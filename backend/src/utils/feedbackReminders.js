const pool = require('../config/db');
const { sendFeedbackApprovalEmail } = require('./mailer');
const { notifyAdmin } = require('./notifications');

// Admin is emailed when a teacher completes a class (feedback awaiting approval).
// If it is still not approved, the email repeats: 8 hours after the first one,
// then 24 hours after it, then every 24 hours after that until it is approved.
// system_meta keeps one ledger row per class: fb_remind:<classId> = { first, sent }.
const HOUR = 60 * 60 * 1000;
const key = (classId) => `fb_remind:${classId}`;
const dueAfter = (sent) => (sent === 0 ? 8 : 24 * sent) * HOUR;

async function emailAdmins(cls, { reminder = 0 } = {}) {
  const [admins] = await pool.query(`SELECT email, name FROM users WHERE role = 'admin'`);
  for (const a of admins) {
    await sendFeedbackApprovalEmail(a.email, { adminName: a.name, className: cls.title, teacherName: cls.teacher_name, classId: cls.id, reminder });
  }
}

// Called when a class is first completed: emails admin and starts the clock
async function startApprovalClock(cls) {
  await pool.query('REPLACE INTO system_meta (k, v) VALUES (?, ?)', [key(cls.id), JSON.stringify({ first: Date.now(), sent: 0 })]);
  await emailAdmins(cls);
}

async function runReminders() {
  const [pending] = await pool.query(
    `SELECT c.id, c.title, u.name AS teacher_name FROM classes c
     LEFT JOIN users u ON u.id = c.teacher_id WHERE c.feedback_status = 'pending'`
  );
  for (const cls of pending) {
    const [rows] = await pool.query('SELECT v FROM system_meta WHERE k = ?', [key(cls.id)]);
    if (!rows.length) {
      // Completed before reminders existed: start counting from now, without emailing again
      await pool.query('INSERT IGNORE INTO system_meta (k, v) VALUES (?, ?)', [key(cls.id), JSON.stringify({ first: Date.now(), sent: 0 })]);
      continue;
    }
    const state = JSON.parse(rows[0].v);
    if (Date.now() < state.first + dueAfter(state.sent)) continue;

    state.sent += 1;
    await pool.query('UPDATE system_meta SET v = ? WHERE k = ?', [JSON.stringify(state), key(cls.id)]);
    await emailAdmins(cls, { reminder: state.sent });
    await notifyAdmin({
      type: 'feedback_reminder',
      title: `Reminder: feedback still awaiting approval - ${cls.title}`,
      body: `Reminder ${state.sent}. Completed by ${cls.teacher_name || 'the teacher'}.`,
      link: `/admin/approvals/${cls.id}`,
      refId: cls.id
    });
  }
}

function startFeedbackReminderJob() {
  const tick = () => runReminders().catch((e) => console.error('[FEEDBACK REMINDERS]', e.message));
  setTimeout(tick, 30 * 1000);
  setInterval(tick, 10 * 60 * 1000);
}

module.exports = { startApprovalClock, startFeedbackReminderJob, runReminders };
