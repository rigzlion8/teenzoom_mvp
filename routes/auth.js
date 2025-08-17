const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Seed admin (safe to run repeatedly – checks for existence)
(async function seedAdmin() {
  try {
    const username = 'Crosslow7';
    const pwd = 'gtrsupra20252026';
    const existing = await User.findOne({ username });
    if (!existing) {
      const hash = await bcrypt.hash(pwd, 10);
      await User.create({ username, passwordHash: hash, displayName: 'Admin', role: 'admin', coins: 50000, xp: 1000, vipLifetime: true });
      console.log('Seeded admin Crosslow7');
    }
  } catch (e) { console.error('Admin seed error', e); }
})();

router.post('/signup', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash, displayName: displayName || username });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, displayName: user.displayName, role: user.role });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, displayName: user.displayName, role: user.role, avatarUrl: user.avatarUrl, xp: user.xp, coins: user.coins });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
