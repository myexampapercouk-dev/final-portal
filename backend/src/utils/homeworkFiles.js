const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { homeworkDir } = require('../middleware/uploadHomework');

// Homework PDFs are also kept in the database (homework_files). Hosting redeploys
// can wipe files on disk; the database copy means a PDF is never lost that way.
let tableReady = null;
function ensureFilesTable() {
  if (!tableReady) {
    tableReady = pool.query(
      `CREATE TABLE IF NOT EXISTS homework_files (
         homework_id INT NOT NULL,
         kind VARCHAR(10) NOT NULL,
         data LONGBLOB NOT NULL,
         PRIMARY KEY (homework_id, kind)
       )`
    ).catch((e) => { tableReady = null; console.error('[HOMEWORK FILES TABLE]', e.message); throw e; });
  }
  return tableReady;
}

async function keepCopy(homeworkId, kind, file) {
  try {
    await ensureFilesTable();
    await pool.query('REPLACE INTO homework_files (homework_id, kind, data) VALUES (?,?,?)',
      [homeworkId, kind, fs.readFileSync(path.join(homeworkDir, file.filename))]);
  } catch (e) {
    console.error('[HOMEWORK COPY FAILED]', e.message);
  }
}

module.exports = { ensureFilesTable, keepCopy };
