import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import { P, cardStyle, btn, STATUS } from './theme';

const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const invNo = (id) => `INV-${String(id).padStart(5, '0')}`;

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

  const unpaid = invoices.filter((i) => i.status === 'unpaid');
  const outstanding = unpaid.reduce((s, i) => s + Number(i.total_amount), 0);

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Invoices</h1>
      {outstanding > 0 ? (
        <div style={{ background: P.redWash, border: `1.5px solid ${P.red}`, color: P.red, borderRadius: 12, padding: '12px 16px', fontWeight: 700, marginBottom: 10 }}>
          ⚠ {money(outstanding)} is due across {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}
        </div>
      ) : (
        <p style={{ color: P.meta, marginBottom: 6 }}>No outstanding balance</p>
      )}
      <p style={{ fontSize: 12.5, color: P.meta, marginBottom: 20 }}>
        This is a record of amounts due — payments are collected in cash or by bank transfer directly, not through this portal.
      </p>

      {invoices.length === 0 && <p style={{ color: P.meta }}>No invoices yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {invoices.map((inv) => {
          const status = STATUS[inv.status] || STATUS.unpaid;
          const isDue = inv.status === 'unpaid';
          const items = inv.items || [];
          const children = [...new Set(items.map((i) => i.child_name).filter(Boolean))];
          return (
            <div key={inv.id} style={isDue ? { ...cardStyle, border: `1.5px solid ${P.red}`, borderLeft: `6px solid ${P.red}`, background: P.redWash } : cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: P.meta, letterSpacing: '.04em' }}>INVOICE {invNo(inv.id)}</div>
                  <div style={{ fontSize: 12, color: P.meta, marginTop: 2 }}>Issued {day(inv.generated_at)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: status.bg, color: status.fg, border: isDue ? `1px solid ${P.red}` : 'none' }}>
                  {isDue ? 'DUE' : status.label.toUpperCase()}
                </span>
              </div>

              <div style={{ fontFamily: P.headlineFont, fontWeight: 700, fontSize: 26, marginTop: 8, color: isDue ? P.red : P.navy }}>
                {money(inv.total_amount)}
              </div>

              {children.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: P.meta, textTransform: 'uppercase', letterSpacing: '.05em' }}>For</span>
                  {children.map((c) => (
                    <span key={c} style={{ fontSize: 12, fontWeight: 700, background: P.goldSoft, color: '#7A5B00', padding: '3px 11px', borderRadius: 999 }}>{c}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12, background: '#fff', border: `1px solid ${P.line}`, borderRadius: 10, overflow: 'hidden' }}>
                {items.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 12.5, color: P.meta }}>
                    No class charges are attached to this invoice.
                  </div>
                ) : (
                  items.map((it, i) => (
                    <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: i ? `1px solid ${P.line}` : 'none' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: P.navy }}>{it.class_title || it.description || 'Class'}</div>
                        <div style={{ fontSize: 12, color: P.meta, marginTop: 1 }}>
                          {it.child_name}{it.class_timing ? ` · ${day(it.class_timing)}` : ''}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: P.navy, whiteSpace: 'nowrap' }}>{money(it.amount)}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={btn('secondary')} onClick={() => viewDetail(inv.id)}>View full invoice</button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={styles.backdrop} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: P.headlineFont, color: P.navy, margin: '0 0 2px' }}>Invoice {invNo(selected.id)}</h3>
            <div style={{ fontSize: 12.5, color: P.meta, marginBottom: 12 }}>
              Issued {day(selected.generated_at)} · {selected.status === 'paid' ? 'Paid' : 'Payment due'}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 380, borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: P.navy, color: '#fff' }}>
                    <th style={styles.th}>Child</th><th style={styles.th}>Class</th><th style={styles.th}>Date</th><th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.length === 0 && (
                    <tr><td colSpan={4} style={{ ...styles.td, color: P.meta }}>No class charges on this invoice.</td></tr>
                  )}
                  {selected.items.map((it) => (
                    <tr key={it.id}>
                      <td style={styles.td}>{it.child_name}</td>
                      <td style={styles.td}>{it.class_title}</td>
                      <td style={styles.td}>{day(it.class_timing)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{money(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ textAlign: 'right', marginTop: 10, color: P.navy }}><strong>Total: {money(selected.total_amount)}</strong></p>
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
  modal: { background: '#fff', padding: 26, borderRadius: 16, width: 540, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' },
  td: { padding: '10px 12px', borderBottom: `1px solid ${P.line}` }
};
