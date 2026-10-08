const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

async function seedDatabase() {
  console.log('Seeding CampusFlow database...');
  const db = await getDb();

  // Clear existing data
  await db.run('DELETE FROM notifications');
  await db.run('DELETE FROM tasks');
  await db.run('DELETE FROM timetable');
  await db.run('DELETE FROM subjects');
  await db.run('DELETE FROM user_settings');
  await db.run('DELETE FROM users');

  // Create demo user
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const userResult = await db.run(`
    INSERT INTO users (student_id, name, email, password, department, year)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'STU202489',
    'Arif Mohamed',
    'arif@college.edu',
    hashedPassword,
    'B.Tech Artificial Intelligence and Data Science',
    '2nd Year'
  ]);

  const userId = userResult.lastID;

  // Settings
  await db.run(`
    INSERT INTO user_settings (user_id, email_alerts, attendance_alerts, task_reminders, target_attendance)
    VALUES (?, 1, 1, 1, 75)
  `, [userId]);

  // Subjects
  const s1Res = await db.run(`
    INSERT INTO subjects (user_id, code, name, faculty, total_classes, present_classes, absent_classes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'CS301', 'Artificial Intelligence', 'Dr. Sarah Jenkins', 40, 34, 6, 'blue']);
  const s1 = s1Res.lastID;

  const s2Res = await db.run(`
    INSERT INTO subjects (user_id, code, name, faculty, total_classes, present_classes, absent_classes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'CS302', 'Data Science & Analytics', 'Prof. Robert Chen', 36, 25, 11, 'rose']);
  const s2 = s2Res.lastID;

  const s3Res = await db.run(`
    INSERT INTO subjects (user_id, code, name, faculty, total_classes, present_classes, absent_classes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'CS303', 'Full-Stack Web Development', 'Dr. Michael Vance', 44, 40, 4, 'emerald']);
  const s3 = s3Res.lastID;

  const s4Res = await db.run(`
    INSERT INTO subjects (user_id, code, name, faculty, total_classes, present_classes, absent_classes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'CS304', 'Database Management Systems', 'Prof. Elena Rostova', 38, 31, 7, 'indigo']);
  const s4 = s4Res.lastID;

  const s5Res = await db.run(`
    INSERT INTO subjects (user_id, code, name, faculty, total_classes, present_classes, absent_classes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, 'CS305', 'Computer Networks', 'Dr. Alan Turing', 32, 23, 9, 'amber']);
  const s5 = s5Res.lastID;

  // Timetable
  const insertTimetable = async (subId, day, start, end, room, faculty) => {
    await db.run(`
      INSERT INTO timetable (user_id, subject_id, day_of_week, start_time, end_time, room, faculty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, subId, day, start, end, room, faculty]);
  };

  // Schedule for Monday
  await insertTimetable(s1, 'Monday', '09:00 AM', '10:30 AM', 'Lab 302', 'Dr. Sarah Jenkins');
  await insertTimetable(s3, 'Monday', '10:45 AM', '12:15 PM', 'Hall B', 'Dr. Michael Vance');
  await insertTimetable(s2, 'Monday', '01:30 PM', '03:00 PM', 'Lab 104', 'Prof. Robert Chen');

  // Schedule for Tuesday
  await insertTimetable(s4, 'Tuesday', '09:00 AM', '10:30 AM', 'Hall A', 'Prof. Elena Rostova');
  await insertTimetable(s5, 'Tuesday', '10:45 AM', '12:15 PM', 'Lab 201', 'Dr. Alan Turing');
  await insertTimetable(s1, 'Tuesday', '01:30 PM', '03:00 PM', 'Lab 302', 'Dr. Sarah Jenkins');

  // Schedule for Wednesday
  await insertTimetable(s3, 'Wednesday', '09:00 AM', '10:30 AM', 'Hall B', 'Dr. Michael Vance');
  await insertTimetable(s2, 'Wednesday', '10:45 AM', '12:15 PM', 'Lab 104', 'Prof. Robert Chen');
  await insertTimetable(s4, 'Wednesday', '01:30 PM', '03:00 PM', 'Hall A', 'Prof. Elena Rostova');

  // Schedule for Thursday
  await insertTimetable(s5, 'Thursday', '09:00 AM', '10:30 AM', 'Lab 201', 'Dr. Alan Turing');
  await insertTimetable(s1, 'Thursday', '10:45 AM', '12:15 PM', 'Lab 302', 'Dr. Sarah Jenkins');
  await insertTimetable(s3, 'Thursday', '01:30 PM', '03:00 PM', 'Hall B', 'Dr. Michael Vance');

  // Schedule for Friday
  await insertTimetable(s2, 'Friday', '09:00 AM', '10:30 AM', 'Lab 104', 'Prof. Robert Chen');
  await insertTimetable(s4, 'Friday', '10:45 AM', '12:15 PM', 'Hall A', 'Prof. Elena Rostova');
  await insertTimetable(s5, 'Friday', '01:30 PM', '03:00 PM', 'Lab 201', 'Dr. Alan Turing');

  // Schedule for Saturday & Sunday
  await insertTimetable(s3, 'Saturday', '10:00 AM', '11:30 AM', 'Online Studio', 'Dr. Michael Vance');
  await insertTimetable(s1, 'Saturday', '01:30 PM', '03:00 PM', 'Online Studio', 'Dr. Sarah Jenkins');
  await insertTimetable(s2, 'Sunday', '11:00 AM', '12:30 PM', 'Online Studio', 'Prof. Robert Chen');

  // Tasks dates
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);

  const inTwoDaysDate = new Date(today);
  inTwoDaysDate.setDate(today.getDate() + 2);

  const inThreeDaysDate = new Date(today);
  inThreeDaysDate.setDate(today.getDate() + 3);

  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(today.getDate() - 1);

  const insertTask = async (subId, title, desc, dueDate, priority, status) => {
    await db.run(`
      INSERT INTO tasks (user_id, subject_id, title, description, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, subId, title, desc, dueDate, priority, status]);
  };

  await insertTask(s1, 'Complete AI Neural Networks Lab', 'Implement backpropagation algorithm in Python with NumPy', formatDate(tomorrowDate), 'High', 'pending');
  await insertTask(s2, 'Data Science Quiz Preparation', 'Review regression models, decision trees, and overfitting techniques', formatDate(inTwoDaysDate), 'High', 'pending');
  await insertTask(s3, 'Submit Web Dev Capstone Milestone 1', 'Create backend REST APIs with Node.js and Express', formatDate(inThreeDaysDate), 'Medium', 'pending');
  await insertTask(s4, 'DBMS Indexing & B-Trees Assignment', 'Solve problem set 4 on B+ Tree node splitting and merging', formatDate(inThreeDaysDate), 'Low', 'pending');
  await insertTask(s5, 'Computer Networks Packet Tracer Lab', 'Configure VLANs and OSPF routing on Cisco routers', formatDate(yesterdayDate), 'High', 'pending');
  await insertTask(s4, 'Setup Local SQLite Database', 'Configured database schema and foreign key constraints', formatDate(yesterdayDate), 'Medium', 'completed');

  // Notifications
  const insertNotif = async (title, msg, type, isRead) => {
    await db.run(`
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, title, msg, type, isRead]);
  };

  await insertNotif('Attendance Risk Warning', 'Data Science attendance has dropped to 69.4%. Minimum required is 75%. You need to attend 8 upcoming classes to reach 75%.', 'warning', 0);
  await insertNotif('Upcoming Assignment Deadline', 'Artificial Intelligence Neural Networks Lab is due tomorrow!', 'deadline', 0);
  await insertNotif('Computer Networks Attendance Alert', 'Attendance is at 71.9%. Attend at least 4 consecutive classes to reach safety zone.', 'warning', 0);
  await insertNotif('Task Completed', 'Setup Local SQLite Database marked as completed.', 'success', 1);

  console.log('Database seeded successfully!');
  console.log('Demo Credentials:');
  console.log('Email: arif@college.edu or Student ID: STU202489');
  console.log('Password: password123');
}

seedDatabase().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
