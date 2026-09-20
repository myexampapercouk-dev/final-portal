import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import TeacherTopNav from './TeacherTopNav';
import { T, cardStyle, btn, labelStyle, inputStyle } from './theme';

export default function TeacherOneOnOne() {
  const location = useLocation();
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
    <div style={{ minHeight: '100vh', background: T.canvas, fontFamily: T.bodyFont }}>
      <TeacherTopNav tabs={[
        { label: 'My Classes', to: '/teacher', active: location.pathname === '/teacher' },
        { label: '1:1 Sessions', to: '/teacher/one-on-one', active: location.pathname.startsWith('/teacher/one-on-one') }
      ]} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 24px 60px' }}>
        <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy, margin: '0 0 16px' }}>Schedule a 1:1 Class</h1>
        <form onSubmit={schedule} style={cardStyle}>
          <label style={labelStyle}>Child</label>
          {form.child_name ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{form.child_name}</span>
              <button type="button" style={btn('secondary')} onClick={() => setForm((f) => ({ ...f, child_id: '', child_name: '' }))}>Change</button>
            </div>
          ) : (
            <div>
              <input placeholder="Search child by name..." value={query} onChange={(e) => searchChildren(e.target.value)} style={inputStyle} />
              {results.map((r) => (
                <div key={r.id} onClick={() => pickChild(r)} style={{ padding: 8, cursor: 'pointer', borderBottom: `1px solid ${T.line}`, fontSize: 13.5 }}>
                  {r.name} ({r.category}) — parent: {r.parent_name}
                </div>
              ))}
            </div>
          )}
          <label style={{ ...labelStyle, marginTop: 14 }}>Topic</label>
          <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 14 }}>Timing</label>
          <input type="datetime-local" required value={form.timing} onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 14 }}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          {error && <div style={{ color: T.red, fontSize: 12.5, background: T.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>}
          <button style={{ ...btn('gold'), marginTop: 14 }} type="submit">Schedule</button>
        </form>

        <h1 style={{ fontFamily: T.headlineFont, fontSize: 22, color: T.navy, margin: '28px 0 14px' }}>My 1:1 Sessions</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s) => (
            <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ color: T.navy }}>{s.child_name}</strong> — {s.topic || 'Session'}
                <div style={{ fontSize: 12, color: T.meta }}>{new Date(s.timing).toLocaleString()} · {s.status}</div>
              </div>
              {s.status === 'upcoming' && <button style={btn('danger')} onClick={() => cancelSession(s.id)}>Cancel</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
