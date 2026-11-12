import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Best-effort read of the numbered questions in a homework PDF.
// Each page's text is scanned for a run of question numbers 1, 2, 3 ... (written
// "1." / "1)" or as a bare number in the left margin; loose digits in sums and tables
// are ignored). The longest run on a page is that page's questions, and the pages
// are added up. For every question the text up to the next question is kept, with
// the page's section heading in front. The admin can always change the number.
const NOISE = /^(working|answer|time:?|score:?|\/)$/i;

export function readQuestions(pages) {
  const out = [];
  for (const items of pages) {
    const tokens = [];
    let section = '';
    items.forEach((it) => {
      const s = (it.str || '').trim();
      if (!s) return;
      if (/^myexampapers\.co\.uk$/i.test(s)) { tokens.pop(); section = '@next'; return; } // the page number sits just before the footer
      if (section === '@next') { section = s; return; } // first text after the footer is the section heading
      tokens.push({ s, x: it.x });
    });
    if (section === '@next') section = '';

    const labels = tokens
      .map((t, i) => {
        const m = /^(\d{1,3})(\.|\)|\s|$)/.exec(t.s);
        if (!m) return null;
        const dotted = m[2] === '.' || m[2] === ')' || /^\d+[.)]\s/.test(t.s);
        return { n: Number(m[1]), i, dotted, x: t.x, rest: t.s.replace(/^\d{1,3}[.)]?\s*/, '') };
      })
      .filter((l) => l && (l.dotted || l.x < 62));

    // longest 1,2,3... run in reading order
    let run = [];
    let best = [];
    for (const l of labels) {
      if (run.length && l.n === run.length + 1) run.push(l);
      else if (l.n === 1) run = [l];
      else continue;
      if (run.length > best.length) best = [...run];
    }
    const dottedPage = best.some((l) => l.dotted);
    if (!(best.length >= 2 || (best.length === 1 && dottedPage))) continue;

    best.forEach((l, k) => {
      const end = k + 1 < best.length ? best[k + 1].i : tokens.length;
      const body = [l.rest, ...tokens.slice(l.i + 1, end).map((t) => t.s)]
        .filter((w) => w && !NOISE.test(w))
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*\/\s*\d+$/, '') // a trailing "/ 14" from a score line
        .trim();
      out.push({ section, text: body.length > 110 ? `${body.slice(0, 107)}...` : body });
    });
  }
  return out.map((q, i) => ({ n: i + 1, ...q }));
}

// Returns { count, questions: [{ n, section, text }] }
export default async function readPdfQuestions(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    pages.push(content.items.map((it) => ({ str: it.str, x: it.transform[4] })));
  }
  const questions = readQuestions(pages);
  return { count: questions.length, questions };
}
