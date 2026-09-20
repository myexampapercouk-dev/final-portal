// Parent Portal design tokens — matches the existing global palette in
// index.css (navy/gold/cream, Lora headings + Poppins UI) rather than the
// stitch magenta theme used by Teacher/Admin. Green and red are reserved
// for attendance/payment states only, per spec.
export const P = {
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
  background: P.paper, borderRadius: P.radius, boxShadow: P.shadow,
  border: `1px solid ${P.line}`, padding: 18
};

export function badge(bg, fg, label) {
  return { style: { background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, display: 'inline-block' }, label };
}

export const STATUS = {
  upcoming: { bg: P.goldSoft, fg: '#7A5B00', label: 'Booked' },
  scheduled: { bg: P.goldSoft, fg: '#7A5B00', label: 'Scheduled' },
  attended: { bg: P.greenWash, fg: P.green, label: 'Attended' },
  completed: { bg: P.greenWash, fg: P.green, label: 'Completed' },
  absent: { bg: P.redWash, fg: P.red, label: 'Absent' },
  cancelled: { bg: P.redWash, fg: P.red, label: 'Cancelled' },
  paid: { bg: P.greenWash, fg: P.green, label: 'Paid' },
  unpaid: { bg: P.goldSoft, fg: '#7A5B00', label: 'Due' }
};

export function btn(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
    fontFamily: P.bodyFont, cursor: 'pointer', border: 'none', textDecoration: 'none'
  };
  if (variant === 'gold') return { ...base, background: P.gold, color: P.navy, fontWeight: 600 };
  if (variant === 'navy') return { ...base, background: P.navy, color: '#fff' };
  if (variant === 'secondary') return { ...base, background: '#fff', color: P.navy, border: `1.5px solid ${P.line}` };
  if (variant === 'danger') return { ...base, background: P.redWash, color: P.red };
  return base;
}

export const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1.5px solid ${P.line}`, borderRadius: 10,
  fontFamily: P.bodyFont, fontSize: 13.5, color: P.navy, background: '#fff', boxSizing: 'border-box'
};

export const labelStyle = {
  display: 'block', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
  marginBottom: 5, color: P.meta, fontWeight: 600
};
