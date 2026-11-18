import React from 'react';
import { A } from './theme';

// Centered popup used by the admin pages (add course, add class, edit class ...).
export default function AdminModal({ title, onClose, children, width = 640 }) {
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(22,36,61,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', zIndex: 400, overflowY: 'auto' }}
    >
      <div role="dialog" aria-label={title} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: width, boxShadow: '0 20px 60px rgba(0,0,0,.35)', fontFamily: A.bodyFont, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: A.headlineFont, fontWeight: 700, fontSize: 20, color: A.navy }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 28, lineHeight: 1, color: A.meta, cursor: 'pointer', padding: 0 }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// "2026-11-20T14:30" for a datetime-local input, from whatever the API gave us
export function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
