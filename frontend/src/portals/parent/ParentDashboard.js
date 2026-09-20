import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import AddChildModal from './AddChildModal';
import { T, initials, btnStyle } from '../../theme';

const NAV = [
  { key: 'dashboard', to: '/parent', label: 'Main Dashboard', icon: 'family_restroom' },
  { key: 'invoices', to: '/parent/invoices', label: 'Invoices', icon: 'receipt_long' }
];

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChildren(); }, []);

  async function loadChildren() {
    setLoading(true);
    const { data } = await api.get('/children');
    setChildren(data);
    setLoading(false);
  }

  return (
    <Shell active="dashboard" navItems={NAV} roleLabel="Parent">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: 0 }}>My Children</h1>
        <button style={btnStyle('primary')} onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Add Child
        </button>
      </div>

      {loading && <p style={{ color: T.onSurfaceVariant }}>Loading...</p>}
      {!loading && children.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No children added yet.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {children.map((c) => (
          <Link key={c.id} to={`/parent/child/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: T.primaryFixed, color: T.onPrimaryFixed,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: T.headlineFont, flexShrink: 0
                }}>
                  {initials(c.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.onSurface }}>{c.name}</div>
                  <span style={{ background: T.secondaryFixed, color: T.onSecondaryFixed, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>{c.category}</span>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: T.onSurfaceVariant, margin: 0 }}>
                DOB: {c.dob}<br />
                Target: {c.target_exam || '—'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <AddChildModal
          onClose={() => setShowModal(false)}
          onAdded={(child) => setChildren((prev) => [child, ...prev])}
        />
      )}
    </Shell>
  );
}
