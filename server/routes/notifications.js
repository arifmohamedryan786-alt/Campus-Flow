const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();

    const dbNotifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    return res.json({ notifications: dbNotifications });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;
    const db = await getDb();

    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);

    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();

    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
