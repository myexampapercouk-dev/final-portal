const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

// Class material files live on disk under /uploads/materials, which a hosting
// redeploy can wipe. Every upload is also kept in the database, and a file that
// has gone missing from disk is restored from there the next time it is opened.
const dir = path.join(__dirname, '../../uploads/materials');

let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = pool.query(
      `CREATE TABLE IF NOT EXISTS material_files (
         file_name VARCHAR(255) NOT NULL PRIMARY KEY,
         data LONGBLOB NOT NULL
       )`
    ).catch((e) => { tableReady = null; console.error('[MATERIAL FILES TABLE]', e.message); throw e; });
  }
  return tableReady;
}

async function keepMaterialCopy(file) {
  try {
    await ensureTable();
    await pool.query('REPLACE INTO material_files (file_name, data) VALUES (?, ?)', [file.filename, fs.readFileSync(path.join(dir, file.filename))]);
  } catch (e) {
    console.error('[MATERIAL COPY FAILED]', e.message);
  }
}

// Express middleware, placed before express.static for /uploads/materials/<file>
async function restoreMissingMaterial(req, res, next) {
  try {
    const name = path.basename(decodeURIComponent(req.path));
    if (!name || fs.existsSync(path.join(dir, name))) return next();
    await ensureTable();
    const [rows] = await pool.query('SELECT data FROM material_files WHERE file_name = ?', [name]);
    if (rows.length) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(path.join(dir, name), rows[0].data, () => {});
    }
  } catch (e) {
    console.error('[MATERIAL RESTORE FAILED]', e.message);
  }
  next();
}

module.exports = { keepMaterialCopy, restoreMissingMaterial, materialsDir: dir };
