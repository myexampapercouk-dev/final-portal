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

// homework.total_questions (required for new homework) and the parents' per-question feedback
let schemaReady = null;
function ensureHomeworkSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const [cols] = await pool.query(
        `SELECT COLUMN_NAME FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = 'homework' AND column_name = 'total_questions'`
      );
      if (!cols.length) await pool.query('ALTER TABLE homework ADD COLUMN total_questions INT NULL');
      const [qcols] = await pool.query(
        `SELECT COLUMN_NAME FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = 'homework' AND column_name = 'questions'`
      );
      if (!qcols.length) await pool.query('ALTER TABLE homework ADD COLUMN questions TEXT NULL');
      await pool.query(
        `CREATE TABLE IF NOT EXISTS homework_feedback (
           id INT AUTO_INCREMENT PRIMARY KEY,
           homework_id INT NOT NULL,
           child_id INT NOT NULL,
           parent_id INT NOT NULL,
           question_no INT NOT NULL,
           feedback TEXT NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )`
      );
    })().catch((e) => { schemaReady = null; console.error('[HOMEWORK SCHEMA]', e.message); throw e; });
  }
  return schemaReady;
}

// The question texts read from the PDF arrive as a JSON string; keep only a clean, bounded list.
// Returns a JSON string, or null when there is nothing usable (the popup then says "Question N").
function cleanQuestions(raw, total) {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length !== total || list.length > 300) return null;
    return JSON.stringify(list.map((q) => ({
      section: String((q && q.section) || '').slice(0, 60),
      text: String((q && q.text) || '').slice(0, 160)
    })));
  } catch (e) {
    return null;
  }
}

module.exports = { ensureFilesTable, ensureHomeworkSchema, keepCopy, cleanQuestions };
