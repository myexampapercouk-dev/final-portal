import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T } from './theme';

export default function TeacherOneOnOne() {
  const [sessions, setSessions] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ child_id: '', child_name: '', topic: '', timing: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/one-on-one/mine');
    setSessions(data);
  }

  async function searchChildren(name) {
    setQuery(name);
    if (!name) { setResults([]); return; }
    const { data } = await api.get('/children/search', { params: { name } });
    setResults(data);
  }

  function pickChild(child) {
    setForm((f) => ({ ...f, child_id: child.id, child_name: `${child.name} (${child.category})` }));
    setResults([]);
    setQuery('');
  }

  async function schedule(e) {
    e.preventDefault();
    setError('');
    if (!form.child_id) { setError('Select a child from the search results'); return; }
    try {
      await api.post('/one-on-one', {
        child_id: form.child_id, topic: form.topic, timing: form.timing, notes: form.notes
      });
      setForm({ child_id: '', child_name: '', topic: '', timing: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not schedule');
    }
  }

  async function cancelSession(id) {
    try {
      await api.post(`/one-on-one/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  return (
    <TeacherShell active="one-on-one">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 16px' }}>
        Schedule a 1:1 Class
      </h1>
      <form onSubmit={schedule} style={cardStyle}>
        <label style={labelStyle}>Child</label>
        {form.child_name ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{form.child_name}</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, child_id: '', child_name: '' }))} style={secondaryBtn}>Change</button>
          </div>
        ) : (
          <div>
            <input placeholder="Search child by name..." value={query} onChange={(e) => searchChildren(e.target.value)} style={inputStyle} />
            {results.map((r) => (
              <div key={r.id} onClick={() => pickChild(r)} style={{ padding: 8, cursor: 'pointer', borderBottom: `1px solid ${T.surfaceContainerHigh}`, fontSize: 13.5 }}>
                {r.name} ({r.category}) — parent: {r.parent_name}
              </div>
            ))}
          </div>
        )}
        <label style={labelStyle}>Topic</label>
        <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} style={inputStyle} />
        <label style={labelStyle}>Timing</label>
        <input type="datetime-local" required value={form.timing} onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />
        <label style={labelStyle}>Notes</label>
        <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
        {error && <div style={{ color: T.error, fontSize: 12.5, marginTop: 8, background: T.errorContainer, padding: '7px 11px', borderRadius: 8 }}>{error}</div>}
        <button type="submit" style={{ ...primaryBtn, marginTop: 12 }}>Schedule</button>
      </form>

      <h1 style={{ fontFamily: T.headlineFont, fontSize: 20, fontWeight: 700, color: T.onSurface, margin: '24px 0 12px' }}>
        My 1:1 Sessions
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => (
          <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <strong>{s.child_name}</strong> — {s.topic || 'Session'}
              <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>{new Date(s.timing).toLocaleString()} · {s.status}</div>
            </div>
            {s.status === 'upcoming' && <button onClick={() => cancelSession(s.id)} style={dangerBtn}>Cancel</button>}
          </div>
        ))}
      </div>
    </TeacherShell>
  );
}

const cardStyle = {
  background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow,
  padding: 18, fontFamily: T.bodyFont, marginBottom: 14
};
const labelStyle = { display: 'block', fontSize: 11.5, fontWeight: 600, color: T.onSurfaceVariant, margin: '12px 0 5px', textTransform: 'uppercase', letterSpacing: '.04em' };
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.surfaceContainerHigh}`,
  background: T.surfaceContainerLow, fontSize: 13.5, fontFamily: T.bodyFont, boxSizing: 'border-box'
};
const primaryBtn = { padding: '10px 18px', borderRadius: 10, border: 'none', background: T.primaryContainer, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13.5 };
const secondaryBtn = { padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.surfaceContainerHigh}`, background: '#fff', cursor: 'pointer', fontSize: 12.5 };
const dangerBtn = { padding: '8px 14px', borderRadius: 8, border: 'none', background: T.errorContainer, color: T.onErrorContainer, fontWeight: 600, cursor: 'pointer', fontSize: 12.5 };
