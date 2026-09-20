// Admin Portal design tokens — same navy/gold/cream system as Parent and
// Teacher, replacing the earlier magenta "stitch" theme for consistency.
export const A = {
  navy: 'var(--navy, #16243D)',
  navySoft: 'var(--navy-soft, #233754)',
  gold: 'var(--gold, #C9A227)',
  goldSoft: 'var(--gold-soft, #E8D9A8)',
  cream: 'var(--cream, #FAF6EE)',
  canvas: 'var(--canvas, #EEEAE0)',
  paper: 'var(--paper, #FFFFFF)',
  ink: 'var(--ink, #1D2433)',
  meta: 'var(--meta, #66707F)',
  line: 'var(--line, #E6E1D5)',
  green: 'var(--green, #2E7D5B)',
  greenWash: 'var(--green-wash, #EAF4EF)',
  red: 'var(--red, #B4433A)',
  redWash: 'var(--red-wash, #F9EDEC)',
  radius: 14,
  radiusLg: 20,
  shadow: '0 2px 12px rgba(22, 36, 61, .08)',
  headlineFont: "'Lora', serif",
  bodyFont: "'Poppins', -apple-system, sans-serif"
};

export function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export const cardStyle = {
  background: A.paper, borderRadius: A.radius, boxShadow: A.shadow,
  border: `1px solid ${A.line}`, padding: 18, marginBottom: 14
};

export function badge(bg, fg) {
  return { background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, display: 'inline-block' };
}

export function btn(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
    fontFamily: A.bodyFont, cursor: 'pointer', border: 'none', textDecoration: 'none'
  };
  if (variant === 'gold') return { ...base, background: A.gold, color: A.navy, fontWeight: 600 };
  if (variant === 'navy') return { ...base, background: A.navy, color: '#fff' };
  if (variant === 'secondary') return { ...base, background: '#fff', color: A.navy, border: `1.5px solid ${A.line}` };
  if (variant === 'danger') return { ...base, background: A.redWash, color: A.red };
  return base;
}

export const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1.5px solid ${A.line}`, borderRadius: 10,
  fontFamily: A.bodyFont, fontSize: 13.5, color: A.navy, background: '#fff', boxSizing: 'border-box'
};

export const labelStyle = {
  display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
  marginBottom: 5, marginTop: 12, color: A.meta, fontWeight: 600
};

export const thStyle = { textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: 11 };
export const tdStyle = { padding: '10px 14px' };
