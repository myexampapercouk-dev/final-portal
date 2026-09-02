import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Nav from '../../components/Nav';
import { NAV_LINKS } from './AdminDashboard';

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
    <div>
      <Nav links={NAV_LINKS} />
      <div className="container">
        <h2>Invoices</h2>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: '0 0 260px' }}>
            <h3>Select Parent</h3>
            {parents.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{ cursor: 'pointer', background: selectedParent?.id === p.id ? '#eff6ff' : '#fff' }}
                onClick={() => selectParent(p)}
              >
                {p.name}
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.email}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {!selectedParent && <p style={{ color: '#64748b' }}>Select a parent to generate an invoice.</p>}
            {selectedParent && (
              <>
                <h3>Attended Classes — {selectedParent.name}'s Children</h3>
                {attendedClasses.length === 0 && <p style={{ color: '#64748b' }}>No attended classes to invoice yet.</p>}
                <table>
                  <thead><tr><th></th><th>Child</th><th>Class</th><th>Date</th><th>Amount (₹)</th></tr></thead>
                  <tbody>
                    {attendedClasses.map((c) => (
                      <tr key={c.registration_id}>
                        <td><input type="checkbox" style={{ width: 'auto' }} checked={!!selectedIds[c.registration_id]} onChange={() => toggleSelect(c.registration_id)} /></td>
                        <td>{c.child_name}</td>
                        <td>{c.title}</td>
                        <td>{new Date(c.timing).toLocaleDateString()}</td>
                        <td>
                          <input
                            type="number"
                            style={{ width: 90 }}
                            value={amounts[c.registration_id] || ''}
                            onChange={(e) => setAmounts((a) => ({ ...a, [c.registration_id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {error && <div className="error">{error}</div>}
                <button className="gold" style={{ marginTop: 10 }} onClick={generateInvoice}>Generate Consolidated Invoice</button>

                <h3 style={{ marginTop: 26 }}>Previous Invoices</h3>
                {invoices.map((inv) => (
                  <div key={inv.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      Invoice #{inv.id} · ₹{inv.total_amount} · {new Date(inv.generated_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="badge" style={{ marginRight: 8 }}>{inv.status}</span>
                      {inv.status !== 'paid' && <button onClick={() => markPaid(inv.id)}>Mark Paid (cash)</button>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
