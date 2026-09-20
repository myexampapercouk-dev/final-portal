import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, badge } from './theme';

export default function Parents() {
  const [parents, setParents] = useState([]);

  useEffect(() => {
    api.get('/admin/parents').then(({ data }) => setParents(data));
  }, []);

  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 16px' }}>Parents</h1>
      {parents.map((p) => (
        <div key={p.id} style={cardStyle}>
          <strong style={{ color: A.navy }}>{p.name}</strong> <span style={{ color: A.meta }}>· {p.email} {p.phone && `· ${p.phone}`}</span>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.children.length === 0 && <span style={{ fontSize: 13, color: A.meta }}>No children added</span>}
            {p.children.map((c) => (
              <span key={c.id} style={badge(A.goldSoft, '#7A5B00')}>{c.name} ({c.category})</span>
            ))}
          </div>
        </div>
      ))}
    </AdminShell>
  );
}
