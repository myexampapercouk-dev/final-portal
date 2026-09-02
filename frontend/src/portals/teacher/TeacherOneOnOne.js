import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Nav from '../../components/Nav';

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
    <div>
      <Nav links={[{ to: '/teacher', label: 'My Classes' }, { to: '/teacher/one-on-one', label: '1:1 Sessions' }]} />
      <div className="container">
        <h2>Schedule a 1:1 Class</h2>
        <form onSubmit={schedule} className="card">
          <label>Child</label>
          {form.child_name ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{form.child_name}</span>
              <button type="button" className="secondary" onClick={() => setForm((f) => ({ ...f, child_id: '', child_name: '' }))}>Change</button>
            </div>
          ) : (
            <div>
              <input placeholder="Search child by name..." value={query} onChange={(e) => searchChildren(e.target.value)} />
              {results.map((r) => (
                <div key={r.id} onClick={() => pickChild(r)} style={{ padding: 6, cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                  {r.name} ({r.category}) — parent: {r.parent_name}
                </div>
              ))}
            </div>
          )}
          <label>Topic</label>
          <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
          <label>Timing</label>
          <input type="datetime-local" required value={form.timing} onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))} />
          <label>Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <div className="error">{error}</div>}
          <button className="gold" style={{ marginTop: 12 }} type="submit">Schedule</button>
        </form>

        <h2>My 1:1 Sessions</h2>
        {sessions.map((s) => (
          <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{s.child_name}</strong> — {s.topic || 'Session'}
              <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(s.timing).toLocaleString()} · {s.status}</div>
            </div>
            {s.status === 'upcoming' && <button className="danger" onClick={() => cancelSession(s.id)}>Cancel</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
