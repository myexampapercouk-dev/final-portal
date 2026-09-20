import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// Same navy/gold/cream system used across Parent, Teacher and Admin.
const C = {
  navy: 'var(--navy, #16243D)',
  gold: 'var(--gold, #C9A227)',
  goldSoft: 'var(--gold-soft, #E8D9A8)',
  cream: 'var(--cream, #FAF6EE)',
  canvas: 'var(--canvas, #EEEAE0)',
  paper: 'var(--paper, #FFFFFF)',
  ink: 'var(--ink, #1D2433)',
  meta: 'var(--meta, #66707F)',
  line: 'var(--line, #E6E1D5)',
  green: 'var(--green, #2E7D5B)',
  red: 'var(--red, #B4433A)',
  redWash: 'var(--red-wash, #F9EDEC)',
  headlineFont: "'Lora', serif",
  bodyFont: "'Poppins', -apple-system, sans-serif"
};

// Matches the real category taxonomy (see AddChildModal.js / schema.sql) —
// a child's category gates which classes they can see, so this can never
// drift from the actual 6-value list.
const CATEGORIES = [
  { value: '7+', note: 'Year 2 target' },
  { value: '8+', note: 'Year 3 target' },
  { value: '9+', note: 'Year 4 target' },
  { value: '10+', note: 'Year 5 target' },
  { value: '11+', note: 'Year 6 target' },
  { value: '13+', note: 'Year 8 target' }
];

export default function ParentRegister() {
  const location = useLocation();
  const prefill = location.state || {};
  const [form, setForm] = useState({ name: prefill.name || '', email: prefill.email || '', phone: '', password: prefill.password || '', confirmPassword: '' });
  const [child, setChild] = useState({
    name: prefill.child?.name || '', dob: prefill.child?.dob || '',
    category: prefill.child?.category || '', target_exam: prefill.child?.target_exam || '', allergies: prefill.child?.allergies || ''
  });
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'verify'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { registerParent } = useAuth();
  const navigate = useNavigate();

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function updateChild(field, value) { setChild((c) => ({ ...c, [field]: value })); }

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!child.category) { setError('Select a category for your child'); return; }
    setInfo('');
    setSending(true);
    try {
      const { data } = await api.post('/auth/parent/send-otp', { email: form.email });
      setStep('verify');
      setInfo(
        data.devOtp
          ? `Dev mode — no email server configured. Your code is ${data.devOtp}`
          : `We sent a 6-digit code to ${form.email}. It expires in 10 minutes.`
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send verification code');
    } finally {
      setSending(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    try {
      await registerParent({ name: form.name, email: form.email, phone: form.phone, password: form.password, otp });
      if (child.name && child.dob && child.category) {
        try { await api.post('/children', child); } catch { /* non-fatal, parent can add it manually */ }
      }
      navigate('/parent');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
        <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: C.navy, textDecoration: 'none' }}>Already registered? Sign In</Link>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={styles.banner}>
          <span style={styles.kicker}>{'\u{1F6E1}'} Parent Gateway</span>
          <p style={{ fontSize: 12.5, color: C.meta, margin: '8px 0 0' }}>
            Category-gated class access for 7+, 8+, 9+, 10+, 11+ &amp; 13+ entrance preparation.
          </p>
        </div>

        <div style={styles.restrictedBanner}>
          <span style={{ fontSize: 22 }}>{'\u{1F512}'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>
              Self-Serve Parent Gateway
              <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', background: C.redWash, color: C.red, padding: '2px 8px', borderRadius: 6 }}>Restricted</span>
            </div>
            <p style={{ fontSize: 12.5, color: C.meta, margin: '2px 0 0' }}>
              Teachers and admins cannot self-register — those accounts are created only by an administrator.
            </p>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {step === 'details' && (
              <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Part 1: Parent credentials */}
                <Section n={1} title="Parent / Guardian Credentials" desc="Primary contact for class confirmations and invoice tracking">
                  <div style={styles.formGrid}>
                    <Field label="Full Name" required>
                      <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Eleanor Vance" style={styles.input} />
                    </Field>
                    <Field label="Email (Portal Login ID)" required>
                      <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="eleanor.vance@example.co.uk" style={styles.input} />
                    </Field>
                    <Field label="Phone (optional)">
                      <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. 07911 123456" style={styles.input} />
                    </Field>
                    <div />
                    <Field label="Password" required>
                      <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••••••" style={styles.input} />
                    </Field>
                    <Field label="Confirm Password" required>
                      <input required type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••••••" style={styles.input} />
                    </Field>
                  </div>
                </Section>

                {/* Part 2: Child profile */}
                <Section n={2} title="Initial Pupil Profile Setup" desc="Registers your first child — you can add more from the dashboard anytime">
                  <div style={styles.formGrid}>
                    <Field label="Child's Full Name" required>
                      <input required value={child.name} onChange={(e) => updateChild('name', e.target.value)} placeholder="e.g. Arthur Vance" style={styles.input} />
                    </Field>
                    <Field label="Date of Birth" required>
                      <input required type="date" value={child.dob} onChange={(e) => updateChild('dob', e.target.value)} style={styles.input} />
                    </Field>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <label style={{ ...styles.fieldLabel, marginBottom: 8, display: 'block' }}>
                      Category <span style={{ color: C.navy }}>*</span>
                      <span style={{ fontWeight: 500, color: C.meta, marginLeft: 8, fontSize: 11.5 }}>Strictly determines which classes this child can see</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                      {CATEGORIES.map((cat) => {
                        const active = child.category === cat.value;
                        return (
                          <label key={cat.value} style={{ ...styles.catCard, border: active ? `2px solid ${C.gold}` : '2px solid transparent', background: active ? C.goldSoft : C.cream }}>
                            <input type="radio" name="category" value={cat.value} checked={active} onChange={() => updateChild('category', cat.value)} style={{ display: 'none' }} />
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{cat.value}</span>
                            <span style={{ fontSize: 10.5, color: C.meta }}>{cat.note}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ ...styles.formGrid, marginTop: 16 }}>
                    <Field label="Target Exam (optional)">
                      <input value={child.target_exam} onChange={(e) => updateChild('target_exam', e.target.value)} placeholder="e.g. Westminster Under 7+" style={styles.input} />
                    </Field>
                    <Field label="Allergies / Medical Notes (optional)">
                      <input value={child.allergies} onChange={(e) => updateChild('allergies', e.target.value)} placeholder="e.g. Nuts, none" style={styles.input} />
                    </Field>
                  </div>
                </Section>

                {/* Part 3: Agreements */}
                <Section n={3} title="Operational Agreements" desc="Reflects the policies this portal actually enforces">
                  <label style={styles.agreement}>
                    <input required type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: C.navy }} />
                    <span style={{ fontSize: 12.5, color: C.meta }}>
                      I understand that classes and 1:1 sessions can only be cancelled or rescheduled at least 24 hours in advance, and that all fees are settled offline (cash or bank transfer) — the portal processes no online payments.
                    </span>
                  </label>
                </Section>

                {error && <div style={{ color: C.red, fontSize: 12.5, background: C.redWash, padding: '9px 13px', borderRadius: 8 }}>{error}</div>}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
                  <button type="submit" disabled={sending} style={styles.submitBtn}>
                    {sending ? 'Sending code...' : 'Send Verification Code'} {'→'}
                  </button>
                </div>
              </form>
            )}

            {step === 'verify' && (
              <Section n="✓" title="Verify Your Email" desc="Enter the 6-digit code to finish setting up your account">
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {info && <p style={{ fontSize: 12.5, background: C.cream, color: C.navy, padding: 10, borderRadius: 8, margin: 0 }}>{info}</p>}
                  <Field label="Verification Code" required>
                    <input required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" style={styles.input} />
                  </Field>
                  {error && <div style={{ color: C.red, fontSize: 12.5, background: C.redWash, padding: '9px 13px', borderRadius: 8 }}>{error}</div>}
                  <button type="submit" style={styles.submitBtn}>Verify &amp; Create Account</button>
                  <button type="button" onClick={() => { setStep('details'); setOtp(''); setError(''); setInfo(''); }} style={styles.secondaryBtn}>
                    Change details
                  </button>
                  <p style={{ fontSize: 12, textAlign: 'center', margin: 0, color: C.meta }}>
                    Didn't get it? <span style={{ color: C.navy, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }} onClick={sendOtp}>Resend code</span>
                  </p>
                </form>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styles.sideCard}>
              <SideHeader icon="✓" title="Why Only Parents Self-Register?" />
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SideItem text="Teacher accounts cannot be self-created — only an administrator can provision one." />
                <SideItem text="A teacher only ever sees pupils explicitly registered in their assigned classes." />
              </ul>
            </div>

            <div style={styles.sideCard}>
              <SideHeader icon="⇄" title="What Happens Next?" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Step n={1} title="Verify your email" desc="A one-time code confirms your address before your account activates." />
                <Step n={2} title="Your child is added automatically" desc="Using the details you entered above." />
                <Step n={3} title="Explore 4 dashboard tabs" desc="Upcoming Classes, Classes Attended, 1:1 Classes & Mock Exams." />
                <Step n={4} title="View invoice statements" desc="Track offline cash/bank-transfer fee records." />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Section({ n, title, desc, children }) {
  return (
    <div style={{ background: C.paper, borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(22,36,61,.06)', border: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: C.navy, color: C.gold, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
        <div>
          <h2 style={{ fontFamily: C.headlineFont, fontSize: 16.5, fontWeight: 700, margin: 0, color: C.navy }}>{title}</h2>
          <span style={{ fontSize: 12, color: C.meta }}>{desc}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={styles.fieldLabel}>{label} {required && <span style={{ color: C.navy }}>*</span>}</label>
      {children}
    </div>
  );
}

function SideHeader({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', background: C.goldSoft, color: '#7A5B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        {icon}
      </span>
      <h3 style={{ fontFamily: C.headlineFont, fontSize: 14.5, fontWeight: 700, margin: 0, color: C.navy }}>{title}</h3>
    </div>
  );
}

function SideItem({ text }) {
  return (
    <li style={{ display: 'flex', gap: 8, fontSize: 12.5, color: C.meta }}>
      <span style={{ color: C.green, flexShrink: 0, marginTop: 1 }}>{'✓'}</span>
      {text}
    </li>
  );
}

function Step({ n, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.cream, color: C.navy, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 12.5, color: C.navy }}>{title}</div>
        <div style={{ fontSize: 11.5, color: C.meta }}>{desc}</div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', borderBottom: `1px solid ${C.line}`, background: C.paper
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandMark: {
    width: 32, height: 32, borderRadius: 9, background: C.navy, color: C.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont, fontSize: 14
  },
  banner: { background: C.paper, borderRadius: 14, padding: '14px 18px', marginTop: 20, border: `1px solid ${C.line}` },
  kicker: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
    background: C.navy, color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em'
  },
  restrictedBanner: {
    display: 'flex', gap: 12, alignItems: 'flex-start', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginTop: 12
  },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(240px, 1fr)', gap: 24, marginTop: 24, alignItems: 'flex-start' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  fieldLabel: { display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 5, color: C.meta },
  input: {
    width: '100%', padding: '10px 13px', borderRadius: 10, border: `1.5px solid ${C.line}`,
    background: '#fff', fontSize: 13.5, fontFamily: C.bodyFont, boxSizing: 'border-box', color: C.navy
  },
  catCard: {
    display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 10, cursor: 'pointer'
  },
  agreement: {
    display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 12, background: C.cream, cursor: 'pointer'
  },
  submitBtn: {
    padding: '12px 22px', borderRadius: 10, border: 'none', background: C.gold, color: C.navy,
    fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8
  },
  secondaryBtn: {
    padding: '11px 0', borderRadius: 10, border: `1.5px solid ${C.line}`, background: '#fff',
    color: C.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer'
  },
  sideCard: { background: C.paper, borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(22,36,61,.06)', border: `1px solid ${C.line}` }
};
