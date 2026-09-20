import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import { NAV } from './AdminDashboard';
import { T, cardStyle, badgeStyle } from '../../theme';

export default function Parents() {
  const [parents, setParents] = useState([]);

  useEffect(() => {
    api.get('/admin/parents').then(({ data }) => setParents(data));
  }, []);

  return (
    <Shell active="parents" navItems={NAV} roleLabel="Admin">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 16px' }}>Parents</h1>
      {parents.map((p) => (
        <div key={p.id} style={cardStyle}>
          <strong>{p.name}</strong> · {p.email} {p.phone && `· ${p.phone}`}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.children.length === 0 && <span style={{ fontSize: 13, color: T.onSurfaceVariant }}>No children added</span>}
            {p.children.map((c) => (
              <span key={c.id} style={badgeStyle(T.secondaryFixed, T.onSecondaryFixed)}>{c.name} ({c.category})</span>
            ))}
          </div>
        </div>
      ))}
    </Shell>
  );
}
