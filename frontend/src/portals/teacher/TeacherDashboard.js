import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Nav from '../../components/Nav';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/classes');
    setClasses(data);
  }

  return (
    <div>
      <Nav links={[
        { to: '/teacher', label: 'My Classes' },
        { to: '/teacher/one-on-one', label: '1:1 Sessions' }
      ]} />
      <div className="container">
        <h2>My Assigned Classes</h2>
        {classes.length === 0 && <p style={{ color: '#64748b' }}>No classes assigned yet.</p>}
        {classes.map((c) => (
          <Link key={c.id} to={`/teacher/class/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{c.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {c.course_name} · {new Date(c.timing).toLocaleString()}
                </div>
                <div style={{ marginTop: 4 }}>
                  {c.categories?.map((cat) => <span key={cat} className="badge" style={{ marginRight: 4 }}>{cat}</span>)}
                  <span className="badge" style={{ marginRight: 4, background: '#f1f5f9', color: '#334155' }}>
                    {c.registered_count} registered
                  </span>
                </div>
              </div>
              <span className="badge" style={{
                background: c.status === 'completed' ? '#dcfce7' : c.status === 'cancelled' ? '#fee2e2' : '#e0f2fe',
                color: c.status === 'completed' ? '#166534' : c.status === 'cancelled' ? '#991b1b' : '#0369a1'
              }}>
                {c.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
