const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { requireAuth } = require('../middleware/auth');
const { requireEducator } = require('../middleware/roles');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) return callback(new Error('Upload a JPG, PNG, WebP, or AVIF image.'));
    callback(null, true);
  }
});

router.post('/image', requireAuth, requireEducator, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: 'Cloudinary is not configured. You can paste a public image URL into the course editor instead.' });
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'edemy/course-thumbnails', resource_type: 'image' }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(req.file.buffer);
    });
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) { next(error); }
});

module.exports = router;
