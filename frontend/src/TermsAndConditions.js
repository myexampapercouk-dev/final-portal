import React from 'react';
import { Link } from 'react-router-dom';
import { TERMS } from './termsContent';

const C = {
  navy: '#16243D', gold: '#C9A227', cream: '#FAF6EE', canvas: '#EEEAE0', meta: '#66707F', line: '#E6E1D5', ink: '#1D2433',
  headlineFont: "'Lora', serif", bodyFont: "'Poppins', -apple-system, sans-serif"
};

// The full terms and conditions, opened from the "I understand the Terms and Conditions" link
// on the registration page. Public: no login needed.
export default function TermsAndConditions() {
  return (
    <div style={{ minHeight: '100vh', background: C.canvas, fontFamily: C.bodyFont, padding: '32px 16px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', background: '#fff', borderRadius: 18, padding: '34px 30px', boxShadow: '0 8px 30px rgba(22,36,61,.08)' }}>
        <h1 style={{ fontFamily: C.headlineFont, color: C.navy, fontSize: 30, margin: '0 0 4px' }}>{TERMS.title}</h1>
        <div style={{ color: C.meta, fontSize: 13, marginBottom: 14 }}>{TERMS.date}</div>
        <p style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 16px', color: C.ink, fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>{TERMS.intro}</p>

        {TERMS.sections.map((s) => (
          <section key={s.n} style={{ marginTop: 26 }}>
            <h2 style={{ fontFamily: C.headlineFont, color: C.navy, fontSize: 20, margin: '0 0 10px', paddingBottom: 6, borderBottom: `2px solid ${C.gold}` }}>
              {s.n}. {s.title}
            </h2>
            {s.clauses.map((c) => (
              <div key={c.n} style={{ display: 'flex', gap: 12, margin: '0 0 10px' }}>
                <div style={{ color: C.gold, fontWeight: 700, fontSize: 13.5, minWidth: 38, paddingTop: 1 }}>{c.n}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink }}>
                  {c.t}
                  {c.bullets && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                      {c.bullets.map((b) => <li key={b} style={{ marginBottom: 4 }}>{b}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </section>
        ))}

        <div style={{ marginTop: 30, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <Link to="/register" style={{ color: C.navy, fontWeight: 600, fontSize: 14 }}>← Back to registration</Link>
        </div>
      </div>
    </div>
  );
}
