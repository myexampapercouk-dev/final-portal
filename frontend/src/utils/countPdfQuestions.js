import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Best-effort count of the numbered questions in a homework PDF. Each page's text
// is scanned for a run of question numbers 1, 2, 3 ... (written "1." or as a
// bare number at the start of a line); the longest run on a page is that page's
// questions and the pages are added up. Page numbers in the footer are ignored.
// It is an estimate - the admin always sees the number and can change it.
export function countFromPageItems(pages) {
  let total = 0;
  for (const items of pages) {
    const tokens = [];
    items.forEach((it, i) => {
      const s = (it.str || '').trim();
      if (!s) return;
      if (/^myexampapers\.co\.uk$/i.test(s)) { tokens.pop(); return; } // the page number just before the footer
      tokens.push({ s, x: it.x, y: it.y });
    });
    // a question label is "3." / "3) text", or a bare number sitting in the left margin;
    // loose digits in sums and tables are not at the margin, so they are not counted
    const labels = tokens
      .map((t, i) => {
        const m = /^(\d{1,3})(\.|\)|\s|$)/.exec(t.s);
        if (!m) return null;
        const dotted = m[2] === '.' || m[2] === ')' || /^\d+[.)]\s/.test(t.s);
        return { n: Number(m[1]), i, dotted, x: t.x };
      })
      .filter((l) => l && (l.dotted || l.x < 62));
    // longest 1,2,3... run in reading order
    let next = 1;
    let run = 0;
    let best = 0;
    for (const l of labels) {
      if (l.n === next) { run += 1; next += 1; best = Math.max(best, run); }
      else if (l.n === 1) { run = 1; next = 2; best = Math.max(best, run); }
    }
    const dottedPage = labels.some((l) => l.dotted);
    if (best >= 2 || (best === 1 && dottedPage)) total += best;
  }
  return total;
}

export default async function countPdfQuestions(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    pages.push(content.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })));
  }
  return countFromPageItems(pages);
}
