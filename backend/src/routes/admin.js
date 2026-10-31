const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendFeedbackReadyEmail, sendChildLinkedEmail } = require('../utils/mailer');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// "Tutors" menu - list all teachers
router.get('/teachers', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, created_at FROM users WHERE role = 'teacher' ORDER BY name`
  );
  res.json(rows);
});

router.delete('/teachers/:id', async (req, res) => {
  await pool.query(`DELETE FROM users WHERE id = ? AND role = 'teacher'`, [req.params.id]);
  res.json({ success: true });
});

// "Parents" menu - view all parents and their associated children
router.get('/parents', async (req, res) => {
  const [parents] = await pool.query(`SELECT id, name, email, phone FROM users WHERE role = 'parent'`);
  const [children] = await pool.query('SELECT * FROM children');
  res.json(parents.map((p) => ({ ...p, children: children.filter((c) => c.parent_id === p.id) })));
});

// ---------------------------------------------------------------
// "Students" menu - every child with the parent they belong to.
// ?filter=new returns only children that have no parent linked yet
// (the ones a teacher added).
// ---------------------------------------------------------------
router.get('/students', async (req, res) => {
  const onlyNew = req.query.filter === 'new';
  const [rows] = await pool.query(
    `SELECT ch.id, ch.name, ch.category, ch.dob, ch.parent_id, ch.created_at,
            u.name AS parent_name, u.email AS parent_email,
            t.name AS added_by_teacher
     FROM children ch
     LEFT JOIN users u ON u.id = ch.parent_id
     LEFT JOIN users t ON t.id = ch.added_by_teacher_id
     ${onlyNew ? 'WHERE ch.parent_id IS NULL' : ''}
     ORDER BY (ch.parent_id IS NULL) DESC, ch.created_at DESC`
  );
  res.json(rows);
});

async function resolveNewChildNotifications(childId) {
  await pool.query(
    `UPDATE notifications SET status = 'done' WHERE type = 'new_child' AND ref_id = ? AND status = 'open'`,
    [childId]
  );
}

// Link a child to an existing parent
router.put('/students/:id/parent', async (req, res) => {
  const { parent_id } = req.body;
  const [parents] = await pool.query(`SELECT id, name, email FROM users WHERE id = ? AND role = 'parent'`, [parent_id]);
  if (!parents.length) return res.status(404).json({ error: 'Parent not found' });
  const [existing] = await pool.query('SELECT name, category, parent_id FROM children WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Student not found' });
  await pool.query('UPDATE children SET parent_id = ? WHERE id = ?', [parent_id, req.params.id]);
  await resolveNewChildNotifications(req.params.id);

  // Let the parent know the child now appears on their account (not when nothing changed)
  if (Number(existing[0].parent_id) !== Number(parent_id)) {
    await sendChildLinkedEmail(parents[0].email, {
      parentName: parents[0].name,
      childName: existing[0].name,
      category: existing[0].category
    });
  }
  res.json({ success: true });
});

// Create a brand-new parent account and link the child to it in one step
router.post('/students/:id/create-parent', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const [child] = await pool.query('SELECT id FROM children WHERE id = ?', [req.params.id]);
    if (!child.length) return res.status(404).json({ error: 'Student not found' });
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [created] = await pool.query(
      'INSERT INTO users (role, name, email, phone, password_hash) VALUES (?,?,?,?,?)',
      ['parent', name, email, phone || null, hash]
    );
    await pool.query('UPDATE children SET parent_id = ? WHERE id = ?', [created.insertId, req.params.id]);
    await resolveNewChildNotifications(req.params.id);
    res.status(201).json({ id: created.insertId, name, email });
  } catch (err) {
    res.status(500).json({ error: 'Could not create parent', details: err.message });
  }
});

// ---------------------------------------------------------------
// Notification bell
// ---------------------------------------------------------------
router.get('/notifications', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE status = 'open' ORDER BY created_at DESC LIMIT 50`
  );
  res.json(rows);
});

router.post('/notifications/:id/done', async (req, res) => {
  await pool.query(`UPDATE notifications SET status = 'done' WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

router.post('/notifications/:id/dismiss', async (req, res) => {
  await pool.query(`UPDATE notifications SET status = 'dismissed' WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

// ---------------------------------------------------------------
// Feedback approval: parents only see a class's feedback once admin approves it
// ---------------------------------------------------------------
router.get('/classes/:id/feedback-review', async (req, res) => {
  const [classes] = await pool.query(
    `SELECT c.id, c.title, c.timing, c.feedback_status, co.name AS course_name, u.name AS teacher_name
     FROM classes c
     JOIN courses co ON co.id = c.course_id
     JOIN users u ON u.id = c.teacher_id
     WHERE c.id = ?`,
    [req.params.id]
  );
  if (!classes.length) return res.status(404).json({ error: 'Class not found' });

  const [students] = await pool.query(
    `SELECT cr.id AS registration_id, ch.name AS child_name, ch.category, u.name AS parent_name
     FROM class_registrations cr
     JOIN children ch ON ch.id = cr.child_id
     LEFT JOIN users u ON u.id = ch.parent_id
     WHERE cr.class_id = ? AND cr.present = 1
     ORDER BY ch.name`,
    [req.params.id]
  );
  const [feedback] = await pool.query(
    `SELECT f.id, f.registration_id, f.subject, f.content
     FROM feedback f JOIN class_registrations cr ON cr.id = f.registration_id
     WHERE cr.class_id = ? ORDER BY f.id`,
    [req.params.id]
  );
  res.json({
    ...classes[0],
    students: students.map((s) => ({ ...s, feedback: feedback.filter((f) => f.registration_id === s.registration_id) }))
  });
});

// Admin can correct a remark during review
router.put('/feedback/:id', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' });
  const [result] = await pool.query('UPDATE feedback SET content = ? WHERE id = ?', [content.trim(), req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Feedback not found' });
  res.json({ success: true });
});

router.post('/classes/:id/approve-feedback', async (req, res) => {
  const [classes] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
  if (!classes.length) return res.status(404).json({ error: 'Class not found' });
  if (classes[0].feedback_status === 'approved') return res.status(400).json({ error: 'Already approved' });
  if (classes[0].feedback_status !== 'pending') {
    return res.status(400).json({ error: 'The teacher has not completed this class yet' });
  }

  await pool.query(`UPDATE classes SET feedback_status = 'approved' WHERE id = ?`, [req.params.id]);
  await pool.query(
    `UPDATE notifications SET status = 'done' WHERE type = 'feedback_approval' AND ref_id = ? AND status = 'open'`,
    [req.params.id]
  );

  // One email per parent, per child that was present (children without a parent are skipped)
  const [recipients] = await pool.query(
    `SELECT ch.name AS child_name, u.name AS parent_name, u.email AS parent_email
     FROM class_registrations cr
     JOIN children ch ON ch.id = cr.child_id
     JOIN users u ON u.id = ch.parent_id
     WHERE cr.class_id = ? AND cr.present = 1`,
    [req.params.id]
  );
  for (const r of recipients) {
    await sendFeedbackReadyEmail(r.parent_email, {
      parentName: r.parent_name,
      childName: r.child_name,
      className: classes[0].title
    });
  }
  res.json({ success: true, notified: recipients.length });
});

module.exports = router;
