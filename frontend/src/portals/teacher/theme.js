// Teacher Portal design tokens — matches the global navy/gold/cream palette
// in index.css (same system as the Parent Portal), replacing the earlier
// magenta "stitch" theme for full visual consistency across portals.
export const T = {
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
  background: T.paper, borderRadius: T.radius, boxShadow: T.shadow,
  border: `1px solid ${T.line}`, padding: 18
};

export function btn(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
    fontFamily: T.bodyFont, cursor: 'pointer', border: 'none', textDecoration: 'none'
  };
  if (variant === 'gold') return { ...base, background: T.gold, color: T.navy, fontWeight: 600 };
  if (variant === 'navy') return { ...base, background: T.navy, color: '#fff' };
  if (variant === 'secondary') return { ...base, background: '#fff', color: T.navy, border: `1.5px solid ${T.line}` };
  if (variant === 'danger') return { ...base, background: T.redWash, color: T.red };
  return base;
}

export const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1.5px solid ${T.line}`, borderRadius: 10,
  fontFamily: T.bodyFont, fontSize: 13.5, color: T.navy, background: '#fff', boxSizing: 'border-box'
};

export const labelStyle = {
  display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
  marginBottom: 5, color: T.meta, fontWeight: 600
};
