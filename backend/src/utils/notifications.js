const pool = require('../config/db');

// Adds an item to the admin notification bell.
async function notifyAdmin({ type, title, body = null, link = null, refId = null }) {
  await pool.query(
    'INSERT INTO notifications (type, title, body, link, ref_id) VALUES (?,?,?,?,?)',
    [type, title, body, link, refId]
  );
}

module.exports = { notifyAdmin };
