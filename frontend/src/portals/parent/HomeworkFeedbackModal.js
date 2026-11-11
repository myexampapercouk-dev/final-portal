import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { P, btn } from './theme';

// "Give feedback" popup. The parent picks one or more questions from a dropdown
// (Question 1 .. Question N), then writes feedback for each question picked.
export default function HomeworkFeedbackModal({ homework, child, onClose }) {
  const total = homework.total_questions || 0;
  const [picked, setPicked] = useState([]); // question numbers, ascending
  const [text, setText] = useState({}); // question number -> feedback
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const menu = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menu.current && !menu.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (q) => setPicked((p) => (p.includes(q) ? p.filter((x) => x !== q) : [...p, q].sort((a, b) => a - b)));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!picked.length) { setError('Choose at least one question'); return; }
    const missing = picked.find((q) => !(text[q] || '').trim());
    if (missing) { setError(`Write your feedback for question ${missing}`); return; }
    setBusy(true);
    try {
      await api.post(`/homework/${homework.id}/feedback`, {
        child_id: child.id,
        items: picked.map((q) => ({ question: q, feedback: text[q].trim() }))
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send your feedback. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.card} role="dialog" aria-label="Give feedback">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ fontFamily: P.headlineFont, fontWeight: 700, fontSize: 18, color: P.navy }}>Give feedback</div>
            <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>{homework.title} · {child.name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.close}>&times;</button>
        </div>

        {done ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ background: P.greenWash, color: P.green, padding: '12px 14px', borderRadius: 10, fontSize: 13.5 }}>
              Thank you - your feedback has been sent.
            </div>
            <div style={{ marginTop: 14 }}><button type="button" onClick={onClose} style={btn('navy')}>Close</button></div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 16 }}>
            <label style={styles.label}>Questions (choose one or more)</label>
            <div ref={menu} style={{ position: 'relative' }}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} style={styles.select}>
                <span style={{ color: picked.length ? P.navy : P.meta }}>
                  {picked.length ? picked.map((q) => `Question ${q}`).join(', ') : 'Select questions'}
                </span>
                <span aria-hidden="true">{menuOpen ? '▴' : '▾'}</span>
              </button>
              {menuOpen && (
                <div style={styles.menu}>
                  {Array.from({ length: total }, (_, i) => i + 1).map((q) => (
                    <label key={q} style={styles.option}>
                      <input type="checkbox" checked={picked.includes(q)} onChange={() => toggle(q)} style={{ width: 'auto', margin: 0 }} />
                      Question {q}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {picked.map((q) => (
              <div key={q} style={{ marginTop: 14 }}>
                <label style={styles.label}>Feedback for question {q}</label>
                <textarea
                  rows={3}
                  value={text[q] || ''}
                  onChange={(e) => setText((t) => ({ ...t, [q]: e.target.value }))}
                  placeholder={`Your feedback on question ${q}`}
                  style={styles.textarea}
                />
              </div>
            ))}

            {error && <div style={{ color: P.red, fontSize: 12.5, background: '#F9EDEC', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Sending...' : 'Send feedback'}</button>
              <button type="button" onClick={onClose} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(22,36,61,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 400 },
  card: { background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.35)', fontFamily: P.bodyFont, boxSizing: 'border-box' },
  close: { background: 'none', border: 'none', fontSize: 26, lineHeight: 1, color: P.meta, cursor: 'pointer', padding: 0 },
  label: { display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, color: P.meta, marginBottom: 6 },
  select: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', padding: '11px 14px', border: `1.5px solid ${P.line}`, borderRadius: 10, background: '#fff', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', boxSizing: 'border-box' },
  menu: { position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', maxHeight: 220, overflowY: 'auto', background: '#fff', border: `1px solid ${P.line}`, borderRadius: 10, boxShadow: '0 10px 30px rgba(22,36,61,.18)', zIndex: 5 },
  option: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 14, color: P.navy, cursor: 'pointer' },
  textarea: { width: '100%', padding: '10px 12px', border: `1.5px solid ${P.line}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, color: P.navy, resize: 'vertical', boxSizing: 'border-box' }
};
