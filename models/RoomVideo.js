const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomVideoSchema = new Schema({
  roomId: { type: String, required: true },
  videoId: { type: String, required: true },
  title: String,
  thumbnail: String,
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  addedByName: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomVideo', RoomVideoSchema);
