/* TeenZoom 2.0: Express + Socket.IO + MongoDB + Stripe
   Features: Auth, coins, VIP monthly/lifetime + Stripe $15 purchase, emojis, PMs, friends,
   Moderation, YouTube links (simple), games (tic-tac-toe & trivia), XP + likes, leaderboards.
   Admin seed: Crosslow7 / gtrsupra20252026
*/
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || '*' } });

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teenzoom';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/', express.static(path.join(__dirname, 'public')));

// Models
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const RoomVideo = require('./models/RoomVideo');
const ModerationLog = require('./models/ModerationLog');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/vip', require('./routes/vip'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/payments', require('./routes/payments'));

// helper to verify token
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

// seed admin
async function seedAdmin() {
  const exists = await User.findOne({ username: 'Crosslow7' });
  if (!exists) {
    const passwordHash = await bcrypt.hash('gtrsupra20252026', 10);
    const admin = new User({
      username: 'Crosslow7',
      passwordHash,
      displayName: 'Admin',
      role: 'admin',
      coins: 50000,
      vipLifetime: true,
      xp: 1000
    });
    await admin.save();
    const general = await Room.findOne({ roomId: 'general' });
    if (!general) {
      const r = new Room({ roomId: 'general', name: 'general', admins: [admin._id] });
      await r.save();
    }
    console.log('Seeded admin user Crosslow7');
  }
}

// public endpoint to get last messages for a room
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    verifyToken(token);
    const roomId = req.params.roomId || 'general';
    const messages = await Message.find({ roomId, isPrivate: false }).sort({ createdAt: 1 }).limit(200).lean();
    res.json(messages);
  } catch (err) { console.error(err); res.status(401).json({ message: 'Unauthorized' }); }
});

// simple profile endpoint
app.get('/api/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select('-passwordHash').lean();
    const isVip = user.vipLifetime || (user.vipUntil && new Date(user.vipUntil) > new Date());
    res.json({ ...user, isVip });
  } catch (err) { res.status(401).json({ message: 'Unauthorized' }); }
});

// socket auth middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    const payload = verifyToken(token);
    socket.user = { id: payload.id, username: payload.username };
    return next();
  } catch (err) { console.error('Socket auth failed', err.message); return next(new Error('Authentication error')); }
});

const online = new Map();

// Games state
const tttGames = new Map(); // key: roomId, value: { board:Array(9), turn:'X'|'O', players:{X:userId,O:userId}, usernames:{X,O} }
const triviaRooms = new Map(); // key: roomId, value: { q, a, askedBy, endsAt }

const TRIVIA_QUESTIONS = [
  { q: 'What is 5 + 7?', a: '12' },
  { q: 'Which planet is known as the Red Planet?', a: 'mars' },
  { q: 'What color do you get by mixing blue and yellow?', a: 'green' },
  { q: 'Who wrote "1984"?', a: 'george orwell' }
];

async function assistantReply(message, fromUsername) {
  const text = message.toLowerCase();
  if (text.includes('hello') || text.includes('hi')) return `Hey ${fromUsername}! I'm TeenZoom Assistant. Type @bot help for commands.`;
  if (text.includes('help') || text.includes('commands')) return 'Commands: /w @name msg, /friend @name, /like @name, /ttt @name, /trivia, /answer text, /kick @name, /ban @name, /mute @name [minutes].';
  if (text.includes('rules')) return 'Be kind, no bullying. Mods can mute/ban. Use /like to appreciate others.';
  return "I'm here to help — try '@bot help'.";
}

function tttNewGame(roomId, pX, pO, uX, uO) {
  tttGames.set(roomId, { board: Array(9).fill(null), turn: 'X', players: { X: pX, O: pO }, usernames: { X: uX, O: uO } });
}

function tttPlace(roomId, userId, idx) {
  const g = tttGames.get(roomId);
  if (!g) return { error: 'No game' };
  const role = g.players.X === userId ? 'X' : (g.players.O === userId ? 'O' : null);
  if (!role) return { error: 'Not a player' };
  if (g.turn !== role) return { error: 'Not your turn' };
  if (g.board[idx]) return { error: 'Cell taken' };
  g.board[idx] = role;
  g.turn = role === 'X' ? 'O' : 'X';
  const winner = tttWinner(g.board);
  if (winner || g.board.every(Boolean)) {
    return { done: true, winner, board: g.board.slice() };
  }
  return { board: g.board.slice(), turn: g.turn };
}

function tttWinner(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b2,c] of lines) {
    if (b[a] && b[a]===b[b2] && b[a]===b[c]) return b[a];
  }
  return null;
}

io.on('connection', (socket) => {
  const { id: userId, username } = socket.user;
  online.set(userId, socket.id);
  let joinedRoom = null;

  socket.on('joinRoom', async (roomId) => {
    roomId = roomId || 'general';
    const room = await Room.findOne({ roomId });
    if (room && room.banned.some(b => b.toString() === userId)) {
      socket.emit('system', { message: 'You are banned from this room.' });
      return;
    }
    if (joinedRoom) socket.leave(joinedRoom);
    socket.join(roomId);
    socket.currentRoom = roomId;
    joinedRoom = roomId;
    socket.emit('system', { message: `Joined ${roomId}` });
    io.to(roomId).emit('presence', { user: username, online: true });
  });

  socket.on('typing', () => {
    const room = socket.currentRoom || 'general';
    socket.to(room).emit('typing', { user: username });
  });

  socket.on('stop_typing', () => {
    const room = socket.currentRoom || 'general';
    socket.to(room).emit('stop_typing', { user: username });
  });

  socket.on('message', async (payload) => {
    try {
      const roomId = payload.roomId || socket.currentRoom || 'general';
      const text = payload.text?.trim();
      if (!text) return;

      const me = await User.findById(userId);
      // mute check (room or global)
      const now = new Date();
      if ((me.mutedUntil && me.mutedUntil > now)) { socket.emit('system', { message: 'You are muted.' }); return; }
      const room = await Room.findOne({ roomId });

      // XP for chatting
      me.xp = (me.xp || 0) + 2;
      await me.save();

      // Commands
      if (text.startsWith('/w ')) {
        const parts = text.split(' ');
        const target = parts[1].replace(/^@/,'');
        const messageText = parts.slice(2).join(' ');
        const toUser = await User.findOne({ username: target });
        if (!toUser) { socket.emit('system', { message: 'User not found' }); return; }
        const msg = new Message({ roomId, userId, username, text: messageText, isPrivate: true, toUserId: toUser._id });
        await msg.save();
        socket.emit('private_message', { from: username, to: toUser.username, text: messageText, createdAt: msg.createdAt });
        const toSocketId = online.get(toUser._id.toString());
        if (toSocketId) io.to(toSocketId).emit('private_message', { from: username, to: toUser.username, text: messageText, createdAt: msg.createdAt });
        return;
      }

      if (text.startsWith('/friend ')) {
        const target = text.split(' ')[1].replace(/^@/,'');
        const toUser = await User.findOne({ username: target });
        if (!toUser) { socket.emit('system', { message: 'User not found' }); return; }
        if (toUser.friendRequests.includes(userId) || toUser.friends.includes(userId)) { socket.emit('system', { message: 'Already requested or friends' }); return; }
        toUser.friendRequests.push(userId);
        await toUser.save();
        socket.emit('system', { message: 'Friend request sent' });
        const toSocket = online.get(toUser._id.toString());
        if (toSocket) io.to(toSocket).emit('friend_request', { fromId: userId, fromUsername: username });
        return;
      }

      if (text.startsWith('/like ')) {
        const target = text.split(' ')[1].replace(/^@/,'');
        const toUser = await User.findOne({ username: target });
        if (!toUser) { socket.emit('system', { message: 'User not found' }); return; }
        toUser.likesCount = (toUser.likesCount || 0) + 1;
        await toUser.save();
        io.to(roomId).emit('system', { message: `${username} liked @${toUser.username} ❤️ (total ${toUser.likesCount})` });
        return;
      }

      // Games
      if (text.startsWith('/ttt ')) {
        const opponentName = text.split(' ')[1].replace(/^@/,'');
        const opponent = await User.findOne({ username: opponentName });
        if (!opponent) { socket.emit('system', { message: 'Opponent not found' }); return; }
        tttNewGame(roomId, userId, opponent._id.toString(), username, opponent.username);
        io.to(roomId).emit('system', { message: `Tic-Tac-Toe started: ${username} (X) vs ${opponent.username} (O). Use /place [0-8]` });
        return;
      }
      if (text.startsWith('/place ')) {
        const idx = parseInt(text.split(' ')[1]);
        const res = tttPlace(roomId, userId, idx);
        if (res?.error) { socket.emit('system', { message: res.error }); return; }
        if (res.done) {
          const g = tttGames.get(roomId);
          const winnerRole = res.winner;
          let winMsg = 'Draw!';
          if (winnerRole) {
            const winnerId = g.players[winnerRole];
            const winnerUser = await User.findById(winnerId);
            winnerUser.xp = (winnerUser.xp || 0) + 20;
            await winnerUser.save();
            winMsg = `${g.usernames[winnerRole]} wins and gets +20 XP!`;
          }
          io.to(roomId).emit('system', { message: `Tic-Tac-Toe ended. ${winMsg}` });
          tttGames.delete(roomId);
        } else {
          io.to(roomId).emit('system', { message: `TTT board: ${res.board.map(c=>c||'.').join('')} Next: ${res.turn}` });
        }
        return;
      }

      if (text === '/trivia') {
        const q = TRIVIA_QUESTIONS[Math.floor(Math.random()*TRIVIA_QUESTIONS.length)];
        triviaRooms.set(roomId, { q: q.q, a: q.a, askedBy: username, endsAt: Date.now()+60000 });
        io.to(roomId).emit('system', { message: `Trivia: ${q.q} (answer with /answer your_text)` });
        return;
      }
      if (text.startsWith('/answer ')) {
        const ans = text.slice(8).trim().toLowerCase();
        const T = triviaRooms.get(roomId);
        if (!T) { socket.emit('system', { message: 'No trivia running' }); return; }
        if (Date.now() > T.endsAt) { triviaRooms.delete(roomId); io.to(roomId).emit('system',{message:'Trivia ended — time up.'}); return; }
        if (ans === T.a) {
          me.xp = (me.xp || 0) + 15;
          await me.save();
          triviaRooms.delete(roomId);
          io.to(roomId).emit('system', { message: `${username} answered correctly! +15 XP` });
        } else {
          socket.emit('system', { message: 'Wrong answer, try again!' });
        }
        return;
      }

      if (text.startsWith('@bot')) {
        const ask = text.replace('@bot', '').trim();
        const reply = await assistantReply(ask, username);
        const msg = new Message({ roomId, userId: null, username: 'TeenZoomBot', text: reply });
        await msg.save();
        io.to(roomId).emit('message', { _id: msg._id, roomId: msg.roomId, username: msg.username, text: msg.text, createdAt: msg.createdAt });
        return;
      }

      if (text.startsWith('/kick ') || text.startsWith('/ban ') || text.startsWith('/mute ')) {
        const parts = text.split(' ');
        const cmd = parts[0].slice(1);
        const target = parts[1].replace(/^@/,'');
        const minutes = parseInt(parts[2]) || 0;
        const targetUser = await User.findOne({ username: target });
        if (!targetUser) { socket.emit('system', { message: 'User not found' }); return; }
        const isAdmin = (room && room.admins && room.admins.some(a => a.toString() === userId)) || (me.role === 'admin');
        if (!isAdmin) { socket.emit('system', { message: 'No permission' }); return; }
        const targetSocketId = online.get(targetUser._id.toString());
        if (cmd === 'kick') {
          if (targetSocketId) io.sockets.sockets.get(targetSocketId)?.leave(roomId);
          io.to(roomId).emit('system', { message: `${target} was kicked by ${username}` });
          await ModerationLog.create({ action: 'kick', performedBy: me._id, performedByName: username, targetUser: targetUser._id, targetName: targetUser.username, roomId });
          return;
        }
        if (cmd === 'ban') {
          room.banned = room.banned || [];
          room.banned.push(targetUser._id);
          await room.save();
          if (targetSocketId) io.sockets.sockets.get(targetSocketId)?.leave(roomId);
          io.to(roomId).emit('system', { message: `${target} was banned by ${username}` });
          await ModerationLog.create({ action: 'ban', performedBy: me._id, performedByName: username, targetUser: targetUser._id, targetName: targetUser.username, roomId });
          return;
        }
        if (cmd === 'mute') {
          const until = new Date(Date.now() + (minutes || 10) * 60000);
          targetUser.mutedUntil = until;
          await targetUser.save();
          io.to(roomId).emit('system', { message: `${target} was muted by ${username} for ${minutes || 10} minutes` });
          await ModerationLog.create({ action: 'mute', performedBy: me._id, performedByName: username, targetUser: targetUser._id, targetName: targetUser.username, roomId, meta: { until } });
          return;
        }
      }

      const msg = new Message({ roomId, userId, username, text });
      await msg.save();
      const payloadOut = { _id: msg._id, roomId: msg.roomId, username: msg.username, text: msg.text, createdAt: msg.createdAt };
      io.to(roomId).emit('message', payloadOut);
    } catch (err) { console.error(err); }
  });

  socket.on('disconnect', () => {
    online.delete(userId);
    const room = socket.currentRoom || 'general';
    io.to(room).emit('presence', { user: username, online: false });
  });
});

// COIN + XP AWARDER (1 coin per minute)
const COIN_INTERVAL_MS = 60 * 1000;
setInterval(async () => {
  try {
    for (const [userId] of online.entries()) {
      try {
        const user = await User.findById(userId);
        if (!user) continue;
        user.coins = (user.coins || 0) + 1;
        user.lifetimeCoins = (user.lifetimeCoins || 0) + 1;
        user.xp = (user.xp || 0) + 1;
        await user.save();
        const sid = online.get(userId);
        if (sid) io.to(sid).emit('coins:update', { coins: user.coins, lifetimeCoins: user.lifetimeCoins, xp: user.xp });
      } catch (e) { console.error('coin-award error for', userId, e); }
    }
  } catch (err) { console.error('coin interval error', err); }
}, COIN_INTERVAL_MS);

// Try to connect to MongoDB with better error handling
async function connectToMongo() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (err.code === 18) { // AuthenticationFailed
      console.log('Authentication failed. Trying alternative connection...');
      try {
        // Try connecting without authentication
        await mongoose.connect('mongodb://127.0.0.1:27017/teenzoom', { 
          useNewUrlParser: true, 
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000
        });
        console.log('MongoDB connected without authentication');
        return true;
      } catch (err2) {
        console.error('Alternative connection also failed:', err2.message);
        return false;
      }
    }
    return false;
  }
}

// Connect to MongoDB and start server
connectToMongo()
  .then(async (connected) => {
    if (connected) {
      await seedAdmin(); 
      server.listen(PORT, () => console.log(`TeenZoom running on ${PORT}`));
    } else {
      console.error('Failed to connect to MongoDB. Server not started.');
      process.exit(1);
    }
  })
  .catch(err => console.error('Server startup error:', err));
