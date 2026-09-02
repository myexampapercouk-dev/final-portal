const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ADMIN: list all teachers ("Tutors" menu)
router.get('/teachers', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, created_at FROM users WHERE role = 'teacher' ORDER BY name`
  );
  res.json(rows);
});

router.delete('/teachers/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query(`DELETE FROM users WHERE id = ? AND role = 'teacher'`, [req.params.id]);
  res.json({ success: true });
});

// ADMIN: "Parents" menu - view all parents and their associated children
router.get('/parents', requireAuth, requireRole('admin'), async (req, res) => {
  const [parents] = await pool.query(`SELECT id, name, email, phone FROM users WHERE role = 'parent'`);
  const [children] = await pool.query('SELECT * FROM children');
  const result = parents.map(p => ({
    ...p,
    children: children.filter(c => c.parent_id === p.id)
  }));
  res.json(result);
});

module.exports = router;
