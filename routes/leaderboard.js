const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const auth = (req, res, next) => {
  try { req.user = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ message: 'Unauthorized' }); }
};

router.get('/top-xp', auth, async (req, res) => {
  try {
    const users = await User.find().sort({ xp: -1 }).limit(20).select('username displayName xp avatarUrl likesCount').lean();
    res.json(users);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.get('/most-liked', auth, async (req, res) => {
  try {
    const users = await User.find().sort({ likesCount: -1 }).limit(20).select('username displayName xp avatarUrl likesCount').lean();
    res.json(users);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
