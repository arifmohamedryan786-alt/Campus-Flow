const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function getDayOfWeek(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function computeClassStatus(startTimeStr, endTimeStr, classDay) {
  const todayDay = getDayOfWeek();
  if (classDay !== todayDay) return 'Upcoming';

  const now = new Date();
  const parseTime = (str) => {
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);

  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.query;
    const db = await getDb();

    let query = `
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ?
    `;

    const params = [userId];

    if (day) {
      query += ` AND t.day_of_week = ?`;
      params.push(day);
    }

    query += ` ORDER BY CASE t.day_of_week
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7
    END, t.id ASC`;

    const timetableEntries = await db.all(query, params);

    const formatted = timetableEntries.map(entry => ({
      ...entry,
      status: computeClassStatus(entry.start_time, entry.end_time, entry.day_of_week)
    }));

    return res.json({ timetable: formatted, currentDay: getDayOfWeek() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
