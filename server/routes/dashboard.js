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

function computeClassStatus(startTimeStr, endTimeStr, isToday) {
  if (!isToday) return 'Upcoming';
  
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
    const todayDay = getDayOfWeek();
    const todayDateStr = getLocalDateString();
    const db = await getDb();

    // User Settings / Target Attendance
    const userSettings = await db.get('SELECT target_attendance FROM user_settings WHERE user_id = ?', [userId]);
    const targetPct = userSettings && userSettings.target_attendance ? userSettings.target_attendance : 75;

    // User Profile
    const user = await db.get('SELECT id, student_id, name, email, department, year FROM users WHERE id = ?', [userId]);

    // Overall Attendance Calculation
    const attendanceStats = await db.get(`
      SELECT 
        COALESCE(SUM(total_classes), 0) as total,
        COALESCE(SUM(present_classes), 0) as present,
        COALESCE(SUM(absent_classes), 0) as absent
      FROM subjects
      WHERE user_id = ?
    `, [userId]);

    const overallAttendance = attendanceStats.total > 0
      ? Number(((attendanceStats.present / attendanceStats.total) * 100).toFixed(1))
      : 100;

    // Today's Timetable
    const todaysTimetableRaw = await db.all(`
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ? AND t.day_of_week = ?
      ORDER BY t.id ASC
    `, [userId, todayDay]);

    const todaysTimetable = todaysTimetableRaw.map(item => ({
      ...item,
      status: computeClassStatus(item.start_time, item.end_time, true)
    }));

    // Tasks Counts
    const pendingTasksCountRes = await db.get(`
      SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'pending'
    `, [userId]);
    const pendingTasksCount = pendingTasksCountRes.count;

    // Upcoming Deadlines (within next 3 days)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = getLocalDateString(threeDaysLater);

    const upcomingDeadlinesCountRes = await db.get(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE user_id = ? AND status = 'pending' AND due_date >= ? AND due_date <= ?
    `, [userId, todayDateStr, threeDaysLaterStr]);
    const upcomingDeadlinesCount = upcomingDeadlinesCountRes.count;

    // Low attendance subjects count (< targetPct)
    const lowAttendanceSubjects = await db.all(`
      SELECT id, name, total_classes, present_classes, 
             CAST(present_classes AS FLOAT) / total_classes * 100 as pct
      FROM subjects
      WHERE user_id = ? AND total_classes > 0 AND (CAST(present_classes AS FLOAT) / total_classes * 100) < ?
    `, [userId, targetPct]);

    // Generate Top AI Priorities
    const aiPriorities = [];

    lowAttendanceSubjects.forEach(sub => {
      const currentPct = Number(sub.pct.toFixed(1));
      const R = targetPct / 100;
      const needed = Math.ceil((R * sub.total_classes - sub.present_classes) / (1 - R));
      aiPriorities.push({
        id: `att-${sub.id}`,
        title: `Attend upcoming ${sub.name} classes`,
        reason: `Attendance is critical at ${currentPct}% (Target: ${targetPct}%). Need to attend ${needed > 0 ? needed : 1} consecutive classes.`,
        priority: 'High',
        tag: 'Attendance Risk'
      });
    });

    const urgentTasks = await db.all(`
      SELECT t.*, s.name as subject_name
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ? AND t.status = 'pending'
      ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, t.due_date ASC
      LIMIT 3
    `, [userId]);

    urgentTasks.forEach(task => {
      aiPriorities.push({
        id: `task-${task.id}`,
        title: task.title,
        reason: `Due ${task.due_date} (${task.subject_name || 'General'}) — ${task.priority} Priority`,
        priority: task.priority,
        tag: 'Task Deadline'
      });
    });

    return res.json({
      user,
      targetPct,
      overview: {
        overallAttendance,
        classesTodayCount: todaysTimetable.length,
        pendingTasksCount,
        upcomingDeadlinesCount,
        lowAttendanceCount: lowAttendanceSubjects.length
      },
      todaysTimetable,
      aiPriorities: aiPriorities.slice(0, 4)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
