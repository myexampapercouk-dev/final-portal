import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Register', 'Feedback', 'Materials', '1:1'];

export default function TeacherClassNav({ tab, setTab }) {
  const { user, logout } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/teacher" style={styles.brand}>
          Edu Portal <em style={styles.brandAccent}>· Teacher</em>
        </Link>
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                color: tab === t ? '#fff' : '#8f9bb3',
                fontWeight: tab === t ? 600 : 500,
                borderBottomColor: tab === t ? 'var(--gold, #C9A227)' : 'transparent'
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.right}>
        {user && <span style={styles.user}>{user.name}</span>}
        {user && <div style={styles.avatar}>{initials}</div>}
        <button className="secondary" style={styles.logout} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', background: 'var(--navy, #16243D)', color: '#fff', height: 64
  },
  left: { display: 'flex', alignItems: 'center', gap: 36, height: '100%' },
  brand: { fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 19, color: '#fff', textDecoration: 'none' },
  brandAccent: { color: 'var(--gold, #C9A227)', fontStyle: 'normal' },
  tabs: { display: 'flex', gap: 26, height: '100%' },
  tab: {
    display: 'flex', alignItems: 'center', height: '100%', cursor: 'pointer',
    fontSize: 14.5, borderBottom: '2.5px solid transparent'
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  user: { fontSize: 13, color: '#C7CEDB' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--gold, #C9A227)',
    color: 'var(--navy, #16243D)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: 13
  },
  logout: { padding: '6px 12px', fontSize: 12.5, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }
};
