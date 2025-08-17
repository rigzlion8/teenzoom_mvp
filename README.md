# TeenZoom v2.0 🚀

**Next Generation Teen Social Platform**

A modern, secure, and feature-rich social platform built for teens with cutting-edge technology.

## ✨ Features

- **Real-time Chat**: Instant messaging with friends in private or public rooms
- **Video Sharing**: Share and watch videos with your community
- **Community Building**: Join rooms, make friends, and build connections
- **Rewards System**: Earn coins, XP, and unlock VIP features
- **Safe & Secure**: Built with security and moderation in mind
- **Lightning Fast**: Built with Next.js 15 and modern technologies

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Framer Motion** - Smooth animations and transitions

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication and session management
- **Prisma** - Type-safe database ORM
- **MongoDB** - NoSQL database for scalability
- **Redis** - In-memory data store for caching and sessions

### Payment & Communication
- **Paystack** - Nigerian payment gateway
- **Resend** - Modern email API for notifications
- **Cloudinary** - Cloud-based media management

### Development & Deployment
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Vercel** - Deployment and hosting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Redis instance
- Paystack account
- Resend account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd teenzoom_mvp
   git checkout teenzoomv2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your_mongodb_connection_string"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Redis
REDIS_URL="redis://localhost:6379"

# Paystack
PAYSTACK_SECRET_KEY="your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="your_paystack_public_key"

# Resend
RESEND_API_KEY="your_resend_api_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="TeenZoom v2.0"
```

## 📁 Project Structure

```
teenzoom_mvp/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── room/              # Chat rooms
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── redis.ts          # Redis client
│   │   └── utils.ts          # Utility functions
│   └── hooks/                # Custom React hooks
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## 🗄️ Database Schema

The application uses Prisma with MongoDB and includes models for:

- **Users**: Authentication, profiles, and stats
- **Rooms**: Chat rooms and communities
- **Messages**: Real-time chat messages
- **Friendships**: User connections and relationships
- **Payments**: Transaction history and Paystack integration
- **Moderation**: Content moderation and user management

## 🔐 Authentication

- **NextAuth.js** for session management
- **Credentials provider** for username/password login
- **JWT tokens** for secure authentication
- **Protected routes** for authenticated users only

## 💰 Payment Integration

- **Paystack** for Nigerian payment processing
- **Coin system** for in-app currency
- **VIP features** and premium subscriptions
- **Secure transaction handling**

## 📧 Email Notifications

- **Resend** for modern email delivery
- **Welcome emails** for new users
- **Password reset** functionality
- **Notification preferences**

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up reverse proxy (nginx/Apache)

## 📱 Features Roadmap

### Phase 1 (Current)
- ✅ User authentication and profiles
- ✅ Basic chat rooms
- ✅ User dashboard and stats
- ✅ Responsive design

### Phase 2 (Next)
- 🔄 Real-time WebSocket chat
- 🔄 Video upload and sharing
- 🔄 Friend system and requests
- 🔄 Room creation and management

### Phase 3 (Future)
- 📋 Advanced moderation tools
- 📋 Mobile app (React Native)
- 📋 AI-powered content filtering
- 📋 Advanced analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## 🙏 Acknowledgments

- **Next.js team** for the amazing framework
- **Vercel** for hosting and deployment
- **shadcn/ui** for beautiful components
- **Prisma** for the excellent ORM
- **TeenZoom community** for feedback and support

---

**Built with ❤️ for the next generation of teen social platforms**
