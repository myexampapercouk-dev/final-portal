import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import { T, cardStyle, btnStyle, badgeStyle, modalBackdrop, modalCard } from '../../theme';

const NAV = [
  { key: 'dashboard', to: '/parent', label: 'Main Dashboard', icon: 'family_restroom' },
  { key: 'invoices', to: '/parent/invoices', label: 'Invoices', icon: 'receipt_long' }
];

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
    <Shell active="invoices" navItems={NAV} roleLabel="Parent">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 6px' }}>Invoices</h1>
      <p style={{ fontSize: 13, color: T.onSurfaceVariant, marginBottom: 16 }}>
        This is a record of amounts due — payments are collected in cash directly, not through this portal.
      </p>
      {invoices.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No invoices yet.</p>}
      {invoices.map((inv) => (
        <div key={inv.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => viewDetail(inv.id)}>
          <div>
            <strong>Invoice #{inv.id}</strong>
            <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>{new Date(inv.generated_at).toLocaleDateString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={badgeStyle(inv.status === 'paid' ? T.tertiaryFixed : T.errorContainer, inv.status === 'paid' ? T.onTertiaryFixed : T.onErrorContainer)}>
              {inv.status}
            </span>
            <strong>₹{inv.total_amount}</strong>
          </div>
        </div>
      ))}

      {selected && (
        <div style={modalBackdrop} onClick={() => setSelected(null)}>
          <div style={{ ...modalCard, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: T.headlineFont, marginTop: 0 }}>Invoice #{selected.id}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: T.surfaceContainer, color: T.onSurfaceVariant, textTransform: 'uppercase', fontSize: 11 }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Child</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: `1px solid ${T.surfaceContainerHigh}` }}>
                    <td style={{ padding: '8px 10px' }}>{it.child_name}</td>
                    <td style={{ padding: '8px 10px' }}>{it.class_title}</td>
                    <td style={{ padding: '8px 10px' }}>₹{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: 'right', marginTop: 10 }}><strong>Total: ₹{selected.total_amount}</strong></p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btnStyle('secondaryOutline')} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
