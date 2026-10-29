const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyAdmin } = require('../utils/notifications');

const router = express.Router();

const VALID_CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

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
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
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

// TEACHER: add a child with just a name and a category. The child has no
// parent yet, so admin is notified and links one from the Students tab.
router.post('/teacher', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
    if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

    const [result] = await pool.query(
      'INSERT INTO children (parent_id, name, category, added_by_teacher_id) VALUES (NULL,?,?,?)',
      [name.trim(), category, req.user.id]
    );
    await notifyAdmin({
      type: 'new_child',
      title: `New student added: ${name.trim()} (${category})`,
      body: `Added by ${req.user.name}. No parent is linked yet.`,
      link: '/admin/students?filter=new',
      refId: result.insertId
    });
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
     FROM children ch LEFT JOIN users u ON u.id = ch.parent_id
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

// Update a child's details - parent only, own child
router.put('/:id', requireAuth, requireRole('parent'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM children WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Child not found' });
  if (rows[0].parent_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, dob, target_exam, allergies, category } = req.body;
  if (category && !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (name !== undefined && !String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' });

  await pool.query(
    `UPDATE children SET name=?, dob=?, target_exam=?, allergies=?, category=? WHERE id=?`,
    [
      name ?? rows[0].name,
      dob === undefined ? rows[0].dob : (dob || null),
      target_exam === undefined ? rows[0].target_exam : (target_exam || null),
      allergies === undefined ? rows[0].allergies : (allergies || null),
      category ?? rows[0].category,
      req.params.id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM children WHERE id = ?', [req.params.id]);
  res.json(updated[0]);
});

module.exports = router;
