const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// TEACHER: schedule a 1:1 class for a specific child
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { child_id, topic, timing, notes } = req.body;
  if (!child_id || !timing) return res.status(400).json({ error: 'child_id and timing are required' });

  const [result] = await pool.query(
    `INSERT INTO one_on_one_classes (child_id, teacher_id, topic, timing, notes)
     VALUES (?,?,?,?,?)`,
    [child_id, req.user.id, topic || null, timing, notes || null]
  );
  const [row] = await pool.query('SELECT * FROM one_on_one_classes WHERE id = ?', [result.insertId]);
  res.status(201).json(row[0]);
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
router.post('/:id/cancel', requireAuth, requireRole('parent', 'teacher'), async (req, res) => {
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
  if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your class' });
  }

  const msUntilClass = new Date(cls.timing).getTime() - Date.now();
  if (msUntilClass < TWENTY_FOUR_HOURS_MS) {
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
