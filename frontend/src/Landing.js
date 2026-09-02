import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>Edu Portal</h1>
      <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto' }}>
        Classes, attendance, feedback and 1:1 sessions, all in one place.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30 }}>
        <Link to="/login"><button className="gold" style={{ padding: '10px 24px' }}>Sign In</button></Link>
        <Link to="/register"><button className="secondary" style={{ padding: '10px 24px' }}>Create Account</button></Link>
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 40 }}>
        Already have an account with us? Sign in above — you'll be taken to the right dashboard automatically.
      </p>
    </div>
  );
}
