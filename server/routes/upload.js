const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const router = express.Router();

// Thư mục lưu ảnh trực tiếp trên ổ cứng C4 Cloud (giảm tải dung lượng MongoDB)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Phục vụ file ảnh tĩnh qua /api/upload/files/:filename (tương thích mọi proxy Vercel & Nginx)
router.use('/files', express.static(UPLOAD_DIR, {
  maxAge: '30d',
  immutable: true,
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // tối đa 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), false);
    }
  }
});

// POST /api/upload/image
// Body: multipart/form-data với field "image"
// Lưu file xuống ổ cứng C4 Cloud và trả về URL tĩnh /api/upload/files/... (kèm fallback base64 nếu lỗi ghi đĩa)
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file ảnh được tải lên' });
    }

    const extMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[req.file.mimetype] || path.extname(req.file.originalname) || '.jpg';
    const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    try {
      fs.writeFileSync(filePath, req.file.buffer);
      return res.json({
        success: true,
        url: `/api/upload/files/${uniqueName}`,
        filename: uniqueName,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (diskErr) {
      console.warn('[UPLOAD] Disk write fallback to base64:', diskErr.message);
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      return res.json({
        success: true,
        url: dataUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Lỗi tải ảnh lên: ' + error.message });
  }
});

// Error handler cho multer (file quá lớn, sai định dạng...)
// POST /api/upload/document
// Body: multipart/form-data với field "file" — chấp nhận ảnh (jpg, png, webp, gif) hoặc PDF, tối đa 15MB
// Dùng cho mục "Quy trình sản xuất" của sản phẩm (doanh nghiệp import file ảnh / PDF từ máy)
const DOCUMENT_MAX_SIZE = 15 * 1024 * 1024;
const DOCUMENT_ALLOWED = {
  'image/jpeg': { ext: '.jpg', kind: 'image' },
  'image/jpg': { ext: '.jpg', kind: 'image' },
  'image/png': { ext: '.png', kind: 'image' },
  'image/webp': { ext: '.webp', kind: 'image' },
  'image/gif': { ext: '.gif', kind: 'image' },
  'application/pdf': { ext: '.pdf', kind: 'pdf' }
};
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (DOCUMENT_ALLOWED[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF) hoặc PDF'), false);
    }
  }
});

router.post('/document', auth, (req, res) => {
  documentUpload.single('file')(req, res, (uploadErr) => {
    if (uploadErr) {
      const message = uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'File quá lớn. Tối đa 15MB.'
        : (uploadErr.message || 'Lỗi tải file lên');
      return res.status(400).json({ error: message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên' });
      }
      const meta = DOCUMENT_ALLOWED[req.file.mimetype];
      // Kiểm tra chữ ký file PDF thực sự (%PDF) để tránh đổi đuôi file giả mạo
      if (meta.kind === 'pdf' && req.file.buffer.slice(0, 4).toString('latin1') !== '%PDF') {
        return res.status(400).json({ error: 'File PDF không hợp lệ' });
      }
      const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${meta.ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), req.file.buffer);
      return res.json({
        success: true,
        url: `/api/upload/files/${uniqueName}`,
        filename: uniqueName,
        originalName: req.file.originalname,
        fileType: meta.kind,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload document error:', error);
      return res.status(500).json({ error: 'Lỗi lưu file lên máy chủ: ' + error.message });
    }
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn. Tối đa 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
