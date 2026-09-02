const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const VALID_CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+']; // extend as needed

// List children belonging to the logged-in parent
router.get('/', requireAuth, requireRole('parent'), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM children WHERE parent_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Add a child (popup form: Name, DOB, Target Exam, Allergies, Category)
router.post('/', requireAuth, requireRole('parent'), async (req, res) => {
  try {
    const { name, dob, target_exam, allergies, category } = req.body;
    if (!name || !dob || !category) {
      return res.status(400).json({ error: 'name, dob and category are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO children (parent_id, name, dob, target_exam, allergies, category)
       VALUES (?,?,?,?,?,?)`,
      [req.user.id, name, dob, target_exam || null, allergies || null, category]
    );
    const [row] = await pool.query('SELECT * FROM children WHERE id = ?', [result.insertId]);
    res.status(201).json(row[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not add child', details: err.message });
  }
});

// TEACHER/ADMIN: search children by name (used to pick a child when scheduling a 1:1 class)
router.get('/search', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  const q = `%${req.query.name || ''}%`;
  const [rows] = await pool.query(
    `SELECT ch.id, ch.name, ch.category, u.name AS parent_name
     FROM children ch JOIN users u ON u.id = ch.parent_id
     WHERE ch.name LIKE ? LIMIT 20`,
    [q]
  );
  res.json(rows);
});

// Get a single child (must belong to this parent, or be viewable by admin/teacher)
router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM children WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Child not found' });
  const child = rows[0];
  if (req.user.role === 'parent' && child.parent_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(child);
});

// Update a child (e.g. correcting category) - parent only, own child
router.put('/:id', requireAuth, requireRole('parent'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM children WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Child not found' });
  if (rows[0].parent_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, dob, target_exam, allergies, category } = req.body;
  await pool.query(
    `UPDATE children SET name=?, dob=?, target_exam=?, allergies=?, category=? WHERE id=?`,
    [
      name ?? rows[0].name,
      dob ?? rows[0].dob,
      target_exam ?? rows[0].target_exam,
      allergies ?? rows[0].allergies,
      category ?? rows[0].category,
      req.params.id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM children WHERE id = ?', [req.params.id]);
  res.json(updated[0]);
});

module.exports = router;
