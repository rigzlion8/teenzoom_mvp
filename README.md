# TeenZoom 2.0 — Full Stack Real-time Chat Application

A feature-rich real-time chat application built with Node.js, Express, Socket.IO, MongoDB, and Stripe integration.

## Features

- **Authentication**: User signup/login with JWT tokens
- **Real-time Chat**: Live messaging with Socket.IO
- **VIP System**: Monthly (3,000 coins) and Lifetime (15,000 coins or $15 via Stripe)
- **Virtual Economy**: Coins earned at 1 per minute while online
- **XP System**: Experience points for chatting and winning games
- **Games**: Tic-tac-toe and trivia with XP rewards
- **Social Features**: Friend requests, private messages, likes
- **Moderation**: Kick, ban, mute commands for admins
- **YouTube Integration**: Share and manage videos in rooms
- **Leaderboards**: Top XP and most liked users
- **Responsive Design**: Mobile-friendly interface
- **Admin Panel**: Seeded admin user with full permissions

## Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **File Uploads**: Multer
- **Payments**: Stripe integration
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time**: Socket.IO for live updates

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Stripe account (optional, for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd teenzoom_mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=4000
   MONGO_URI=mongodb://127.0.0.1:27017/teenzoom
   JWT_SECRET=your_very_secure_jwt_secret_here
   CLIENT_URL=http://localhost:4000
   PUBLIC_URL=http://localhost:4000
   UPLOAD_DIR=./uploads
   STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud instance
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open `http://localhost:4000` in your browser
   - Use the seeded admin account:
     - Username: `Crosslow7`
     - Password: `gtrsupra20252026`

## Commands & Features

### Chat Commands
- `/w @username message` - Send private message
- `/friend @username` - Send friend request
- `/like @username` - Give a like to a user
- `/ttt @username` - Start tic-tac-toe game
- `/place 0-8` - Make a move in tic-tac-toe
- `/trivia` - Start trivia game
- `/answer text` - Answer trivia question
- `@bot help` - Get bot assistance

### Moderation Commands (Admin/Mod only)
- `/kick @username` - Kick user from room
- `/ban @username` - Ban user from room
- `/mute @username [minutes]` - Mute user temporarily

### Game Instructions
- **Tic-tac-toe**: Use `/ttt @username` to challenge, then `/place 0-8` for moves
- **Trivia**: Use `/trivia` to start, then `/answer your_answer` to respond
- **Board positions**: 0-8 representing 3x3 grid (0=top-left, 8=bottom-right)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/me` - Get current user profile
- `POST /api/upload/avatar` - Upload avatar image
- `POST /api/upload/status` - Update status/theme

### VIP & Payments
- `POST /api/vip/purchase` - Buy VIP with coins
- `GET /api/vip/status` - Get VIP status
- `POST /api/payments/checkout/lifetime` - Stripe checkout for $15 lifetime VIP
- `POST /api/payments/webhook` - Stripe webhook handler

### Social Features
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept friend request

### Rooms & Content
- `GET /api/rooms` - List available rooms
- `POST /api/rooms` - Create new room
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/videos` - Add YouTube video to room
- `GET /api/videos/:roomId` - Get room videos

### Leaderboards
- `GET /api/leaderboard/top-xp` - Top XP users
- `GET /api/leaderboard/most-liked` - Most liked users

## Stripe Integration

### Setup
1. Create a Stripe account
2. Get your test secret key
3. Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`
4. Configure webhook endpoint: `POST {PUBLIC_URL}/api/payments/webhook`
5. Select event: `checkout.session.completed`

### Webhook Security
For production, implement webhook signature verification:
```javascript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
```

## Deployment

### Render (Recommended)
1. Push code to GitHub
2. Create new Web Service on Render
3. Build command: `npm install`
4. Start command: `node server.js`
5. Set environment variables in Render dashboard

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/teenzoom
JWT_SECRET=very_long_random_string_here
PUBLIC_URL=https://your-app.onrender.com
STRIPE_SECRET_KEY=sk_live_your_live_key_here
```

## Project Structure

```
teenzoom_mvp/
├── models/                 # MongoDB schemas
│   ├── User.js           # User model
│   ├── Message.js        # Chat messages
│   ├── Room.js           # Chat rooms
│   ├── RoomVideo.js      # YouTube videos
│   └── ModerationLog.js  # Moderation actions
├── routes/                # API endpoints
│   ├── auth.js           # Authentication
│   ├── friends.js        # Friend system
│   ├── rooms.js          # Room management
│   ├── upload.js         # File uploads
│   ├── vip.js            # VIP purchases
│   ├── videos.js         # Video management
│   ├── leaderboard.js    # Rankings
│   └── payments.js       # Stripe integration
├── public/                # Frontend files
│   ├── index.html        # Main page
│   ├── app.js            # Frontend logic
│   ├── style.css         # Styling
│   ├── payment-success.html
│   └── payment-cancel.html
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example          # Environment template
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the admin user for system status

---

**TeenZoom 2.0** - Building the future of teen social networking! 🚀
