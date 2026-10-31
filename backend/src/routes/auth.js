const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/mailer');
require('dotenv').config();

const router = express.Router();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Email verification codes are switched OFF unless OTP_REQUIRED=true is set in
// the environment. To turn them back on later, set OTP_REQUIRED=true and
// restart the backend - nothing else needs to change.
const OTP_REQUIRED = String(process.env.OTP_REQUIRED).toLowerCase() === 'true';

// The frontend reads this to decide whether to show the "enter your code" step.
router.get('/config', (req, res) => res.json({ otpRequired: OTP_REQUIRED }));

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ---------------------------------------------------------------
// PARENT SIGNUP STEP 1: send a 6-digit email verification code.
// Only parents go through OTP verification — teacher/admin accounts
// are created directly by admin, so they don't need this step.
// ---------------------------------------------------------------
router.post('/parent/send-otp', async (req, res) => {
  try {
    if (!OTP_REQUIRED) return res.json({ success: true, otpDisabled: true });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const otp = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await pool.query(
      `INSERT INTO email_otps (email, otp_code, purpose, expires_at) VALUES (?, ?, 'parent_signup', ?)`,
      [email, otp, expiresAt]
    );

    const result = await sendOtpEmail(email, otp);

    const response = { success: true, message: 'Verification code sent to your email.' };
    if (!result.delivered) {
      response.devOtp = otp;
      response.message = 'SMTP is not configured on this server — check the backend console for your code (dev mode).';
    }
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Could not send verification code', details: err.message });
  }
});

// ---------------------------------------------------------------
// PARENT SIGNUP STEP 2: verify the OTP and create the account
// (the only self-serve registration path)
// ---------------------------------------------------------------
router.post('/parent/register', async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (OTP_REQUIRED && !otp) {
      return res.status(400).json({ error: 'Email verification code is required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    if (OTP_REQUIRED) {
      const [otpRows] = await pool.query(
        `SELECT * FROM email_otps
         WHERE email = ? AND purpose = 'parent_signup' AND consumed = 0
         ORDER BY id DESC LIMIT 1`,
        [email]
      );
      if (!otpRows.length) {
        return res.status(400).json({ error: 'No verification code found for this email. Request a new one.' });
      }
      const record = otpRows[0];
      if (new Date(record.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ error: 'Verification code expired. Request a new one.' });
      }
      if (record.otp_code !== String(otp)) {
        return res.status(400).json({ error: 'Incorrect verification code' });
      }
      await pool.query('UPDATE email_otps SET consumed = 1 WHERE id = ?', [record.id]);
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (role, name, email, phone, password_hash) VALUES (?,?,?,?,?)',
      ['parent', name, email, phone || null, hash]
    );
    const user = { id: result.insertId, role: 'parent', name, email };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// LOGIN (parent / teacher / admin all share this).
// Password is checked first for everyone. If the account is a parent,
// login isn't complete yet — an OTP is emailed and a token is withheld
// until /login/verify-otp succeeds. Teacher/admin get a token immediately.
// ---------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN ATTEMPT]', email);

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('[LOGIN] users found for that email:', rows.length);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] password match:', ok);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role === 'parent' && OTP_REQUIRED) {
      const otp = String(crypto.randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      await pool.query(
        `INSERT INTO email_otps (email, otp_code, purpose, expires_at) VALUES (?, ?, 'parent_login', ?)`,
        [email, otp, expiresAt]
      );
      const result = await sendOtpEmail(email, otp);

      const response = { requiresOtp: true, email, message: 'Verification code sent to your email.' };
      if (!result.delivered) {
        response.devOtp = otp;
        response.message = 'SMTP is not configured on this server — check the backend console for your code (dev mode).';
      }
      return res.json(response);
    }

    const safeUser = { id: user.id, role: user.role, name: user.name, email: user.email };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.code || '', err.message);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// PARENT LOGIN STEP 2: verify the OTP and issue the token
// ---------------------------------------------------------------
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });

    const [otpRows] = await pool.query(
      `SELECT * FROM email_otps
       WHERE email = ? AND purpose = 'parent_login' AND consumed = 0
       ORDER BY id DESC LIMIT 1`,
      [email]
    );
    if (!otpRows.length) {
      return res.status(400).json({ error: 'No verification code found. Please log in again.' });
    }
    const record = otpRows[0];
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code expired. Please log in again.' });
    }
    if (record.otp_code !== String(otp)) {
      return res.status(400).json({ error: 'Incorrect verification code' });
    }

    await pool.query('UPDATE email_otps SET consumed = 1 WHERE id = ?', [record.id]);

    const [userRows] = await pool.query(`SELECT * FROM users WHERE email = ? AND role = 'parent'`, [email]);
    if (!userRows.length) return res.status(404).json({ error: 'Account not found' });

    const user = userRows[0];
    const safeUser = { id: user.id, role: user.role, name: user.name, email: user.email };
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// ---------------------------------------------------------------
// ADMIN creates teacher accounts (teachers cannot self-register)
// ---------------------------------------------------------------
router.post('/admin/create-teacher', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (role, name, email, phone, password_hash) VALUES (?,?,?,?,?)',
      ['teacher', name, email, phone || null, hash]
    );
    res.status(201).json({ id: result.insertId, name, email, role: 'teacher' });
  } catch (err) {
    res.status(500).json({ error: 'Could not create teacher', details: err.message });
  }
});


// ---------------------------------------------------------------
// FORGOT / RESET PASSWORD (parents and teachers only - admin accounts are
// never reset through the public site).
// The reset link carries a random token. Only a fingerprint of it is stored
// (in system_meta), it expires after 1 hour and works once.
// ---------------------------------------------------------------
const RESET_TTL_MS = 60 * 60 * 1000;
const resetKey = (token) => 'pwreset:' + crypto.createHash('sha256').update(token).digest('hex').slice(0, 40);
const lastResetRequest = new Map(); // email -> time, so nobody can spam someone's inbox

router.post('/forgot-password', async (req, res) => {
  // Always the same answer, so this can't be used to find out who has an account.
  const generic = { success: true, message: 'If that email belongs to a parent or teacher account, a reset link has been sent.' };
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Enter your email address' });

    const last = lastResetRequest.get(email) || 0;
    if (Date.now() - last < 60 * 1000) return res.json(generic);
    lastResetRequest.set(email, Date.now());

    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE LOWER(email) = ? AND role IN ('parent','teacher')",
      [email]
    );
    if (rows.length) {
      const user = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      await pool.query('INSERT INTO system_meta (k, v) VALUES (?, ?)', [
        resetKey(token),
        JSON.stringify({ uid: user.id, exp: Date.now() + RESET_TTL_MS })
      ]);
      const portalUrl = process.env.PORTAL_URL || 'https://portal.myexampapers.co.uk';
      await sendPasswordResetEmail(user.email, { name: user.name, link: `${portalUrl}/reset-password?token=${token}` });
    }
    res.json(generic);
  } catch (err) {
    console.error('[FORGOT PASSWORD]', err.message);
    res.json(generic);
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password are required' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const key = resetKey(String(token));
    const [rows] = await pool.query('SELECT v FROM system_meta WHERE k = ?', [key]);
    const expired = { error: 'This reset link is invalid or has expired. Please request a new one.' };
    if (!rows.length) return res.status(400).json(expired);

    // Single use: remove it first so the same link can never be replayed
    await pool.query('DELETE FROM system_meta WHERE k = ?', [key]);
    const { uid, exp } = JSON.parse(rows[0].v);
    if (Date.now() > exp) return res.status(400).json(expired);

    const hash = await bcrypt.hash(String(password), 10);
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ? AND role IN ('parent','teacher')",
      [hash, uid]
    );
    if (!result.affectedRows) return res.status(400).json(expired);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not reset password', details: err.message });
  }
});

// GET current logged-in user (used by frontend on refresh)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;