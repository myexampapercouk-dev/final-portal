import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Nav from '../../components/Nav';
import { NAV_LINKS } from './AdminDashboard';

export default function Parents() {
  const [parents, setParents] = useState([]);

  useEffect(() => {
    api.get('/admin/parents').then(({ data }) => setParents(data));
  }, []);

  return (
    <div>
      <Nav links={NAV_LINKS} />
      <div className="container">
        <h2>Parents</h2>
        {parents.map((p) => (
          <div key={p.id} className="card">
            <strong>{p.name}</strong> · {p.email} {p.phone && `· ${p.phone}`}
            <div style={{ marginTop: 8 }}>
              {p.children.length === 0 && <span style={{ fontSize: 13, color: '#94a3b8' }}>No children added</span>}
              {p.children.map((c) => (
                <span key={c.id} className="badge" style={{ marginRight: 6 }}>{c.name} ({c.category})</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
