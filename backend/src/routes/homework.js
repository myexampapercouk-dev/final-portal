const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { notifyUser } = require('../utils/notifications');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadHomework, homeworkDir } = require('../middleware/uploadHomework');
const { ensureFilesTable, keepCopy } = require('../utils/homeworkFiles');

const router = express.Router();

// ADMIN: upload homework (+ optional answer PDF) for a class
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  uploadHomework(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { class_id, title } = req.body;
      const hw = req.files?.homework?.[0];
      const ans = req.files?.answer?.[0];
      if (!class_id || !title || !hw) {
        return res.status(400).json({ error: 'class_id, title and the homework PDF are required' });
      }
      const [result] = await pool.query(
        `INSERT INTO homework (class_id, title, file_name, file_path, answer_file_name, answer_file_path)
         VALUES (?,?,?,?,?,?)`,
        [class_id, title, hw.originalname, hw.filename, ans ? ans.originalname : null, ans ? ans.filename : null]
      );
      // Tell the parents of the children booked into this class
      try {
        const [parents] = await pool.query(
          `SELECT DISTINCT ch.parent_id FROM class_registrations cr
           JOIN children ch ON ch.id = cr.child_id
           WHERE cr.class_id = ? AND cr.status <> 'cancelled' AND ch.parent_id IS NOT NULL`,
          [class_id]
        );
        for (const p of parents) {
          await notifyUser(p.parent_id, { type: 'parent_homework', title: 'New homework', body: title, link: '/parent/homework' });
        }
      } catch (e) {
        console.error('[HOMEWORK NOTIFY FAILED]', e.message);
      }
      res.status(201).json({ id: result.insertId });
      // Database backup copy runs after the response so a slow save can never hold the upload up
      keepCopy(result.insertId, 'homework', hw).then(() => (ans ? keepCopy(result.insertId, 'answer', ans) : null));
    } catch (e) {
      res.status(500).json({ error: 'Could not save homework', details: e.message });
    }
  });
});

// ADMIN: list everything
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT h.id, h.title, h.file_name, h.answer_file_name, h.created_at, c.title AS class_title, c.timing
     FROM homework h JOIN classes c ON c.id = h.class_id
     ORDER BY h.created_at DESC, h.id DESC`
  );
  res.json(rows);
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM homework WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Homework not found' });
  for (const f of [rows[0].file_path, rows[0].answer_file_path]) {
    if (f) fs.unlink(path.join(homeworkDir, path.basename(f)), () => {});
  }
  await pool.query('DELETE FROM homework WHERE id = ?', [req.params.id]);
  try { await ensureFilesTable(); await pool.query('DELETE FROM homework_files WHERE homework_id = ?', [req.params.id]); } catch (e) { /* nothing to remove */ }
  res.json({ success: true });
});

// PARENT: homework for the classes a child is registered in, newest first
router.get('/', requireAuth, requireRole('parent'), async (req, res) => {
  const { child_id } = req.query;
  const [child] = await pool.query('SELECT id FROM children WHERE id = ? AND parent_id = ?', [child_id, req.user.id]);
  if (!child.length) return res.status(403).json({ error: 'Not your child' });
  const [rows] = await pool.query(
    `SELECT h.id, h.title, h.created_at, (h.answer_file_path IS NOT NULL) AS has_answer,
            c.title AS class_title, c.timing
     FROM homework h
     JOIN classes c ON c.id = h.class_id
     JOIN class_registrations cr ON cr.class_id = c.id
     WHERE cr.child_id = ? AND cr.status IN ('upcoming','attended')
     ORDER BY h.created_at DESC, h.id DESC`,
    [child_id]
  );
  res.json(rows.map((r) => ({ ...r, has_answer: !!r.has_answer })));
});

// View-only PDF stream. kind = 'homework' | 'answer'.
// Sent inline with no-store so the browser never offers it as a download.
router.get('/:id/file/:kind', requireAuth, requireRole('parent', 'admin', 'teacher'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM homework WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Homework not found' });
  const hw = rows[0];

  if (req.user.role === 'parent') {
    const [allowed] = await pool.query(
      `SELECT cr.id FROM class_registrations cr
       JOIN children ch ON ch.id = cr.child_id
       WHERE cr.class_id = ? AND ch.parent_id = ? AND cr.status IN ('upcoming','attended') LIMIT 1`,
      [hw.class_id, req.user.id]
    );
    if (!allowed.length) return res.status(403).json({ error: 'Forbidden' });
  }

  const stored = req.params.kind === 'answer' ? hw.answer_file_path : req.params.kind === 'homework' ? hw.file_path : null;
  if (!stored) return res.status(404).json({ error: 'File not found' });
  const full = path.join(homeworkDir, path.basename(stored));
  const headers = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff'
  };
  if (fs.existsSync(full)) {
    res.set(headers);
    return fs.createReadStream(full).pipe(res);
  }
  // Not on disk (e.g. wiped by a redeploy): serve the database copy and restore the file
  try {
    await ensureFilesTable();
    const [copy] = await pool.query('SELECT data FROM homework_files WHERE homework_id = ? AND kind = ?', [hw.id, req.params.kind]);
    if (copy.length) {
      fs.mkdirSync(homeworkDir, { recursive: true });
      fs.writeFile(full, copy[0].data, () => {});
      res.set(headers);
      return res.send(copy[0].data);
    }
  } catch (e) {
    console.error('[HOMEWORK COPY READ FAILED]', e.message);
  }
  res.status(404).json({ error: 'File missing on server - please ask admin to upload it again' });
});

module.exports = router;
