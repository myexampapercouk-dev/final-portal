const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const uploadMaterials = require('../middleware/upload');

const router = express.Router();

// Attaches categories[], materials[] (uploaded files), and registered_count to each class row
async function attachExtras(classes) {
  if (!classes.length) return classes;
  const ids = classes.map(c => c.id);
  const placeholders = ids.map(() => '?').join(',');

  const [cats] = await pool.query(
    `SELECT class_id, category FROM class_categories WHERE class_id IN (${placeholders})`,
    ids
  );
  const [materials] = await pool.query(
    `SELECT id, class_id, file_name, file_path FROM class_materials WHERE class_id IN (${placeholders})`,
    ids
  );
  const [counts] = await pool.query(
    `SELECT class_id, COUNT(*) AS registered_count
     FROM class_registrations
     WHERE class_id IN (${placeholders}) AND status IN ('upcoming','attended')
     GROUP BY class_id`,
    ids
  );

  return classes.map(c => ({
    ...c,
    categories: cats.filter(x => x.class_id === c.id).map(x => x.category),
    materials: materials.filter(x => x.class_id === c.id),
    registered_count: (counts.find(x => x.class_id === c.id) || {}).registered_count || 0
  }));
}

// ---------------------------------------------------------------
// ADMIN: create a class under a course
// multipart/form-data fields: course_id, title, teacher_id, timing,
// categories (repeat the field for each selected category),
// materials (up to 4 files, optional)
// ---------------------------------------------------------------
router.post('/', requireAuth, requireRole('admin'), uploadMaterials, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { course_id, title, teacher_id, timing } = req.body;
    let categories = req.body.categories || [];
    if (!Array.isArray(categories)) categories = [categories];

    if (!course_id || !title || !teacher_id || !timing || !categories.length) {
      return res.status(400).json({
        error: 'course_id, title, teacher_id, timing and at least one category are required'
      });
    }

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO classes (course_id, teacher_id, title, timing) VALUES (?,?,?,?)`,
      [course_id, teacher_id, title, timing]
    );
    const classId = result.insertId;

    for (const cat of categories) {
      await conn.query('INSERT INTO class_categories (class_id, category) VALUES (?,?)', [classId, cat]);
    }

    for (const file of req.files || []) {
      await conn.query(
        'INSERT INTO class_materials (class_id, file_name, file_path) VALUES (?,?,?)',
        [classId, file.originalname, `/uploads/materials/${file.filename}`]
      );
    }

    await conn.commit();
    const [row] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);
    const withExtras = await attachExtras(row);
    res.status(201).json(withExtras[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Could not create class', details: err.message });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------
// LIST classes - behavior depends on role:
//  - admin: all classes (with registered_count)
//  - teacher: only classes assigned to them (their dashboard list, with registered_count)
// ---------------------------------------------------------------
router.get('/', requireAuth, async (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    [rows] = await pool.query(
      `SELECT c.*, co.name AS course_name, u.name AS teacher_name
       FROM classes c
       JOIN courses co ON co.id = c.course_id
       JOIN users u ON u.id = c.teacher_id
       ORDER BY c.timing DESC`
    );
  } else if (req.user.role === 'teacher') {
    [rows] = await pool.query(
      `SELECT c.*, co.name AS course_name
       FROM classes c
       JOIN courses co ON co.id = c.course_id
       WHERE c.teacher_id = ?
       ORDER BY c.timing ASC`,
      [req.user.id]
    );
  } else {
    return res.status(403).json({ error: 'Use /classes/available for parent view' });
  }
  res.json(await attachExtras(rows));
});

// ---------------------------------------------------------------
// PARENT: classes available for a given child to register for
// (only classes matching the child's category, not already registered, not cancelled/completed)
// ---------------------------------------------------------------
router.get('/available', requireAuth, requireRole('parent'), async (req, res) => {
  const { child_id } = req.query;
  if (!child_id) return res.status(400).json({ error: 'child_id is required' });

  const [childRows] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [
    child_id, req.user.id
  ]);
  if (!childRows.length) return res.status(404).json({ error: 'Child not found' });
  const category = childRows[0].category;

  const [rows] = await pool.query(
    `SELECT c.*, co.name AS course_name, u.name AS teacher_name
     FROM classes c
     JOIN class_categories cc ON cc.class_id = c.id
     JOIN courses co ON co.id = c.course_id
     JOIN users u ON u.id = c.teacher_id
     WHERE cc.category = ?
       AND c.status = 'scheduled'
       AND c.id NOT IN (
         SELECT class_id FROM class_registrations
         WHERE child_id = ? AND status IN ('upcoming','attended')
       )
     ORDER BY c.timing ASC`,
    [category, child_id]
  );
  res.json(await attachExtras(rows));
});

// Update a class (admin only) - text fields only; materials are managed via /:id/materials
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, teacher_id, timing } = req.body;
  const [existing] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Class not found' });
  await pool.query(
    `UPDATE classes SET title=?, teacher_id=?, timing=? WHERE id=?`,
    [
      title ?? existing[0].title,
      teacher_id ?? existing[0].teacher_id,
      timing ?? existing[0].timing,
      req.params.id
    ]
  );
  const [row] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
  res.json((await attachExtras(row))[0]);
});

// ADMIN: add more material files to an existing class (still capped at 4 total)
router.post('/:id/materials', requireAuth, requireRole('admin'), uploadMaterials, async (req, res) => {
  const [existingFiles] = await pool.query('SELECT id FROM class_materials WHERE class_id = ?', [req.params.id]);
  const incoming = req.files || [];
  if (existingFiles.length + incoming.length > 4) {
    return res.status(400).json({ error: 'A class can have at most 4 material files' });
  }
  for (const file of incoming) {
    await pool.query(
      'INSERT INTO class_materials (class_id, file_name, file_path) VALUES (?,?,?)',
      [req.params.id, file.originalname, `/uploads/materials/${file.filename}`]
    );
  }
  const [row] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
  res.json((await attachExtras(row))[0]);
});

// ADMIN: remove a single material file
router.delete('/materials/:materialId', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM class_materials WHERE id = ?', [req.params.materialId]);
  res.json({ success: true });
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;