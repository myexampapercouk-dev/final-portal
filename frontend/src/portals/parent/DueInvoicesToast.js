import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { P } from './theme';

// Shown once per login: tells the parent straight away if invoices are unpaid.
// The flag is cleared on logout (see AuthContext) so the next login shows it again.
export default function DueInvoicesToast() {
  const [due, setDue] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem('due_toast_shown')) return;
    api.get('/invoices').then(({ data }) => {
      const unpaid = data.filter((i) => i.status === 'unpaid');
      sessionStorage.setItem('due_toast_shown', '1');
      if (unpaid.length) {
        setDue({ count: unpaid.length, total: unpaid.reduce((s, i) => s + Number(i.total_amount), 0) });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!due) return undefined;
    const t = setTimeout(() => setDue(null), 12000);
    return () => clearTimeout(t);
  }, [due]);

  if (!due) return null;
  return (
    <div role="alert" style={{
      position: 'fixed', top: 72, right: 16, left: 16, maxWidth: 380, marginLeft: 'auto', zIndex: 300,
      background: P.red, color: '#fff', borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 10px 30px rgba(180,67,58,.45)', fontFamily: P.bodyFont
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>⚠ Payment due</div>
          <div style={{ fontSize: 13, marginTop: 3 }}>
            £{due.total.toFixed(2)} is outstanding across {due.count} unpaid invoice{due.count === 1 ? '' : 's'}.
          </div>
          <Link to="/parent/invoices" onClick={() => setDue(null)} style={{ color: '#fff', fontWeight: 700, fontSize: 13, display: 'inline-block', marginTop: 8 }}>
            View invoices {'→'}
          </Link>
        </div>
        <button onClick={() => setDue(null)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', alignSelf: 'flex-start', lineHeight: 1 }}>&times;</button>
      </div>
    </div>
  );
}
