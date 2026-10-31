import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { P } from './theme';

// Parent's bell. Every item has View (open the page it is about), Yes (got it -
// mark done) and No (not needed - dismiss). New items that arrive while the
// parent is online also pop up as a toast.
export default function ParentNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const seen = useRef(null);
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data);
      if (seen.current === null) {
        seen.current = new Set(data.map((n) => n.id));
        if (data.length) setToast({ title: `You have ${data.length} new notification${data.length === 1 ? '' : 's'}`, link: null });
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
    try {
      await api.post(`/notifications/${n.id}/${action}`);
      setItems((list) => list.filter((x) => x.id !== n.id));
    } catch (e) {
      // leave it in the list so the parent can try again
    }
  }

  function view(n) {
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
          <div style={{ padding: '12px 14px', fontWeight: 700, color: P.navy, borderBottom: `1px solid ${P.line}` }}>Notifications</div>
          {items.length === 0 && <div style={{ padding: 16, color: P.meta, fontSize: 13 }}>You are all caught up.</div>}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {items.map((n) => (
              <div key={n.id} style={styles.item}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.navy }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12, color: P.meta, marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: P.meta, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {n.link && <button onClick={() => view(n)} style={{ ...styles.action, background: P.navy, color: '#fff', borderColor: P.navy }}>View</button>}
                  <button onClick={() => resolve(n, 'done')} style={{ ...styles.action, color: P.green, borderColor: P.green }}>Yes</button>
                  <button onClick={() => resolve(n, 'dismiss')} style={{ ...styles.action, color: P.red, borderColor: P.red }}>No</button>
                </div>
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
    position: 'relative', width: 38, height: 38, borderRadius: '50%', border: `1px solid ${P.line}`,
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  count: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: P.red,
    color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
  },
  panel: {
    position: 'absolute', right: 0, top: 46, width: 340, maxWidth: 'calc(100vw - 24px)', background: '#fff',
    border: `1px solid ${P.line}`, borderRadius: 14, boxShadow: '0 12px 36px rgba(22,36,61,.18)', zIndex: 120
  },
  item: { padding: '12px 14px', borderBottom: `1px solid ${P.line}` },
  action: {
    padding: '6px 16px', borderRadius: 999, border: '1.5px solid', background: '#fff', fontSize: 12.5,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
  },
  toast: {
    position: 'fixed', top: 70, right: 16, maxWidth: 320, background: P.navy, color: '#fff', padding: '12px 16px',
    borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 300, cursor: 'pointer', borderLeft: `5px solid ${P.gold}`
  }
};
