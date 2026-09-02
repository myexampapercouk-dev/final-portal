import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Nav from '../../components/Nav';
import { NAV_LINKS } from './AdminDashboard';

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
    <div>
      <Nav links={NAV_LINKS} />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Tutors</h2>
          <button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : '+ Add Teacher'}</button>
        </div>

        {showForm && (
          <form onSubmit={addTeacher} className="card">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <label>Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <label>Temporary Password</label>
            <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            {error && <div className="error">{error}</div>}
            <button className="gold" style={{ marginTop: 12 }} type="submit">Create Teacher Account</button>
          </form>
        )}

        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th></th></tr></thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.phone || '—'}</td>
                <td><button className="danger" onClick={() => removeTeacher(t.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
