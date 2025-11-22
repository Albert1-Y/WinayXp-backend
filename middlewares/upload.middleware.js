const fs = require('fs');
const path = require('path');
const multer = require('multer');

const tmpDir = path.join(process.cwd(), 'uploads', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname || '');
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]);
    if (allowedTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    if (file.originalname && file.originalname.toLowerCase().endsWith('.xlsx')) {
      return cb(null, true);
    }
    return cb(new Error('Formato de archivo no soportado'));
  },
});

module.exports = { upload };
