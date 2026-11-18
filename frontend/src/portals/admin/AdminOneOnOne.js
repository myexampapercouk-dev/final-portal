import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import AdminModal from './AdminModal';
import { A, cardStyle, btn, labelStyle, inputStyle, badge } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];
const EMPTY = { teacher_id: '', child_id: '', child_label: '', topic: '', date: '', start: '', end: '', notes: '' };

// 1:1 sessions are scheduled here by admin. Pick a teacher to see their upcoming, completed
// and cancelled sessions. Teachers can only view them.
export default function AdminOneOnOne() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [filter, setFilter] = useState('');
  const [students, setStudents] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [childSearch, setChildSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadTeachers = () => api.get('/one-on-one/admin/teachers').then(({ data }) => setTeachers(data));
  const loadSessions = (id) => api.get(`/one-on-one/admin/teacher/${id}`).then(({ data }) => setSessions(data));
  useEffect(() => { loadTeachers(); api.get('/admin/students').then(({ data }) => setStudents(data)); }, []);
  useEffect(() => { if (teacherId) { setTab('upcoming'); loadSessions(teacherId); } }, [teacherId]);

  const teacher = teachers.find((t) => t.id === teacherId) || null;
  const shown = useMemo(
    () => sessions.filter((s) => s.status === tab && (!filter || s.category === filter)),
    [sessions, tab, filter]
  );
  const counts = (status) => sessions.filter((s) => s.status === status && (!filter || s.category === filter)).length;
  const matches = useMemo(() => {
    const q = childSearch.trim().toLowerCase();
    return q ? students.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8) : [];
  }, [students, childSearch]);

  function openModal() {
    setForm({ ...EMPTY, teacher_id: teacherId ? String(teacherId) : '' });
    setChildSearch('');
    setError('');
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.child_id) { setError('Search for a child and pick them from the list'); return; }
    setBusy(true);
    try {
      await api.post('/one-on-one', {
        child_id: form.child_id,
        teacher_id: form.teacher_id,
        topic: form.topic,
        timing: `${form.date}T${form.start}`,
        end_timing: form.end ? `${form.date}T${form.end}` : null,
        notes: form.notes
      });
      setModal(false);
      loadTeachers();
      if (teacherId) loadSessions(teacherId);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not schedule');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(s) {
    if (!window.confirm(`Cancel the 1:1 session for ${s.child_name}?`)) return;
    try {
      await api.post(`/one-on-one/${s.id}/cancel`);
      loadTeachers();
      loadSessions(teacherId);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 6px' }}>
        <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: 0 }}>1:1 Classes</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {teacher && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by age group" style={{ ...inputStyle, width: 'auto', margin: 0 }}>
              <option value="">All age groups</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button style={btn('gold')} onClick={openModal}>+ Schedule 1:1</button>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: A.meta, margin: '0 0 14px', display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => setTeacherId(null)} style={{ background: 'none', border: 'none', color: A.navy, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13.5 }}>Teachers</button>
        {teacher && <>› <span style={{ color: A.navy, fontWeight: 600 }}>{teacher.name}</span></>}
      </div>

      {!teacher && (teachers.length === 0
        ? <div style={{ ...cardStyle, color: A.meta }}>No teachers yet.</div>
        : teachers.map((t) => (
          <div key={t.id} onClick={() => setTeacherId(t.id)} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div><strong style={{ color: A.navy }}>{t.name}</strong><div style={{ fontSize: 12, color: A.meta }}>{t.email}</div></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={badge(A.goldSoft, '#7A5B00')}>{t.upcoming} upcoming</span>
              <span style={badge(A.greenWash, A.green)}>{t.completed} completed</span>
              {t.cancelled > 0 && <span style={badge(A.cream, A.meta)}>{t.cancelled} cancelled</span>}
              <span style={{ color: A.meta }}>›</span>
            </div>
          </div>
        )))}

      {teacher && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['upcoming', 'Upcoming'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} style={{ ...btn(tab === k ? 'navy' : 'secondary'), padding: '8px 16px' }}>{label} ({counts(k)})</button>
            ))}
          </div>
          {shown.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>No {tab} 1:1 sessions{filter ? ` for ${filter}` : ''}.</div>}
          {shown.map((s) => (
            <div key={s.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: A.navy }}>{s.child_name}</strong> <span style={badge(A.goldSoft, '#7A5B00')}>{s.category}</span>
                <div style={{ fontSize: 13, color: A.navy, marginTop: 2 }}>{s.topic || 'Session'}</div>
                <div style={{ fontSize: 12, color: A.meta }}>
                  {new Date(s.timing).toLocaleString()}{s.end_timing ? ` - ${new Date(s.end_timing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  {s.parent_name ? ` · parent: ${s.parent_name}` : ''}
                </div>
                {s.notes && <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>{s.notes}</div>}
              </div>
              {s.status === 'upcoming' && <button style={{ ...btn('danger'), padding: '7px 14px' }} onClick={() => cancel(s)}>Cancel</button>}
            </div>
          ))}
        </>
      )}

      {modal && (
        <AdminModal title="Schedule a 1:1 class" onClose={() => setModal(false)} width={560}>
          <form onSubmit={submit}>
            <label style={labelStyle}>Teacher</label>
            <select required value={form.teacher_id} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
              <option value="">Select a teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <label style={labelStyle}>Child</label>
            {form.child_label ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>{form.child_label}</span>
                <button type="button" style={btn('secondary')} onClick={() => setForm((f) => ({ ...f, child_id: '', child_label: '' }))}>Change</button>
              </div>
            ) : (
              <div>
                <input placeholder="Search child by name..." value={childSearch} onChange={(e) => setChildSearch(e.target.value)} style={inputStyle} />
                {matches.map((c) => (
                  <div key={c.id} onClick={() => { setForm((f) => ({ ...f, child_id: c.id, child_label: `${c.name} (${c.category})` })); setChildSearch(''); }} style={{ padding: 8, cursor: 'pointer', borderBottom: `1px solid ${A.line}`, fontSize: 13.5 }}>
                    {c.name} ({c.category}){c.parent_name ? ` - parent: ${c.parent_name}` : ''}
                  </div>
                ))}
              </div>
            )}

            <label style={labelStyle}>Topic</label>
            <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Date</label>
            <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={labelStyle}>Start</label>
                <input required type="time" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={labelStyle}>End</label>
                <input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <label style={labelStyle}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />

            {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Scheduling...' : 'Schedule'}</button>
              <button type="button" onClick={() => setModal(false)} style={btn('secondary')}>Cancel</button>
            </div>
            <p style={{ fontSize: 12, color: A.meta, marginTop: 8 }}>The parent is notified and the session shows on their 1:1 Classes page.</p>
          </form>
        </AdminModal>
      )}
    </AdminShell>
  );
}
