const pool = require('../config/db');

// Next category on 1 September each year. 13+ is the maximum.
const NEXT = { '7+': '8+', '8+': '9+', '9+': '10+', '10+': '11+', '11+': '13+' };

// The academic year starts on 1 September.
function academicYear(date = new Date()) {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

async function runCategoryUpgrade() {
  const current = academicYear();
  const [rows] = await pool.query("SELECT v FROM system_meta WHERE k = 'category_year'");

  // First run ever: record the current academic year without upgrading anyone,
  // otherwise every existing child would jump a category the day this ships.
  if (!rows.length) {
    await pool.query("INSERT INTO system_meta (k, v) VALUES ('category_year', ?)", [String(current)]);
    return;
  }
  if (Number(rows[0].v) >= current) return;

  for (const [from, to] of Object.entries(NEXT)) {
    await pool.query('UPDATE children SET category = ? WHERE category = ?', [to, from]);
  }
  await pool.query("UPDATE system_meta SET v = ? WHERE k = 'category_year'", [String(current)]);
  console.log(`[CATEGORY UPGRADE] Children moved up for academic year starting Sep ${current}`);
}

function startCategoryUpgradeJob() {
  const run = () => runCategoryUpgrade().catch((err) => console.error('[CATEGORY UPGRADE FAILED]', err.message));
  run();
  setInterval(run, 6 * 60 * 60 * 1000);
}

module.exports = { startCategoryUpgradeJob, runCategoryUpgrade, academicYear };
