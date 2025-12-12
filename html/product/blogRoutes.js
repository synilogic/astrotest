import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { blogLike, addBlog, getMyBlog, deleteBlog } from './blogController.js';

const router = express.Router();

// ✅ Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Absolute path to: public/uploads/blog (root of project)
const uploadDir = path.resolve(__dirname, '../public/uploads/blog');
console.log('✅ Uploading blog image to:', uploadDir);

// ✅ Setup Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  }
});

// ✅ Allow any image type via mimetype
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB
  // No fileFilter — all files allowed
});

// ✅ Define routes
router.post('/addBlog', upload.any(), addBlog);
router.post('/getMyBlog', upload.none(), getMyBlog);
router.post('/deleteBlog', upload.none(), deleteBlog);
router.post('/blogLike', upload.none(), blogLike);

export default router;
