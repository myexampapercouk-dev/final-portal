// Every time on the portal is UK time (Europe/London, switching between GMT and BST by itself),
// whatever timezone the browser is in. Class times are stored as UTC; this file turns them into
// UK wall-clock time for display, and UK wall-clock time typed into a form back into UTC.
export const UK_TZ = 'Europe/London';

// Make every toLocaleString / toLocaleDateString / toLocaleTimeString on the site show UK time
// unless a call asks for a specific timezone itself.
export function showUkTimeEverywhere() {
  ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'].forEach((name) => {
    const original = Date.prototype[name];
    if (original.__uk) return;
    const patched = function (locales, options) {
      return original.call(this, locales, { timeZone: UK_TZ, ...(options || {}) });
    };
    patched.__uk = true;
    // eslint-disable-next-line no-extend-native
    Date.prototype[name] = patched;
  });
}

const partsIn = (date) => {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const o = {};
  f.formatToParts(date).forEach((p) => { o[p.type] = p.value; });
  return o;
};

// "2026-11-20T14:30" for a datetime-local input: the UK wall-clock time of an instant
export function toUkInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = partsIn(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// The UK wall-clock time typed in a datetime-local input ("2026-11-20T14:30") as the UTC
// "YYYY-MM-DD HH:mm:ss" the server stores. Empty stays empty.
export function ukInputToServer(local) {
  if (!local) return local;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(local);
  if (!m) return local;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const wanted = Date.UTC(y, mo - 1, d, h, mi);
  // UK offset at that moment (0 in winter, 60 minutes in summer); one refinement covers the clock change
  const offsetAt = (utcMs) => {
    const p = partsIn(new Date(utcMs));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(utcMs / 1000) * 1000;
  };
  let utc = wanted - offsetAt(wanted);
  utc = wanted - offsetAt(utc);
  return new Date(utc).toISOString().slice(0, 19).replace('T', ' ');
}
