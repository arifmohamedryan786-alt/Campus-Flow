const express = require('express');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const DEFAULT_TARGET_ATTENDANCE = 75;

async function getTargetAttendance(db, userId) {
  const settings = await db.get('SELECT target_attendance FROM user_settings WHERE user_id = ?', [userId]);
  return settings && settings.target_attendance ? settings.target_attendance : DEFAULT_TARGET_ATTENDANCE;
}

function calculateAttendanceForecast(present, total, targetPct = DEFAULT_TARGET_ATTENDANCE) {
  const p = Number(present) || 0;
  const t = Number(total) || 0;

  if (t === 0) {
    return {
      currentPct: 100,
      targetPct,
      isBelowTarget: false,
      classesNeededToReachTarget: 0,
      classesCanMiss: 0,
      statusMessage: 'No classes recorded yet.'
    };
  }

  const currentPct = Number(((p / t) * 100).toFixed(1));
  const R = targetPct / 100;
  const isBelowTarget = currentPct < targetPct;

  if (isBelowTarget) {
    // Math: (p + x) / (t + x) >= R => x * (1 - R) >= R * t - p => x = ceil((R * t - p) / (1 - R))
    const numerator = R * t - p;
    const denominator = 1 - R;
    const needed = Math.ceil(numerator / (denominator > 0 ? denominator : 0.01));
    const classesNeededToReachTarget = needed > 0 ? needed : 1;
    return {
      currentPct,
      targetPct,
      isBelowTarget: true,
      classesNeededToReachTarget,
      classesCanMiss: 0,
      statusMessage: `Attend next ${classesNeededToReachTarget} consecutive class${classesNeededToReachTarget > 1 ? 'es' : ''} to reach ${targetPct}%.`
    };
  } else {
    // Math: p / (t + y) >= R => R * y <= p - R * t => y = floor((p - R * t) / R)
    const canMiss = Math.floor((p - R * t) / R);
    return {
      currentPct,
      targetPct,
      isBelowTarget: false,
      classesNeededToReachTarget: 0,
      classesCanMiss: canMiss >= 0 ? canMiss : 0,
      statusMessage: canMiss > 0
        ? `You can safely miss ${canMiss} class${canMiss > 1 ? 'es' : ''} without dropping below ${targetPct}%.`
        : `Your attendance is exactly at safe threshold. Do not miss any upcoming class.`
    };
  }
}

// GET /api/attendance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();
    const targetPct = await getTargetAttendance(db, userId);

    const subjects = await db.all(`
      SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC
    `, [userId]);

    let totalClassesOverall = 0;
    let presentClassesOverall = 0;
    let absentClassesOverall = 0;

    const formattedSubjects = subjects.map(sub => {
      const tot = sub.total_classes || 0;
      const pres = sub.present_classes || 0;
      const abs = sub.absent_classes || 0;

      totalClassesOverall += tot;
      presentClassesOverall += pres;
      absentClassesOverall += abs;

      const percentage = tot > 0 ? Number(((pres / tot) * 100).toFixed(1)) : 100;
      const forecast = calculateAttendanceForecast(pres, tot, targetPct);

      return {
        ...sub,
        percentage,
        status: percentage >= targetPct ? 'safe' : 'warning',
        forecast
      };
    });

    const overallPercentage = totalClassesOverall > 0
      ? Number(((presentClassesOverall / totalClassesOverall) * 100).toFixed(1))
      : 100;

    const overallForecast = calculateAttendanceForecast(presentClassesOverall, totalClassesOverall, targetPct);

    return res.json({
      targetPct,
      overall: {
        totalClasses: totalClassesOverall,
        presentClasses: presentClassesOverall,
        absentClasses: absentClassesOverall,
        percentage: overallPercentage,
        status: overallPercentage >= targetPct ? 'safe' : 'warning',
        forecast: overallForecast
      },
      subjects: formattedSubjects
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/prediction
router.get('/prediction', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDb();
    const targetPct = await getTargetAttendance(db, userId);

    const subjects = await db.all('SELECT * FROM subjects WHERE user_id = ?', [userId]);

    let totalClassesOverall = 0;
    let presentClassesOverall = 0;

    const predictions = subjects.map(sub => {
      const tot = sub.total_classes || 0;
      const pres = sub.present_classes || 0;

      totalClassesOverall += tot;
      presentClassesOverall += pres;

      const forecast = calculateAttendanceForecast(pres, tot, targetPct);

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        totalClasses: tot,
        presentClasses: pres,
        absentClasses: sub.absent_classes || 0,
        ...forecast
      };
    });

    const overallForecast = calculateAttendanceForecast(presentClassesOverall, totalClassesOverall, targetPct);

    return res.json({
      targetPct,
      overallForecast,
      subjectPredictions: predictions
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/mark
router.post('/mark', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, status } = req.body;
    const db = await getDb();

    if (!subjectId || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Valid subjectId and status (present/absent) are required.' });
    }

    const subject = await db.get('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subjectId, userId]);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    if (status === 'present') {
      await db.run(`
        UPDATE subjects 
        SET total_classes = total_classes + 1, present_classes = present_classes + 1 
        WHERE id = ? AND user_id = ?
      `, [subjectId, userId]);
    } else {
      await db.run(`
        UPDATE subjects 
        SET total_classes = total_classes + 1, absent_classes = absent_classes + 1 
        WHERE id = ? AND user_id = ?
      `, [subjectId, userId]);
    }

    return res.json({ message: `Marked ${status} for ${subject.name}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
