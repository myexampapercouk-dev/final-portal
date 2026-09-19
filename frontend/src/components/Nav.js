import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav({ links = [], brandSuffix = 'Portal' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        Edu Portal <em style={styles.brandAccent}>· {brandSuffix}</em>
      </div>
      <div style={styles.links}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={styles.link}>{l.label}</Link>
        ))}
      </div>
      <div style={styles.right}>
        {user && <span style={styles.user}>{user.name} ({user.role})</span>}
        {user && <div style={styles.avatar}>{initials}</div>}
        <button
          className="secondary"
          style={styles.logout}
          onClick={() => { logout(); navigate('/'); }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', padding: '16px 28px',
    background: 'var(--navy, #16243D)', color: '#fff'
  },
  brand: { fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 19, marginRight: 30 },
  brandAccent: { color: 'var(--gold, #C9A227)', fontStyle: 'normal' },
  links: { display: 'flex', gap: 20, flex: 1, fontSize: 13.5 },
  link: { color: '#C7CEDB', textDecoration: 'none' },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  user: { fontSize: 13, color: '#94a3b8' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: 'var(--gold, #C9A227)',
    color: 'var(--navy, #16243D)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 600, fontSize: 13
  },
  logout: { padding: '7px 14px', fontSize: 13, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }
};
