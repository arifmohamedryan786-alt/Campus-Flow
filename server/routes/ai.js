const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function getDayOfWeek(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/ai/priorities
router.get('/priorities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDay = getDayOfWeek();
    const todayDateStr = getLocalDateString();
    const db = await getDb();

    // User settings target attendance
    const userSettings = await db.get('SELECT target_attendance FROM user_settings WHERE user_id = ?', [userId]);
    const targetPct = userSettings && userSettings.target_attendance ? userSettings.target_attendance : 75;

    const priorities = [];

    // 1. Attendance Risks (< targetPct)
    const lowAttendance = await db.all(`
      SELECT *, (CAST(present_classes AS FLOAT) / total_classes * 100) as pct
      FROM subjects
      WHERE user_id = ? AND total_classes > 0 AND (CAST(present_classes AS FLOAT) / total_classes * 100) < ?
    `, [userId, targetPct]);

    lowAttendance.forEach(sub => {
      const pct = Number(sub.pct.toFixed(1));
      const R = targetPct / 100;
      const needed = Math.ceil((R * sub.total_classes - sub.present_classes) / (1 - R));
      priorities.push({
        id: `att-${sub.id}`,
        category: 'Attendance Alert',
        level: 'Critical',
        title: `Attend upcoming ${sub.name} classes`,
        description: `Current attendance is ${pct}% (below ${targetPct}% target). Attend ${needed > 0 ? needed : 1} consecutive upcoming classes to regain compliance.`,
        action: `/attendance`
      });
    });

    // 2. Urgent / High Priority Tasks
    const highPriorityTasks = await db.all(`
      SELECT t.*, s.name as subject_name
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ? AND t.status = 'pending'
      ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, t.due_date ASC
    `, [userId]);

    highPriorityTasks.forEach(task => {
      let level = 'Medium';
      if (task.priority === 'High' || task.due_date <= todayDateStr) {
        level = 'High';
      }
      priorities.push({
        id: `task-${task.id}`,
        category: 'Task Deadline',
        level,
        title: `Complete ${task.title}`,
        description: `${task.subject_name ? '[' + task.subject_name + '] ' : ''}Due date: ${task.due_date}. Priority: ${task.priority}.`,
        action: `/tasks`
      });
    });

    // 3. Today's Classes
    const todayClasses = await db.all(`
      SELECT t.*, s.name as subject_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ? AND t.day_of_week = ?
    `, [userId, todayDay]);

    if (todayClasses.length > 0) {
      priorities.push({
        id: 'classes-today',
        category: 'Schedule',
        level: 'Info',
        title: `Prepare for ${todayClasses.length} class${todayClasses.length > 1 ? 'es' : ''} today`,
        description: `Classes scheduled for today (${todayDay}): ${todayClasses.map(c => c.subject_name).join(', ')}.`,
        action: `/timetable`
      });
    }

    return res.json({ priorities });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/assistant
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Please ask a question or enter a query.' });
    }

    const db = await getDb();
    const userSettings = await db.get('SELECT target_attendance FROM user_settings WHERE user_id = ?', [userId]);
    const targetPct = userSettings && userSettings.target_attendance ? userSettings.target_attendance : 75;

    const user = await db.get('SELECT name FROM users WHERE id = ?', [userId]);
    const q = query.toLowerCase().trim();
    const todayDay = getDayOfWeek();
    const todayDateStr = getLocalDateString();

    let replyText = '';
    let relatedData = null;

    if (q.includes('study') || q.includes('focus') || q.includes('do today') || q.includes('what should i do')) {
      const pendingTasks = await db.all(`
        SELECT t.*, s.name as subject_name
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.user_id = ? AND t.status = 'pending'
        ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, t.due_date ASC
        LIMIT 3
      `, [userId]);

      const lowAtt = await db.all(`
        SELECT name, (CAST(present_classes AS FLOAT) / total_classes * 100) as pct
        FROM subjects
        WHERE user_id = ? AND total_classes > 0 AND (CAST(present_classes AS FLOAT) / total_classes * 100) < ?
      `, [userId, targetPct]);

      replyText = `Hello ${user ? user.name.split(' ')[0] : 'student'}! Here is your AI-recommended focus plan for today:\n\n`;

      if (lowAtt.length > 0) {
        replyText += `⚠️ **Attendance Alert**: You have ${lowAtt.length} subject(s) below the ${targetPct}% target:\n`;
        lowAtt.forEach(s => {
          replyText += `• **${s.name}**: ${s.pct.toFixed(1)}% attendance. Prioritize attending the next class!\n`;
        });
        replyText += `\n`;
      }

      if (pendingTasks.length > 0) {
        replyText += `🎯 **Priority Study & Task List**:\n`;
        pendingTasks.forEach((t, i) => {
          replyText += `${i + 1}. **${t.title}** (${t.subject_name || 'General'}) — Due: ${t.due_date} [${t.priority} Priority]\n`;
        });
      } else {
        replyText += `🎉 Great job! You have no pending urgent tasks. Use today to review past lecture notes.`;
      }

      relatedData = { type: 'tasks', count: pendingTasks.length };

    } else if (q.includes('assignment') || q.includes('due') || q.includes('task') || q.includes('homework')) {
      const tasks = await db.all(`
        SELECT t.*, s.name as subject_name
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.user_id = ? AND t.status = 'pending'
        ORDER BY t.due_date ASC
      `, [userId]);

      if (tasks.length === 0) {
        replyText = `You currently have 0 pending assignments due. You are all caught up!`;
      } else {
        replyText = `You have **${tasks.length} pending assignment(s)**:\n\n`;
        tasks.forEach((t, i) => {
          const isOverdue = t.due_date < todayDateStr;
          const tag = isOverdue ? ' [OVERDUE]' : '';
          replyText += `${i + 1}. **${t.title}** ${tag}\n   • Subject: ${t.subject_name || 'N/A'}\n   • Due Date: ${t.due_date}\n   • Priority: ${t.priority}\n\n`;
        });
      }
      relatedData = { type: 'assignments', tasks };

    } else if (q.includes('attendance') || q.includes('risk') || q.includes('absent') || q.includes('bunk') || q.includes('miss')) {
      const subjects = await db.all('SELECT * FROM subjects WHERE user_id = ?', [userId]);
      
      replyText = `📊 **Attendance Summary & Risk Analysis**:\n\n`;
      const risks = [];
      subjects.forEach(sub => {
        const pct = sub.total_classes > 0 ? Number(((sub.present_classes / sub.total_classes) * 100).toFixed(1)) : 100;
        const statusIcon = pct >= targetPct ? '✅' : '🔴';
        replyText += `${statusIcon} **${sub.name}**: ${pct}% (${sub.present_classes}/${sub.total_classes} classes)\n`;
        if (pct < targetPct) {
          const R = targetPct / 100;
          const needed = Math.ceil((R * sub.total_classes - sub.present_classes) / (1 - R));
          risks.push({ name: sub.name, pct, needed });
        }
      });

      if (risks.length > 0) {
        replyText += `\n⚠️ **Action Required**: You need to attend consecutive classes for:\n`;
        risks.forEach(r => {
          replyText += `• **${r.name}**: Attend next ${r.needed} classes to cross ${targetPct}%.\n`;
        });
      } else {
        replyText += `\n✨ Excellent! All your subjects are currently above the ${targetPct}% safety threshold.`;
      }
      relatedData = { type: 'attendance', risks };

    } else if (q.includes('timetable') || q.includes('class') || q.includes('schedule') || q.includes('today')) {
      const classes = await db.all(`
        SELECT t.*, s.name as subject_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE t.user_id = ? AND t.day_of_week = ?
        ORDER BY t.id ASC
      `, [userId, todayDay]);

      replyText = `📅 **Timetable for Today (${todayDay})**:\n\n`;
      if (classes.length === 0) {
        replyText += `No classes scheduled for today! Enjoy your free time or work on pending assignments.`;
      } else {
        classes.forEach((c, i) => {
          replyText += `${i + 1}. **${c.subject_name}**\n   • Time: ${c.start_time} - ${c.end_time}\n   • Room: ${c.room}\n   • Faculty: ${c.faculty}\n\n`;
        });
      }
      relatedData = { type: 'timetable', count: classes.length };

    } else {
      const pendingCountRes = await db.get(`SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'pending'`, [userId]);
      const lowAttCountRes = await db.get(`
        SELECT COUNT(*) as count FROM subjects 
        WHERE user_id = ? AND total_classes > 0 AND (CAST(present_classes AS FLOAT) / total_classes * 100) < ?
      `, [userId, targetPct]);

      replyText = `Hello! I am your **CampusFlow Academic Assistant**.\n\n` +
        `Here is a quick snapshot of your academic status:\n` +
        `• **Pending Tasks**: ${pendingCountRes.count}\n` +
        `• **Attendance Warnings**: ${lowAttCountRes.count}\n\n` +
        `You can ask me questions like:\n` +
        `1. *"What should I study today?"*\n` +
        `2. *"What assignments are due this week?"*\n` +
        `3. *"Which subject has attendance risk?"*\n` +
        `4. *"Show my timetable for today"*`;
    }

    return res.json({
      query,
      reply: replyText,
      relatedData,
      engine: 'Academic Assistant — Rule Engine v1.0'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
