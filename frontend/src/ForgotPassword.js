import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/axios';

const C = {
  navy: 'var(--navy, #16243D)', gold: 'var(--gold, #C9A227)', cream: 'var(--cream, #FAF6EE)',
  canvas: 'var(--canvas, #EEEAE0)', paper: 'var(--paper, #FFFFFF)', ink: 'var(--ink, #1D2433)',
  meta: 'var(--meta, #66707F)', line: 'var(--line, #E6E1D5)', green: 'var(--green, #2E7D5B)',
  greenWash: 'var(--green-wash, #EAF4EF)', red: 'var(--red, #B4433A)', redWash: 'var(--red-wash, #F9EDEC)',
  headlineFont: "'Lora', serif", bodyFont: "'Poppins', -apple-system, sans-serif"
};

// Shared look for the small "forgot / reset password" pages
export function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{ fontFamily: C.bodyFont, color: C.ink, background: C.canvas, minHeight: '100vh' }}>
      <header style={{ minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${C.line}`, background: C.paper, boxSizing: 'border-box' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.navy, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont, fontSize: 14 }}>M</div>
          <span style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 17, color: C.navy }}>
            MyExamPapers <em style={{ color: C.gold, fontStyle: 'normal', fontFamily: C.bodyFont, fontSize: 12 }}>· Portal</em>
          </span>
        </Link>
        <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: C.meta, textDecoration: 'none' }}>← Back to sign in</Link>
      </header>
      <main style={{ maxWidth: 460, margin: '0 auto', padding: '40px 16px 60px' }}>
        <div style={{ background: C.paper, borderRadius: 18, padding: 26, boxShadow: '0 10px 30px rgba(22,36,61,.1)', border: `1px solid ${C.line}` }}>
          <h1 style={{ fontFamily: C.headlineFont, fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: C.navy }}>{title}</h1>
          <p style={{ fontSize: 13, color: C.meta, margin: '0 0 20px' }}>{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

export const authStyles = {
  label: { display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, color: C.meta },
  input: { width: '100%', padding: '11px 14px', border: `1.5px solid ${C.line}`, borderRadius: 10, fontFamily: C.bodyFont, fontSize: 14, color: C.navy, background: '#fff', boxSizing: 'border-box' },
  button: { width: '100%', padding: '13px 0', border: 'none', borderRadius: 12, background: C.gold, color: C.navy, fontWeight: 700, fontSize: 15, fontFamily: C.bodyFont, cursor: 'pointer' },
  error: { color: C.red, fontSize: 12.5, background: C.redWash, padding: '8px 12px', borderRadius: 8 },
  success: { color: C.green, fontSize: 13, background: C.greenWash, padding: '12px 14px', borderRadius: 8 }
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter the email you use to sign in as a parent or teacher and we will send you a link to choose a new password.">
      {done ? (
        <div style={authStyles.success}>
          If that email belongs to a parent or teacher account, a reset link is on its way. It works once and expires in 1 hour. Check your spam folder if it does not arrive.
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={authStyles.label}>Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={authStyles.input} />
          </div>
          {error && <div style={authStyles.error}>{error}</div>}
          <button type="submit" disabled={sending} style={authStyles.button}>{sending ? 'Sending...' : 'Send reset link'}</button>
        </form>
      )}
    </AuthCard>
  );
}
