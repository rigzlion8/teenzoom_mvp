const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: String,
  role: { type: String, enum: ['user','moderator','admin'], default: 'user' },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  mutedUntil: Date,
  avatarUrl: String,
  status: { type: String, default: '' },
  theme: { type: String, default: 'dark' },
  coins: { type: Number, default: 0 },
  lifetimeCoins: { type: Number, default: 0 },
  vipUntil: Date,
  vipLifetime: { type: Boolean, default: false },
  playlist: [{ videoId: String, title: String, thumbnail: String }],
  xp: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
