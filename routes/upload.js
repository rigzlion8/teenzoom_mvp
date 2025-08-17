const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ message: 'Unauthorized' }); }
};

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.avatarUrl = '/uploads/' + req.file.filename;
    await user.save();
    res.json({ avatarUrl: user.avatarUrl });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Upload error' }); }
});

router.post('/status', auth, async (req, res) => {
  try {
    const { status, theme } = req.body;
    const user = await User.findById(req.user.id);
    if (status !== undefined) user.status = status.slice(0, 100);
    if (theme) user.theme = theme;
    await user.save();
    res.json({ status: user.status, theme: user.theme });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
