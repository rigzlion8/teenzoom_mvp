# 🚨 Railway Environment Variables Update

## **Immediate Fixes Required:**

### 1. Fix NEXTAUTH_URL Warning

**Current Issue:** NextAuth.js is warning about missing NEXTAUTH_URL

**Solution:** In Railway Dashboard → Variables, update:
```bash
NEXTAUTH_URL=https://your-actual-railway-app-url.railway.app
NEXT_PUBLIC_APP_URL=https://your-actual-railway-app-url.railway.app
```

**How to find your Railway URL:**
1. Go to Railway Dashboard
2. Click on your project
3. Look for the "Deployments" tab
4. Copy the URL from the latest deployment

### 2. Fix Resend Email Domain Error

**Current Issue:** `The teenzoom.com domain is not verified`

**Option A: Verify Your Domain (Recommended)**
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add `teenzoom.com` domain
3. Follow DNS verification steps
4. Wait for verification (usually 24-48 hours)

**Option B: Use Test Domain (Quick Fix)**
Update in Railway Variables:
```bash
FROM_EMAIL=onboarding@resend.dev
```

### 3. Update All Environment Variables

**Complete Railway Environment Variables:**
```bash
# Database
DATABASE_URL=mongodb+srv://rigzadmin:2794HSZxT6VTZZe@cluster0.9em0pjh.mongodb.net/teenzoom-v2?retryWrites=true&w=majority&appName=Cluster0

# NextAuth.js
NEXTAUTH_URL=https://your-actual-railway-app-url.railway.app
NEXTAUTH_SECRET=bc62572a587715db4734811f25f1916e1139528ed8d320ac

# Redis
REDIS_URL=redis://default:dWzChAsOiyQMFJszMpAMqedLmlEdarID@interchange.proxy.rlwy.net:39610

# Paystack
PAYSTACK_SECRET_KEY=sk_test_bc3485c741238b6e69969f67f4c4ef7ca86eed25
PAYSTACK_PUBLIC_KEY=pk_test_9772109181402da3c5124f51cfce7085dbf743d6

# Resend
RESEND_API_KEY=re_FFgo8GU7_GSCnEmghKHiXez57rcHBFzhH
FROM_EMAIL=onboarding@resend.dev

# Cloudinary
CLOUDINARY_NAME=dsjptulx6
CLOUDINARY_KEY=921969172333543
CLOUDINARY_SECRET=kdhF5kyMzTqQz2oez4pMCljK-kA
CLOUDINARY_URL=cloudinary://921969172333543:kdhF5kyMzTqQz2oez4pMCljK-kA@dsjptulx6
CLOUDINARY_UPLOAD_PRESET=teenzoom_uploads
CLOUDINARY_FOLDER=teenzoom

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-actual-railway-app-url.railway.app
NEXT_PUBLIC_APP_NAME=TeenZoom v2.0

# Node Environment
NODE_ENV=production
```

## **After Updating Variables:**

1. **Redeploy** your Railway app (it will auto-redeploy)
2. **Test signup/login** again
3. **Check logs** for any remaining errors
4. **Test real-time chat** functionality

## **Expected Results:**

- ✅ No more NEXTAUTH_URL warnings
- ✅ Successful email sending (if using test domain)
- ✅ Full WebSocket support for real-time chat
- ✅ Complete TeenZoom v2.0 functionality
