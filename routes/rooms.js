const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const auth = (req, res, next) => {
  try { req.user = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ message: 'Unauthorized' }); }
};

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    res.json(rooms);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { roomId, name } = req.body;
    if (!roomId) return res.status(400).json({ message: 'Missing roomId' });
    const exists = await Room.findOne({ roomId });
    if (exists) return res.status(400).json({ message: 'Room exists' });
    const room = new Room({ roomId, name: name || roomId, admins: [req.user.id] });
    await room.save();
    res.json(room);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
