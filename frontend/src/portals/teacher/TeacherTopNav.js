import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useIsMobile from '../../useIsMobile';
import { T, initials } from './theme';

// Navy top navbar with inline tabs — matches the reference "Teacher Portal"
// artifacts exactly (brand left, tab strip, user info + logout right).
// `tabs` is [{ label, to }] for route-based tabs, or [{ label, active, onClick }]
// for in-page tab state (used inside a class workspace).
export default function TeacherTopNav({ tabs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(860);
  const [menuOpen, setMenuOpen] = useState(false);

  function renderTab(t, mobile) {
    const isLink = !!t.to;
    const content = (
      <>
        <span>{t.label}</span>
        {t.badge !== undefined && <span style={styles.badge}>{t.badge}</span>}
      </>
    );
    const style = mobile
      ? { ...styles.mobileTab, color: t.active ? T.gold : '#fff', fontWeight: t.active ? 600 : 500 }
      : {
          ...styles.tab,
          color: t.active ? '#fff' : '#8f9bb3',
          fontWeight: t.active ? 600 : 500,
          borderBottomColor: t.active ? T.gold : 'transparent'
        };
    const onClick = mobile
      ? () => { setMenuOpen(false); if (t.onClick) t.onClick(); }
      : t.onClick;
    return isLink ? (
      <Link key={t.label} to={t.to} style={{ ...style, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>{content}</Link>
    ) : (
      <div key={t.label} onClick={onClick} style={style}>{content}</div>
    );
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/teacher" style={styles.brand}>
          MyExamPapers <em style={styles.brandAccent}>· Teacher</em>
        </Link>
        {!isMobile && <div style={styles.tabs}>{tabs.map((t) => renderTab(t, false))}</div>}
      </div>

      {!isMobile && (
        <div style={styles.right}>
          {user && <span style={styles.user}>{user.name}</span>}
          {user && <div style={styles.avatar}>{initials(user.name)}</div>}
          <button style={styles.logout} onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      )}

      {isMobile && (
        <button aria-label="Menu" onClick={() => setMenuOpen((o) => !o)} style={styles.hamburgerBtn}>
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
        </button>
      )}

      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {tabs.map((t) => renderTab(t, true))}
          <div style={styles.mobileDivider} />
          {user && <div style={styles.mobileUser}>{initials(user.name)} &nbsp; {user.name}</div>}
          <button style={styles.mobileLogout} onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}>Logout</button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', background: T.navy, color: '#fff', minHeight: 64, fontFamily: T.bodyFont,
    boxSizing: 'border-box', position: 'relative', flexWrap: 'wrap'
  },
  left: { display: 'flex', alignItems: 'center', gap: 36, minHeight: 64 },
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
  logout: { padding: '6px 12px', fontSize: 12.5, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, cursor: 'pointer' },
  hamburgerBtn: {
    width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5
  },
  hamburgerBar: { width: 22, height: 2, background: '#fff', borderRadius: 2 },
  mobileMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0, background: T.navySoft,
    display: 'flex', flexDirection: 'column', padding: '8px 20px 16px', boxShadow: '0 8px 16px rgba(0,0,0,.2)', zIndex: 20
  },
  mobileTab: { padding: '12px 4px', fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.1)' },
  mobileDivider: { height: 1, background: 'rgba(255,255,255,.1)', margin: '6px 0' },
  mobileUser: { color: '#C7CEDB', fontSize: 13.5, padding: '8px 4px' },
  mobileLogout: {
    marginTop: 6, padding: '10px 14px', fontSize: 13.5, background: 'transparent', color: '#fff',
    border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, cursor: 'pointer', textAlign: 'left'
  }
};
