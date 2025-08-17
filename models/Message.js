const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  roomId: { type: String, default: 'general' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: String,
  text: String,
  isPrivate: { type: Boolean, default: false },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  reactions: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, emoji: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
