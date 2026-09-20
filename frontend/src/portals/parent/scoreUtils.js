// Best-effort percentage parse for the free-text mock_exams.score column
// (e.g. "68%", "17/25"). Returns null when it can't be read as a percentage,
// so callers can fall back to showing the raw text instead of guessing.
export function parsePercent(score) {
  if (!score) return null;
  const pctMatch = String(score).match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return Math.round(parseFloat(pctMatch[1]));
  const fracMatch = String(score).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den > 0) return Math.round((num / den) * 100);
  }
  return null;
}
