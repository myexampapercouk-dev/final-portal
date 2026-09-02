const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Files are saved to backend/uploads/materials and served statically from /uploads
const uploadDir = path.join(__dirname, '../../uploads/materials');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${unique}-${safeName}`);
    }
});

// Up to 4 files, 20MB each, field name "materials". Not required — 0 files is valid.
const uploadMaterials = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }
}).array('materials', 4);

module.exports = uploadMaterials;