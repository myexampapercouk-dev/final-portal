import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { P } from './theme';
import { useParentNotifications } from './NotificationsContext';

// Parent's bell. Clicking a notification opens the page it is about; the tick
// marks it done and removes it from the list.
export default function ParentNotifications() {
  const navigate = useNavigate();
  const { items, toast, setToast, resolve } = useParentNotifications();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
                <div onClick={() => view(n)} style={{ flex: 1, minWidth: 0, cursor: n.link ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: P.navy }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: P.meta, marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: P.meta, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <button title="Mark as done" aria-label="Mark done" onClick={() => resolve(n)} style={styles.tick}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" /></svg>
                </button>
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
  item: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', borderBottom: `1px solid ${P.line}` },
  tick: {
    width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${P.green}`, color: P.green, background: '#fff',
    cursor: 'pointer', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  toast: {
    position: 'fixed', top: 70, right: 16, maxWidth: 320, background: P.navy, color: '#fff', padding: '12px 16px',
    borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 300, cursor: 'pointer', borderLeft: `5px solid ${P.gold}`
  }
};
