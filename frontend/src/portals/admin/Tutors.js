import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import { NAV } from './AdminDashboard';
import { T, cardStyle, btnStyle, labelStyle, inputStyle, thStyle, tdStyle } from '../../theme';

export default function Tutors() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/admin/teachers');
    setTeachers(data);
  }

  async function addTeacher(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/admin/create-teacher', form);
      setForm({ name: '', email: '', phone: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add teacher');
    }
  }

  async function removeTeacher(id) {
    if (!window.confirm('Remove this teacher?')) return;
    await api.delete(`/admin/teachers/${id}`);
    load();
  }

  return (
    <Shell active="tutors" navItems={NAV} roleLabel="Admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: 0 }}>Tutors</h1>
        <button style={btnStyle(showForm ? 'secondaryOutline' : 'primary')} onClick={() => setShowForm((s) => !s)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Close' : 'Add Teacher'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTeacher} style={cardStyle}>
          <label style={labelStyle}>Name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>Phone</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>Temporary Password</label>
          <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={inputStyle} />
          {error && <div style={{ color: T.error, fontSize: 12.5, background: T.errorContainer, padding: '7px 11px', borderRadius: 8, marginTop: 8 }}>{error}</div>}
          <button style={{ ...btnStyle('primary'), marginTop: 12 }} type="submit">Create Teacher Account</button>
        </form>
      )}

      <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: T.surfaceContainer, color: T.onSurfaceVariant, textTransform: 'uppercase', fontSize: 11 }}>
              <th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${T.surfaceContainerHigh}` }}>
                <td style={tdStyle}>{t.name}</td>
                <td style={tdStyle}>{t.email}</td>
                <td style={tdStyle}>{t.phone || '—'}</td>
                <td style={tdStyle}><button style={btnStyle('danger')} onClick={() => removeTeacher(t.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
