import React from 'react';
import { P } from './theme';

const time = (d) => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// Date, start/end time, venue and price - shown on the booking pages.
// Venue/price/end time fall back to "To be confirmed" for older classes.
export default function ClassDetails({ c }) {
  const rows = [
    ['Date', new Date(c.timing).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['Start time', time(c.timing)],
    ['End time', c.end_timing ? time(c.end_timing) : 'To be confirmed'],
    ['Venue', c.venue || 'To be confirmed'],
    ['Price', c.price !== null && c.price !== undefined && c.price !== '' ? `£${Number(c.price).toFixed(2)}` : 'To be confirmed']
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px 18px', marginTop: 10 }}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: P.meta, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 13.5, color: P.navy, fontWeight: 500 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}
