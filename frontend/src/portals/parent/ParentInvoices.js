import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import { P, cardStyle, btn, STATUS } from './theme';

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

  const outstanding = invoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + Number(i.total_amount), 0);

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Invoices</h1>
      <p style={{ color: P.meta, marginBottom: 6 }}>
        {outstanding > 0 ? `£${outstanding.toFixed(2)} outstanding across ${invoices.filter((i) => i.status === 'unpaid').length} invoice(s)` : 'No outstanding balance'}
      </p>
      <p style={{ fontSize: 12.5, color: P.meta, marginBottom: 20 }}>
        This is a record of amounts due — payments are collected in cash or by bank transfer directly, not through this portal.
      </p>

      {invoices.length === 0 && <p style={{ color: P.meta }}>No invoices yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {invoices.map((inv) => {
          const status = STATUS[inv.status] || STATUS.unpaid;
          return (
            <div key={inv.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: P.meta }}>Invoice #INV-{String(inv.id).padStart(5, '0')}</div>
                  <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16, marginTop: 2 }}>£{inv.total_amount}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, height: 'fit-content', background: status.bg, color: status.fg }}>{status.label}</span>
              </div>
              <div style={{ fontSize: 12.5, color: P.meta, marginTop: 8 }}>
                Generated {new Date(inv.generated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={btn('secondary')} onClick={() => viewDetail(inv.id)}>View invoice</button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={styles.backdrop} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: P.headlineFont, color: P.navy, marginTop: 0 }}>Invoice #INV-{String(selected.id).padStart(5, '0')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: P.navy, color: '#fff' }}>
                  <th style={styles.th}>Child</th><th style={styles.th}>Class</th><th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.id}>
                    <td style={styles.td}>{it.child_name}</td>
                    <td style={styles.td}>{it.class_title}</td>
                    <td style={styles.td}>£{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: 'right', marginTop: 10, color: P.navy }}><strong>Total: £{selected.total_amount}</strong></p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btn('secondary')} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </ParentShell>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(22,36,61,.55)', display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center', padding: '40px 14px', overflow: 'auto', zIndex: 200
  },
  modal: { background: '#fff', padding: 26, borderRadius: 16, width: 480, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' },
  td: { padding: '10px 12px', borderBottom: `1px solid ${P.line}` }
};
