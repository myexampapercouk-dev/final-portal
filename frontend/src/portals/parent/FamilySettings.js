import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ParentShell from './ParentShell';
import AddChildModal from './AddChildModal';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, initials } from './theme';

export default function FamilySettings() {
  const { user } = useAuth();
  const { kids, reload } = useParent();
  const [showAddChild, setShowAddChild] = useState(false);

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Family Settings</h1>
      <p style={{ color: P.meta, marginBottom: 24 }}>Account for the {user?.name?.split(' ').slice(-1)[0] || ''} family</p>

      <SectionLabel>Parent Details</SectionLabel>
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: P.gold, color: P.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
        }}>
          {user?.name ? initials(user.name) : ''}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: P.meta }}>Primary account holder</div>
        </div>
      </div>

      <SectionLabel>Contact Information</SectionLabel>
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <Row label="Email" value={user?.email} />
        <Row label="Mobile" value={user?.phone || '—'} last />
      </div>

      <SectionLabel>Children</SectionLabel>
      <div style={{ ...cardStyle, padding: 0, marginBottom: 12 }}>
        {kids.length === 0 && <div style={{ padding: 18, color: P.meta }}>No children added yet.</div>}
        {kids.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < kids.length - 1 ? `1px solid ${P.line}` : 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: P.navy, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0
            }}>
              {initials(c.name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: P.navy }}>{c.name}</div>
              <div style={{ fontSize: 12, color: P.meta }}>{c.category}{c.target_exam ? ` · ${c.target_exam}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
      <button style={{ ...btn('secondary'), width: '100%', justifyContent: 'center', marginBottom: 24 }} onClick={() => setShowAddChild(true)}>
        + Add a child
      </button>

      {showAddChild && <AddChildModal onClose={() => setShowAddChild(false)} onAdded={() => { setShowAddChild(false); reload(); }} />}
    </ParentShell>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: P.meta, fontWeight: 600, marginBottom: 8 }}>{children}</div>;
}

function Row({ label, value, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${P.line}` }}>
      <span style={{ fontSize: 12.5, color: P.meta }}>{label}</span>
      <span style={{ fontSize: 13.5, color: P.navy, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
