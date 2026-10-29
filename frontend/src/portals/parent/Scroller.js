import React, { useRef } from 'react';
import { P } from './theme';

// Horizontal card strip with circular left/right arrows (touch-swipe works too).
export default function Scroller({ children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  const arrow = (side, dir, glyph) => (
    <button
      type="button"
      onClick={() => scroll(dir)}
      aria-label={dir < 0 ? 'Scroll left' : 'Scroll right'}
      style={{
        position: 'absolute', top: '50%', [side]: -4, transform: 'translateY(-50%)', zIndex: 2,
        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${P.navy}`, background: '#fff',
        color: P.navy, cursor: 'pointer', fontSize: 16, lineHeight: 1, boxShadow: P.shadow
      }}
    >
      {glyph}
    </button>
  );
  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      {arrow('left', -1, '‹')}
      <div ref={ref} style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 24px 10px', scrollSnapType: 'x proximity', scrollbarWidth: 'thin' }}>
        {children}
      </div>
      {arrow('right', 1, '›')}
    </div>
  );
}

export function ScrollCard({ children, accent }) {
  return (
    <div style={{
      flex: '0 0 250px', scrollSnapAlign: 'start', background: P.paper, borderRadius: P.radius,
      border: `1px solid ${P.line}`, borderTop: `3px solid ${accent || P.gold}`, boxShadow: P.shadow, padding: 14
    }}>
      {children}
    </div>
  );
}

export function StudentTag({ name }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, background: P.goldSoft, color: '#7A5B00', padding: '2px 10px', borderRadius: 999 }}>
      {name}
    </span>
  );
}
