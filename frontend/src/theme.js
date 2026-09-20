// Shared color/spacing tokens lifted from the "British Prep Specialist" stitch
// design (stitch_tuition_academy_management_portal.zip), used by the Parent
// and Admin portal shells/pages so all three portals share one visual system.
export const T = {
  primary: '#9b005f',
  primaryContainer: '#c2187a',
  onPrimary: '#ffffff',
  primaryFixed: '#ffd9e5',
  onPrimaryFixed: '#3d0023',
  secondary: '#006398',
  secondaryFixed: '#cce5ff',
  onSecondaryFixed: '#001d31',
  tertiary: '#16a34a',
  tertiaryFixed: '#dcfce7',
  onTertiaryFixed: '#052e13',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  surface: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',
  onSurface: '#131b2e',
  onSurfaceVariant: '#584049',
  outlineVariant: '#debec9',
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
  shadow: '0 1px 3px 0 rgba(15,23,42,.05), 0 1px 2px -1px rgba(15,23,42,.03)',
  shadowMd: '0 10px 15px -3px rgba(15,23,42,.08), 0 4px 6px -4px rgba(15,23,42,.03)',
  headlineFont: "'Plus Jakarta Sans', -apple-system, sans-serif",
  bodyFont: "'Inter', -apple-system, sans-serif"
};

export function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function btnStyle(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: T.bodyFont
  };
  if (variant === 'primary') return { ...base, background: T.primaryContainer, color: '#fff' };
  if (variant === 'secondary') return { ...base, background: T.secondary, color: '#fff' };
  if (variant === 'secondaryOutline') return { ...base, background: T.surfaceContainerHigh, color: T.onSurface };
  if (variant === 'danger') return { ...base, background: T.errorContainer, color: T.onErrorContainer };
  if (variant === 'ghost') return { ...base, background: T.surfaceContainerLowest, color: T.onSurfaceVariant, boxShadow: T.shadow };
  return base;
}

export const cardStyle = {
  background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow,
  padding: 18, fontFamily: T.bodyFont, marginBottom: 14
};

export const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.onSurfaceVariant, margin: '12px 0 5px',
  textTransform: 'uppercase', letterSpacing: '.04em'
};

export const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.surfaceContainerHigh}`,
  background: T.surfaceContainerLow, fontSize: 13.5, fontFamily: T.bodyFont, boxSizing: 'border-box'
};

export function badgeStyle(bg, fg) {
  return { background: bg, color: fg, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-block' };
}

export const thStyle = { padding: '10px 16px', fontWeight: 700, textAlign: 'left' };
export const tdStyle = { padding: '12px 16px' };

export const modalBackdrop = {
  position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(40,48,68,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
};
export const modalCard = {
  background: T.surfaceContainerLowest, borderRadius: T.radius.xl, boxShadow: T.shadowMd,
  padding: 22, width: '100%', fontFamily: T.bodyFont, maxHeight: '90vh', overflowY: 'auto'
};
