const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');
require('dotenv').config();

const router = express.Router();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
    if (!otp) {
      return res.status(400).json({ error: 'Email verification code is required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

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
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role === 'parent') {
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

// GET current logged-in user (used by frontend on refresh)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;