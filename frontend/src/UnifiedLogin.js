import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function UnifiedLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'verify-otp'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { loginRequest, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSending(true);
    try {
      const result = await loginRequest(email, password);
      if (result.done) {
        // Teacher / admin — no OTP step, straight into their dashboard
        navigate(`/${result.user.role}`);
      } else {
        // Parent — password was correct, but a code was just emailed
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
    <div className="auth-box">
      <div className="card">
        <h2>Sign In</h2>

        {step === 'credentials' && (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            {error && <div className="error">{error}</div>}
            <button className="gold" style={{ marginTop: 16, width: '100%' }} type="submit" disabled={sending}>
              {sending ? 'Checking...' : 'Sign In'}
            </button>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 14, textAlign: 'center' }}>
              New parent? <Link to="/register">Create an account</Link>
            </p>
          </form>
        )}

        {step === 'verify-otp' && (
          <form onSubmit={handleVerify}>
            {info && (
              <p style={{ fontSize: 13, color: 'var(--navy, #16243D)', background: 'var(--cream, #FAF6EE)', padding: 10, borderRadius: 8, marginTop: 10 }}>
                {info}
              </p>
            )}
            <label>Verification Code</label>
            <input
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
            />
            {error && <div className="error">{error}</div>}
            <button className="gold" style={{ marginTop: 16, width: '100%' }} type="submit">
              Verify & Sign In
            </button>
            <button
              type="button"
              className="secondary"
              style={{ marginTop: 8, width: '100%' }}
              onClick={() => { setStep('credentials'); setOtp(''); setError(''); setInfo(''); }}
            >
              Back
            </button>
            <p style={{ fontSize: 12, textAlign: 'center', marginTop: 10, color: 'var(--meta, #66707F)' }}>
              Didn't get it?{' '}
              <span style={{ color: 'var(--gold, #C9A227)', cursor: 'pointer', fontWeight: 600 }} onClick={resend}>
                Resend code
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}