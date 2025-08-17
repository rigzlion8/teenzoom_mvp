const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; next();
  } catch (err) { res.status(401).json({ message: 'Unauthorized' }); }
};

router.post('/request', auth, async (req, res) => {
  try {
    const { toUsername } = req.body;
    const from = await User.findById(req.user.id);
    const to = await User.findOne({ username: toUsername });
    if (!to) return res.status(404).json({ message: 'User not found' });
    if (to.friendRequests.includes(from._id) || to.friends.includes(from._id)) return res.json({ message: 'Already requested or friends' });
    to.friendRequests.push(from._id);
    await to.save();
    res.json({ message: 'Request sent' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.post('/accept', auth, async (req, res) => {
  try {
    const { fromId } = req.body;
    const me = await User.findById(req.user.id);
    const from = await User.findById(fromId);
    if (!from) return res.status(404).json({ message: 'User not found' });
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== fromId);
    me.friends.push(from._id);
    from.friends.push(me._id);
    await me.save(); await from.save();
    res.json({ message: 'Friend added' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
