import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Nav from '../../components/Nav';

export default function ParentInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/invoices');
    setInvoices(data);
  }

  async function viewDetail(id) {
    const { data } = await api.get(`/invoices/${id}`);
    setSelected(data);
  }

  return (
    <div>
      <Nav links={[{ to: '/parent', label: 'Main Dashboard' }, { to: '/parent/invoices', label: 'Invoices' }]} />
      <div className="container">
        <h2>Invoices</h2>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          This is a record of amounts due — payments are collected in cash directly, not through this portal.
        </p>
        {invoices.length === 0 && <p style={{ color: '#64748b' }}>No invoices yet.</p>}
        {invoices.map((inv) => (
          <div key={inv.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => viewDetail(inv.id)}>
            <div>
              <strong>Invoice #{inv.id}</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(inv.generated_at).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="badge" style={{ background: inv.status === 'paid' ? '#dcfce7' : '#fee2e2', color: inv.status === 'paid' ? '#166534' : '#991b1b' }}>
                {inv.status}
              </span>
              <strong style={{ marginLeft: 10 }}>₹{inv.total_amount}</strong>
            </div>
          </div>
        ))}

        {selected && (
          <div className="modal-backdrop" onClick={() => setSelected(null)}>
            <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
              <h3>Invoice #{selected.id}</h3>
              <table>
                <thead><tr><th>Child</th><th>Class</th><th>Amount</th></tr></thead>
                <tbody>
                  {selected.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.child_name}</td>
                      <td>{it.class_title}</td>
                      <td>₹{it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ textAlign: 'right', marginTop: 10 }}><strong>Total: ₹{selected.total_amount}</strong></p>
              <button className="secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
