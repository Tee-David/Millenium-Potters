# Deployment Guide - Render + Vercel

Complete deployment guide for Millenium Potters LMS monorepo.

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

---

## 🚀 Step 2: Deploy Backend to Render

### **2.1 Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your GitHub

### **2.2 Create Web Service**
1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `Tee-David/Millenium-Potters`
3. Configure service:

**Basic Settings:**
- **Name**: `millenium-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- **Free** (for testing) or **Starter $7/month** (for production)

### **2.3 Add Environment Variables**

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
CORS_ORIGIN=https://your-frontend-url.vercel.app

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

### **2.4 Deploy**
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

### **3.2 Import Project**
1. Click **Add New** → **Project**
2. Import `Tee-David/Millenium-Potters` repository
3. Configure project:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `frontend` (IMPORTANT: Click "Edit" and set this!)

**Build Settings:**
- **Build Command**: `npm run build` (default, leave as is)
- **Output Directory**: `.next` (default, leave as is)
- **Install Command**: `npm install` (default, leave as is)

### **3.3 Add Environment Variables**

Click **Environment Variables** and add:

```bash
# Backend API URL (from Step 2)
NEXT_PUBLIC_API_URL=https://millenium-backend.onrender.com/api

# Add more as needed by your frontend
```

**⚠️ Important:**
- All frontend env variables must start with `NEXT_PUBLIC_`
- They are exposed to the browser (don't put secrets here)

### **3.4 Deploy**
1. Click **Deploy**
2. Wait 2-3 minutes for build and deployment
3. Your frontend will be at: `https://millenium-potters.vercel.app` (or custom domain)

### **3.5 Update Backend CORS**
1. Go back to Render dashboard
2. Update `CORS_ORIGIN` environment variable:
   ```bash
   CORS_ORIGIN=https://millenium-potters.vercel.app
   ```
3. Save and wait for backend to redeploy

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
1. Open `https://millenium-potters.vercel.app`
2. Try logging in
3. Check browser console for errors
4. Verify API calls are working

### **4.3 Test Full Flow**
- [ ] User registration works
- [ ] Login works
- [ ] Dashboard loads
- [ ] API calls succeed
- [ ] File uploads work (Cloudinary)

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
# Ensure build command includes: npm install && npx prisma generate
# Check all dependencies are in package.json
```

**Issue: "Migrations failed"**
```bash
# Use: npx prisma db push (in build command)
# Or: npx prisma migrate deploy
# Check database is empty or has compatible schema
```

**Issue: CORS errors**
```bash
# Update CORS_ORIGIN in Render to match Vercel URL
# Include protocol: https://your-app.vercel.app
# No trailing slash
```

### **Frontend Issues**

**Issue: "API calls fail"**
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Include /api at the end: https://backend.onrender.com/api
# Check backend CORS allows your frontend domain
```

**Issue: "Environment variables not working"**
```bash
# Ensure variables start with NEXT_PUBLIC_
# Redeploy after adding env variables
# Check they're set for Production environment
```

**Issue: "Build fails"**
```bash
# Check Root Directory is set to "frontend"
# Ensure all dependencies are in package.json
# Check build logs for specific errors
```

---

## 🔄 Continuous Deployment

### **Automatic Deployments**

Both Render and Vercel auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel deploys frontend automatically (~2 min)
# Render deploys backend automatically (~3-5 min)
```

### **Manual Deployments**

**Render:**
1. Go to service dashboard
2. Click **Manual Deploy** → **Deploy latest commit**

**Vercel:**
1. Go to project dashboard
2. Click **Deployments** → **Redeploy**

---

## 📊 Monitoring

### **Render Monitoring**
- View logs: Service → **Logs** tab
- Check metrics: Service → **Metrics** tab
- Set up alerts: Service → **Settings** → **Notifications**

### **Vercel Monitoring**
- View logs: Project → **Deployments** → Click deployment → **Function Logs**
- Analytics: Project → **Analytics** tab
- Speed Insights: Project → **Speed Insights** tab

---

## 💰 Cost Breakdown

### **Free Tier (Good for Testing)**
```
Database: Supabase Free (500MB)            $0
Backend: Render Free                       $0
Frontend: Vercel Free                      $0
Cloudinary: Free tier (25GB/month)        $0
─────────────────────────────────────────────
Total:                                     $0/month
```

**Limitations:**
- Backend sleeps after inactivity (30s wake time)
- Limited bandwidth
- No custom domains on free

### **Recommended Production Setup**
```
Database: Supabase Pro (8GB)               $25/month
Backend: Render Starter                    $7/month
Frontend: Vercel Pro                       $20/month
Cloudinary: Free tier                      $0
─────────────────────────────────────────────
Total:                                     $52/month
```

### **Budget Production Setup**
```
Database: Neon Free (512MB)                $0
Backend: Railway                           $5/month
Frontend: Vercel Free                      $0
Cloudinary: Free tier                      $0
─────────────────────────────────────────────
Total:                                     $5/month
```

---

## 🌍 Custom Domains (Optional)

### **Frontend (Vercel)**
1. Buy domain (Namecheap, Google Domains, etc.)
2. Vercel Project → **Settings** → **Domains**
3. Add your domain: `app.millenniumpotters.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (~5 min)

### **Backend (Render)**
1. Render Service → **Settings** → **Custom Domains**
2. Add domain: `api.millenniumpotters.com`
3. Update DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: `millenium-backend.onrender.com`
4. Wait for SSL (~10 min)

**Then update frontend env:**
```bash
NEXT_PUBLIC_API_URL=https://api.millenniumpotters.com/api
```

---

## 🔐 Security Checklist

- [ ] Strong JWT secrets (64+ random characters)
- [ ] Database credentials not in code
- [ ] CORS restricted to your frontend domain
- [ ] HTTPS enforced (automatic on Render/Vercel)
- [ ] Rate limiting enabled (already in backend)
- [ ] Cloudinary credentials secure
- [ ] No sensitive data in frontend env variables

---

## 📝 Post-Deployment Tasks

1. **Create Admin User**
   ```bash
   # SSH into Render or use seed script
   # See backend/prisma/seed.ts
   ```

2. **Test All Features**
   - User registration
   - Loan creation
   - Repayment recording
   - File uploads
   - Reports generation

3. **Set Up Monitoring**
   - Configure error tracking (Sentry, etc.)
   - Set up uptime monitoring (UptimeRobot)
   - Enable Vercel Analytics

4. **Backup Strategy**
   - Supabase: Enable daily backups (paid tier)
   - Or: Set up pg_dump cron job

---

## 🚨 Emergency Rollback

**If deployment breaks:**

### **Backend (Render)**
```bash
# In Render dashboard:
1. Go to Deployments tab
2. Find last working deployment
3. Click "Redeploy"
```

### **Frontend (Vercel)**
```bash
# In Vercel dashboard:
1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → "Promote to Production"
```

---

## 📞 Support

**Render:** https://render.com/docs
**Vercel:** https://vercel.com/docs
**Supabase:** https://supabase.com/docs
**Next.js:** https://nextjs.org/docs

---

## ✨ Done!

Your app is now live:
- **Frontend**: https://millenium-potters.vercel.app
- **Backend API**: https://millenium-backend.onrender.com/api

**Next Steps:**
1. Share with stakeholders
2. Gather feedback
3. Iterate and improve
4. Monitor performance
5. Scale as needed

---

*Deployment completed! 🎉*
