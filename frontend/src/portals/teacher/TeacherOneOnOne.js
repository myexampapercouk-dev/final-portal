import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T, cardStyle, btn, labelStyle, inputStyle } from './theme';

const TABS = ['Register', 'Upcoming', 'Completed'];

function durationLabel(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h} hr ${m ? `${m} min` : ''}` : `${m} min`}`.trim();
}

export default function TeacherOneOnOne() {
  const [tab, setTab] = useState('Register');
  const [sessions, setSessions] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [form, setForm] = useState({ child_id: '', child_name: '', topic: '', date: '', start: '', end: '', notes: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

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
    setMsg('');
    if (!form.child_id) { setError('Select a child from the search results'); return; }
    if (!form.date || !form.start) { setError('Pick a date and start time'); return; }
    try {
      await api.post('/one-on-one', {
        child_id: form.child_id,
        topic: form.topic,
        timing: `${form.date}T${form.start}`,
        end_timing: form.end ? `${form.date}T${form.end}` : null,
        notes: form.notes
      });
      setForm({ child_id: '', child_name: '', topic: '', date: '', start: '', end: '', notes: '' });
      setMsg('Lesson scheduled — visible on the parent portal.');
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

  async function completeSession(id) {
    try {
      await api.post(`/one-on-one/${id}/complete`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not mark complete');
    }
  }

  const upcoming = useMemo(() => sessions.filter((s) => s.status === 'upcoming'), [sessions]);
  const completed = useMemo(() => sessions.filter((s) => s.status === 'completed'), [sessions]);

  return (
    <TeacherShell>
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy, margin: '0 0 16px' }}>1:1 Sessions</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${tab === t ? T.navy : T.line}`,
                background: tab === t ? T.navy : '#fff',
                color: tab === t ? '#fff' : T.navy
              }}
            >
              {t === 'Register' ? 'Schedule' : t}
              {t === 'Upcoming' && upcoming.length > 0 ? ` (${upcoming.length})` : ''}
              {t === 'Completed' && completed.length > 0 ? ` (${completed.length})` : ''}
            </button>
          ))}
        </div>

        {tab === 'Register' && (
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

            <label style={{ ...labelStyle, marginTop: 14 }}>Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />

            <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={labelStyle}>Start</label>
                <input type="time" required value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={labelStyle}>End</label>
                <input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {durationLabel(form.start, form.end) && (
              <div style={{ background: T.greenWash, color: T.green, padding: '9px 13px', borderRadius: 10, fontSize: 13, marginTop: 12 }}>
                Duration: {durationLabel(form.start, form.end)} — calculated for you
              </div>
            )}

            <label style={{ ...labelStyle, marginTop: 14 }}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />

            {error && <div style={{ color: T.red, fontSize: 12.5, background: T.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>}
            {msg && <div style={{ color: T.green, fontSize: 12.5, background: T.greenWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{msg}</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: T.meta }}>Saves to parent portal</span>
              <button style={btn('gold')} type="submit">Schedule</button>
            </div>
          </form>
        )}

        {tab === 'Upcoming' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.length === 0 && <p style={{ color: T.meta }}>No upcoming 1:1 sessions.</p>}
            {upcoming.map((s) => (
              <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: T.navy }}>{s.child_name}</strong> — {s.topic || 'Session'}
                  <div style={{ fontSize: 12, color: T.meta }}>{new Date(s.timing).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btn('secondary')} onClick={() => completeSession(s.id)}>Mark complete</button>
                  <button style={btn('danger')} onClick={() => cancelSession(s.id)}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.length === 0 && <p style={{ color: T.meta }}>No completed 1:1 sessions yet.</p>}
            {completed.map((s) => (
              <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: T.navy }}>{s.child_name}</strong> — {s.topic || 'Session'}
                  <div style={{ fontSize: 12, color: T.meta }}>{new Date(s.timing).toLocaleString()}</div>
                  {s.notes && <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>{s.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherShell>
  );
}
