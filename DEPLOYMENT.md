# Deployment Guide - Render (Backend) + Vercel (Frontend)

Complete deployment guide for Millenium Potters LMS monorepo - NEW deployments from monorepo.

---

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database ready (Supabase, Neon, Railway, or Render)
- [ ] Cloudinary account created (for file uploads)
- [ ] Environment variables prepared
- [ ] Code tested locally
- [ ] GitHub repository updated

---

## 🗄️ Step 1: Database Setup

### **Option A: Supabase (Free, Recommended)**

1. Go to https://supabase.com
2. Create new project
3. Wait 2-3 minutes for provisioning
4. Go to **Settings → Database**
5. Copy connection strings:
   - **Transaction pooler** (for DATABASE_URL)
   - **Direct connection** (for DIRECT_URL)

### **Option B: Neon (Free Alternative)**

1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Use same string for both DATABASE_URL and DIRECT_URL

### **Option C: Railway ($5/month)**

1. Go to https://railway.app
2. Create PostgreSQL database
3. Copy connection string from database settings

### **Option D: Render PostgreSQL**

1. In Render dashboard → **New +** → **PostgreSQL**
2. Name: `millenium-db`
3. Choose plan (Free for 90 days, then $7/month)
4. Copy **Internal Database URL** (for DATABASE_URL)
5. Copy **External Database URL** (for DIRECT_URL)

---

## 🚀 Step 2: Deploy Backend to Render

### **2.1 Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your GitHub

### **2.2 Create Backend Web Service**
1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `Tee-David/Millenium-Potters`
3. Configure service:

**Basic Settings:**
- **Name**: `millenium-backend`
- **Region**: Choose closest to your users (e.g., Oregon, Ohio, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- **Free** (for testing, sleeps after 15 min inactivity)
- **Starter $7/month** (recommended for production, no sleep)

### **2.3 Add Backend Environment Variables**

Click **Environment** tab and add:

```bash
# Database (from Step 1)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server
NODE_ENV=production
PORT=5000

# CORS (will update after frontend deployment)
CORS_ORIGIN=https://millenium-frontend.onrender.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/data/uploads
```

**To generate JWT secrets:**
```bash
# On your computer
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2.4 Deploy Backend**
1. Click **Create Web Service**
2. Wait 3-5 minutes for deployment
3. Check logs for errors
4. Your API will be at: `https://millenium-backend.onrender.com`

### **2.5 Test Backend**
```bash
curl https://millenium-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2026-01-09T...",
  "version": "1.0.0"
}
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### **3.1 Create Vercel Account**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### **3.2 Import Monorepo Project**
1. Click **Add New** → **Project**
2. Import `Tee-David/Millenium-Potters` repository
3. Click **Import**

### **3.3 Configure Project Settings** ⚠️ **CRITICAL**

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** ⚠️ Click **Edit** and set to `frontend`

**Build Settings:**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node Version**: 18.x (default)

### **3.4 Add Frontend Environment Variables**

Click **Environment Variables** tab and add:

```bash
# Backend API URL (from Step 2)
NEXT_PUBLIC_API_URL=https://millenium-backend.onrender.com/api

# Optional: Analytics, etc.
# NEXT_PUBLIC_GOOGLE_ANALYTICS=UA-XXXXX-X
```

**⚠️ Important:**
- All frontend env variables must start with `NEXT_PUBLIC_`
- They are exposed to the browser (don't put secrets here)
- Set for **Production**, **Preview**, and **Development** environments

### **3.5 Deploy Frontend**
1. Click **Deploy**
2. Wait 2-3 minutes for build and deployment
3. Your frontend will be at: `https://millenium-potters.vercel.app`
4. Vercel provides a custom URL (you can add custom domain later)

### **3.6 Update Backend CORS**
1. Go back to Render backend service
2. Go to **Environment** tab
3. Update `CORS_ORIGIN` environment variable:
   ```bash
   CORS_ORIGIN=https://millenium-potters.vercel.app
   ```
4. Save (backend will auto-redeploy ~3 min)

---

## ✅ Step 4: Verify Deployment

### **4.1 Test Backend API**
```bash
# Health check
curl https://millenium-backend.onrender.com/health

# API health
curl https://millenium-backend.onrender.com/api/health
```

### **4.2 Test Frontend**
1. Open `https://millenium-frontend.onrender.com`
2. Try logging in
3. Check browser console for errors
4. Verify API calls are working

### **4.3 Test Full Flow**
- [ ] User registration works
- [ ] Login works
- [ ] Dashboard loads
- [ ] API calls succeed (check Network tab)
- [ ] File uploads work (Cloudinary)
- [ ] No CORS errors in console

---

## 🔧 Troubleshooting

### **Backend Issues**

**Issue: "Database connection failed"**
```bash
# Check DATABASE_URL and DIRECT_URL are correct
# Ensure database is accessible from Render
# Check Supabase/Neon hasn't paused
```

**Issue: "Module not found" errors**
```bash
# Ensure Root Directory is set to "backend"
# Check build command includes: npm install && npx prisma generate
# Verify all dependencies are in backend/package.json
```

**Issue: "Migrations failed"**
```bash
# Option 1: Use: npx prisma db push (in build command)
# Option 2: Use: npx prisma migrate deploy
# Check database is empty or has compatible schema
```

**Issue: CORS errors**
```bash
# Update CORS_ORIGIN in backend to match frontend URL
# Include protocol: https://millenium-frontend.onrender.com
# No trailing slash
# Wait for backend to redeploy after changing env var
```

### **Frontend Issues (Vercel)**

**Issue: "API calls fail"**
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Include /api at the end: https://backend.onrender.com/api
# Check backend CORS allows your frontend domain
# Check backend is running (not sleeping on Render free tier)
```

**Issue: "Environment variables not working"**
```bash
# Ensure variables start with NEXT_PUBLIC_
# Redeploy after adding env variables
# Check they're set for Production environment
# Variables are baked into build - redeploy to update
```

**Issue: "Build fails"**
```bash
# Check Root Directory is set to "frontend" ⚠️ MOST COMMON
# Ensure all dependencies are in frontend/package.json
# Check Vercel build logs for specific errors
# Verify Node version compatibility (18+)
```

**Issue: "Page loads but broken styling"**
```bash
# Check build completed successfully
# Verify .next folder was created (check build logs)
# Check browser console for CSS errors
# Hard refresh (Ctrl+Shift+R)
# Check Tailwind CSS is building properly
```

**Issue: "Old Vercel project still showing"**
```bash
# Disconnect old repository in Settings → Git
# Connect new monorepo: Tee-David/Millenium-Potters
# Set Root Directory to "frontend"
# Redeploy
# See VERCEL_UPDATE_GUIDE.md for details
```

---

## 🔄 Continuous Deployment

### **Automatic Deployments**

Both platforms auto-deploy when you push to GitHub:

```bash
# Make changes to backend or frontend
git add .
git commit -m "Your changes"
git push origin main

# Render detects changes in backend/ and deploys backend (~3-5 min)
# Vercel detects changes in frontend/ and deploys frontend (~2-3 min)
```

### **Manual Deployments**

**Backend (Render):**
1. Go to Render backend service dashboard
2. Click **Manual Deploy** → **Deploy latest commit**

**Frontend (Vercel):**
1. Go to Vercel project dashboard
2. Click **Deployments** tab
3. Click **Redeploy** on any deployment

---

## 📊 Monitoring

### **Backend Monitoring (Render)**
- **Logs**: Service → **Logs** tab (real-time)
- **Metrics**: Service → **Metrics** tab (CPU, memory, bandwidth)
- **Events**: Service → **Events** tab (deployments, crashes)
- **Alerts**: Service → **Settings** → **Notifications**

### **Frontend Monitoring (Vercel)**
- **Deployment Logs**: Project → **Deployments** → Click deployment
- **Runtime Logs**: Project → **Logs** tab (real-time)
- **Analytics**: Project → **Analytics** tab (page views, performance)
- **Speed Insights**: Automatic Web Vitals tracking

### **Set Up Alerts**

**Render (Backend):**
1. Go to service **Settings** → **Notifications**
2. Add email or Slack webhook
3. Get notified on deploy failures, crashes, high memory usage

**Vercel (Frontend):**
1. Go to project **Settings** → **Notifications**
2. Configure deployment notifications
3. Get notified on build failures and deployment status

---

## 💰 Cost Breakdown

### **Free Tier (Good for Testing)**
```
Database: Supabase Free (500MB)            $0
Backend: Render Free Web Service           $0
Frontend: Vercel Hobby (Free)              $0
Cloudinary: Free tier (25GB/month)        $0
─────────────────────────────────────────────
Total:                                     $0/month
```

**Limitations:**
- Backend sleeps after 15 min inactivity (30s wake time)
- Render: 750 hours/month free (enough for 1 service 24/7)
- Vercel: Unlimited deployments, 100GB bandwidth/month

### **Production Setup (No Sleep)**
```
Database: Supabase Free (500MB)            $0
Backend: Render Starter                    $7/month
Frontend: Vercel Pro (optional)            $20/month
Cloudinary: Free tier                      $0
─────────────────────────────────────────────
Total:                                     $7-27/month
```

**Note:** Vercel Hobby (free) is fine for production. Pro adds team features, analytics, and priority support.

### **Recommended Production Setup**
```
Database: Supabase Pro (8GB)               $25/month
Backend: Render Starter                    $7/month
Frontend: Vercel Pro                       $20/month
Cloudinary: Free tier                      $0
─────────────────────────────────────────────
Total:                                     $52/month
```

### **Budget Production Setup (Recommended)**
```
Database: Neon Free (512MB)                $0
Backend: Render Starter                    $7/month
Frontend: Vercel Hobby (Free)              $0
Cloudinary: Free tier                      $0
─────────────────────────────────────────────
Total:                                     $7/month
```

**Best value!** Only pay for backend hosting, everything else free.

---

## 🌍 Custom Domains (Optional)

### **Backend Domain**
1. Buy domain (Namecheap, Google Domains, etc.)
2. Backend Service → **Settings** → **Custom Domains**
3. Add domain: `api.millenniumpotters.com`
4. Update DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: `millenium-backend.onrender.com`
5. Wait for SSL (~10 min)

### **Frontend Domain**
1. Frontend Service → **Settings** → **Custom Domains**
2. Add domain: `app.millenniumpotters.com` or `millenniumpotters.com`
3. Update DNS:
   - Type: `CNAME`
   - Name: `app` (or `@` for root domain)
   - Value: `millenium-frontend.onrender.com`
4. Wait for SSL (~10 min)

**Then update environment variables:**

Backend CORS:
```bash
CORS_ORIGIN=https://app.millenniumpotters.com
```

Frontend API URL:
```bash
NEXT_PUBLIC_API_URL=https://api.millenniumpotters.com/api
```

---

## 🔐 Security Checklist

- [ ] Strong JWT secrets (64+ random characters)
- [ ] Database credentials not in code
- [ ] CORS restricted to your frontend domain
- [ ] HTTPS enforced (automatic on Render)
- [ ] Rate limiting enabled (already in backend)
- [ ] Cloudinary credentials secure
- [ ] No sensitive data in frontend env variables
- [ ] Environment variables set correctly
- [ ] Services on latest Node version (18+)

---

## 📝 Post-Deployment Tasks

1. **Create Admin User**
   ```bash
   # Use backend seed script or API
   # POST to /api/auth/register with admin role
   ```

2. **Test All Features**
   - User registration
   - Loan creation
   - Repayment recording
   - File uploads
   - Reports generation

3. **Set Up Monitoring**
   - Enable Render notifications
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (optional: Sentry)

4. **Backup Strategy**
   - Supabase: Enable daily backups (paid tier)
   - Or: Set up pg_dump cron job

5. **Performance Optimization**
   - Monitor service metrics
   - Upgrade if needed
   - Enable caching where appropriate

---

## 🚨 Emergency Rollback

**If deployment breaks:**

### **Backend (Render)**
```bash
# In Render dashboard:
1. Go to backend service → Deployments tab
2. Find last working deployment
3. Click "..." → "Redeploy"
```

### **Frontend (Vercel)**
```bash
# In Vercel dashboard:
1. Go to project → Deployments tab
2. Find last working deployment
3. Click "..." → "Redeploy"
```

---

## ⚡ Performance Tips

### **Reduce Backend Cold Starts (Render Free Tier)**
Render free tier sleeps after 15 min. To keep backend warm:

1. **Use Cron Job** (External)
   - Sign up at https://cron-job.org
   - Create job to ping every 10 minutes:
     - `https://millenium-backend.onrender.com/health`

2. **Upgrade to Render Starter**
   - $7/month for backend
   - No sleep, instant response

**Note:** Vercel doesn't sleep - frontend is always fast!

### **Optimize Build Times**
```bash
# Backend build command (faster):
npm install --production && npx prisma generate && npx prisma migrate deploy && npm run build

# Frontend build command (faster):
npm ci && npm run build
```

---

## 📞 Support

**Render:** https://render.com/docs
**Vercel:** https://vercel.com/docs
**Supabase:** https://supabase.com/docs
**Neon:** https://neon.tech/docs
**Next.js:** https://nextjs.org/docs
**Prisma:** https://prisma.io/docs

**Communities:**
- Render: https://community.render.com
- Vercel: https://vercel.com/discord

---

## ✨ Done!

Your app is now live:
- **Backend API**: https://millenium-backend.onrender.com/api (Render)
- **Frontend**: https://millenium-potters.vercel.app (Vercel)

**Best of both platforms:**
- Render: Reliable backend hosting with database proximity
- Vercel: Lightning-fast frontend with edge network

**Next Steps:**
1. Test the full application flow
2. Share with stakeholders
3. Monitor performance on both platforms
4. Scale as needed (upgrade Render backend if needed)
5. Consider custom domains

---

## 🆚 Why This Setup?

### **Render (Backend)**
- ✅ Excellent for Node.js/Express APIs
- ✅ Close proximity to database
- ✅ Built-in health checks and monitoring
- ✅ Free tier for testing
- ✅ Easy PostgreSQL integration
- ✅ Automatic HTTPS

### **Vercel (Frontend)**
- ✅ **Best** Next.js hosting (made by Next.js creators)
- ✅ Lightning-fast edge network (CDN)
- ✅ Instant deployments (~2 min vs ~5 min)
- ✅ Built-in analytics and Web Vitals
- ✅ Generous free tier (unlimited projects)
- ✅ Zero cold starts

### **Alternative: All on Render**
You could host both on Render, but Vercel is significantly better for Next.js applications.

---

*Deployment completed! Backend on Render, Frontend on Vercel! 🎉*
