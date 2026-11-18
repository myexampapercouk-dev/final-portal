import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import AdminModal, { toLocalInput } from './AdminModal';
import { A, cardStyle, btn, labelStyle, inputStyle, badge } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

// Where a scheduled class is right now
function phase(cl, now = Date.now()) {
  const start = new Date(cl.timing).getTime();
  const end = cl.end_timing ? new Date(cl.end_timing).getTime() : start + 90 * 60 * 1000;
  if (now < start) return { key: 'upcoming', label: 'Upcoming', bg: A.cream, fg: A.meta };
  if (now <= end) return { key: 'now', label: 'Happening now', bg: A.greenWash, fg: A.green };
  return { key: 'overdue', label: 'Time passed - not completed', bg: A.redWash, fg: A.red };
}

// Live = every class that is still scheduled, grouped under its course. Used on the dashboard
// (compact) and on the Live classes page. Clicking a class opens it for editing.
export function LiveClassesPanel({ compact = false }) {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/classes'), api.get('/admin/teachers')]).then(([c, t]) => {
    setClasses(c.data);
    setTeachers(t.data);
    setLoaded(true);
  }).catch(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  const live = useMemo(
    () => classes
      .filter((c) => c.status === 'scheduled' && (!filter || (c.categories || []).includes(filter)))
      .sort((a, b) => new Date(a.timing) - new Date(b.timing)),
    [classes, filter]
  );
  const groups = useMemo(() => {
    const map = new Map();
    live.forEach((c) => {
      if (!map.has(c.course_id)) map.set(c.course_id, { id: c.course_id, name: c.course_name, classes: [] });
      map.get(c.course_id).classes.push(c);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [live]);
  const nowCount = live.filter((c) => phase(c).key === 'now').length;

  function openEdit(cl) {
    setError('');
    setEditing({
      id: cl.id, title: cl.title, teacher_id: String(cl.teacher_id), timing: toLocalInput(cl.timing),
      end_timing: toLocalInput(cl.end_timing), venue: cl.venue || '', price: cl.price === null || cl.price === undefined ? '' : String(cl.price)
    });
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { id, ...body } = editing;
      await api.put(`/classes/${id}`, body);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the class');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: A.meta }}>
          {live.length} live class{live.length === 1 ? '' : 'es'} in {groups.length} course{groups.length === 1 ? '' : 's'}
          {nowCount > 0 && <span style={{ ...badge(A.greenWash, A.green), marginLeft: 8 }}>{nowCount} happening now</span>}
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by age group" style={{ ...inputStyle, width: 'auto', margin: 0 }}>
          <option value="">All age groups</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loaded && groups.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>No live classes{filter ? ` for ${filter}` : ''} right now.</div>}

      {groups.map((g) => (
        <div key={g.id} style={{ ...cardStyle, padding: compact ? 14 : 18 }}>
          <div style={{ fontFamily: A.headlineFont, fontWeight: 700, color: A.navy, marginBottom: 8 }}>
            {g.name} <span style={{ ...badge(A.cream, A.meta), marginLeft: 6 }}>{g.classes.length}</span>
          </div>
          {(compact ? g.classes.slice(0, 4) : g.classes).map((cl) => {
            const ph = phase(cl);
            return (
              <div key={cl.id} onClick={() => openEdit(cl)} title="Click to edit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 10px', borderTop: `1px solid ${A.line}`, cursor: 'pointer' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: A.navy, fontSize: 13.5 }}>{cl.title}</div>
                  <div style={{ fontSize: 12, color: A.meta }}>
                    {new Date(cl.timing).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {cl.end_timing ? ` - ${new Date(cl.end_timing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {' · '}{cl.teacher_name}{cl.venue ? ` · ${cl.venue}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(cl.categories || []).map((cat) => <span key={cat} style={badge(A.goldSoft, '#7A5B00')}>{cat}</span>)}
                  <span style={badge(A.cream, A.meta)}>{cl.registered_count} registered</span>
                  <span style={badge(ph.bg, ph.fg)}>{ph.label}</span>
                </div>
              </div>
            );
          })}
          {compact && g.classes.length > 4 && <div style={{ fontSize: 12, color: A.meta, paddingTop: 8 }}>+ {g.classes.length - 4} more</div>}
        </div>
      ))}

      {editing && (
        <AdminModal title="Edit class" onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label style={labelStyle}>Class title</label>
            <input required value={editing.title} onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Assigned teacher</label>
            <select required value={editing.teacher_id} onChange={(e) => setEditing((f) => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label style={labelStyle}>Start time</label>
            <input required type="datetime-local" value={editing.timing} onChange={(e) => setEditing((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>End time</label>
            <input type="datetime-local" value={editing.end_timing} onChange={(e) => setEditing((f) => ({ ...f, end_timing: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Venue</label>
            <input value={editing.venue} onChange={(e) => setEditing((f) => ({ ...f, venue: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Price (£)</label>
            <input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing((f) => ({ ...f, price: e.target.value }))} style={inputStyle} />
            <p style={{ fontSize: 12.5, color: A.meta, marginTop: 10 }}>
              Also: <Link to="/admin/homework" style={{ color: A.navy }}>homework for this class</Link> · <Link to="/admin/courses" style={{ color: A.navy }}>all courses &amp; classes</Link>
            </p>
            {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 6 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Saving...' : 'Save changes'}</button>
              <button type="button" onClick={() => setEditing(null)} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}

export default function LiveClasses() {
  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 4px' }}>Live classes &amp; courses</h1>
      <p style={{ fontSize: 12.5, color: A.meta, margin: '0 0 14px' }}>Every class that is still scheduled, grouped by course. Click a class to edit it.</p>
      <LiveClassesPanel />
    </AdminShell>
  );
}
