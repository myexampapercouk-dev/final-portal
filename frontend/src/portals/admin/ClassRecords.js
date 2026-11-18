import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, inputStyle, badge, thStyle, tdStyle } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];
const fmt = (d) => new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Course -> class -> everything about that class (details, students, feedback) on one page.
export default function ClassRecords() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [classId, setClassId] = useState(null);
  const [tab, setTab] = useState('details');
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loadingClass, setLoadingClass] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/classes')]).then(([c, cl]) => { setCourses(c.data); setClasses(cl.data); });
  }, []);

  const matches = (cl) => !filter || (cl.categories || []).includes(filter);
  const course = courses.find((c) => c.id === courseId) || null;
  const cls = classes.find((c) => c.id === classId) || null;
  const q = search.trim().toLowerCase();

  const shownCourses = useMemo(
    () => courses.filter((c) => classes.some((cl) => cl.course_id === c.id && matches(cl)) && (!q || c.name.toLowerCase().includes(q))),
    [courses, classes, filter, q] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const shownClasses = course ? classes.filter((cl) => cl.course_id === course.id && matches(cl) && (!q || cl.title.toLowerCase().includes(q))) : [];

  useEffect(() => {
    if (!classId) return;
    setLoadingClass(true);
    Promise.all([api.get(`/registrations/class/${classId}`), api.get(`/registrations/class/${classId}/feedback`)])
      .then(([s, f]) => { setStudents(s.data.filter((r) => r.registration_id)); setFeedback(f.data); })
      .finally(() => setLoadingClass(false));
  }, [classId]);

  const open = (setter, id) => { setter(id); setSearch(''); };
  const crumb = (label, onClick) => <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', color: A.navy, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 13.5 }}>{label}</button>;

  const feedbackByChild = useMemo(() => {
    const map = new Map();
    feedback.forEach((f) => { if (!map.has(f.child_id)) map.set(f.child_id, { name: f.child_name, items: [] }); map.get(f.child_id).items.push(f); });
    return [...map.values()];
  }, [feedback]);

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 6px' }}>
        <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: 0 }}>Class Records</h1>
        {!cls && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={course ? 'Search classes...' : 'Search courses...'} style={{ ...inputStyle, width: 220, margin: 0 }} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by age group" style={{ ...inputStyle, width: 'auto', margin: 0 }}>
              <option value="">All age groups</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ fontSize: 13.5, color: A.meta, margin: '0 0 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {crumb('Courses', () => { setCourseId(null); setClassId(null); setSearch(''); })}
        {course && <>› {crumb(course.name, () => { setClassId(null); setSearch(''); })}</>}
        {cls && <>› <span style={{ color: A.navy, fontWeight: 600 }}>{cls.title}</span></>}
      </div>

      {/* level 1: courses */}
      {!course && (
        <>
          {shownCourses.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>No courses found.</div>}
          {shownCourses.map((c) => {
            const n = classes.filter((cl) => cl.course_id === c.id && matches(cl)).length;
            return (
              <div key={c.id} onClick={() => open(setCourseId, c.id)} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div><strong style={{ color: A.navy }}>{c.name}</strong>{c.description && <div style={{ fontSize: 12, color: A.meta }}>{c.description}</div>}</div>
                <span style={badge(A.cream, A.meta)}>{n} class{n === 1 ? '' : 'es'} ›</span>
              </div>
            );
          })}
        </>
      )}

      {/* level 2: classes of the course */}
      {course && !cls && (
        <>
          {shownClasses.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>No classes found.</div>}
          {shownClasses.map((cl) => (
            <div key={cl.id} onClick={() => { setClassId(cl.id); setTab('details'); setSearch(''); }} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ color: A.navy }}>{cl.title}</strong>
                <div style={{ fontSize: 12, color: A.meta }}>{fmt(cl.timing)} · {cl.teacher_name}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(cl.categories || []).map((cat) => <span key={cat} style={badge(A.goldSoft, '#7A5B00')}>{cat}</span>)}
                <span style={badge(A.cream, A.meta)}>{cl.registered_count} registered</span>
                <span style={badge(cl.status === 'completed' ? A.greenWash : A.cream, cl.status === 'completed' ? A.green : A.meta)}>{cl.status}</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* level 3: one class */}
      {cls && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['details', 'Class details'], ['students', `Students (${students.length})`], ['feedback', `Feedback (${feedback.length})`]].map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} style={{ ...btn(tab === k ? 'navy' : 'secondary'), padding: '8px 16px' }}>{label}</button>
            ))}
          </div>

          {tab === 'details' && (
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13.5 }}>
                {[['Course', cls.course_name], ['Teacher', cls.teacher_name], ['Starts', fmt(cls.timing)], ['Ends', cls.end_timing ? fmt(cls.end_timing) : '-'],
                  ['Venue', cls.venue || '-'], ['Price', cls.price !== null && cls.price !== undefined ? '£' + Number(cls.price).toFixed(2) : '-'],
                  ['Age groups', (cls.categories || []).join(', ')], ['Status', cls.status], ['Feedback', cls.feedback_status]].map(([k, v]) => (
                  <div key={k}><div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: A.meta, fontWeight: 600 }}>{k}</div><div style={{ color: A.navy, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
              {cls.materials && cls.materials.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: A.meta, fontWeight: 600 }}>Materials</div>
                  {cls.materials.map((m) => <div key={m.id}><a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer" style={{ color: A.navy, fontSize: 13 }}>{m.file_name}</a></div>)}
                </div>
              )}
              <p style={{ fontSize: 12.5, color: A.meta, marginTop: 14 }}>
                <Link to="/admin/homework" style={{ color: A.navy }}>Homework</Link> · <Link to="/admin/courses" style={{ color: A.navy }}>Edit this class</Link>
                {cls.feedback_status !== 'none' && <> · <Link to={'/admin/approvals/' + cls.id} style={{ color: A.navy }}>{cls.feedback_status === 'pending' ? 'Review feedback' : 'View feedback'}</Link></>}
              </p>
            </div>
          )}

          {tab === 'students' && (
            <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 460, borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ background: A.navy, color: '#fff' }}><th style={thStyle}>Student</th><th style={thStyle}>Age group</th><th style={thStyle}>Booking</th><th style={thStyle}>Attendance</th></tr></thead>
                <tbody>
                  {loadingClass && <tr><td style={{ ...tdStyle, color: A.meta }} colSpan={4}>Loading...</td></tr>}
                  {!loadingClass && students.length === 0 && <tr><td style={{ ...tdStyle, color: A.meta }} colSpan={4}>No students registered.</td></tr>}
                  {students.map((s, i) => (
                    <tr key={s.registration_id} style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}` }}>
                      <td style={tdStyle}><strong style={{ color: A.navy }}>{s.child_name}</strong></td>
                      <td style={tdStyle}>{s.category}</td>
                      <td style={tdStyle}>{s.status}</td>
                      <td style={tdStyle}>{s.present === 1 ? 'Present' : s.present === 0 ? 'Absent' : 'Not marked'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'feedback' && (
            <>
              {feedbackByChild.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>No feedback has been written for this class yet.</div>}
              {feedbackByChild.map((g) => (
                <div key={g.name} style={cardStyle}>
                  <strong style={{ color: A.navy }}>{g.name}</strong>
                  {g.items.map((f) => (
                    <div key={f.id} style={{ borderLeft: `3px solid ${A.gold}`, paddingLeft: 10, marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: A.meta }}>{f.subject || 'General'}</div>
                      <div style={{ fontSize: 13.5, color: A.navy, whiteSpace: 'pre-wrap' }}>{f.content}</div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </AdminShell>
  );
}
