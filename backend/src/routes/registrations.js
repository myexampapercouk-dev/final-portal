const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function assertChildOwnership(childId, parentId) {
  const [rows] = await pool.query('SELECT * FROM children WHERE id = ? AND parent_id = ?', [childId, parentId]);
  return rows[0] || null;
}

// ---------------------------------------------------------------
// PARENT: register a child for a class ("Upcoming Classes" -> register for more)
// ---------------------------------------------------------------
router.post('/', requireAuth, requireRole('parent'), async (req, res) => {
  try {
    const { class_id, child_id } = req.body;
    const child = await assertChildOwnership(child_id, req.user.id);
    if (!child) return res.status(403).json({ error: 'Not your child' });

    const [classRows] = await pool.query(
      `SELECT c.*, GROUP_CONCAT(cc.category) AS cats FROM classes c
       JOIN class_categories cc ON cc.class_id = c.id
       WHERE c.id = ? GROUP BY c.id`,
      [class_id]
    );
    if (!classRows.length) return res.status(404).json({ error: 'Class not found' });
    const cls = classRows[0];
    if (!cls.cats.split(',').includes(child.category)) {
      return res.status(403).json({ error: 'This class is not available for this child\'s category' });
    }

    const [result] = await pool.query(
      'INSERT INTO class_registrations (class_id, child_id, status) VALUES (?,?,\'upcoming\')',
      [class_id, child_id]
    );
    const [row] = await pool.query('SELECT * FROM class_registrations WHERE id = ?', [result.insertId]);
    res.status(201).json(row[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Child already registered for this class' });
    }
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// PARENT/TEACHER: cancel a registration (only allowed up to 24h before class time)
// ---------------------------------------------------------------
router.post('/:id/cancel', requireAuth, requireRole('parent', 'teacher'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cr.*, c.timing, c.teacher_id, ch.parent_id
     FROM class_registrations cr
     JOIN classes c ON c.id = cr.class_id
     JOIN children ch ON ch.id = cr.child_id
     WHERE cr.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Registration not found' });
  const reg = rows[0];

  if (req.user.role === 'parent' && reg.parent_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your child\'s registration' });
  }
  if (req.user.role === 'teacher' && reg.teacher_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your class' });
  }

  const msUntilClass = new Date(reg.timing).getTime() - Date.now();
  if (msUntilClass < TWENTY_FOUR_HOURS_MS) {
    return res.status(400).json({ error: 'Cancellation window has passed (must cancel 24h+ before class)' });
  }

  await pool.query(
    `UPDATE class_registrations SET status='cancelled', cancelled_at = NOW() WHERE id = ?`,
    [req.params.id]
  );
  res.json({ success: true });
});

// ---------------------------------------------------------------
// PARENT: per-child tab data
// ---------------------------------------------------------------
router.get('/child/:childId/upcoming', requireAuth, requireRole('parent'), async (req, res) => {
  const child = await assertChildOwnership(req.params.childId, req.user.id);
  if (!child) return res.status(403).json({ error: 'Not your child' });
  const [rows] = await pool.query(
    `SELECT cr.*, c.title, c.timing, u.name AS teacher_name
     FROM class_registrations cr
     JOIN classes c ON c.id = cr.class_id
     JOIN users u ON u.id = c.teacher_id
     WHERE cr.child_id = ? AND cr.status = 'upcoming'
     ORDER BY c.timing ASC`,
    [req.params.childId]
  );
  res.json(rows);
});

router.get('/child/:childId/attended', requireAuth, requireRole('parent'), async (req, res) => {
  const child = await assertChildOwnership(req.params.childId, req.user.id);
  if (!child) return res.status(403).json({ error: 'Not your child' });
  const [rows] = await pool.query(
    `SELECT cr.*, c.title, c.timing, u.name AS teacher_name
     FROM class_registrations cr
     JOIN classes c ON c.id = cr.class_id
     JOIN users u ON u.id = c.teacher_id
     WHERE cr.child_id = ? AND cr.status = 'attended'
     ORDER BY c.timing DESC`,
    [req.params.childId]
  );
  res.json(rows);
});

// ---------------------------------------------------------------
// TEACHER: class roster - ALL children in this class's category,
// whether or not they're registered. Unregistered children still show up
// (as "not registered") so a teacher can mark a walk-in present, which
// auto-registers them below.
// ---------------------------------------------------------------
router.get('/class/:classId', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  if (req.user.role === 'teacher') {
    const [cls] = await pool.query('SELECT * FROM classes WHERE id = ? AND teacher_id = ?', [
      req.params.classId, req.user.id
    ]);
    if (!cls.length) return res.status(403).json({ error: 'Not your class' });
  }
  const [rows] = await pool.query(
    `SELECT ch.id AS child_id, ch.name AS child_name, ch.category,
            cr.id AS registration_id, cr.status, cr.present
     FROM children ch
     LEFT JOIN class_registrations cr
       ON cr.child_id = ch.id AND cr.class_id = ? AND cr.status != 'cancelled'
     WHERE ch.category IN (
       SELECT category FROM class_categories WHERE class_id = ?
     )
     ORDER BY ch.name`,
    [req.params.classId, req.params.classId]
  );
  res.json(rows);
});

// ---------------------------------------------------------------
// TEACHER: mark attendance for the full roster.
// body: { attendance: [{ child_id, registration_id, present: true/false }, ...] }
// - registration_id present -> updates that registration's present flag
// - registration_id null + present=true -> auto-registers the child as a
//   walk-in (status 'upcoming', present=1) so it behaves identically to a
//   normally-registered child from here on (feedback, Complete Class, etc.)
// - registration_id null + present=false -> no-op, stays unregistered
// ---------------------------------------------------------------
router.post('/class/:classId/attendance', requireAuth, requireRole('teacher'), async (req, res) => {
  const [cls] = await pool.query('SELECT * FROM classes WHERE id = ? AND teacher_id = ?', [
    req.params.classId, req.user.id
  ]);
  if (!cls.length) return res.status(403).json({ error: 'Not your class' });

  const { attendance } = req.body; // array
  for (const entry of attendance) {
    if (entry.registration_id) {
      await pool.query('UPDATE class_registrations SET present = ? WHERE id = ? AND class_id = ?', [
        entry.present ? 1 : 0, entry.registration_id, req.params.classId
      ]);
    } else if (entry.present) {
      await pool.query(
        `INSERT INTO class_registrations (class_id, child_id, status, present)
         VALUES (?, ?, 'upcoming', 1)
         ON DUPLICATE KEY UPDATE present = 1, status = IF(status = 'cancelled', 'upcoming', status)`,
        [req.params.classId, entry.child_id]
      );
    }
    // else: not registered and not marked present -> leave as-is
  }
  res.json({ success: true });
});

// ---------------------------------------------------------------
// TEACHER: add feedback for a present student
// ---------------------------------------------------------------
router.post('/:registrationId/feedback', requireAuth, requireRole('teacher'), async (req, res) => {
  const { content } = req.body;
  const [rows] = await pool.query(
    `SELECT cr.*, c.teacher_id FROM class_registrations cr
     JOIN classes c ON c.id = cr.class_id WHERE cr.id = ?`,
    [req.params.registrationId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Registration not found' });
  const reg = rows[0];
  if (reg.teacher_id !== req.user.id) return res.status(403).json({ error: 'Not your class' });
  if (!reg.present) return res.status(400).json({ error: 'Can only give feedback to students marked present' });

  const [result] = await pool.query(
    'INSERT INTO feedback (registration_id, teacher_id, content) VALUES (?,?,?)',
    [req.params.registrationId, req.user.id, content]
  );
  const [row] = await pool.query('SELECT * FROM feedback WHERE id = ?', [result.insertId]);
  res.status(201).json(row[0]);
});

router.get('/class/:classId/feedback', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT f.*, cr.child_id, ch.name AS child_name
     FROM feedback f
     JOIN class_registrations cr ON cr.id = f.registration_id
     JOIN children ch ON ch.id = cr.child_id
     WHERE cr.class_id = ?`,
    [req.params.classId]
  );
  res.json(rows);
});

// ---------------------------------------------------------------
// TEACHER: "Complete Class" - marks class attended, reflects to parent/admin
// ---------------------------------------------------------------
router.post('/class/:classId/complete', requireAuth, requireRole('teacher'), async (req, res) => {
  const [cls] = await pool.query('SELECT * FROM classes WHERE id = ? AND teacher_id = ?', [
    req.params.classId, req.user.id
  ]);
  if (!cls.length) return res.status(403).json({ error: 'Not your class' });

  await pool.query('UPDATE classes SET status = \'completed\' WHERE id = ?', [req.params.classId]);
  // All non-cancelled registrations for this class flip to "attended" for the parent-facing tab
  await pool.query(
    `UPDATE class_registrations SET status = 'attended' WHERE class_id = ? AND status = 'upcoming'`,
    [req.params.classId]
  );
  res.json({ success: true });
});

module.exports = router;