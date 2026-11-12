import React, { useState } from 'react';
import api from '../../api/axios';
import { P, btn } from './theme';

// "Give feedback" popup. The parent ticks one or more questions from the list (each shown
// with its real text from the homework PDF), then writes feedback for every question ticked.
export default function HomeworkFeedbackModal({ homework, child, onClose }) {
  const total = homework.total_questions || 0;
  const texts = Array.isArray(homework.questions) && homework.questions.length === total ? homework.questions : null;
  const [picked, setPicked] = useState([]); // question numbers, ascending
  const [text, setText] = useState({}); // question number -> feedback
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const toggle = (q) => setPicked((p) => (p.includes(q) ? p.filter((x) => x !== q) : [...p, q].sort((a, b) => a - b)));
  const info = (q) => (texts ? texts[q - 1] : null);

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
            <div style={{ fontFamily: P.headlineFont, fontWeight: 700, fontSize: 22, color: P.navy }}>Give feedback</div>
            <div style={{ fontSize: 13.5, color: P.meta, marginTop: 3 }}>{homework.title} · {child.name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.close}>&times;</button>
        </div>

        {done ? (
          <div style={{ marginTop: 22 }}>
            <div style={{ background: P.greenWash, color: P.green, padding: '14px 16px', borderRadius: 10, fontSize: 14.5 }}>
              Thank you - your feedback has been sent.
            </div>
            <div style={{ marginTop: 16 }}><button type="button" onClick={onClose} style={btn('navy')}>Close</button></div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 20 }}>
            <label style={styles.label}>Questions (choose one or more)</label>
            <button type="button" onClick={() => setMenuOpen((o) => !o)} style={styles.select}>
              <span style={{ color: picked.length ? P.navy : P.meta }}>
                {picked.length ? picked.map((q) => `Q${q}`).join(', ') : 'Select questions'}
              </span>
              <span aria-hidden="true">{menuOpen ? '▴' : '▾'}</span>
            </button>
            {menuOpen && (
              <div style={styles.menu}>
                {Array.from({ length: total }, (_, i) => i + 1).map((q) => {
                  const d = info(q);
                  return (
                    <label key={q} style={{ ...styles.option, background: picked.includes(q) ? '#FAF6EE' : '#fff' }}>
                      <input type="checkbox" checked={picked.includes(q)} onChange={() => toggle(q)} style={{ width: 'auto', margin: '3px 0 0', flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <strong>Q{q}</strong>
                        {d && d.section && <span style={{ color: P.meta, fontSize: 12.5 }}> · {d.section}</span>}
                        {d && d.text && <span style={{ display: 'block', fontSize: 13.5, color: P.navy, marginTop: 2 }}>{d.text}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {picked.map((q) => {
              const d = info(q);
              return (
                <div key={q} style={{ marginTop: 18 }}>
                  <label style={styles.label}>Feedback for Q{q}{d && d.section ? ` · ${d.section}` : ''}</label>
                  {d && d.text && <div style={{ fontSize: 13.5, color: P.navy, background: '#FAF6EE', padding: '8px 12px', borderRadius: 8, marginBottom: 8 }}>{d.text}</div>}
                  <textarea
                    rows={4}
                    value={text[q] || ''}
                    onChange={(e) => setText((t) => ({ ...t, [q]: e.target.value }))}
                    placeholder={`Your feedback on question ${q}`}
                    style={styles.textarea}
                  />
                </div>
              );
            })}

            {error && <div style={{ color: P.red, fontSize: 13, background: '#F9EDEC', padding: '9px 12px', borderRadius: 8, marginTop: 14 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
  card: { background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.35)', fontFamily: P.bodyFont, boxSizing: 'border-box' },
  close: { background: 'none', border: 'none', fontSize: 30, lineHeight: 1, color: P.meta, cursor: 'pointer', padding: 0 },
  label: { display: 'block', fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, color: P.meta, marginBottom: 7 },
  select: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, textAlign: 'left', padding: '13px 16px', border: `1.5px solid ${P.line}`, borderRadius: 10, background: '#fff', fontFamily: 'inherit', fontSize: 15, cursor: 'pointer', boxSizing: 'border-box' },
  menu: { marginTop: 6, maxHeight: 320, overflowY: 'auto', background: '#fff', border: `1px solid ${P.line}`, borderRadius: 10 },
  option: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 16px', fontSize: 14.5, color: P.navy, cursor: 'pointer', borderBottom: `1px solid ${P.line}` },
  textarea: { width: '100%', padding: '12px 14px', border: `1.5px solid ${P.line}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14.5, color: P.navy, resize: 'vertical', boxSizing: 'border-box' }
};
