const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  name: String,
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  banned: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  muted: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, until: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
