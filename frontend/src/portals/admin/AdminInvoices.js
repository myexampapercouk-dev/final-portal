import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import { NAV } from './AdminDashboard';
import { T, cardStyle, btnStyle, badgeStyle, thStyle, tdStyle } from '../../theme';

export default function AdminInvoices() {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [attendedClasses, setAttendedClasses] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [selectedIds, setSelectedIds] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { loadParents(); }, []);

  async function loadParents() {
    const { data } = await api.get('/invoices/parents');
    setParents(data);
  }

  async function selectParent(parent) {
    setSelectedParent(parent);
    setError('');
    const [classesRes, invoicesRes] = await Promise.all([
      api.get(`/invoices/parents/${parent.id}/attended-classes`),
      api.get('/invoices', { params: { parent_id: parent.id } })
    ]);
    setAttendedClasses(classesRes.data);
    setInvoices(invoicesRes.data);
    setAmounts({});
    setSelectedIds({});
  }

  function toggleSelect(regId) {
    setSelectedIds((s) => ({ ...s, [regId]: !s[regId] }));
  }

  async function generateInvoice() {
    setError('');
    const items = attendedClasses
      .filter((c) => selectedIds[c.registration_id])
      .map((c) => ({
        child_id: c.child_id,
        class_id: c.class_id,
        description: `${c.title} (${c.course_name})`,
        amount: Number(amounts[c.registration_id] || 0)
      }));
    if (!items.length) { setError('Select at least one class'); return; }
    try {
      await api.post(`/invoices/parents/${selectedParent.id}/generate`, { items });
      selectParent(selectedParent);
      setSelectedIds({});
      setAmounts({});
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate invoice');
    }
  }

  async function markPaid(invoiceId) {
    await api.post(`/invoices/${invoiceId}/mark-paid`);
    selectParent(selectedParent);
  }

  return (
    <Shell active="invoices" navItems={NAV} roleLabel="Admin">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 16px' }}>Invoices &amp; Billing</h1>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 260px' }}>
          <h3 style={{ fontFamily: T.headlineFont, fontSize: 15 }}>Select Parent</h3>
          {parents.map((p) => (
            <div
              key={p.id}
              style={{
                ...cardStyle, cursor: 'pointer',
                background: selectedParent?.id === p.id ? T.primaryFixed : T.surfaceContainerLowest
              }}
              onClick={() => selectParent(p)}
            >
              {p.name}
              <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>{p.email}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedParent && <p style={{ color: T.onSurfaceVariant }}>Select a parent to generate an invoice.</p>}
          {selectedParent && (
            <>
              <h3 style={{ fontFamily: T.headlineFont, fontSize: 15 }}>Attended Classes — {selectedParent.name}'s Children</h3>
              {attendedClasses.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No attended classes to invoice yet.</p>}
              {attendedClasses.length > 0 && (
                <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, overflow: 'auto', marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.surfaceContainer, color: T.onSurfaceVariant, textTransform: 'uppercase', fontSize: 10.5 }}>
                        <th style={thStyle}></th><th style={thStyle}>Child</th><th style={thStyle}>Class</th><th style={thStyle}>Date</th><th style={thStyle}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendedClasses.map((c) => (
                        <tr key={c.registration_id} style={{ borderBottom: `1px solid ${T.surfaceContainerHigh}` }}>
                          <td style={tdStyle}><input type="checkbox" style={{ width: 'auto' }} checked={!!selectedIds[c.registration_id]} onChange={() => toggleSelect(c.registration_id)} /></td>
                          <td style={tdStyle}>{c.child_name}</td>
                          <td style={tdStyle}>{c.title}</td>
                          <td style={tdStyle}>{new Date(c.timing).toLocaleDateString()}</td>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.surfaceContainerHigh}` }}
                              value={amounts[c.registration_id] || ''}
                              onChange={(e) => setAmounts((a) => ({ ...a, [c.registration_id]: e.target.value }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {error && <div style={{ color: T.error, fontSize: 12.5, background: T.errorContainer, padding: '7px 11px', borderRadius: 8, marginBottom: 10 }}>{error}</div>}
              <button style={btnStyle('primary')} onClick={generateInvoice}>Generate Consolidated Invoice</button>

              <h3 style={{ fontFamily: T.headlineFont, fontSize: 15, marginTop: 26 }}>Previous Invoices</h3>
              {invoices.map((inv) => (
                <div key={inv.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    Invoice #{inv.id} · ₹{inv.total_amount} · {new Date(inv.generated_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={badgeStyle(inv.status === 'paid' ? T.tertiaryFixed : T.errorContainer, inv.status === 'paid' ? T.onTertiaryFixed : T.onErrorContainer)}>{inv.status}</span>
                    {inv.status !== 'paid' && <button style={btnStyle('secondaryOutline')} onClick={() => markPaid(inv.id)}>Mark Paid (cash)</button>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
