import React from 'react';
import { P } from './theme';

export default function ScoreRing({ percent, size = 64, stroke = 7, dark }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,.15)' : P.line} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={P.gold} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: P.headlineFont, fontWeight: 700, fontSize: size * 0.26, fill: dark ? '#fff' : P.navy }}>
        {percent}%
      </text>
      <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: P.bodyFont, fontSize: size * 0.13, fill: dark ? '#C7CEDB' : P.meta, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Score
      </text>
    </svg>
  );
}
