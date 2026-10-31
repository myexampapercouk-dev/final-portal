const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { userNotificationsEnabled } = require('../utils/notifications');

const router = express.Router();
router.use(requireAuth, requireRole('parent'));

// The signed-in parent's own open notifications
router.get('/', async (req, res) => {
  if (!userNotificationsEnabled()) return res.json([]);
  const [rows] = await pool.query(
    `SELECT id, type, title, body, link, created_at FROM notifications
     WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC, id DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
});

async function resolve(req, res, status) {
  if (!userNotificationsEnabled()) return res.json({ success: true });
  await pool.query('UPDATE notifications SET status = ? WHERE id = ? AND user_id = ?', [status, req.params.id, req.user.id]);
  res.json({ success: true });
}
router.post('/:id/done', (req, res) => resolve(req, res, 'done'));
router.post('/:id/dismiss', (req, res) => resolve(req, res, 'dismissed'));

module.exports = router;
