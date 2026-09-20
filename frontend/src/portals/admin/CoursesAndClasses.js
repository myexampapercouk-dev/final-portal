import React, { useEffect, useState } from 'react';
import api, { FILE_BASE_URL } from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, labelStyle, inputStyle, badge, thStyle, tdStyle } from './theme';

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
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 16px' }}>Courses</h1>
      <form onSubmit={addCourse} style={cardStyle}>
        <label style={labelStyle}>Course Name</label>
        <input required value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <label style={labelStyle}>Description</label>
        <textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
        <button style={{ ...btn('secondary'), marginTop: 10 }} type="submit">Add Course</button>
      </form>
      <p style={{ fontSize: 12, color: A.meta, marginTop: 4, marginBottom: 12 }}>
        Click a course below to see all classes registered under it.
      </p>
      {courses.map((c) => {
        const courseClasses = classes.filter((cl) => cl.course_id === c.id);
        const isOpen = expandedCourseId === c.id;
        return (
          <div key={c.id} style={{ ...cardStyle, cursor: 'pointer' }}>
            <div
              onClick={() => setExpandedCourseId(isOpen ? null : c.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <strong style={{ color: A.navy }}>{c.name}</strong>
                {c.description && <div style={{ fontSize: 12, color: A.meta }}>{c.description}</div>}
              </div>
              <span style={badge(A.cream, A.meta)}>
                {isOpen ? '▲ ' : '▼ '}{courseClasses.length} class{courseClasses.length === 1 ? '' : 'es'}
              </span>
            </div>

            {isOpen && (
              courseClasses.length === 0 ? (
                <p style={{ marginTop: 10, color: A.meta, fontSize: 13 }}>
                  No classes created under this course yet.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
                  <thead>
                    <tr style={{ background: A.navy, color: '#fff' }}>
                      <th style={thStyle}>Title</th><th style={thStyle}>Teacher</th><th style={thStyle}>Timing</th>
                      <th style={thStyle}>Categories</th><th style={thStyle}>Registered</th><th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseClasses.map((cl) => (
                      <tr key={cl.id} style={{ borderBottom: `1px solid ${A.line}` }}>
                        <td style={tdStyle}>{cl.title}</td>
                        <td style={tdStyle}>{cl.teacher_name}</td>
                        <td style={tdStyle}>{new Date(cl.timing).toLocaleString()}</td>
                        <td style={tdStyle}>{cl.categories?.join(', ')}</td>
                        <td style={tdStyle}><span style={badge(A.cream, A.meta)}>{cl.registered_count} registered</span></td>
                        <td style={tdStyle}>{cl.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        );
      })}

      <h1 style={{ fontFamily: A.headlineFont, fontSize: 22, color: A.navy, margin: '30px 0 16px' }}>Classes</h1>
      <form onSubmit={addClass} style={cardStyle}>
        <label style={labelStyle}>Course</label>
        <select required value={classForm.course_id} onChange={(e) => setClassForm((f) => ({ ...f, course_id: e.target.value }))} style={inputStyle}>
          <option value="">Select a course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label style={labelStyle}>Class Title</label>
        <input required value={classForm.title} onChange={(e) => setClassForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
        <label style={labelStyle}>Assigned Teacher</label>
        <select required value={classForm.teacher_id} onChange={(e) => setClassForm((f) => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
          <option value="">Select a teacher</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label style={labelStyle}>Timing</label>
        <input required type="datetime-local" value={classForm.timing} onChange={(e) => setClassForm((f) => ({ ...f, timing: e.target.value }))} style={inputStyle} />

        <label style={labelStyle}>Category (multi-select)</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          {CATEGORIES.map((cat) => (
            <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, margin: 0, fontSize: 13, textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: A.navy }}>
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

        <label style={labelStyle}>Material Files (optional, up to 4)</label>
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            type="file"
            style={{ marginTop: 6, display: 'block' }}
            onChange={(e) => setMaterialFile(i, e.target.files[0] || null)}
          />
        ))}
        <p style={{ fontSize: 12, color: A.meta, marginTop: 4 }}>
          None of these are required — leave any or all blank and add them later if needed.
        </p>

        {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>{error}</div>}
        <button style={{ ...btn('gold'), marginTop: 12 }} type="submit">Create Class</button>
      </form>

      <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: A.navy, color: '#fff' }}>
              <th style={thStyle}>Title</th><th style={thStyle}>Course</th><th style={thStyle}>Teacher</th><th style={thStyle}>Timing</th>
              <th style={thStyle}>Categories</th><th style={thStyle}>Registered</th><th style={thStyle}>Materials</th><th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}` }}>
                <td style={tdStyle}>{c.title}</td>
                <td style={tdStyle}>{c.course_name}</td>
                <td style={tdStyle}>{c.teacher_name}</td>
                <td style={tdStyle}>{new Date(c.timing).toLocaleString()}</td>
                <td style={tdStyle}>{c.categories?.join(', ')}</td>
                <td style={tdStyle}><span style={badge(A.cream, A.meta)}>{c.registered_count} registered</span></td>
                <td style={tdStyle}>
                  {c.materials && c.materials.length > 0
                    ? c.materials.map((m) => (
                      <div key={m.id}>
                        <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer" style={{ color: A.navy }}>{m.file_name}</a>
                      </div>
                    ))
                    : <span style={{ color: A.meta }}>—</span>}
                </td>
                <td style={tdStyle}>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
