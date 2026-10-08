const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeTaskStatus(task) {
  if (task.status === 'completed') return 'completed';

  const todayStr = getLocalDateString();
  if (task.due_date < todayStr) return 'overdue';
  return 'pending';
}

// GET /api/tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, filter } = req.query;
    const db = await getDb();

    const tasksRaw = await db.all(`
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ?
      ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, t.due_date ASC
    `, [userId]);

    const formattedTasks = tasksRaw.map(task => ({
      ...task,
      computed_status: computeTaskStatus(task)
    }));

    let filtered = formattedTasks;
    const activeFilter = status || filter;

    if (activeFilter === 'pending') {
      filtered = formattedTasks.filter(t => t.computed_status === 'pending');
    } else if (activeFilter === 'completed') {
      filtered = formattedTasks.filter(t => t.computed_status === 'completed');
    } else if (activeFilter === 'overdue') {
      filtered = formattedTasks.filter(t => t.computed_status === 'overdue');
    }

    const counts = {
      all: formattedTasks.length,
      pending: formattedTasks.filter(t => t.computed_status === 'pending').length,
      completed: formattedTasks.filter(t => t.computed_status === 'completed').length,
      overdue: formattedTasks.filter(t => t.computed_status === 'overdue').length
    };

    return res.json({ tasks: filtered, counts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, subject_id, due_date, priority } = req.body;
    const db = await getDb();

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Task title and due date are required.' });
    }

    const validPriority = ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium';

    const result = await db.run(`
      INSERT INTO tasks (user_id, subject_id, title, description, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [
      userId,
      subject_id ? parseInt(subject_id, 10) : null,
      title.trim(),
      description ? description.trim() : '',
      due_date,
      validPriority
    ]);

    const newTask = await db.get(`
      SELECT t.*, s.name as subject_name, s.code as subject_code
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ? AND t.user_id = ?
    `, [result.lastID, userId]);

    return res.status(201).json({
      message: 'Task created successfully.',
      task: {
        ...newTask,
        computed_status: computeTaskStatus(newTask)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, subject_id, due_date, priority, status } = req.body;
    const db = await getDb();

    const existing = await db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found or access unauthorized.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedSubId = subject_id !== undefined ? (subject_id ? parseInt(subject_id, 10) : null) : existing.subject_id;
    const updatedDueDate = due_date !== undefined ? due_date : existing.due_date;
    const updatedPriority = priority !== undefined ? priority : existing.priority;
    const updatedStatus = status !== undefined ? status : existing.status;

    await db.run(`
      UPDATE tasks
      SET title = ?, description = ?, subject_id = ?, due_date = ?, priority = ?, status = ?
      WHERE id = ? AND user_id = ?
    `, [updatedTitle, updatedDesc, updatedSubId, updatedDueDate, updatedPriority, updatedStatus, taskId, userId]);

    const updatedTask = await db.get(`
      SELECT t.*, s.name as subject_name, s.code as subject_code
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ? AND t.user_id = ?
    `, [taskId, userId]);

    return res.json({
      message: 'Task updated successfully.',
      task: {
        ...updatedTask,
        computed_status: computeTaskStatus(updatedTask)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const db = await getDb();

    const existing = await db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found or access unauthorized.' });
    }

    await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);

    return res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
