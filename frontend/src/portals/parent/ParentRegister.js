import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function ParentRegister() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'verify'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { registerParent } = useAuth();
  const navigate = useNavigate();

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
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
      await registerParent({ ...form, otp });
      navigate('/parent');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="auth-box">
      <div className="card">
        <h2>Parent Registration</h2>

        {step === 'details' && (
          <form onSubmit={sendOtp}>
            <label>Full Name</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
            <label>Email</label>
            <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            <label>Password</label>
            <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
            {error && <div className="error">{error}</div>}
            <button className="gold" style={{ marginTop: 16, width: '100%' }} type="submit" disabled={sending}>
              {sending ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleRegister}>
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
              Verify & Create Account
            </button>
            <button
              type="button"
              className="secondary"
              style={{ marginTop: 8, width: '100%' }}
              onClick={() => { setStep('details'); setOtp(''); setError(''); setInfo(''); }}
            >
              Change email / details
            </button>
            <p style={{ fontSize: 12, textAlign: 'center', marginTop: 10, color: 'var(--meta, #66707F)' }}>
              Didn't get it?{' '}
              <span style={{ color: 'var(--gold, #C9A227)', cursor: 'pointer', fontWeight: 600 }} onClick={sendOtp}>
                Resend code
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}