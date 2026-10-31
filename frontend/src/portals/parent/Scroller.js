import React, { useState } from 'react';
import { P } from './theme';

// Card grid for the dashboard sections: shows the latest few, with a toggle for the rest.
const SHOW = 3;

export default function Scroller({ children }) {
  const [all, setAll] = useState(false);
  const items = React.Children.toArray(children);
  const shown = all ? items : items.slice(0, SHOW);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {shown}
      </div>
      {items.length > SHOW && (
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          style={{ marginTop: 10, background: 'none', border: 'none', color: P.navy, fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          {all ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </div>
  );
}

export function ScrollCard({ children, accent }) {
  return (
    <div style={{
      minWidth: 0, background: P.paper, borderRadius: P.radius,
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
