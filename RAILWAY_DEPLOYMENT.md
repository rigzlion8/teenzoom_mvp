# 🚂 Railway Deployment Guide for TeenZoom v2.0

This guide will walk you through deploying TeenZoom v2.0 to Railway, which provides full WebSocket support for real-time chat functionality.

## 🎯 Why Railway?

- **Full WebSocket Support**: Unlike Vercel, Railway supports persistent connections
- **Node.js Native**: Perfect for Socket.IO and real-time features
- **Easy Scaling**: Automatic scaling based on traffic
- **Database Integration**: Easy MongoDB and Redis setup
- **Custom Domains**: Support for custom domains and SSL

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your TeenZoom v2.0 code should be on GitHub
3. **MongoDB Atlas**: Your existing MongoDB database
4. **Redis**: Your existing Redis instance

## 🚀 Step-by-Step Deployment

### Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `teenzoom_mvp` repository
5. Select the `teenzoomv2.0` branch

### Step 2: Configure Environment Variables

In your Railway project dashboard, add these environment variables:

```bash
# Database
DATABASE_URL=mongodb+srv://rigzadmin:2794HSZxT6VTZZe@cluster0.9em0pjh.mongodb.net/teenzoom-v2?retryWrites=true&w=majority&appName=Cluster0

# NextAuth.js
NEXTAUTH_URL=https://your-app-name.railway.app
NEXTAUTH_SECRET=bc62572a587715db4734811f25f1916e1139528ed8d320ac

# Redis
REDIS_URL=redis://default:dWzChAsOiyQMFJszMpAMqedLmlEdarID@interchange.proxy.rlwy.net:39610

# Paystack
PAYSTACK_SECRET_KEY=sk_test_bc3485c741238b6e69969f67f4c4ef7ca86eed25
PAYSTACK_PUBLIC_KEY=pk_test_9772109181402da3c5124f51cfce7085dbf743d6

# Resend
RESEND_API_KEY=re_FFgo8GU7_GSCnEmghKHiXez57rcHBFzhH
FROM_EMAIL=noreply@maishatech.co.ke

# Cloudinary
CLOUDINARY_NAME=dsjptulx6
CLOUDINARY_KEY=921969172333543
CLOUDINARY_SECRET=kdhF5kyMzTqQz2oez4pMCljK-kA
CLOUDINARY_URL=cloudinary://921969172333543:kdhF5kyMzTqQz2oez4pMCljK-kA@dsjptulx6
CLOUDINARY_UPLOAD_PRESET=teenzoom_uploads
CLOUDINARY_FOLDER=teenzoom

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.railway.app
NEXT_PUBLIC_APP_NAME=TeenZoom v2.0

# Node Environment
NODE_ENV=production
```

### Step 3: Deploy

1. Railway will automatically detect your Next.js app
2. Click "Deploy" to start the build process
3. Wait for the build to complete (usually 5-10 minutes)

### Step 4: Configure Custom Domain (Optional)

1. In your Railway project, go to "Settings" → "Domains"
2. Add your custom domain (e.g., `teenzoom.com`)
3. Update your DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use your custom domain

## 🔧 Railway-Specific Configuration

### Port Configuration
Railway automatically provides a `PORT` environment variable. Our code is already configured to use it:

```typescript
// src/lib/socket-server.ts
const serverPort = port || parseInt(process.env.PORT || '3002', 10)
```

### Build Configuration
Railway uses the `railway.json` file we created to configure the build and deployment.

## 🌐 WebSocket Support

Once deployed on Railway, your Socket.IO implementation will work perfectly:

- **Real-time Chat**: Full WebSocket support for instant messaging
- **Typing Indicators**: Real-time typing status updates
- **User Presence**: Online/offline status tracking
- **Room Management**: Dynamic room joining/leaving

## 📱 Testing the Deployment

1. **Visit your app**: `https://your-app-name.railway.app`
2. **Sign up/Login**: Test user authentication
3. **Join a chat room**: Navigate to `/room/general`
4. **Test real-time features**: Send messages, see typing indicators

## 🔍 Monitoring & Logs

- **Railway Dashboard**: Monitor app performance and logs
- **Real-time Logs**: View live application logs
- **Metrics**: Track response times and error rates
- **Scaling**: Automatic scaling based on traffic

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**: Check Railway logs for build errors
2. **Environment Variables**: Ensure all required variables are set
3. **Database Connection**: Verify MongoDB connection string
4. **Port Issues**: Railway handles ports automatically

### Getting Help:

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: Railway Discord server
- **Support**: Railway support team

## 💰 Pricing

Railway offers a generous free tier:
- **Free Tier**: $5/month credit (usually covers small apps)
- **Pay-as-you-go**: Only pay for what you use
- **Scaling**: Automatic scaling with usage

## 🎉 Success!

Once deployed, you'll have:
- ✅ Full WebSocket support for real-time chat
- ✅ Scalable Node.js hosting
- ✅ Professional-grade infrastructure
- ✅ Real-time TeenZoom v2.0 platform

Your users will now experience the full real-time chat functionality that wasn't possible on Vercel!
