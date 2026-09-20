import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const C = {
  primary: '#9b005f',
  primaryContainer: '#c2187a',
  primaryFixed: '#ffd9e5',
  onPrimaryFixed: '#3d0023',
  secondary: '#006398',
  secondaryFixed: '#cce5ff',
  onSecondaryFixed: '#001d31',
  tertiary: '#005c25',
  tertiaryFixed: '#7ffc97',
  onTertiaryFixed: '#002109',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  surface: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  onSurface: '#131b2e',
  onSurfaceVariant: '#584049',
  outlineVariant: '#debec9',
  headlineFont: "'Plus Jakarta Sans', -apple-system, sans-serif",
  bodyFont: "'Inter', -apple-system, sans-serif"
};

// Purely presentational — reflects the real, already-implemented rules
// (see backend/src/routes/registrations.js, oneOnOne.js, invoices.js).
// No fabricated certifications or claims the app doesn't actually do.
const PROTOCOLS = [
  { icon: 'visibility', bg: C.secondaryFixed, fg: C.secondary, title: 'Category-Driven Visibility',
    desc: 'A child only ever sees classes matching their assigned category (7+, 8+, 9+, 10+, 11+ or 13+).' },
  { icon: 'alarm_on', bg: C.errorContainer, fg: C.error, title: 'Strict 24h Rescheduling',
    desc: 'Lesson cancellations or 1:1 adjustments must be made at least 24 hours before the session starts.' },
  { icon: 'payments', bg: C.surfaceContainerHigh, fg: C.onSurface, title: 'Cash-Only Ledger Accounting',
    desc: 'Consolidated family invoices are informational records for offline cash settlement — no online payments are processed.' }
];

const ROLE_COPY = {
  parent: {
    badge: 'Parent Access', badgeBg: C.primary,
    heading: 'Parent Portal Sign In',
    desc: 'Enter your registered family credentials to view lesson progress and manage pupil registers.',
    label: 'Parent Email',
    placeholder: 'e.g. eleanor.davies@example.co.uk',
    cta: 'Sign In to Parent Portal',
    ctaBg: C.primary
  },
  teacher: {
    badge: 'Educator Gateway', badgeBg: C.secondary,
    heading: 'Teacher Portal Sign In',
    desc: 'Access your assigned class rosters, log pupil attendance, and record feedback.',
    label: 'Educator Email',
    placeholder: 'e.g. m.hargreaves@myexampapers.co.uk',
    cta: 'Sign In to Teacher Portal',
    ctaBg: C.secondary
  },
  admin: {
    badge: 'Governance Terminal', badgeBg: '#283044',
    heading: 'Admin Portal Sign In',
    desc: 'Central administrator authentication for course provisioning, tutor management, and invoicing.',
    label: 'Admin Email',
    placeholder: 'e.g. admin@myexampapers.co.uk',
    cta: 'Sign In to Admin Portal',
    ctaBg: '#283044'
  }
};

const ROLE_CARDS = [
  { key: 'parent', icon: 'family_restroom', bg: C.primaryFixed, fg: C.onPrimaryFixed, title: 'Parent Portal', tag: 'Self-Serve & Families', tagColor: C.primary,
    desc: 'Pupil progression, lesson registers, 1:1 bookings, and offline cash fee records.', foot: 'Self-Serve Allowed', footColor: C.tertiary },
  { key: 'teacher', icon: 'history_edu', bg: C.secondaryFixed, fg: C.secondary, title: 'Teacher Portal', tag: 'Vetted Educators', tagColor: C.secondary,
    desc: 'Assigned class rosters, present-only attendance, feedback, and 1:1 scheduling.', foot: 'Admin-Provisioned', footColor: C.onSurfaceVariant },
  { key: 'admin', icon: 'admin_panel_settings', bg: C.surfaceContainerHigh, fg: C.onSurface, title: 'Admin Portal', tag: 'Academic Governance', tagColor: C.onSurface,
    desc: 'Tutor management, course setup, cash invoice generation.', foot: 'Internal Access Only', footColor: C.onSurfaceVariant }
];

export default function UnifiedLogin() {
  const [role, setRole] = useState('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'verify-otp'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { loginRequest, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const copy = ROLE_COPY[role];

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
    <div style={{ fontFamily: C.bodyFont, color: C.onSurface, background: C.surface, minHeight: '100vh' }}>
      <header style={styles.header}>
        <Link to="/" style={styles.brand}>
          <div style={styles.brandMark}>M</div>
          <span style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 17, color: C.primary }}>My Exam Papers</span>
        </Link>
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: C.onSurfaceVariant, textDecoration: 'none' }}>← Back to home</Link>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        <section style={styles.banner}>
          <div style={{ maxWidth: 640 }}>
            <span style={styles.kicker}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary }} />
              Unified Academic Gateway
            </span>
            <h1 style={{ fontFamily: C.headlineFont, fontSize: 28, fontWeight: 700, margin: '10px 0 8px', letterSpacing: '-.01em' }}>
              Institutional Access &amp; Sign In
            </h1>
            <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: 0 }}>
              Select your role to authenticate. Pupil registers, class rosters, and billing are strictly separated by portal.
            </p>
          </div>
        </section>

        <div style={styles.grid}>
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
                        boxShadow: active ? '0 4px 14px rgba(15,23,42,.1)' : '0 1px 3px rgba(15,23,42,.05)',
                        border: active ? `2px solid ${r.tagColor}` : '2px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ ...styles.iconBox, background: r.bg, color: r.fg }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{r.icon}</span>
                        </span>
                        <span className="material-symbols-outlined" style={{ color: active ? r.tagColor : '#c7ccd6', fontSize: 20 }}>
                          {active ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: C.headlineFont, fontSize: 15, fontWeight: 700, margin: '10px 0 2px' }}>{r.title}</h3>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: r.tagColor }}>{r.tag}</span>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '6px 0 10px' }}>{r.desc}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.onSurfaceVariant, background: C.surfaceContainer, padding: '3px 9px', borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.footColor }} />
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
                    <span style={{ ...styles.iconBox, background: p.bg, color: p.fg, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{p.icon}</span>
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</div>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '3px 0 0' }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: auth terminal */}
          <div style={styles.terminal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ ...styles.badge, background: copy.badgeBg }}>{copy.badge}</span>
            </div>
            <h2 style={{ fontFamily: C.headlineFont, fontSize: 21, fontWeight: 700, margin: '10px 0 4px' }}>{copy.heading}</h2>
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '0 0 20px' }}>{copy.desc}</p>

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
                      <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                {error && <div style={{ color: C.error, fontSize: 12.5, background: C.errorContainer, padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
                <button type="submit" disabled={sending} style={{ ...styles.submitBtn, background: copy.ctaBg }}>
                  {sending ? 'Checking...' : copy.cta} <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </form>
            )}

            {step === 'verify-otp' && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {info && <p style={{ fontSize: 12.5, color: C.onSurface, background: C.surfaceContainerLow, padding: 10, borderRadius: 8, margin: 0 }}>{info}</p>}
                <div>
                  <label style={styles.label}>Verification Code</label>
                  <input
                    required maxLength={6} value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code" style={styles.input}
                  />
                </div>
                {error && <div style={{ color: C.error, fontSize: 12.5, background: C.errorContainer, padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
                <button type="submit" style={{ ...styles.submitBtn, background: copy.ctaBg }}>Verify &amp; Sign In</button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtp(''); setError(''); setInfo(''); }}
                  style={styles.secondaryBtn}
                >
                  Back
                </button>
                <p style={{ fontSize: 12, textAlign: 'center', margin: 0, color: C.onSurfaceVariant }}>
                  Didn't get it?{' '}
                  <span style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }} onClick={resend}>Resend code</span>
                </p>
              </form>
            )}

            <div style={{ marginTop: 20, borderTop: `1px solid ${C.surfaceContainerHigh}`, paddingTop: 16 }}>
              {role === 'parent' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: C.surfaceContainerLow, gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>New Prep School Family?</div>
                    <div style={{ fontSize: 12, color: C.onSurfaceVariant }}>Register to add your child and book classes</div>
                  </div>
                  <Link to="/register" style={{ ...styles.submitBtnSmall, background: C.surfaceContainerLowest, color: C.primary }}>Create Account</Link>
                </div>
              )}
              {role === 'teacher' && (
                <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
                  Teacher accounts are created directly by an administrator — there is no self-registration for this role.
                </p>
              )}
              {role === 'admin' && (
                <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
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
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', borderBottom: `1px solid ${C.surfaceContainerHigh}`, background: C.surfaceContainerLowest
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandMark: {
    width: 32, height: 32, borderRadius: 9, background: C.primaryContainer, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont, fontSize: 14
  },
  banner: {
    background: C.surfaceContainerLowest, borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,.05)', marginBottom: 24
  },
  kicker: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999,
    background: C.primaryFixed, color: C.onPrimaryFixed, fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em'
  },
  kickerSmall: { fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: C.onSurfaceVariant },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 28, alignItems: 'flex-start' },
  roleCard: {
    textAlign: 'left', padding: 16, borderRadius: 14, cursor: 'pointer', background: C.surfaceContainerLowest,
    fontFamily: C.bodyFont, display: 'flex', flexDirection: 'column'
  },
  iconBox: { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  protocolCard: {
    display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: C.surfaceContainerLowest, boxShadow: '0 1px 3px rgba(15,23,42,.05)'
  },
  terminal: {
    background: C.surfaceContainerLowest, borderRadius: 18, padding: 26, boxShadow: '0 10px 30px rgba(15,23,42,.08)'
  },
  badge: { fontSize: 11, fontWeight: 700, color: '#fff', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.04em' },
  label: { display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.outlineVariant}99`,
    background: C.surfaceContainerLow, fontSize: 13.5, fontFamily: C.bodyFont, boxSizing: 'border-box'
  },
  eyeBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, display: 'flex'
  },
  submitBtn: {
    padding: '13px 0', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
  },
  submitBtnSmall: {
    padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(15,23,42,.08)'
  },
  secondaryBtn: {
    padding: '11px 0', borderRadius: 10, border: `1px solid ${C.outlineVariant}99`, background: '#fff',
    color: C.onSurface, fontWeight: 600, fontSize: 13, cursor: 'pointer'
  }
};
