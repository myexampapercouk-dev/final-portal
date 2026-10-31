import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from './api/axios';
import { AuthCard, authStyles } from './ForgotPassword';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('The two passwords do not match'); return; }
    setSaving(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset your password. Please request a new link.');
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset link missing" subtitle="This page needs the link from your reset email.">
        <Link to="/forgot-password" style={{ color: 'var(--navy, #16243D)', fontWeight: 600 }}>Request a new reset link</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 8 characters. You will use it to sign in from now on.">
      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={authStyles.success}>Your password has been changed.</div>
          <Link to="/login" style={{ ...authStyles.button, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', display: 'block', lineHeight: '1.2', padding: '14px 0' }}>Go to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={authStyles.label}>New password</label>
            <input required type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={authStyles.input} />
          </div>
          <div>
            <label style={authStyles.label}>Confirm new password</label>
            <input required type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} style={authStyles.input} />
          </div>
          <label style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--meta, #66707F)' }}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ width: 'auto', flex: 'none', margin: 0 }} /> Show passwords
          </label>
          {error && <div style={authStyles.error}>{error}</div>}
          <button type="submit" disabled={saving} style={authStyles.button}>{saving ? 'Saving...' : 'Change password'}</button>
          {error.includes('expired') && (
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--navy, #16243D)', fontWeight: 600, textAlign: 'center' }}>Request a new reset link</Link>
          )}
        </form>
      )}
    </AuthCard>
  );
}
