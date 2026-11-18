const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../utils/notifications');

const router = express.Router();
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// ADMIN: schedule a 1:1 class for a child with a chosen teacher (teachers can only view them)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { child_id, teacher_id, topic, timing, end_timing, notes } = req.body;
  if (!child_id || !teacher_id || !timing) return res.status(400).json({ error: 'child, teacher and start time are required' });
  const [teacher] = await pool.query(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`, [teacher_id]);
  if (!teacher.length) return res.status(404).json({ error: 'Teacher not found' });
  const [child] = await pool.query('SELECT id, name, parent_id FROM children WHERE id = ?', [child_id]);
  if (!child.length) return res.status(404).json({ error: 'Child not found' });

  const [result] = await pool.query(
    `INSERT INTO one_on_one_classes (child_id, teacher_id, topic, timing, end_timing, notes)
     VALUES (?,?,?,?,?,?)`,
    [child_id, teacher_id, topic || null, timing, end_timing || null, notes || null]
  );
  if (child[0].parent_id) {
    await notifyUser(child[0].parent_id, {
      type: 'parent_one_on_one',
      title: `1:1 session booked for ${child[0].name}`,
      body: topic || null,
      link: '/parent/one-on-one'
    });
  }
  const [row] = await pool.query('SELECT * FROM one_on_one_classes WHERE id = ?', [result.insertId]);
  res.status(201).json(row[0]);
});

// ADMIN: every teacher with how many 1:1 sessions they have in each state
router.get('/admin/teachers', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email,
            COALESCE(SUM(o.status = 'upcoming'), 0) AS upcoming,
            COALESCE(SUM(o.status = 'completed'), 0) AS completed,
            COALESCE(SUM(o.status = 'cancelled'), 0) AS cancelled
     FROM users u LEFT JOIN one_on_one_classes o ON o.teacher_id = u.id
     WHERE u.role = 'teacher' GROUP BY u.id ORDER BY u.name`
  );
  res.json(rows.map((r) => ({ ...r, upcoming: Number(r.upcoming), completed: Number(r.completed), cancelled: Number(r.cancelled) })));
});

// ADMIN: one teacher's 1:1 sessions
router.get('/admin/teacher/:teacherId', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, ch.name AS child_name, ch.category, p.name AS parent_name
     FROM one_on_one_classes o
     JOIN children ch ON ch.id = o.child_id
     LEFT JOIN users p ON p.id = ch.parent_id
     WHERE o.teacher_id = ? ORDER BY o.timing DESC`,
    [req.params.teacherId]
  );
  res.json(rows);
});

// PARENT: view 1:1 classes for a child ("1:1 Classes" tab)
router.get('/child/:childId', requireAuth, requireRole('parent', 'teacher', 'admin'), async (req, res) => {
  if (req.user.role === 'parent') {
    const [child] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [
      req.params.childId, req.user.id
    ]);
    if (!child.length) return res.status(403).json({ error: 'Not your child' });
  }
  const [rows] = await pool.query(
    `SELECT o.*, u.name AS teacher_name FROM one_on_one_classes o
     JOIN users u ON u.id = o.teacher_id
     WHERE o.child_id = ? ORDER BY o.timing DESC`,
    [req.params.childId]
  );
  res.json(rows);
});

// TEACHER: their own 1:1 schedule
router.get('/mine', requireAuth, requireRole('teacher'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, ch.name AS child_name FROM one_on_one_classes o
     JOIN children ch ON ch.id = o.child_id
     WHERE o.teacher_id = ? ORDER BY o.timing ASC`,
    [req.user.id]
  );
  res.json(rows);
});

// Cancel a 1:1 class - parent or teacher, only 24h+ before
router.post('/:id/cancel', requireAuth, requireRole('parent', 'admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, ch.parent_id FROM one_on_one_classes o
     JOIN children ch ON ch.id = o.child_id WHERE o.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const cls = rows[0];

  if (req.user.role === 'parent' && cls.parent_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your child' });
  }

  const msUntilClass = new Date(cls.timing).getTime() - Date.now();
  if (req.user.role === 'parent' && msUntilClass < TWENTY_FOUR_HOURS_MS) {
    return res.status(400).json({ error: 'Cancellation window has passed (must cancel 24h+ before class)' });
  }

  await pool.query(`UPDATE one_on_one_classes SET status='cancelled', cancelled_at = NOW() WHERE id = ?`, [
    req.params.id
  ]);
  res.json({ success: true });
});

// Mark a 1:1 class complete (teacher)
router.post('/:id/complete', requireAuth, requireRole('teacher'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM one_on_one_classes WHERE id = ? AND teacher_id = ?', [
    req.params.id, req.user.id
  ]);
  if (!rows.length) return res.status(403).json({ error: 'Not your class' });
  await pool.query(`UPDATE one_on_one_classes SET status='completed' WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
