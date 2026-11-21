import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import AdminShell from './AdminShell';
import AdminModal from './AdminModal';
import { toUkInput, ukInputToServer } from '../../utils/ukTime';
import { A, cardStyle, btn, labelStyle, inputStyle, badge, thStyle, tdStyle } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];
const EMPTY_CLASS_FORM = { course_id: '', title: '', teacher_id: '', timing: '', end_timing: '', venue: '', price: '', total_questions: '', categories: [] };

// Courses with the classes inside them. Adding a course, adding a class and editing a
// class all happen in popups; the age-group filter narrows the classes shown.
export default function CoursesAndClasses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState(''); // age group, '' = all
  const [expanded, setExpanded] = useState(null);

  const [courseModal, setCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', description: '' });
  const [classModal, setClassModal] = useState(false); // add-class popup
  const [classForm, setClassForm] = useState(EMPTY_CLASS_FORM);
  const [materialFiles, setMaterialFiles] = useState([null, null, null, null]);
  const [homeworkFile, setHomeworkFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [editing, setEditing] = useState(null); // class being edited
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    const [c, t, cl] = await Promise.all([api.get('/courses'), api.get('/admin/teachers'), api.get('/classes')]);
    setCourses(c.data);
    setTeachers(t.data);
    setClasses(cl.data);
  };
  useEffect(() => { loadAll(); }, []);

  const classesOf = (courseId) => classes.filter((cl) => cl.course_id === courseId && (!filter || (cl.categories || []).includes(filter)));
  const visibleCourses = useMemo(
    () => courses.filter((c) => !filter || classes.some((cl) => cl.course_id === c.id && (cl.categories || []).includes(filter))),
    [courses, classes, filter]
  );

  function closeModals() {
    setCourseModal(false);
    setClassModal(false);
    setEditing(null);
    setError('');
  }

  async function addCourse(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/courses', courseForm);
      setCourseForm({ name: '', description: '' });
      closeModals();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add the course');
    } finally {
      setBusy(false);
    }
  }

  function openAddClass(courseId) {
    setClassForm({ ...EMPTY_CLASS_FORM, course_id: String(courseId) });
    setMaterialFiles([null, null, null, null]);
    setHomeworkFile(null);
    setAnswerFile(null);
    setError('');
    setClassModal(true);
  }

  async function addClass(e) {
    e.preventDefault();
    setError('');
    if (!homeworkFile) { setError('Please attach the homework PDF for this class'); return; }
    if (!classForm.categories.length) { setError('Choose at least one category'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      ['course_id', 'title', 'teacher_id', 'timing', 'end_timing', 'venue', 'price', 'total_questions'].forEach((k) => fd.append(k, k === 'timing' || k === 'end_timing' ? ukInputToServer(classForm[k]) : classForm[k]));
      classForm.categories.forEach((cat) => fd.append('categories', cat));
      materialFiles.filter(Boolean).forEach((file) => fd.append('materials', file));
      fd.append('homework', homeworkFile);
      if (answerFile) fd.append('answer', answerFile);
      await api.post('/classes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeModals();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create class');
    } finally {
      setBusy(false);
    }
  }

  function openEdit(cl) {
    setError('');
    setEditing({
      id: cl.id, title: cl.title, teacher_id: String(cl.teacher_id), timing: toUkInput(cl.timing),
      end_timing: toUkInput(cl.end_timing), venue: cl.venue || '', price: cl.price === null || cl.price === undefined ? '' : String(cl.price)
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { id, ...body } = editing;
      await api.put(`/classes/${id}`, { ...body, timing: ukInputToServer(body.timing), end_timing: ukInputToServer(body.end_timing) });
      closeModals();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the class');
    } finally {
      setBusy(false);
    }
  }

  const toggleCategory = (cat) => setClassForm((f) => ({ ...f, categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat] }));
  const setMaterial = (i, file) => setMaterialFiles((prev) => { const n = [...prev]; n[i] = file; return n; });
  const errorBox = error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>;

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 6px' }}>
        <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: 0 }}>Courses &amp; Classes</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by age group" style={{ ...inputStyle, width: 'auto', margin: 0 }}>
            <option value="">All age groups</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={btn('gold')} onClick={() => { setError(''); setCourseModal(true); }}>+ Add course</button>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: A.meta, margin: '0 0 14px' }}>Click a course to see its classes, and a class to edit it.</p>

      {visibleCourses.length === 0 && <div style={{ ...cardStyle, color: A.meta }}>{courses.length ? 'No courses have classes for this age group.' : 'No courses yet - add the first one.'}</div>}

      {visibleCourses.map((c) => {
        const list = classesOf(c.id);
        const isOpen = expanded === c.id;
        return (
          <div key={c.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div onClick={() => setExpanded(isOpen ? null : c.id)} style={{ cursor: 'pointer', flex: 1, minWidth: 200 }}>
                <strong style={{ color: A.navy }}>{c.name}</strong>
                {c.description && <div style={{ fontSize: 12, color: A.meta }}>{c.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span onClick={() => setExpanded(isOpen ? null : c.id)} style={{ ...badge(A.cream, A.meta), cursor: 'pointer' }}>
                  {isOpen ? '▲ ' : '▼ '}{list.length} class{list.length === 1 ? '' : 'es'}
                </span>
                <button style={{ ...btn('secondary'), padding: '6px 12px', fontSize: 12.5 }} onClick={() => openAddClass(c.id)}>+ Add class</button>
              </div>
            </div>

            {isOpen && (list.length === 0 ? (
              <p style={{ marginTop: 10, color: A.meta, fontSize: 13 }}>No classes in this course{filter ? ` for ${filter}` : ''} yet.</p>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: 12 }}>
                <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: A.navy, color: '#fff' }}>
                      <th style={thStyle}>Title</th><th style={thStyle}>Teacher</th><th style={thStyle}>Timing</th><th style={thStyle}>Venue</th>
                      <th style={thStyle}>Price</th><th style={thStyle}>Categories</th><th style={thStyle}>Registered</th><th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((cl, i) => (
                      <tr key={cl.id} onClick={() => openEdit(cl)} title="Click to edit" style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}`, cursor: 'pointer' }}>
                        <td style={tdStyle}><strong style={{ color: A.navy }}>{cl.title}</strong></td>
                        <td style={tdStyle}>{cl.teacher_name}</td>
                        <td style={tdStyle}>
                          {new Date(cl.timing).toLocaleString()}
                          {cl.end_timing && <div style={{ fontSize: 12, color: A.meta }}>to {new Date(cl.end_timing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        </td>
                        <td style={tdStyle}>{cl.venue || '-'}</td>
                        <td style={tdStyle}>{cl.price !== null && cl.price !== undefined ? '£' + Number(cl.price).toFixed(2) : '-'}</td>
                        <td style={tdStyle}>{cl.categories?.join(', ')}</td>
                        <td style={tdStyle}><span style={badge(A.cream, A.meta)}>{cl.registered_count} registered</span></td>
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          {cl.status}
                          {cl.feedback_status === 'pending' && <div><Link to={'/admin/approvals/' + cl.id} style={{ color: A.red, fontWeight: 700, fontSize: 12 }}>Review feedback</Link></div>}
                          {cl.feedback_status === 'approved' && <div><Link to={'/admin/approvals/' + cl.id} style={{ color: A.meta, fontSize: 12 }}>View feedback</Link></div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );
      })}

      {courseModal && (
        <AdminModal title="Add a course" onClose={closeModals} width={520}>
          <form onSubmit={addCourse}>
            <label style={labelStyle}>Course name</label>
            <input required value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Description</label>
            <textarea rows={3} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
            {errorBox}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Saving...' : 'Add course'}</button>
              <button type="button" onClick={closeModals} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        </AdminModal>
      )}

      {classModal && (
        <AdminModal title={`Add a class${courses.find((c) => String(c.id) === classForm.course_id) ? ' to ' + courses.find((c) => String(c.id) === classForm.course_id).name : ''}`} onClose={closeModals}>
          <form onSubmit={addClass}>
            <label style={labelStyle}>Class title</label>
            <input required value={classForm.title} onChange={(e) => setClassForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Assigned teacher</label>
            <select required value={classForm.teacher_id} onChange={(e) => setClassForm((f) => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
              <option value="">Select a teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label style={labelStyle}>Start time (UK)</label>
            <input required type="datetime-local" value={classForm.timing} onChange={(e) => setClassForm((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>End time (UK)</label>
            <input required type="datetime-local" value={classForm.end_timing} onChange={(e) => setClassForm((f) => ({ ...f, end_timing: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Venue</label>
            <input required value={classForm.venue} onChange={(e) => setClassForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Room 2, Main Campus" style={inputStyle} />
            <label style={labelStyle}>Price (£)</label>
            <input required type="number" min="0" step="0.01" value={classForm.price} onChange={(e) => setClassForm((f) => ({ ...f, price: e.target.value }))} style={inputStyle} />

            <label style={labelStyle}>Category (multi-select)</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              {CATEGORIES.map((cat) => (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, margin: 0, fontSize: 13, textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: A.navy }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={classForm.categories.includes(cat)} onChange={() => toggleCategory(cat)} />
                  {cat}
                </label>
              ))}
            </div>

            <label style={labelStyle}>Homework PDF (required)</label>
            <input required type="file" accept="application/pdf" style={{ marginTop: 6, display: 'block' }} onChange={(e) => setHomeworkFile(e.target.files[0] || null)} />
            <label style={labelStyle}>Total number of questions (required)</label>
            <input required type="number" min="1" step="1" value={classForm.total_questions} onChange={(e) => setClassForm((f) => ({ ...f, total_questions: e.target.value }))} placeholder="e.g. 10" style={inputStyle} />
            <label style={labelStyle}>Answers PDF (optional)</label>
            <input type="file" accept="application/pdf" style={{ marginTop: 6, display: 'block' }} onChange={(e) => setAnswerFile(e.target.files[0] || null)} />

            <label style={labelStyle}>Material files (optional, up to 4)</label>
            {[0, 1, 2, 3].map((i) => (
              <input key={i} type="file" style={{ marginTop: 6, display: 'block' }} onChange={(e) => setMaterial(i, e.target.files[0] || null)} />
            ))}

            {errorBox}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Creating...' : 'Create class'}</button>
              <button type="button" onClick={closeModals} style={btn('secondary')}>Cancel</button>
            </div>
          </form>
        </AdminModal>
      )}

      {editing && (() => {
        const cl = classes.find((x) => x.id === editing.id);
        return (
          <AdminModal title="Edit class" onClose={closeModals}>
            <form onSubmit={saveEdit}>
              <label style={labelStyle}>Class title</label>
              <input required value={editing.title} onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
              <label style={labelStyle}>Assigned teacher</label>
              <select required value={editing.teacher_id} onChange={(e) => setEditing((f) => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label style={labelStyle}>Start time (UK)</label>
              <input required type="datetime-local" value={editing.timing} onChange={(e) => setEditing((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />
              <label style={labelStyle}>End time (UK)</label>
              <input type="datetime-local" value={editing.end_timing} onChange={(e) => setEditing((f) => ({ ...f, end_timing: e.target.value }))} style={inputStyle} />
              <label style={labelStyle}>Venue</label>
              <input value={editing.venue} onChange={(e) => setEditing((f) => ({ ...f, venue: e.target.value }))} style={inputStyle} />
              <label style={labelStyle}>Price (£)</label>
              <input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing((f) => ({ ...f, price: e.target.value }))} style={inputStyle} />

              {cl && cl.materials && cl.materials.length > 0 && (
                <>
                  <label style={labelStyle}>Materials</label>
                  {cl.materials.map((m) => (
                    <div key={m.id}><a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer" style={{ color: A.navy, fontSize: 13 }}>{m.file_name}</a></div>
                  ))}
                </>
              )}
              <p style={{ fontSize: 12, color: A.meta, marginTop: 10 }}>Homework for this class is managed on the <Link to="/admin/homework" style={{ color: A.navy }}>Homework</Link> page.</p>

              {errorBox}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Saving...' : 'Save changes'}</button>
                <button type="button" onClick={closeModals} style={btn('secondary')}>Cancel</button>
              </div>
            </form>
          </AdminModal>
        );
      })()}
    </AdminShell>
  );
}
