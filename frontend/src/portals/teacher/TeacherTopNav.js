import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T, initials } from './theme';

// Navy top navbar with inline tabs — matches the reference "Teacher Portal"
// artifacts exactly (brand left, tab strip, user info + logout right).
// `tabs` is [{ label, to }] for route-based tabs, or [{ label, active, onClick }]
// for in-page tab state (used inside a class workspace).
export default function TeacherTopNav({ tabs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/teacher" style={styles.brand}>
          MyExamPapers <em style={styles.brandAccent}>· Teacher</em>
        </Link>
        <div style={styles.tabs}>
          {tabs.map((t) => {
            const isLink = !!t.to;
            const content = (
              <>
                <span>{t.label}</span>
                {t.badge !== undefined && <span style={styles.badge}>{t.badge}</span>}
              </>
            );
            const style = {
              ...styles.tab,
              color: t.active ? '#fff' : '#8f9bb3',
              fontWeight: t.active ? 600 : 500,
              borderBottomColor: t.active ? T.gold : 'transparent'
            };
            return isLink ? (
              <Link key={t.label} to={t.to} style={{ ...style, textDecoration: 'none' }}>{content}</Link>
            ) : (
              <div key={t.label} onClick={t.onClick} style={style}>{content}</div>
            );
          })}
        </div>
      </div>
      <div style={styles.right}>
        {user && <span style={styles.user}>{user.name}</span>}
        {user && <div style={styles.avatar}>{initials(user.name)}</div>}
        <button style={styles.logout} onClick={() => { logout(); navigate('/'); }}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', background: T.navy, color: '#fff', height: 64, fontFamily: T.bodyFont
  },
  left: { display: 'flex', alignItems: 'center', gap: 36, height: '100%' },
  brand: { fontFamily: T.headlineFont, fontWeight: 700, fontSize: 19, color: '#fff', textDecoration: 'none' },
  brandAccent: { color: T.gold, fontStyle: 'normal' },
  tabs: { display: 'flex', gap: 26, height: '100%' },
  tab: {
    display: 'flex', alignItems: 'center', gap: 8, height: '100%', cursor: 'pointer',
    fontSize: 14.5, borderBottom: '2.5px solid transparent'
  },
  badge: {
    background: T.goldSoft, color: '#7A5B00', fontSize: 11, fontWeight: 700,
    padding: '1px 8px', borderRadius: 999
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  user: { fontSize: 13, color: '#C7CEDB' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: T.gold, color: T.navy,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
  },
  logout: { padding: '6px 12px', fontSize: 12.5, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, cursor: 'pointer' }
};
