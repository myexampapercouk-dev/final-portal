import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, labelStyle, inputStyle, thStyle, tdStyle } from './theme';

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
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: 0 }}>Tutors</h1>
        <button style={btn(showForm ? 'secondary' : 'gold')} onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : '+ Add Teacher'}
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
          {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>{error}</div>}
          <button style={{ ...btn('gold'), marginTop: 12 }} type="submit">Create Teacher Account</button>
        </form>
      )}

      <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: A.navy, color: '#fff', textTransform: 'uppercase' }}>
              <th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}` }}>
                <td style={tdStyle}>{t.name}</td>
                <td style={tdStyle}>{t.email}</td>
                <td style={tdStyle}>{t.phone || '—'}</td>
                <td style={tdStyle}><button style={btn('danger')} onClick={() => removeTeacher(t.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
