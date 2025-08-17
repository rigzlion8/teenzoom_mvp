const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModLogSchema = new Schema({
  action: String,
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
  targetName: String,
  roomId: String,
  reason: String,
  meta: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ModerationLog', ModLogSchema);
