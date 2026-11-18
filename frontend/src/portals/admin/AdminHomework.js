import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import AdminModal from './AdminModal';
import { A, cardStyle, btn, labelStyle, inputStyle, badge } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

// Course -> class -> that class's homework (with Edit, Delete and a feedback CSV).
export default function AdminHomework() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [items, setItems] = useState([]); // all homework
  const [fbCount, setFbCount] = useState({}); // homework id -> parent feedback rows
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [classId, setClassId] = useState(null);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ class_id: '', title: '', total_questions: '' });
  const [homeworkFile, setHomeworkFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/courses'), api.get('/classes'), api.get('/homework/all'), api.get('/homework/feedback').catch(() => ({ data: [] }))])
    .then(([co, cl, hw, fb]) => {
      setCourses(co.data);
      setClasses(cl.data);
      setItems(hw.data);
      const counts = {};
      fb.data.forEach((f) => { counts[f.homework_id] = (counts[f.homework_id] || 0) + 1; });
      setFbCount(counts);
    });
  useEffect(() => { load(); }, []);

  const matches = (cl) => !filter || (cl.categories || []).includes(filter);
  const hwOf = (id) => items.filter((h) => h.class_id === id);
  const course = courses.find((c) => c.id === courseId) || null;
  const cls = classes.find((c) => c.id === classId) || null;
  const q = search.trim().toLowerCase();

  const shownCourses = useMemo(
    () => courses.filter((c) => classes.some((cl) => cl.course_id === c.id && matches(cl)) && (!q || c.name.toLowerCase().includes(q))),
    [courses, classes, filter, q] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const shownClasses = course ? classes.filter((cl) => cl.course_id === course.id && matches(cl) && (!q || cl.title.toLowerCase().includes(q))) : [];

  function openAdd() {
    setForm({ class_id: cls ? String(cls.id) : '', title: '', total_questions: '' });
    setHomeworkFile(null);
    setAnswerFile(null);
    setError('');
    setAdding(true);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setError('');
    if (!homeworkFile) { setError('Attach the homework PDF'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('class_id', form.class_id);
      fd.append('title', form.title);
      fd.append('total_questions', form.total_questions);
      fd.append('homework', homeworkFile);
      if (answerFile) fd.append('answer', answerFile);
      await api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdding(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload homework');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.put(`/homework/${editing.id}`, { title: editing.title, total_questions: editing.total_questions });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(h) {
    if (!window.confirm(`Delete "${h.title}"?`)) return;
    await api.delete(`/homework/${h.id}`);
    load();
  }

  async function downloadFeedback(h) {
    try {
      const { data } = await api.get(`/homework/${h.id}/feedback.csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${h.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'homework'}-feedback.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      alert('Could not download the feedback file');
    }
  }

  const crumb = (label, onClick) => <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', color: A.navy, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13.5 }}>{label}</button>;
  const errorBox = error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>;

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 6px' }}>
        <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: 0 }}>Homework</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!cls && <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={course ? 'Search classes...' : 'Search courses...'} style={{ ...inputStyle, width: 200, margin: 0 }} />}
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by age group" style={{ ...inputStyle, width: 'auto', margin: 0 }}>
            <option value="">All age groups</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={btn('gold')} onClick={openAdd}>+ Add homework</button>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: A.meta, margin: '0 0 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {crumb('Courses', () => { setCourseId(null); setClassId(null); setSearch(''); })}
        {course && <>› {crumb(course.name, () => { setClassId(null); setSearch(''); })}</>}
        {cls && <>› <span style={{ color: A.navy, fontWeight: 600 }}>{cls.title}</span></>}
      </div>

      {!course && (shownCourses.length === 0
        ? <div style={{ ...cardStyle, color: A.meta }}>No courses found.</div>
        : shownCourses.map((c) => {
          const cl = classes.filter((x) => x.course_id === c.id && matches(x));
          const n = cl.reduce((s, x) => s + hwOf(x.id).length, 0);
          return (
            <div key={c.id} onClick={() => { setCourseId(c.id); setSearch(''); }} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <strong style={{ color: A.navy }}>{c.name}</strong>
              <span style={badge(A.cream, A.meta)}>{cl.length} class{cl.length === 1 ? '' : 'es'} · {n} homework ›</span>
            </div>
          );
        }))}

      {course && !cls && (shownClasses.length === 0
        ? <div style={{ ...cardStyle, color: A.meta }}>No classes found.</div>
        : shownClasses.map((cl) => (
          <div key={cl.id} onClick={() => { setClassId(cl.id); setSearch(''); }} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: A.navy }}>{cl.title}</strong>
              <div style={{ fontSize: 12, color: A.meta }}>{new Date(cl.timing).toLocaleString()} · {cl.status}</div>
            </div>
            <span style={badge(A.cream, A.meta)}>{hwOf(cl.id).length} homework ›</span>
          </div>
        )))}

      {cls && (hwOf(cls.id).length === 0
        ? <div style={{ ...cardStyle, color: A.meta }}>No homework for this class yet. Use "+ Add homework".</div>
        : hwOf(cls.id).map((h) => (
          <div key={h.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: A.navy, fontSize: 15 }}>{h.title}</strong>
                <div style={{ fontSize: 12.5, color: A.meta, marginTop: 3 }}>
                  {h.total_questions ? `${h.total_questions} questions` : 'No question count'} · added {new Date(h.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 12.5, color: A.meta }}>{h.file_name}{h.answer_file_name ? ` + ${h.answer_file_name}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <button style={{ ...btn('secondary'), padding: '7px 14px' }} onClick={() => { setError(''); setEditing({ id: h.id, title: h.title, total_questions: h.total_questions || '' }); }}>Edit</button>
                <button style={{ ...btn('secondary'), padding: '7px 14px' }} onClick={() => downloadFeedback(h)}>Download feedback{fbCount[h.id] ? ` (${fbCount[h.id]})` : ''}</button>
                <button style={{ ...btn('danger'), padding: '7px 14px' }} onClick={() => remove(h)}>Delete</button>
              </div>
            </div>
          </div>
        )))}

      {adding && (
        <AdminModal title="Add homework" onClose={() => setAdding(false)} width={560}>
          <form onSubmit={submitAdd}>
            <label style={labelStyle}>Class</label>
            <select required value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))} style={inputStyle}>
              <option value="">Select a class...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.course_name} - {c.title} - {new Date(c.timing).toLocaleDateString()}</option>)}
            </select>
            <label style={labelStyle}>Title</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Total number of questions (required)</label>
            <input required type="number" min="1" step="1" value={form.total_questions} onChange={(e) => setForm((f) => ({ ...f, total_questions: e.target.value }))} placeholder="e.g. 10" style={inputStyle} />
            <label style={labelStyle}>Homework PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => setHomeworkFile(e.target.files[0] || null)} />
            <label style={labelStyle}>Answers PDF (optional)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setAnswerFile(e.target.files[0] || null)} />
            {errorBox}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Uploading...' : 'Add homework'}</button>
              <button type="button" onClick={() => setAdding(false)} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        </AdminModal>
      )}

      {editing && (
        <AdminModal title="Edit homework" onClose={() => setEditing(null)} width={500}>
          <form onSubmit={saveEdit}>
            <label style={labelStyle}>Title</label>
            <input required value={editing.title} onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Total number of questions</label>
            <input required type="number" min="1" step="1" value={editing.total_questions} onChange={(e) => setEditing((f) => ({ ...f, total_questions: e.target.value }))} style={inputStyle} />
            <p style={{ fontSize: 12, color: A.meta, marginTop: 8 }}>To replace the PDF files, delete this homework and add it again.</p>
            {errorBox}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Saving...' : 'Save changes'}</button>
              <button type="button" onClick={() => setEditing(null)} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        </AdminModal>
      )}
    </AdminShell>
  );
}
