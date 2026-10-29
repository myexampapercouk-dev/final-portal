import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { A } from './theme';

// Bell with an open-count badge. Each item can be ticked (done) or crossed
// (no longer needed); clicking the item itself goes to where the action is.
// New items that arrive while the admin is online also pop up as a toast.
export default function AdminNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const seen = useRef(null); // ids already known, so only genuinely new ones toast
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      setItems(data);
      if (seen.current === null) {
        seen.current = new Set(data.map((n) => n.id));
        if (data.length) {
          setToast({ title: `You have ${data.length} pending notification${data.length === 1 ? '' : 's'}`, link: null });
        }
      } else {
        const fresh = data.filter((n) => !seen.current.has(n.id));
        fresh.forEach((n) => seen.current.add(n.id));
        if (fresh.length) setToast({ title: fresh[0].title, body: fresh[0].body, link: fresh[0].link });
      }
    } catch (e) {
      // the bell just stays as it was
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function resolve(n, action) {
    await api.post(`/admin/notifications/${n.id}/${action}`);
    setItems((list) => list.filter((x) => x.id !== n.id));
  }

  function go(n) {
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" style={styles.bell}>
        <span style={{ fontSize: 18 }}>{'\u{1F514}'}</span>
        {items.length > 0 && <span style={styles.count}>{items.length > 9 ? '9+' : items.length}</span>}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={{ padding: '12px 14px', fontWeight: 700, color: A.navy, borderBottom: `1px solid ${A.line}` }}>Notifications</div>
          {items.length === 0 && <div style={{ padding: 16, color: A.meta, fontSize: 13 }}>You are all caught up.</div>}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.map((n) => (
              <div key={n.id} style={styles.item}>
                <div onClick={() => go(n)} style={{ flex: 1, cursor: n.link ? 'pointer' : 'default', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: A.navy }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: A.meta, marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: A.meta, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <button title="Done" onClick={() => resolve(n, 'done')} style={{ ...styles.round, color: A.green, borderColor: A.green }}>{'✓'}</button>
                <button title="No longer needed" onClick={() => resolve(n, 'dismiss')} style={{ ...styles.round, color: A.red, borderColor: A.red }}>{'✕'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={styles.toast} onClick={() => { if (toast.link) navigate(toast.link); setToast(null); }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{toast.title}</div>
          {toast.body && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{toast.body}</div>}
        </div>
      )}
    </div>
  );
}

const styles = {
  bell: {
    position: 'relative', width: 38, height: 38, borderRadius: '50%', border: `1px solid ${A.line}`,
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  count: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: A.red,
    color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
  },
  panel: {
    position: 'absolute', right: 0, top: 46, width: 360, maxWidth: 'calc(100vw - 24px)', background: '#fff',
    border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 12px 36px rgba(22,36,61,.18)', zIndex: 120
  },
  item: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', borderBottom: `1px solid ${A.line}` },
  round: {
    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid', background: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0
  },
  toast: {
    position: 'fixed', top: 70, right: 16, maxWidth: 340, background: A.navy, color: '#fff', padding: '12px 16px',
    borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 300, cursor: 'pointer', borderLeft: `5px solid ${A.gold}`
  }
};
