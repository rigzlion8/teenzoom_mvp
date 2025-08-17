const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const RoomVideo = require('../models/RoomVideo');
const Room = require('../models/Room');
const User = require('../models/User');
const ModerationLog = require('../models/ModerationLog');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const auth = (req, res, next) => {
  try {
    req.user = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) { res.status(401).json({ message: 'Unauthorized' }); }
};

router.post('/', auth, async (req, res) => {
  try {
    const { roomId, videoId, title, thumbnail } = req.body;
    if (!roomId || !videoId) return res.status(400).json({ message: 'Missing fields' });
    const video = new RoomVideo({ roomId, videoId, title, thumbnail, addedBy: req.user.id, addedByName: req.user.username });
    await video.save();
    res.json(video);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.get('/:roomId', auth, async (req, res) => {
  try {
    const videos = await RoomVideo.find({ roomId: req.params.roomId }).sort({ createdAt: -1 }).lean();
    res.json(videos);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:roomId/:vidId', auth, async (req, res) => {
  try {
    const { roomId, vidId } = req.params;
    const room = await Room.findOne({ roomId });
    const user = await User.findById(req.user.id);
    const isAdmin = (room && room.admins.some(a => a.toString() === req.user.id)) || user.role === 'admin';
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const video = await RoomVideo.findByIdAndDelete(vidId);
    await ModerationLog.create({
      action: 'delete_video',
      performedBy: req.user.id,
      performedByName: req.user.username,
      roomId,
      targetName: video?.addedByName,
      meta: { videoId: video?.videoId }
    });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
