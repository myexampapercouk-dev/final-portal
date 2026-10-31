const pool = require('../config/db');

// notifications.user_id: NULL = an admin notification, otherwise the id of the
// parent it belongs to. The column is added automatically at startup, so a
// database that has not had the migration run yet still works.
let hasUserId = false;

async function ensureNotificationSchema() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'user_id'`
    );
    if (!cols.length) await pool.query('ALTER TABLE notifications ADD COLUMN user_id INT NULL');
    hasUserId = true;
  } catch (err) {
    console.error('[NOTIFICATIONS] could not prepare the user_id column - parent notifications are off:', err.message);
  }
}

const userNotificationsEnabled = () => hasUserId;

// SQL fragment that keeps parents' notifications out of the admin bell
const adminOnlyClause = () => (hasUserId ? ' AND user_id IS NULL' : '');

// Adds an item to the admin notification bell.
async function notifyAdmin({ type, title, body = null, link = null, refId = null }) {
  await pool.query(
    'INSERT INTO notifications (type, title, body, link, ref_id) VALUES (?,?,?,?,?)',
    [type, title, body, link, refId]
  );
}

// Adds an item to one parent's bell. Never throws - a failed notification must
// not break the action that triggered it.
async function notifyUser(userId, { type, title, body = null, link = null, refId = null }) {
  if (!hasUserId || !userId) return;
  try {
    await pool.query(
      'INSERT INTO notifications (type, title, body, link, ref_id, user_id) VALUES (?,?,?,?,?,?)',
      [type, title, body, link, refId, userId]
    );
  } catch (err) {
    console.error('[NOTIFY USER FAILED]', err.message);
  }
}

module.exports = { notifyAdmin, notifyUser, ensureNotificationSchema, userNotificationsEnabled, adminOnlyClause };
