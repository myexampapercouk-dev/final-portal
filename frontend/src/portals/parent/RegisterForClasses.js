import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import ClassDetails from './ClassDetails';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, inputStyle, labelStyle } from './theme';

// Two levels: the courses with classes open for the selected child, then the classes in the
// course the parent picked. The search box searches whichever level is showing.
export default function RegisterForClasses() {
  const { selectedChild } = useParent();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [registeredIds, setRegisteredIds] = useState([]);
  const [courseId, setCourseId] = useState(null); // null = the course list

  const load = useCallback(() => {
    if (!selectedChild) { setClasses([]); setLoading(false); return; }
    setLoading(true);
    api.get('/classes/available', { params: { child_id: selectedChild.id } }).then(({ data }) => {
      setClasses(data);
      setLoading(false);
    });
  }, [selectedChild]);

  // A different child has different classes: start again from the course list
  useEffect(() => { load(); setRegisteredIds([]); setCourseId(null); setSearch(''); }, [load]);

  async function register(classId) {
    setError('');
    try {
      await api.post('/registrations', { class_id: classId, child_id: selectedChild.id });
      setRegisteredIds((ids) => [...ids, classId]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register');
    }
  }

  const open = useMemo(() => classes.filter((c) => !registeredIds.includes(c.id)), [classes, registeredIds]);

  const courses = useMemo(() => {
    const map = new Map();
    open.forEach((c) => {
      if (!map.has(c.course_id)) map.set(c.course_id, { id: c.course_id, name: c.course_name, description: c.course_description, classes: [] });
      map.get(c.course_id).classes.push(c);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [open]);

  const course = courses.find((c) => c.id === courseId) || null;
  const q = search.trim().toLowerCase();

  const shownCourses = courses.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  const shownClasses = course
    ? course.classes.filter((c) => !q || c.title.toLowerCase().includes(q) || c.categories.some((cat) => cat.toLowerCase().includes(q)))
    : [];

  function openCourse(id) { setCourseId(id); setSearch(''); setError(''); }
  function backToCourses() { setCourseId(null); setSearch(''); setError(''); }

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Register for Classes</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>
        {course
          ? `${course.classes.length} session${course.classes.length === 1 ? '' : 's'} open for booking in ${course.name}`
          : `${courses.length} course${courses.length === 1 ? '' : 's'} with classes open for booking`}
      </p>
      <ChildPills />

      {selectedChild && (
        <div style={{ marginBottom: 18, maxWidth: 320 }}>
          <label style={labelStyle}>Search</label>
          <input
            placeholder={course ? 'Search classes in this course...' : 'Search courses...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {course && (
        <button type="button" onClick={backToCourses} style={{ background: 'none', border: 'none', color: P.navy, fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0, margin: '0 0 14px', fontFamily: 'inherit' }}>
          ← Back to courses
        </button>
      )}

      {error && <div style={{ color: P.red, fontSize: 12.5, background: P.redWash, padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {loading && <p style={{ color: P.meta }}>Loading available classes...</p>}
      {!loading && !selectedChild && <p style={{ color: P.meta }}>Add a child first to see classes available for their category.</p>}
      {!loading && selectedChild && !course && shownCourses.length === 0 && <p style={{ color: P.meta }}>{courses.length ? 'No courses match your search.' : 'No new classes available right now.'}</p>}
      {!loading && course && shownClasses.length === 0 && <p style={{ color: P.meta }}>{course.classes.length ? 'No classes match your search.' : 'No classes left in this course.'}</p>}

      {/* Level 1: courses */}
      {!course && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shownCourses.map((c) => (
            <div key={c.id} role="button" tabIndex={0} onClick={() => openCourse(c.id)} onKeyDown={(e) => { if (e.key === 'Enter') openCourse(c.id); }} style={{ ...cardStyle, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 17 }}>{c.name}</div>
                  {c.description && <div style={{ fontSize: 13, color: P.meta, marginTop: 3 }}>{c.description}</div>}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: P.cream, color: P.meta, padding: '3px 10px', borderRadius: 999 }}>
                      {c.classes.length} class{c.classes.length === 1 ? '' : 'es'} open
                    </span>
                  </div>
                </div>
                <span style={{ color: P.meta, fontSize: 20 }} aria-hidden="true">{'›'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Level 2: the classes in the chosen course */}
      {course && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shownClasses.map((c) => (
            <div key={c.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>{c.course_name}</div>
                  <ClassDetails c={c} />
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.categories.map((cat) => (
                      <span key={cat} style={{ fontSize: 11, fontWeight: 700, background: P.goldSoft, color: '#7A5B00', padding: '3px 10px', borderRadius: 999 }}>{cat}</span>
                    ))}
                    <span style={{ fontSize: 11, fontWeight: 600, background: P.cream, color: P.meta, padding: '3px 10px', borderRadius: 999 }}>{c.registered_count} registered</span>
                  </div>
                </div>
                <button style={{ ...btn('gold'), alignSelf: 'center', flexShrink: 0 }} onClick={() => register(c.id)}>Register</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ParentShell>
  );
}
