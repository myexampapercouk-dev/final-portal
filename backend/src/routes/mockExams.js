const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// PARENT: view mock exam records for a child ("Mock Exams" tab)
router.get('/child/:childId', requireAuth, requireRole('parent', 'teacher', 'admin'), async (req, res) => {
  if (req.user.role === 'parent') {
    const [child] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [
      req.params.childId, req.user.id
    ]);
    if (!child.length) return res.status(403).json({ error: 'Not your child' });
  }
  const [rows] = await pool.query(
    'SELECT * FROM mock_exams WHERE child_id = ? ORDER BY exam_date DESC',
    [req.params.childId]
  );
  res.json(rows);
});

// TEACHER/ADMIN: record a mock exam result for a child
router.post('/', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  const { child_id, exam_name, exam_date, score, remarks } = req.body;
  if (!child_id || !exam_name) return res.status(400).json({ error: 'child_id and exam_name are required' });
  const [result] = await pool.query(
    `INSERT INTO mock_exams (child_id, exam_name, exam_date, score, remarks) VALUES (?,?,?,?,?)`,
    [child_id, exam_name, exam_date || null, score || null, remarks || null]
  );
  const [row] = await pool.query('SELECT * FROM mock_exams WHERE id = ?', [result.insertId]);
  res.status(201).json(row[0]);
});

module.exports = router;
