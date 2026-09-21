import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import useIsMobile from './useIsMobile';

// Same navy/gold/cream system used across Parent, Teacher and Admin.
const C = {
  navy: 'var(--navy, #16243D)',
  navySoft: 'var(--navy-soft, #233754)',
  gold: 'var(--gold, #C9A227)',
  goldSoft: 'var(--gold-soft, #E8D9A8)',
  cream: 'var(--cream, #FAF6EE)',
  canvas: 'var(--canvas, #EEEAE0)',
  paper: 'var(--paper, #FFFFFF)',
  ink: 'var(--ink, #1D2433)',
  meta: 'var(--meta, #66707F)',
  line: 'var(--line, #E6E1D5)',
  green: 'var(--green, #2E7D5B)',
  greenWash: 'var(--green-wash, #EAF4EF)',
  red: 'var(--red, #B4433A)',
  redWash: 'var(--red-wash, #F9EDEC)',
  headlineFont: "'Lora', serif",
  bodyFont: "'Poppins', -apple-system, sans-serif"
};

// Purely presentational — reflects the real, already-implemented rules
// (see backend/src/routes/registrations.js, oneOnOne.js, invoices.js).
// No fabricated certifications or claims the app doesn't actually do.
const PROTOCOLS = [
  { icon: '\u{1F441}', title: 'Category-Driven Visibility',
    desc: 'A child only ever sees classes matching their assigned category (7+, 8+, 9+, 10+, 11+ or 13+).' },
  { icon: '⏰', title: 'Strict 24h Rescheduling',
    desc: 'Lesson cancellations or 1:1 adjustments must be made at least 24 hours before the session starts.' },
  { icon: '\u{1F4B5}', title: 'Cash-Only Ledger Accounting',
    desc: 'Consolidated family invoices are informational records for offline cash settlement — no online payments are processed.' }
];

const ROLE_COPY = {
  parent: {
    badge: 'Parent Access',
    heading: 'Parent Portal Sign In',
    desc: 'Enter your registered family credentials to view lesson progress and manage pupil registers.',
    label: 'Parent Email',
    placeholder: 'e.g. eleanor.davies@example.co.uk',
    cta: 'Sign In to Parent Portal'
  },
  teacher: {
    badge: 'Educator Gateway',
    heading: 'Teacher Portal Sign In',
    desc: 'Access your assigned class rosters, log pupil attendance, and record feedback.',
    label: 'Educator Email',
    placeholder: 'e.g. m.hargreaves@myexampapers.co.uk',
    cta: 'Sign In to Teacher Portal'
  },
  admin: {
    badge: 'Governance Terminal',
    heading: 'Admin Portal Sign In',
    desc: 'Central administrator authentication for course provisioning, tutor management, and invoicing.',
    label: 'Admin Email',
    placeholder: 'e.g. admin@myexampapers.co.uk',
    cta: 'Sign In to Admin Portal'
  }
};

const ROLE_CARDS = [
  { key: 'parent', icon: '\u{1F46A}', title: 'Parent Portal', tag: 'Self-Serve & Families',
    desc: 'Pupil progression, lesson registers, 1:1 bookings, and offline cash fee records.', foot: 'Self-Serve Allowed' },
  { key: 'teacher', icon: '\u{1F393}', title: 'Teacher Portal', tag: 'Vetted Educators',
    desc: 'Assigned class rosters, present-only attendance, feedback, and 1:1 scheduling.', foot: 'Admin-Provisioned' },
  { key: 'admin', icon: '⚙', title: 'Admin Portal', tag: 'Academic Governance',
    desc: 'Tutor management, course setup, cash invoice generation.', foot: 'Internal Access Only' }
];

const VALID_ROLES = ['parent', 'teacher', 'admin'];

export default function UnifiedLogin() {
  const isMobile = useIsMobile(900);
  const location = useLocation();
  const preselectedRole = VALID_ROLES.includes(location.state?.role) ? location.state.role : 'parent';
  const [role, setRole] = useState(preselectedRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'verify-otp'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { user, loginRequest, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const copy = ROLE_COPY[role];

  // Already signed in (e.g. someone edits the URL to /login while logged
  // in) - send them straight to their own portal instead of showing the
  // login form again.
  if (user) return <Navigate to={`/${user.role}`} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSending(true);
    try {
      const result = await loginRequest(email, password);
      if (result.done) {
        navigate(`/${result.user.role}`);
      } else {
        setStep('verify-otp');
        setInfo(
          result.devOtp
            ? `Dev mode — no email server configured. Your code is ${result.devOtp}`
            : (result.message || `We sent a 6-digit code to ${email}`)
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await verifyLoginOtp(email, otp);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    try {
      const result = await loginRequest(email, password);
      if (!result.done) {
        setInfo(result.devOtp ? `Dev mode — new code is ${result.devOtp}` : 'A new code has been sent.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend code');
    }
  }

  return (
    <div style={{ fontFamily: C.bodyFont, color: C.ink, background: C.canvas, minHeight: '100vh' }}>
      <header style={styles.header}>
        <Link to="/" style={styles.brand}>
          <div style={styles.brandMark}>M</div>
          <span style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 17, color: C.navy }}>
            MyExamPapers <em style={{ color: C.gold, fontStyle: 'normal', fontFamily: C.bodyFont, fontSize: 12 }}>· Portal</em>
          </span>
        </Link>
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: C.meta, textDecoration: 'none' }}>← Back to home</Link>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 50px' : '32px 24px 60px' }}>
        <section style={styles.banner}>
          <div style={{ maxWidth: 640 }}>
            <span style={styles.kicker}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
              Unified Academic Gateway
            </span>
            <h1 style={{ fontFamily: C.headlineFont, fontSize: 28, fontWeight: 700, margin: '10px 0 8px', letterSpacing: '-.01em', color: C.navy }}>
              Institutional Access &amp; Sign In
            </h1>
            <p style={{ fontSize: 14, color: C.meta, margin: 0 }}>
              Select your role to authenticate. Pupil registers, class rosters, and billing are strictly separated by portal.
            </p>
          </div>
        </section>

        <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : styles.grid.gridTemplateColumns }}>
          {/* Left: role selector + protocols */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <span style={styles.kickerSmall}>Step 1 · Select your portal</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 10 }}>
                {ROLE_CARDS.map((r) => {
                  const active = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      style={{
                        ...styles.roleCard,
                        boxShadow: active ? '0 4px 14px rgba(22,36,61,.12)' : '0 1px 3px rgba(22,36,61,.06)',
                        border: active ? `2px solid ${C.navy}` : '2px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={styles.iconBox}>{r.icon}</span>
                        <span style={{ color: active ? C.gold : '#c7ccd6', fontSize: 18 }}>{active ? '✓' : '○'}</span>
                      </div>
                      <h3 style={{ fontFamily: C.headlineFont, fontSize: 15, fontWeight: 700, margin: '10px 0 2px', color: C.navy }}>{r.title}</h3>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.04em' }}>{r.tag}</span>
                      <p style={{ fontSize: 12, color: C.meta, margin: '6px 0 10px' }}>{r.desc}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.meta, background: C.cream, padding: '3px 9px', borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                        {r.foot}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span style={styles.kickerSmall}>Operational Protocols</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
                {PROTOCOLS.map((p) => (
                  <div key={p.title} style={styles.protocolCard}>
                    <span style={{ ...styles.iconBox, flexShrink: 0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: C.navy }}>{p.title}</div>
                      <p style={{ fontSize: 12, color: C.meta, margin: '3px 0 0' }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: auth terminal */}
          <div style={styles.terminal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={styles.badge}>{copy.badge}</span>
            </div>
            <h2 style={{ fontFamily: C.headlineFont, fontSize: 21, fontWeight: 700, margin: '10px 0 4px', color: C.navy }}>{copy.heading}</h2>
            <p style={{ fontSize: 13, color: C.meta, margin: '0 0 20px' }}>{copy.desc}</p>

            {step === 'credentials' && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={styles.label}>{copy.label}</label>
                  <input
                    required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.placeholder} style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••"
                      style={{ ...styles.input, paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
                      {showPassword ? '\u{1F648}' : '\u{1F441}'}
                    </button>
                  </div>
                </div>
                {error && <div style={{ color: C.red, fontSize: 12.5, background: C.redWash, padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
                <button type="submit" disabled={sending} style={styles.submitBtn}>
                  {sending ? 'Checking...' : copy.cta} {'→'}
                </button>
              </form>
            )}

            {step === 'verify-otp' && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {info && <p style={{ fontSize: 12.5, color: C.navy, background: C.cream, padding: 10, borderRadius: 8, margin: 0 }}>{info}</p>}
                <div>
                  <label style={styles.label}>Verification Code</label>
                  <input
                    required maxLength={6} value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code" style={styles.input}
                  />
                </div>
                {error && <div style={{ color: C.red, fontSize: 12.5, background: C.redWash, padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
                <button type="submit" style={styles.submitBtn}>Verify &amp; Sign In</button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtp(''); setError(''); setInfo(''); }}
                  style={styles.secondaryBtn}
                >
                  Back
                </button>
                <p style={{ fontSize: 12, textAlign: 'center', margin: 0, color: C.meta }}>
                  Didn't get it?{' '}
                  <span style={{ color: C.navy, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }} onClick={resend}>Resend code</span>
                </p>
              </form>
            )}

            <div style={{ marginTop: 20, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
              {role === 'parent' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: C.cream, gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>New Prep School Family?</div>
                    <div style={{ fontSize: 12, color: C.meta }}>Register to add your child and book classes</div>
                  </div>
                  <Link to="/register" style={styles.submitBtnSmall}>Create Account</Link>
                </div>
              )}
              {role === 'teacher' && (
                <p style={{ fontSize: 12, color: C.meta, margin: 0 }}>
                  Teacher accounts are created directly by an administrator — there is no self-registration for this role.
                </p>
              )}
              {role === 'admin' && (
                <p style={{ fontSize: 12, color: C.meta, margin: 0 }}>
                  Admin accounts are provisioned internally and are not available for self-registration.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  header: {
    minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: `1px solid ${C.line}`, background: C.paper, gap: 12, flexWrap: 'wrap', boxSizing: 'border-box'
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandMark: {
    width: 32, height: 32, borderRadius: 9, background: C.navy, color: C.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont, fontSize: 14
  },
  banner: {
    background: C.paper, borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(22,36,61,.06)', marginBottom: 24, border: `1px solid ${C.line}`
  },
  kicker: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999,
    background: C.goldSoft, color: '#7A5B00', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em'
  },
  kickerSmall: { fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.meta },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 28, alignItems: 'flex-start' },
  roleCard: {
    textAlign: 'left', padding: 16, borderRadius: 14, cursor: 'pointer', background: C.paper,
    fontFamily: C.bodyFont, display: 'flex', flexDirection: 'column'
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: C.goldSoft, fontSize: 16
  },
  protocolCard: {
    display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: C.paper, boxShadow: '0 1px 3px rgba(22,36,61,.06)', border: `1px solid ${C.line}`
  },
  terminal: {
    background: C.paper, borderRadius: 18, padding: 26, boxShadow: '0 10px 30px rgba(22,36,61,.1)', border: `1px solid ${C.line}`
  },
  badge: { fontSize: 11, fontWeight: 700, color: '#fff', background: C.navy, padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.04em' },
  label: { display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, color: C.meta },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.line}`,
    background: '#fff', fontSize: 13.5, fontFamily: C.bodyFont, boxSizing: 'border-box', color: C.navy
  },
  eyeBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, display: 'flex', fontSize: 16
  },
  submitBtn: {
    padding: '13px 0', borderRadius: 10, border: 'none', background: C.gold, color: C.navy, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  submitBtnSmall: {
    padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(22,36,61,.08)', background: '#fff', color: C.navy, border: `1px solid ${C.line}`
  },
  secondaryBtn: {
    padding: '11px 0', borderRadius: 10, border: `1.5px solid ${C.line}`, background: '#fff',
    color: C.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer'
  }
};
