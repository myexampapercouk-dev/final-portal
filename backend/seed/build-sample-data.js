// Generates sample-data.sql (2 courses x 10 future classes, each with material,
// homework + answers PDFs, all categories, plus fresh demo users) and the sample
// material PDF. Run:  node backend/seed/build-sample-data.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const PASSWORD = 'Welcome@2026';
const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

// Minimal one-page PDF with the given lines of text
function makePdf(lines) {
  const esc = (t) => t.replace(/[\\()]/g, '\\$&');
  let y = 770;
  const content = lines.map((l, i) => {
    const size = i === 0 ? 20 : 12;
    const line = `BT /F1 ${size} Tf 56 ${y} Td (${esc(l)}) Tj ET`;
    y -= i === 0 ? 34 : 22;
    return line;
  }).join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const allCats = CATEGORIES.join(', ');
const material = makePdf(['Class Notes (sample)', `Categories covered: ${allCats}`, '', 'Topic 1: Number and place value', 'Topic 2: Fractions and decimals', 'Topic 3: Reading comprehension', 'Topic 4: Verbal and non-verbal reasoning']);
const homework = makePdf(['Homework (sample)', `Categories covered: ${allCats}`, '', 'Q1. Write the next three numbers: 4, 9, 14, ...', 'Q2. Simplify 12/18.', 'Q3. Find the odd one out: cat, dog, rose, horse.', 'Q4. Write two sentences using the word "because".']);
const answers = makePdf(['Answers (sample)', `Categories covered: ${allCats}`, '', 'A1. 19, 24, 29', 'A2. 2/3', 'A3. rose', 'A4. Any two correct sentences.']);

fs.writeFileSync(path.join(__dirname, 'sample-material.pdf'), material);

const hash = bcrypt.hashSync(PASSWORD, 10);
const hex = (b) => '0x' + b.toString('hex');
const catUnion = CATEGORIES.map((c) => `SELECT '${c}' AS cat`).join(' UNION ALL ');
const nums = Array.from({ length: 10 }, (_, i) => `SELECT ${i + 1} AS n`).join(' UNION ALL ');

const sql = `-- Sample data: fresh demo users + 2 courses x 10 future classes.
-- Every class has all categories, a venue, price, start/end time, a material PDF,
-- and homework + answers PDFs (kept in the database, so they survive redeploys).
-- Run ONCE in phpMyAdmin (SQL tab) against the portal database.
-- Demo password for all three logins: ${PASSWORD}

-- 1. Tables the app also creates by itself (safe if they already exist)
CREATE TABLE IF NOT EXISTS homework_files (
  homework_id INT NOT NULL,
  kind VARCHAR(10) NOT NULL,
  data LONGBLOB NOT NULL,
  PRIMARY KEY (homework_id, kind)
);

-- 2. Fresh users (skipped if the email already exists)
INSERT INTO users (role, name, email, phone, password_hash) VALUES
  ('teacher', 'Demo Teacher',  'demo.teacher@myexampapers.co.uk', '07700900001', '${hash}'),
  ('parent',  'Demo Parent One', 'demo.parent1@myexampapers.co.uk', '07700900002', '${hash}'),
  ('parent',  'Demo Parent Two', 'demo.parent2@myexampapers.co.uk', '07700900003', '${hash}')
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @teacher := (SELECT id FROM users WHERE email = 'demo.teacher@myexampapers.co.uk');
SET @p1 := (SELECT id FROM users WHERE email = 'demo.parent1@myexampapers.co.uk');
SET @p2 := (SELECT id FROM users WHERE email = 'demo.parent2@myexampapers.co.uk');

-- 3. Children (two per parent)
INSERT INTO children (parent_id, name, dob, target_exam, allergies, category) VALUES
  (@p1, 'Aarav Demo', '2018-03-14', 'Grammar school entry', 'None', '7+'),
  (@p1, 'Anaya Demo', '2015-09-02', 'Grammar school entry', 'None', '10+'),
  (@p2, 'Rohan Demo', '2016-06-21', 'Independent school entry', 'None', '9+'),
  (@p2, 'Meera Demo', '2013-01-30', 'Independent school entry', 'None', '13+');

-- 4. Two courses
INSERT INTO courses (name, description) VALUES
  ('Demo English Masterclass', 'Comprehension, vocabulary and writing skills for every entrance-exam category.');
SET @c1 := LAST_INSERT_ID();
INSERT INTO courses (name, description) VALUES
  ('Demo Maths and Reasoning', 'Number, problem solving and verbal / non-verbal reasoning for every entrance-exam category.');
SET @c2 := LAST_INSERT_ID();

-- 5. Ten future classes per course (weekly, starting next week)
INSERT INTO classes (course_id, teacher_id, title, timing, end_timing, venue, price)
SELECT @c1, @teacher, CONCAT('English Masterclass - Week ', n),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 DAY), '16:00:00'),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 DAY), '17:30:00'),
       'Room 1, Main Campus', 25.00
FROM (${nums}) AS t;

INSERT INTO classes (course_id, teacher_id, title, timing, end_timing, venue, price)
SELECT @c2, @teacher, CONCAT('Maths and Reasoning - Week ', n),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 + 2 DAY), '10:00:00'),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 + 2 DAY), '11:30:00'),
       'Room 2, Main Campus', 30.00
FROM (${nums}) AS t;

-- 6. Every class covers all categories
INSERT INTO class_categories (class_id, category)
SELECT c.id, k.cat FROM classes c CROSS JOIN (${catUnion}) AS k
WHERE c.course_id IN (@c1, @c2);

-- 7. Material PDF on every class (file is created in uploads/materials when the backend starts)
INSERT INTO class_materials (class_id, file_name, file_path)
SELECT id, 'Class notes.pdf', '/uploads/materials/sample-material.pdf' FROM classes WHERE course_id IN (@c1, @c2);

-- 8. Homework + answers on every class
INSERT INTO homework (class_id, title, file_name, file_path, answer_file_name, answer_file_path)
SELECT id, CONCAT(title, ' homework'), 'Homework.pdf', 'seed-homework.pdf', 'Answers.pdf', 'seed-answers.pdf'
FROM classes WHERE course_id IN (@c1, @c2);

INSERT INTO homework_files (homework_id, kind, data)
SELECT h.id, 'homework', ${hex(homework)} FROM homework h
JOIN classes c ON c.id = h.class_id WHERE c.course_id IN (@c1, @c2);

INSERT INTO homework_files (homework_id, kind, data)
SELECT h.id, 'answer', ${hex(answers)} FROM homework h
JOIN classes c ON c.id = h.class_id WHERE c.course_id IN (@c1, @c2);

-- 9. Book the demo children into the first three classes of each course so the parents see homework
INSERT IGNORE INTO class_registrations (class_id, child_id, status)
SELECT c.id, ch.id, 'upcoming' FROM classes c
JOIN children ch ON ch.parent_id IN (@p1, @p2)
WHERE c.course_id IN (@c1, @c2) AND c.timing < DATE_ADD(CURDATE(), INTERVAL 25 DAY);
`;

fs.writeFileSync(path.join(__dirname, 'sample-data.sql'), sql);
console.log('written', Math.round(sql.length / 1024) + ' KB');
