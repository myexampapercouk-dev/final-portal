import React from 'react';

// Pop-up used for "You have N pending notifications" and for new notifications arriving live.
// Colourful, slides in, has a close (x) button, and shows a bar counting down to auto-dismiss.
// Clicking the message itself opens its link; the x only closes it.
const DURATION = 9; // seconds; the parent components auto-dismiss after the same time

export default function NotificationToast({ toast, onOpen, onClose }) {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" style={styles.wrap}>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateX(40px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes toastBar { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <div style={styles.stripe} />
      <div style={styles.row}>
        <div style={styles.icon} aria-hidden="true">{'\u{1F514}'}</div>
        <div onClick={onOpen} style={{ flex: 1, minWidth: 0, cursor: toast.link ? 'pointer' : 'default' }}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35 }}>{toast.title}</div>
          {toast.body && <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 3, lineHeight: 1.4 }}>{toast.body}</div>}
          {toast.link && <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD86B', marginTop: 6 }}>View {'→'}</div>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close notification" style={styles.close}>&times;</button>
      </div>
      <div style={styles.barTrack}><div style={{ ...styles.bar, animation: `toastBar ${DURATION}s linear forwards` }} /></div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed', top: 70, right: 16, width: 'calc(100vw - 32px)', maxWidth: 360, zIndex: 300, overflow: 'hidden',
    color: '#fff', borderRadius: 16, boxShadow: '0 14px 40px rgba(22,36,61,.45)', animation: 'toastIn .35s ease-out',
    background: 'linear-gradient(135deg, #1B2B4B 0%, #3A2C6E 55%, #7B3FA0 100%)'
  },
  stripe: { height: 5, background: 'linear-gradient(90deg, #FFC93C, #FF7A59, #E84A8A, #4FC3F7)' },
  row: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 12px 12px 14px' },
  icon: {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, background: 'linear-gradient(135deg, #FFC93C, #FF7A59)', boxShadow: '0 4px 12px rgba(255,122,89,.5)'
  },
  close: {
    width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.18)', color: '#fff',
    fontSize: 20, lineHeight: 1, cursor: 'pointer', flexShrink: 0, padding: 0
  },
  barTrack: { height: 3, background: 'rgba(255,255,255,.15)' },
  bar: { height: 3, background: 'linear-gradient(90deg, #FFC93C, #FF7A59)' }
};
