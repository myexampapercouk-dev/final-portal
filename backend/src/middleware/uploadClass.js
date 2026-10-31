const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { homeworkDir } = require('./uploadHomework');

// Creating a class takes up to 4 material files (public, under /uploads) plus the
// class's homework PDF and optional answers PDF (private, view-only for parents).
const materialsDir = path.join(__dirname, '../../uploads/materials');
fs.mkdirSync(materialsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, file.fieldname === 'materials' ? materialsDir : homeworkDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    if (file.fieldname === 'materials') return cb(null, `${unique}-${file.originalname.replace(/\s+/g, '_')}`);
    cb(null, `${unique}.pdf`);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'materials' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Homework and answers must be PDF files'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'materials', maxCount: 4 },
  { name: 'homework', maxCount: 1 },
  { name: 'answer', maxCount: 1 }
]);
