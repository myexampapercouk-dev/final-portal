import React, { useEffect, useState } from 'react';
import api, { FILE_BASE_URL } from '../../api/axios';
import Nav from '../../components/Nav';
import { NAV_LINKS } from './AdminDashboard';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];
const EMPTY_CLASS_FORM = { course_id: '', title: '', teacher_id: '', timing: '', categories: [] };

export default function CoursesAndClasses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courseForm, setCourseForm] = useState({ name: '', description: '' });
  const [classForm, setClassForm] = useState(EMPTY_CLASS_FORM);
  const [materialFiles, setMaterialFiles] = useState([null, null, null, null]); // up to 4, optional
  const [error, setError] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [c, t, cl] = await Promise.all([
      api.get('/courses'),
      api.get('/admin/teachers'),
      api.get('/classes')
    ]);
    setCourses(c.data);
    setTeachers(t.data);
    setClasses(cl.data);
  }

  async function addCourse(e) {
    e.preventDefault();
    await api.post('/courses', courseForm);
    setCourseForm({ name: '', description: '' });
    loadAll();
  }

  function toggleCategory(cat) {
    setClassForm((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat]
    }));
  }

  function setMaterialFile(index, file) {
    setMaterialFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }

  async function addClass(e) {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      fd.append('course_id', classForm.course_id);
      fd.append('title', classForm.title);
      fd.append('teacher_id', classForm.teacher_id);
      fd.append('timing', classForm.timing);
      classForm.categories.forEach((cat) => fd.append('categories', cat));
      materialFiles.filter(Boolean).forEach((file) => fd.append('materials', file));

      await api.post('/classes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setClassForm(EMPTY_CLASS_FORM);
      setMaterialFiles([null, null, null, null]);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create class');
    }
  }

  return (
    <div>
      <Nav links={NAV_LINKS} />
      <div className="container">
        <h2>Courses</h2>
        <form onSubmit={addCourse} className="card">
          <label>Course Name</label>
          <input required value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} />
          <label>Description</label>
          <textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
          <button style={{ marginTop: 10 }} type="submit">Add Course</button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--meta, #66707F)', marginTop: 12 }}>
          Click a course below to see all classes registered under it.
        </p>
        {courses.map((c) => {
          const courseClasses = classes.filter((cl) => cl.course_id === c.id);
          const isOpen = expandedCourseId === c.id;
          return (
            <div key={c.id} className="card" style={{ cursor: 'pointer' }}>
              <div
                onClick={() => setExpandedCourseId(isOpen ? null : c.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <strong>{c.name}</strong>
                  {c.description && (
                    <div style={{ fontSize: 12, color: 'var(--meta, #66707F)' }}>{c.description}</div>
                  )}
                </div>
                <span className="badge">
                  {isOpen ? '▲ ' : '▼ '}{courseClasses.length} class{courseClasses.length === 1 ? '' : 'es'}
                </span>
              </div>

              {isOpen && (
                courseClasses.length === 0 ? (
                  <p style={{ marginTop: 10, color: '#94a3b8', fontSize: 13 }}>
                    No classes created under this course yet.
                  </p>
                ) : (
                  <table style={{ marginTop: 12 }}>
                    <thead>
                      <tr>
                        <th>Title</th><th>Teacher</th><th>Timing</th>
                        <th>Categories</th><th>Registered</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseClasses.map((cl) => (
                        <tr key={cl.id}>
                          <td>{cl.title}</td>
                          <td>{cl.teacher_name}</td>
                          <td>{new Date(cl.timing).toLocaleString()}</td>
                          <td>{cl.categories?.join(', ')}</td>
                          <td><span className="badge">{cl.registered_count} registered</span></td>
                          <td>{cl.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          );
        })}

        <h2 style={{ marginTop: 30 }}>Classes</h2>
        <form onSubmit={addClass} className="card">
          <label>Course</label>
          <select required value={classForm.course_id} onChange={(e) => setClassForm((f) => ({ ...f, course_id: e.target.value }))}>
            <option value="">Select a course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label>Class Title</label>
          <input required value={classForm.title} onChange={(e) => setClassForm((f) => ({ ...f, title: e.target.value }))} />
          <label>Assigned Teacher</label>
          <select required value={classForm.teacher_id} onChange={(e) => setClassForm((f) => ({ ...f, teacher_id: e.target.value }))}>
            <option value="">Select a teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label>Timing</label>
          <input required type="datetime-local" value={classForm.timing} onChange={(e) => setClassForm((f) => ({ ...f, timing: e.target.value }))} />

          <label>Category (multi-select)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {CATEGORIES.map((cat) => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={classForm.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <label>Material Files (optional, up to 4)</label>
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              type="file"
              style={{ marginTop: 6 }}
              onChange={(e) => setMaterialFile(i, e.target.files[0] || null)}
            />
          ))}
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            None of these are required — leave any or all blank and add them later if needed.
          </p>

          {error && <div className="error">{error}</div>}
          <button className="gold" style={{ marginTop: 12 }} type="submit">Create Class</button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Title</th><th>Course</th><th>Teacher</th><th>Timing</th>
              <th>Categories</th><th>Registered</th><th>Materials</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.course_name}</td>
                <td>{c.teacher_name}</td>
                <td>{new Date(c.timing).toLocaleString()}</td>
                <td>{c.categories?.join(', ')}</td>
                <td><span className="badge">{c.registered_count} registered</span></td>
                <td>
                  {c.materials && c.materials.length > 0
                    ? c.materials.map((m) => (
                      <div key={m.id}>
                        <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer">{m.file_name}</a>
                      </div>
                    ))
                    : <span style={{ color: '#94a3b8' }}>—</span>}
                </td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}