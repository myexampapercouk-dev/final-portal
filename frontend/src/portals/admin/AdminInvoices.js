import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, badge, thStyle, tdStyle } from './theme';

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
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 16px' }}>Invoices &amp; Billing</h1>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 260px' }}>
          <h3 style={{ fontFamily: A.headlineFont, fontSize: 15, color: A.navy }}>Select Parent</h3>
          {parents.map((p) => (
            <div
              key={p.id}
              style={{ ...cardStyle, cursor: 'pointer', background: selectedParent?.id === p.id ? A.goldSoft : A.paper }}
              onClick={() => selectParent(p)}
            >
              <span style={{ color: A.navy }}>{p.name}</span>
              <div style={{ fontSize: 12, color: A.meta }}>{p.email}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          {!selectedParent && <p style={{ color: A.meta }}>Select a parent to generate an invoice.</p>}
          {selectedParent && (
            <>
              <h3 style={{ fontFamily: A.headlineFont, fontSize: 15, color: A.navy }}>Attended Classes — {selectedParent.name}'s Children</h3>
              {attendedClasses.length === 0 && <p style={{ color: A.meta }}>No attended classes to invoice yet.</p>}
              {attendedClasses.length > 0 && (
                <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflow: 'auto', marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: A.navy, color: '#fff' }}>
                        <th style={thStyle}></th><th style={thStyle}>Child</th><th style={thStyle}>Class</th><th style={thStyle}>Date</th><th style={thStyle}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendedClasses.map((c) => (
                        <tr key={c.registration_id} style={{ borderBottom: `1px solid ${A.line}` }}>
                          <td style={tdStyle}><input type="checkbox" style={{ width: 'auto' }} checked={!!selectedIds[c.registration_id]} onChange={() => toggleSelect(c.registration_id)} /></td>
                          <td style={tdStyle}>{c.child_name}</td>
                          <td style={tdStyle}>{c.title}</td>
                          <td style={tdStyle}>{new Date(c.timing).toLocaleDateString()}</td>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: `1px solid ${A.line}` }}
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
              {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>{error}</div>}
              <button style={btn('gold')} onClick={generateInvoice}>Generate Consolidated Invoice</button>

              <h3 style={{ fontFamily: A.headlineFont, fontSize: 15, color: A.navy, marginTop: 26 }}>Previous Invoices</h3>
              {invoices.map((inv) => (
                <div key={inv.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ color: A.navy }}>
                    Invoice #{inv.id} · ₹{inv.total_amount} · {new Date(inv.generated_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={badge(inv.status === 'paid' ? A.greenWash : A.goldSoft, inv.status === 'paid' ? A.green : '#7A5B00')}>{inv.status}</span>
                    {inv.status !== 'paid' && <button style={btn('secondary')} onClick={() => markPaid(inv.id)}>Mark Paid (cash)</button>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
