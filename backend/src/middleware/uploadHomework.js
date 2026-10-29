const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Homework PDFs live OUTSIDE /uploads (which is served statically), so they can
// only be reached through the authenticated, view-only route in routes/homework.js.
const dir = path.join(__dirname, '../../private/homework');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}.pdf`);
  }
});

const uploadHomework = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  }
}).fields([{ name: 'homework', maxCount: 1 }, { name: 'answer', maxCount: 1 }]);

module.exports = { uploadHomework, homeworkDir: dir };
