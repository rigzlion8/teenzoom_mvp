const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { return res.status(401).json({ message: 'Unauthorized' }); }
};

router.post('/purchase', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (type === 'monthly') {
      const cost = 3000;
      if (user.coins < cost) return res.status(400).json({ message: 'Not enough coins' });
      user.coins -= cost;
      const now = new Date();
      const until = user.vipUntil && new Date(user.vipUntil) > now ? new Date(user.vipUntil) : now;
      until.setDate(until.getDate() + 30);
      user.vipUntil = until;
      user.lifetimeCoins = (user.lifetimeCoins || 0) + cost;
      await user.save();
      return res.json({ message: 'VIP purchased (30 days)', vipUntil: user.vipUntil });
    }

    if (type === 'lifetime_coins') {
      const cost = 15000;
      if (user.coins < cost) return res.status(400).json({ message: 'Not enough coins' });
      user.coins -= cost;
      user.vipLifetime = true;
      user.lifetimeCoins = (user.lifetimeCoins || 0) + cost;
      await user.save();
      return res.json({ message: 'Lifetime VIP granted (coins)', vipLifetime: true });
    }

    return res.status(400).json({ message: 'Invalid type' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const isVip = user.vipLifetime || (user.vipUntil && new Date(user.vipUntil) > new Date());
    res.json({ coins: user.coins, lifetimeCoins: user.lifetimeCoins, vipUntil: user.vipUntil, vipLifetime: user.vipLifetime, isVip, xp: user.xp, likesCount: user.likesCount });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
