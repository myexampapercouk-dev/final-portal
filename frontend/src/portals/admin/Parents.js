import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, badge, labelStyle, inputStyle } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

export default function Parents() {
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [onlyWithChildren, setOnlyWithChildren] = useState(false);

  useEffect(() => {
    api.get('/admin/parents').then(({ data }) => setParents(data));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parents.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
      if (category && !p.children.some((c) => c.category === category)) return false;
      if (onlyWithChildren && p.children.length === 0) return false;
      return true;
    });
  }, [parents, search, category, onlyWithChildren]);

  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 4px' }}>Parents</h1>
      <p style={{ color: A.meta, marginBottom: 18 }}>{filtered.length} of {parents.length} parent{parents.length === 1 ? '' : 's'}</p>

      <div style={{ ...cardStyle, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Search</label>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: '0 1 180px' }}>
          <label style={labelStyle}>Child Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.navy, marginBottom: 2, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyWithChildren} onChange={(e) => setOnlyWithChildren(e.target.checked)} style={{ width: 'auto' }} />
          Has children only
        </label>
        {(search || category || onlyWithChildren) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setCategory(''); setOnlyWithChildren(false); }}
            style={{ background: 'none', border: 'none', color: A.meta, fontSize: 12.5, textDecoration: 'underline', cursor: 'pointer', marginBottom: 2 }}
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 && <p style={{ color: A.meta }}>No parents match these filters.</p>}
      {filtered.map((p) => (
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
