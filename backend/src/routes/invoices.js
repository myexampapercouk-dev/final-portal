const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// ADMIN: list all parents (for the Invoices flow: select a parent)
// ---------------------------------------------------------------
router.get('/parents', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(`SELECT id, name, email, phone FROM users WHERE role = 'parent'`);
  res.json(rows);
});

// ADMIN: children under a parent -> classes attended per child
router.get('/parents/:parentId/attended-classes', requireAuth, requireRole('admin'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cr.id AS registration_id, ch.id AS child_id, ch.name AS child_name,
            c.id AS class_id, c.title, c.timing, co.name AS course_name
     FROM class_registrations cr
     JOIN children ch ON ch.id = cr.child_id
     JOIN classes c ON c.id = cr.class_id
     JOIN courses co ON co.id = c.course_id
     WHERE ch.parent_id = ? AND cr.status = 'attended'
     ORDER BY ch.name, c.timing`,
    [req.params.parentId]
  );
  res.json(rows);
});

// ---------------------------------------------------------------
// ADMIN: generate ONE consolidated invoice per parent
// body: { items: [{ child_id, class_id, description, amount }, ...] }
// (No payment gateway - this is a record/notification only, cash payment)
// ---------------------------------------------------------------
router.post('/parents/:parentId/generate', requireAuth, requireRole('admin'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'At least one item is required' });

    const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO invoices (parent_id, total_amount) VALUES (?,?)',
      [req.params.parentId, total]
    );
    const invoiceId = result.insertId;
    for (const item of items) {
      await conn.query(
        `INSERT INTO invoice_items (invoice_id, child_id, class_id, description, amount)
         VALUES (?,?,?,?,?)`,
        [invoiceId, item.child_id, item.class_id, item.description || null, item.amount || 0]
      );
    }
    await conn.commit();
    const [invoice] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    res.status(201).json(invoice[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Could not generate invoice', details: err.message });
  } finally {
    conn.release();
  }
});

// ADMIN: mark an invoice as paid (cash received)
router.post('/:id/mark-paid', requireAuth, requireRole('admin'), async (req, res) => {
  await pool.query(`UPDATE invoices SET status = 'paid' WHERE id = ?`, [req.params.id]);
  res.json({ success: true });
});

// ---------------------------------------------------------------
// Shared: list invoices - parent sees their own, admin sees all (or by parent)
// ---------------------------------------------------------------
router.get('/', requireAuth, async (req, res) => {
  let rows;
  if (req.user.role === 'parent') {
    [rows] = await pool.query('SELECT * FROM invoices WHERE parent_id = ? ORDER BY generated_at DESC', [
      req.user.id
    ]);
  } else if (req.user.role === 'admin') {
    const parentId = req.query.parent_id;
    if (parentId) {
      [rows] = await pool.query('SELECT * FROM invoices WHERE parent_id = ? ORDER BY generated_at DESC', [
        parentId
      ]);
    } else {
      [rows] = await pool.query('SELECT * FROM invoices ORDER BY generated_at DESC');
    }
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(rows);
});

// Invoice detail with line items (parent must own it, admin can view any)
router.get('/:id', requireAuth, async (req, res) => {
  const [invoiceRows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  if (!invoiceRows.length) return res.status(404).json({ error: 'Invoice not found' });
  const invoice = invoiceRows[0];
  if (req.user.role === 'parent' && invoice.parent_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const [items] = await pool.query(
    `SELECT ii.*, ch.name AS child_name, c.title AS class_title
     FROM invoice_items ii
     JOIN children ch ON ch.id = ii.child_id
     JOIN classes c ON c.id = ii.class_id
     WHERE ii.invoice_id = ?`,
    [req.params.id]
  );
  res.json({ ...invoice, items });
});

module.exports = router;
