const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();

    const user = await db.get(`
      SELECT id, student_id, name, email, department, year, created_at 
      FROM users WHERE id = ?
    `, [userId]);

    if (!user) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);

    return res.json({ profile: user, settings: settings || {} });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, department, year } = req.body;
    const db = await getDb();

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    await db.run(`
      UPDATE users 
      SET name = ?, email = ?, department = ?, year = ? 
      WHERE id = ?
    `, [
      name.trim(),
      email.trim(),
      department ? department.trim() : 'B.Tech Artificial Intelligence and Data Science',
      year ? year.trim() : '2nd Year',
      userId
    ]);

    const updatedUser = await db.get(`
      SELECT id, student_id, name, email, department, year, created_at 
      FROM users WHERE id = ?
    `, [userId]);

    return res.json({ message: 'Profile updated successfully.', profile: updatedUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile/settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_alerts, attendance_alerts, task_reminders, target_attendance } = req.body;
    const db = await getDb();

    const existingSettings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);

    if (existingSettings) {
      await db.run(`
        UPDATE user_settings
        SET email_alerts = ?, attendance_alerts = ?, task_reminders = ?, target_attendance = ?
        WHERE user_id = ?
      `, [
        email_alerts ? 1 : 0,
        attendance_alerts ? 1 : 0,
        task_reminders ? 1 : 0,
        target_attendance ? parseInt(target_attendance, 10) : 75,
        userId
      ]);
    } else {
      await db.run(`
        INSERT INTO user_settings (user_id, email_alerts, attendance_alerts, task_reminders, target_attendance)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        email_alerts ? 1 : 0,
        attendance_alerts ? 1 : 0,
        task_reminders ? 1 : 0,
        target_attendance ? parseInt(target_attendance, 10) : 75
      ]);
    }

    const settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);

    return res.json({ message: 'Settings updated successfully.', settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
