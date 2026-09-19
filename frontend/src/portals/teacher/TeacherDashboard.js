import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Nav from '../../components/Nav';

const STATUS_STYLE = {
  completed: { background: '#dcfce7', color: '#166534' },
  cancelled: { background: '#fee2e2', color: '#991b1b' },
  scheduled: { background: '#e0f2fe', color: '#0369a1' }
};

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/classes');
    setClasses(data);
  }

  return (
    <div>
      <Nav brandSuffix="Teacher" links={[
        { to: '/teacher', label: 'My Classes' },
        { to: '/teacher/one-on-one', label: '1:1 Sessions' }
      ]} />
      <div className="container">
        <h2>My Assigned Classes</h2>
        {classes.length === 0 && <p style={{ color: '#64748b' }}>No classes assigned yet.</p>}
        {classes.map((c) => (
          <Link key={c.id} to={`/teacher/class/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="card" style={styles.row}>
              <div>
                <strong style={{ fontSize: 15.5 }}>{c.title}</strong>
                <div style={{ fontSize: 12.5, color: 'var(--meta)', marginTop: 2 }}>
                  {c.course_name} · {new Date(c.timing).toLocaleString()}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.categories?.map((cat) => <span key={cat} className="badge">{cat}</span>)}
                  <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                    {c.registered_count} registered
                  </span>
                </div>
              </div>
              <span className="badge" style={{ ...(STATUS_STYLE[c.status] || STATUS_STYLE.scheduled), flexShrink: 0 }}>
                {c.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    transition: 'box-shadow .15s ease, transform .05s ease'
  }
};
