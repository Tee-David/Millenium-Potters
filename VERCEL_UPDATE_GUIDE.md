# Update Vercel to Use Monorepo

Your Vercel project is still pointing to the old frontend repo. Here's how to fix it:

---

## 🔄 Option 1: Update Existing Vercel Project

### Step 1: Go to Vercel Project Settings
1. Log into https://vercel.com
2. Go to your existing project dashboard
3. Click **Settings** tab

### Step 2: Disconnect Old Repository
1. Go to **Git** section in Settings
2. Click **Disconnect** next to the old repository (`Amidathtc/L-DF`)
3. Confirm disconnection

### Step 3: Connect New Monorepo
1. Still in **Git** section
2. Click **Connect Git Repository**
3. Select `Tee-David/Millenium-Potters`
4. Authorize if needed

### Step 4: Update Root Directory
1. Go to **General** section in Settings
2. Find **Root Directory** setting
3. Click **Edit**
4. Set to: `frontend`
5. Click **Save**

### Step 5: Verify Build Settings
1. Still in **General** section
2. Check **Build & Development Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 6: Update Environment Variables (if needed)
1. Go to **Environment Variables** section
2. Update `NEXT_PUBLIC_API_URL` if backend URL changed
3. Click **Save**

### Step 7: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. OR: Make a small change and push to trigger auto-deploy

---

## 🆕 Option 2: Create Fresh Vercel Project (Clean Slate)

### Step 1: Delete Old Project (Optional)
1. Go to old project **Settings**
2. Scroll to bottom → **Delete Project**
3. Type project name to confirm
4. Click **Delete**

### Step 2: Create New Project
1. Vercel dashboard → **Add New** → **Project**
2. Import `Tee-David/Millenium-Potters`

### Step 3: Configure Project
**Important: Click "Edit" next to Root Directory**

```
Framework Preset: Next.js (auto-detected)
Root Directory: frontend ⚠️ CRITICAL - Must set this!
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 4: Add Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Step 5: Deploy
1. Click **Deploy**
2. Wait 2-3 minutes
3. Done!

---

## ✅ Verification Checklist

After updating/creating project:

- [ ] Project connected to `Tee-David/Millenium-Potters`
- [ ] Root Directory set to `frontend`
- [ ] Build succeeds without errors
- [ ] Environment variables set correctly
- [ ] Frontend loads at Vercel URL
- [ ] API calls work (check browser console)

---

## 🚨 Common Issues

### Issue: "Build failed - Cannot find module"
**Fix:** Ensure Root Directory is set to `frontend` (not root!)

### Issue: "API calls fail"
**Fix:** Check `NEXT_PUBLIC_API_URL` environment variable is set

### Issue: "Old code still showing"
**Fix:**
1. Clear deployment cache (Redeploy with cache cleared)
2. Or wait for new deployment to finish
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: "Cannot find frontend folder"
**Fix:** Make sure you pushed the monorepo to GitHub:
```bash
git status
git push origin main
```

---

## 📝 Quick Commands

**Check if monorepo is on GitHub:**
```bash
# Visit in browser:
https://github.com/Tee-David/Millenium-Potters/tree/main/frontend

# Should see frontend/ folder with app/, components/, etc.
```

**If frontend/ folder not showing on GitHub:**
```bash
# In your local project
git status
git add frontend/
git commit -m "Ensure frontend is tracked"
git push origin main
```

---

## 🎯 Final Structure on Vercel

After update, Vercel will:
- ✅ Pull from `Tee-David/Millenium-Potters` (monorepo)
- ✅ Use `frontend/` as root directory
- ✅ Build only the frontend code
- ✅ Deploy to same URL (or new URL if fresh project)

---

## ⚡ Auto-Deploy

Once connected properly:

```bash
# Make changes to frontend
cd frontend
# ... edit files ...

# Commit and push
git add .
git commit -m "Update frontend"
git push origin main

# Vercel auto-deploys in ~2 minutes ✨
```

---

## 💡 Which Option Should You Choose?

**Option 1 (Update Existing):**
- ✅ Keep same URL
- ✅ Keep deployment history
- ✅ Keep custom domain (if set)
- ⏱️ 5 minutes

**Option 2 (Fresh Project):**
- ✅ Clean slate
- ✅ No baggage from old setup
- ❌ New URL (can set custom domain)
- ⏱️ 5 minutes

**Recommendation:** Try Option 1 first. If any issues, go with Option 2.

---

Need help? Let me know at which step you're stuck!
