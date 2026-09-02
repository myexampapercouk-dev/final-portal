const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// List all courses (any logged-in role can view; parents/teachers need it for context)
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
  res.json(rows);
});

// Create a course (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const [result] = await pool.query(
    'INSERT INTO courses (name, description) VALUES (?,?)',
    [name, description || null]
  );
  const [row] = await pool.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
  res.status(201).json(row[0]);
});

// Update a course (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, description } = req.body;
  await pool.query('UPDATE courses SET name=?, description=? WHERE id=?', [
    name, description, req.params.id
  ]);
  const [row] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
  res.json(row[0]);
});

// Delete a course (admin only) - cascades to its classes
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
