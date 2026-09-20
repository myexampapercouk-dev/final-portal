import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T } from './theme';

const NAV = [
  { key: 'classes', to: '/teacher', label: 'My Classes', icon: 'groups' },
  { key: 'one-on-one', to: '/teacher/one-on-one', label: '1:1 Sessions', icon: 'person_search' }
];

export default function TeacherShell({ active, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: T.bodyFont }}>
      <header style={styles.header}>
        <Link to="/teacher" style={styles.brandLink}>
          <div style={styles.brandMark}>M</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontFamily: T.headlineFont, fontWeight: 700, fontSize: 18, color: T.primary }}>My Exam Papers</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.08em', color: T.secondary, textTransform: 'uppercase' }}>The School Specialist</span>
          </div>
        </Link>
        <div style={styles.headerRight}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.onSurface }}>{user?.name}</span>
            <span style={{ fontSize: 11, color: T.onSurfaceVariant }}>Teacher</span>
          </div>
          <div style={styles.avatar}>{initials}</div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </header>

      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <span className="material-symbols-outlined" style={{ color: T.secondary, fontSize: 22 }}>school</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.onSurface }}>Teacher Console</div>
            <div style={{ fontSize: 11, color: T.onSurfaceVariant }}>Exam Prep Cohort</div>
          </div>
        </div>
        <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((n) => {
            const isActive = active === n.key;
            return (
              <Link
                key={n.key}
                to={n.to}
                style={{
                  ...styles.navItem,
                  background: isActive ? T.primaryContainer : 'transparent',
                  color: isActive ? '#fff' : T.onSurfaceVariant,
                  fontWeight: isActive ? 700 : 500
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div style={{ marginLeft: 260, paddingTop: 64 }}>
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 50,
    background: T.surfaceContainerLowest, borderBottom: `1px solid ${T.surfaceContainerHighest}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px'
  },
  brandLink: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandMark: {
    width: 36, height: 36, borderRadius: 10, background: T.primaryContainer, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: T.headlineFont
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: T.primaryFixed, color: T.onPrimaryFixed,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
  },
  logoutBtn: {
    padding: '7px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
    background: T.surfaceContainerHigh, color: T.onSurface, border: 'none'
  },
  sidebar: {
    position: 'fixed', left: 0, top: 64, bottom: 0, width: 260, zIndex: 40,
    background: T.surfaceContainerLowest, borderRight: `1px solid ${T.surfaceContainerHighest}`,
    display: 'flex', flexDirection: 'column'
  },
  sidebarTop: {
    display: 'flex', alignItems: 'center', gap: 10, margin: 16, padding: 12,
    background: T.surfaceContainerLow, borderRadius: 12, border: `1px solid ${T.surfaceContainerHighest}`
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
    textDecoration: 'none', fontSize: 14
  }
};
