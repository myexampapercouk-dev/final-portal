// Generates category-demo.sql: one course per age group (7+, 8+, 9+, 10+, 11+, 13+), each with 6 future
// weekly classes that are for THAT age group only, a material, homework + answers PDFs, and every
// existing child registered into the classes of their own age group.
// Run:  node backend/seed/build-category-demo.js
const fs = require('fs');
const path = require('path');

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

function makePdf(lines) {
  const esc = (t) => t.replace(/[\\()]/g, '\\$&');
  let y = 770;
  const content = lines.map((l, i) => {
    const line = `BT /F1 ${i === 0 ? 20 : 12} Tf 56 ${y} Td (${esc(l)}) Tj ET`;
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
const hex = (b) => '0x' + b.toString('hex');

const homework = makePdf(['Homework (demo)', 'Q1. Write the next three numbers: 4, 9, 14, ...', 'Q2. Simplify 12/18.', 'Q3. Find the odd one out: cat, dog, rose, horse.', 'Q4. Write two sentences using the word "because".']);
const answers = makePdf(['Answers (demo)', 'A1. 19, 24, 29', 'A2. 2/3', 'A3. rose', 'A4. Any two correct sentences.']);

const courseInserts = CATEGORIES.map((cat, i) => `INSERT INTO courses (name, description) VALUES ('Demo ${cat} Foundation Course', 'Weekly English, maths and reasoning classes for the ${cat} age group only.');
SET @c${i} := LAST_INSERT_ID();`).join('\n');

const nums = Array.from({ length: 6 }, (_, i) => `SELECT ${i + 1} AS n`).join(' UNION ALL ');
const classInserts = CATEGORIES.map((cat, i) => `INSERT INTO classes (course_id, teacher_id, title, timing, end_timing, venue, price)
SELECT @c${i}, @teacher, CONCAT('${cat} Class - Week ', n),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 + ${i} DAY), '16:00:00'),
       TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL n * 7 + ${i} DAY), '17:30:00'),
       'Room ${i + 1}, Main Campus', ${20 + i * 2}.00
FROM (${nums}) AS t;`).join('\n');

const courseList = CATEGORIES.map((_, i) => `@c${i}`).join(', ');
const catCase = CATEGORIES.map((cat, i) => `WHEN course_id = @c${i} THEN '${cat}'`).join(' ');

const sql = `-- Demo data, category specific: one course per age group (${CATEGORIES.join(', ')}).
-- Each course has 6 future weekly classes for that age group only, each with a material,
-- homework + answers PDFs (10 questions), and every existing child is registered into the
-- classes of their own age group. Uses the first teacher account for the classes.
-- Run ONCE in phpMyAdmin (SQL tab), after the backend has been redeployed.

CREATE TABLE IF NOT EXISTS homework_files (
  homework_id INT NOT NULL,
  kind VARCHAR(10) NOT NULL,
  data LONGBLOB NOT NULL,
  PRIMARY KEY (homework_id, kind)
);

SET @teacher := (SELECT id FROM users WHERE role = 'teacher' ORDER BY id LIMIT 1);

-- 1. One course per age group
${courseInserts}

-- 2. Six future classes per course
${classInserts}

-- 3. Each class is for its own age group only
INSERT INTO class_categories (class_id, category)
SELECT id, CASE ${catCase} END FROM classes WHERE course_id IN (${courseList});

-- 4. A material on every class (the file is created in uploads/materials when the backend starts)
INSERT INTO class_materials (class_id, file_name, file_path)
SELECT id, 'Class notes.pdf', '/uploads/materials/sample-material.pdf' FROM classes WHERE course_id IN (${courseList});

-- 5. Homework + answers on every class (10 questions)
INSERT INTO homework (class_id, title, file_name, file_path, answer_file_name, answer_file_path, total_questions)
SELECT id, CONCAT(title, ' homework'), 'Homework.pdf', 'seed-homework.pdf', 'Answers.pdf', 'seed-answers.pdf', 10
FROM classes WHERE course_id IN (${courseList});

INSERT INTO homework_files (homework_id, kind, data)
SELECT h.id, 'homework', ${hex(homework)} FROM homework h
JOIN classes c ON c.id = h.class_id WHERE c.course_id IN (${courseList});

INSERT INTO homework_files (homework_id, kind, data)
SELECT h.id, 'answer', ${hex(answers)} FROM homework h
JOIN classes c ON c.id = h.class_id WHERE c.course_id IN (${courseList});

-- 6. Register every child into the classes of their own age group
INSERT IGNORE INTO class_registrations (class_id, child_id, status)
SELECT c.id, ch.id, 'upcoming'
FROM classes c
JOIN class_categories cc ON cc.class_id = c.id
JOIN children ch ON ch.category = cc.category AND ch.parent_id IS NOT NULL
WHERE c.course_id IN (${courseList});
`;

fs.writeFileSync(path.join(__dirname, 'category-demo.sql'), sql);
console.log('written', Math.round(sql.length / 1024) + ' KB');
