import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { P, initials } from './theme';

const NAV = [
  { to: '/parent', label: 'Dashboard', icon: '▦', exact: true },
  { to: '/parent/upcoming', label: 'Upcoming Classes', icon: '\u{1F4C5}' },
  { to: '/parent/register', label: 'Register for Classes', icon: '\u{1F4DD}' },
  { to: '/parent/one-on-one', label: '1:1 Classes', icon: '\u{1F464}' },
  { to: '/parent/attended', label: 'Classes Attended', icon: '☑' },
  { to: '/parent/mock-exams', label: 'Mock Exams', icon: '\u{1F4C4}' },
  { to: '/parent/invoices', label: 'Invoices', icon: '\u{1F4CB}' },
  { to: '/parent/settings', label: 'Family Settings', icon: '⌂' }
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

export default function ParentShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const sidebarContent = (
    <>
      <div style={styles.brandRow}>
        <div style={styles.brandMark}>M</div>
        <div>
          <div style={{ fontFamily: P.headlineFont, fontWeight: 700, fontSize: 15, color: '#fff' }}>MyExamPapers</div>
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: P.gold, textTransform: 'uppercase' }}>Portal</div>
        </div>
        {!isDesktop && (
          <button onClick={() => setDrawerOpen(false)} style={styles.closeBtn}>&times;</button>
        )}
      </div>
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((n) => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              style={{
                ...styles.navItem,
                background: active ? P.gold : 'transparent',
                color: active ? P.navy : '#C7CEDB',
                fontWeight: active ? 700 : 500
              }}
            >
              <span style={{ width: 18, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div style={styles.userRow}>
        <div style={styles.avatar}>{user?.name ? initials(user.name) : ''}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#8B96A8' }}>Parent account</div>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} style={styles.logoutBtn}>Logout</button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: P.canvas, fontFamily: P.bodyFont }}>
      <header style={styles.header}>
        {!isDesktop && (
          <button onClick={() => setDrawerOpen(true)} style={styles.hamburger} aria-label="Open menu">
            <span style={styles.hamburgerBar} /><span style={styles.hamburgerBar} /><span style={styles.hamburgerBar} />
          </button>
        )}
        <Link to="/parent" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ ...styles.brandMark, width: 28, height: 28, fontSize: 12 }}>M</div>
          <span style={{ fontFamily: P.headlineFont, fontWeight: 700, color: P.navy, fontSize: 15 }}>
            MyExamPapers <em style={{ color: P.gold, fontStyle: 'normal', fontFamily: P.bodyFont, fontSize: 12 }}>· Portal</em>
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={styles.avatarSm}>{user?.name ? initials(user.name) : ''}</div>
      </header>

      {isDesktop ? (
        <aside style={styles.sidebarDesktop}>{sidebarContent}</aside>
      ) : (
        drawerOpen && (
          <>
            <div style={styles.backdrop} onClick={() => setDrawerOpen(false)} />
            <aside style={styles.sidebarDrawer}>{sidebarContent}</aside>
          </>
        )
      )}

      <div style={{ marginLeft: isDesktop ? 260 : 0, paddingTop: 60 }}>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 50,
    background: '#fff', borderBottom: `1px solid var(--line, #E6E1D5)`,
    display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px'
  },
  hamburger: { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 },
  hamburgerBar: { width: 20, height: 2, background: P.navy, borderRadius: 2 },
  brandMark: {
    width: 32, height: 32, borderRadius: 8, background: P.navy, color: P.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: P.headlineFont, flexShrink: 0
  },
  avatarSm: {
    width: 30, height: 30, borderRadius: '50%', background: P.gold, color: P.navy,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
  },
  sidebarDesktop: {
    position: 'fixed', left: 0, top: 60, bottom: 0, width: 260, background: P.navy,
    display: 'flex', flexDirection: 'column', zIndex: 40
  },
  sidebarDrawer: {
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, background: P.navy,
    display: 'flex', flexDirection: 'column', zIndex: 70, boxShadow: '4px 0 24px rgba(0,0,0,.2)'
  },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(22,36,61,.5)', zIndex: 60 },
  brandRow: { display: 'flex', alignItems: 'center', gap: 10, padding: 18, position: 'relative' },
  closeBtn: { position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
    textDecoration: 'none', fontSize: 13.5
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderTop: '1px solid rgba(255,255,255,.1)' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: P.gold, color: P.navy,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0
  },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 11, padding: '5px 9px', borderRadius: 8, cursor: 'pointer' }
};
