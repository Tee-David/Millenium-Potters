# Database Migration Options - Millenium Potters LMS

**Date:** January 10, 2026
**Current Issue:** Supabase free tier causing connection issues
**Goal:** Find truly free, reliable database alternative

---

## Table of Contents
1. [Current Problem Analysis](#current-problem-analysis)
2. [Database Options Comparison](#database-options-comparison)
3. [Recommended Solution: CockroachDB](#recommended-solution-cockroachdb)
4. [Alternative Solutions](#alternative-solutions)
5. [Quick Fixes for Supabase](#quick-fixes-for-supabase)
6. [Migration Guides](#migration-guides)

---

## Current Problem Analysis

### Why Supabase Free Tier Has Connection Issues

1. **Connection Pooling Limits**
   - Supabase free tier: 60 concurrent connections max
   - Your Express/Prisma app might be exhausting the connection pool
   - Each API request holds a connection open
   - Solution: Implement proper connection pooling

2. **Cold Starts**
   - Database sleeps after inactivity
   - First query takes 5-15 seconds to wake up
   - Frustrating for internal tools with sporadic usage

3. **Shared Infrastructure Throttling**
   - Free tier users share resources
   - Other users' workloads can slow you down
   - No guaranteed IOPS or CPU

4. **Geographic Latency**
   - If Supabase region ≠ Render region
   - Each query adds 50-100ms network latency
   - Compounds with connection pooling issues

### Current Stack Costs

```
Frontend: Vercel Free           → $0/month
Backend: Render Free            → $0/month
Database: Supabase Free (issue) → $0/month (but unreliable)
Files: Cloudinary Free          → $0/month
──────────────────────────────────────────
TOTAL: $0/month (but with reliability issues)
```

---

## Database Options Comparison

| Database | Free Storage | Free Compute | Postgres Compatible | Migration Effort | Reliability | Restrictions |
|----------|--------------|--------------|---------------------|------------------|-------------|--------------|
| **CockroachDB** | 10GB | 250M RUs/month | ✅ Yes | 1 day | ⭐⭐⭐⭐⭐ | RU limits, pauses if exceeded |
| **Turso** | 9GB | 1B reads/mo | ❌ SQLite | 2-3 days | ⭐⭐⭐⭐ | SQLite limitations |
| **Neon** | 0.5GB | 191.9 hrs/mo | ✅ Yes | 2 hours | ⭐⭐⭐⭐ | Small storage |
| **Railway** | $5 credits | Varies | ✅ Yes | 2 hours | ⭐⭐⭐⭐⭐ | ~$5-10/month after credits |
| **Supabase** | 0.5GB | 500MB | ✅ Yes | 0 (current) | ⭐⭐⭐ | Connection limits, cold starts |
| **PlanetScale** | ❌ No free tier | ❌ | ❌ MySQL | N/A | N/A | Removed free tier in 2024 |

---

## Recommended Solution: CockroachDB Serverless

### ✅ Is CockroachDB Truly Free?

**YES**, with these specifics:

#### Free Tier Details (Serverless Plan)
- **Storage:** 10 GiB (10,737 MB) - 20x more than Supabase!
- **Request Units (RUs):** 250 million RUs/month
- **No credit card required** for signup
- **No time limit** - free forever
- **No automatic charges** - you choose to upgrade
- **Production-ready** - not a trial

#### What Are Request Units (RUs)?

Request Units measure compute + network usage:
- 1 RU ≈ 1 simple read query
- 5-10 RUs ≈ 1 complex join query
- 20-50 RUs ≈ 1 write query

**For your internal loan management tool:**
- 250M RUs/month = ~8.3M RUs/day
- If average query = 5 RUs → **1.6 million queries/day**
- For internal tool with 5-50 users → **MORE than enough**

#### What Happens If You Exceed Free Tier?

- **Option 1:** Database **pauses** until next month (data preserved)
- **Option 2:** Upgrade to paid ($1/month minimum + usage)
- **No surprise charges** - you control spending

#### Free Tier Restrictions

✅ **No restrictions on:**
- Number of databases
- Number of tables
- Query complexity
- Concurrent connections
- Uptime/availability
- Backup frequency

❌ **Limitations:**
- 10GB storage max
- 250M RUs/month compute
- 1 region only (multi-region requires paid)
- No dedicated resources (shared infrastructure)

### Why CockroachDB Over Others?

| Feature | CockroachDB | Supabase Free | Neon Free |
|---------|-------------|---------------|-----------|
| **Storage** | 10GB | 0.5GB | 0.5GB |
| **Connection Pool** | Generous | 60 connections | 100 connections |
| **Cold Starts** | None | Yes (slow) | Fast (300ms) |
| **Postgres Compatible** | 100% | 100% | 100% |
| **Auto-scaling** | Yes | No | Yes |
| **Reliability** | Enterprise-grade | Good | Very Good |
| **No CC Required** | Yes | Yes | Yes |

### CockroachDB Architecture Benefits

1. **Distributed by Design**
   - Survives datacenter failures
   - Used by companies like Netflix, DoorDash
   - Built for zero downtime

2. **True Serverless**
   - Pay only for what you use (RUs)
   - No connection pooling nightmares
   - Auto-scales from 0 to production

3. **Postgres Wire Protocol**
   - Works with Prisma out of the box
   - Use `postgresql` provider
   - No code changes needed!

---

## CockroachDB Migration Guide

### Phase 1: Setup (30 minutes)

#### Step 1: Create CockroachDB Account
1. Go to https://cockroachlabs.cloud/signup
2. Sign up with email (no credit card)
3. Verify email
4. Create organization

#### Step 2: Create Serverless Cluster
1. Click "Create Cluster"
2. Select **"Serverless"** plan (FREE)
3. Choose cloud provider (AWS recommended)
4. Select region closest to Render backend
   - US East (Virginia) for us-east
   - US West (Oregon) for us-west
5. Name cluster: `millenium-potters-db`
6. Click "Create Cluster"

#### Step 3: Get Connection String
1. After cluster creation, click "Connect"
2. Select "General connection string"
3. Copy the connection string:
   ```
   postgresql://username:password@cluster-name.cockroachdb.cloud:26257/defaultdb?sslmode=verify-full
   ```
4. Save credentials securely

### Phase 2: Test Connection (15 minutes)

#### Step 1: Update Environment Variables (Local Test)
```bash
# In your backend/.env.local (for testing)
DATABASE_URL="postgresql://username:password@cluster.cockroachdb.cloud:26257/defaultdb?sslmode=verify-full"
```

#### Step 2: Test Prisma Connection
```bash
cd backend
npx prisma db push --skip-generate
```

Expected output: `✓ Database synchronized with Prisma schema`

#### Step 3: Verify Tables Created
```bash
npx prisma studio
```
Should open Prisma Studio with empty tables.

### Phase 3: Data Migration (2-4 hours)

#### Option A: Fresh Start (Easiest)
If you can afford to lose existing data or it's test data:

```bash
# Generate fresh database
npx prisma migrate deploy

# Seed with sample data
npx prisma db seed
```

#### Option B: Migrate Existing Data (Recommended for Production)

**Step 1: Export from Supabase**
```bash
# Install pg_dump (if not installed)
# For Windows: Download from PostgreSQL website
# For macOS: brew install postgresql

# Export data
pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  --data-only \
  --inserts \
  --no-owner \
  --no-privileges \
  > supabase_data.sql
```

**Step 2: Clean Export File**
Open `supabase_data.sql` and:
- Remove any Supabase-specific extensions
- Remove `SELECT pg_catalog.set_config` lines
- Ensure INSERT statements are clean

**Step 3: Import to CockroachDB**
```bash
# First, create schema
npx prisma migrate deploy

# Then import data
psql "postgresql://username:password@cluster.cockroachdb.cloud:26257/defaultdb?sslmode=verify-full" \
  < supabase_data.sql
```

**Step 4: Verify Data**
```bash
npx prisma studio
# Check that all records are present
```

### Phase 4: Update Production Environment (30 minutes)

#### Step 1: Update Render Environment Variables
1. Go to Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `DATABASE_URL`:
   ```
   postgresql://username:password@cluster.cockroachdb.cloud:26257/defaultdb?sslmode=verify-full
   ```
5. Save changes

#### Step 2: Trigger Deployment
Render will auto-deploy with new database connection.

#### Step 3: Run Migrations (if needed)
In Render dashboard:
```bash
npx prisma migrate deploy
```

#### Step 4: Monitor Logs
Watch Render logs for:
- ✓ Successful database connection
- ✓ No connection errors
- ✓ API endpoints responding

### Phase 5: Testing (1-2 hours)

#### Functional Testing Checklist
- [ ] Login works
- [ ] User management works
- [ ] Union creation works
- [ ] Loan creation works
- [ ] Repayment recording works
- [ ] Reports generate correctly
- [ ] Document uploads work
- [ ] All API endpoints respond

#### Performance Testing
- [ ] Query response times < 500ms
- [ ] No connection timeouts
- [ ] Concurrent user testing

#### Data Integrity Checks
```sql
-- Check record counts match Supabase
SELECT 'users' as table_name, COUNT(*) FROM "User"
UNION ALL
SELECT 'unions', COUNT(*) FROM "Union"
UNION ALL
SELECT 'loans', COUNT(*) FROM "Loan"
-- ... repeat for all tables
```

### Phase 6: Cutover (15 minutes)

1. **Verify everything works on CockroachDB**
2. **Update frontend environment** (if DATABASE_URL is referenced)
3. **Announce to users**: "Database upgrade complete"
4. **Monitor for 24-48 hours**
5. **Delete Supabase project** (after 1 week of stability)

---

## Troubleshooting CockroachDB

### Issue: "connection refused"
**Solution:**
- Check connection string has `?sslmode=verify-full`
- Verify IP whitelist (CockroachDB allows all IPs by default)

### Issue: "database does not exist"
**Solution:**
- Change `defaultdb` to your actual database name
- Or create database: `CREATE DATABASE millenium;`

### Issue: Migration fails with syntax errors
**Solution:**
- CockroachDB has minor Postgres incompatibilities
- Check: https://www.cockroachlabs.com/docs/stable/postgresql-compatibility
- Most common: `SERIAL` → use `INT` with `DEFAULT unique_rowid()`

### Issue: Queries slower than Supabase
**Solution:**
- Add indexes (check Prisma schema)
- Run `ANALYZE` to update statistics
- Check query explain plans

### Issue: Running out of RUs
**Solution:**
- Optimize queries (reduce N+1 queries)
- Add caching layer (Redis)
- Consider upgrading to paid tier ($1/month minimum)

---

## Alternative Solutions

### Option 2: Turso (LibSQL/SQLite) - 9GB Free

**Best for:** Edge applications, lightweight databases

#### Free Tier
- 9GB storage
- 1B row reads/month
- 25M row writes/month
- 500 databases

#### Migration Effort: 2-3 days

**Pros:**
- More storage than CockroachDB
- Edge replication (faster globally)
- True unlimited reads/writes within limits

**Cons:**
- SQLite limitations (no concurrent writes easily)
- Prisma provider change needed
- Some SQL syntax differences

#### When to Choose Turso
- You need >10GB storage
- You want edge deployment
- You're okay with SQLite limitations

---

### Option 3: Neon Postgres - Fast Cold Starts

**Best for:** Small databases, fast wakeup

#### Free Tier
- 0.5GB storage (same as Supabase)
- 191.9 compute hours/month
- Instant cold starts (300ms vs 15 seconds)

#### Migration Effort: 2 hours

**Pros:**
- Near-instant wakeup
- True Postgres
- Database branching (dev/staging)
- Generous compute hours

**Cons:**
- Only 0.5GB storage (might not be enough)
- Limited to 1 project

#### When to Choose Neon
- Your database is <500MB
- You want Postgres compatibility
- Cold starts are your main issue with Supabase

---

### Option 4: Railway - $5 Free Credits/Month

**Best for:** When free tiers aren't enough

#### Pricing
- $5 free credits/month (ongoing)
- After credits: ~$0.000463/GB-hour
- Real cost: $5-10/month for small database

#### Migration Effort: 2 hours

**Pros:**
- Real Postgres, no compromises
- Generous resources
- Great DX (developer experience)
- No weird restrictions

**Cons:**
- Not truly free (but very cheap)
- Need to monitor credit usage

#### When to Choose Railway
- You're okay with $5-10/month
- You want reliability over free tier
- Your loan tool generates revenue

---

## Quick Fixes for Supabase (Try First!)

Before migrating, try these fixes - might solve your problem in 2-4 hours:

### Fix 1: Enable Connection Pooling (30 minutes)

#### In Prisma Client Setup
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=5&pool_timeout=20`
    }
  },
  log: ['error', 'warn'],
});

export default prisma;
```

#### Update Environment Variable
```bash
# Use Supabase's transaction pooler (port 6543 instead of 5432)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?pgbouncer=true"
```

### Fix 2: Close Connections Properly (1 hour)

#### Add Middleware to Close Connections
```typescript
// backend/src/middlewares/database.ts
import prisma from '../config/database';

export const closePrismaConnection = async (req, res, next) => {
  res.on('finish', async () => {
    await prisma.$disconnect();
  });
  next();
};
```

#### Apply Middleware
```typescript
// backend/src/app.ts
import { closePrismaConnection } from './middlewares/database';

app.use(closePrismaConnection);
```

### Fix 3: Check Active Connections (5 minutes)

```sql
-- Run this query in Supabase SQL Editor
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = 'postgres';
```

If you see 50-60 connections constantly, you're hitting the limit.

### Fix 4: Implement Query Caching (2-3 hours)

For frequently accessed data (loan types, company settings):

```typescript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedLoanTypes = async () => {
  const cached = cache.get('loan_types');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const loanTypes = await prisma.loanType.findMany();
  cache.set('loan_types', { data: loanTypes, timestamp: Date.now() });
  return loanTypes;
};
```

---

## Cost Comparison Summary

### Current (Supabase - Unreliable)
```
Vercel:      $0
Render:      $0
Supabase:    $0 (with connection issues)
────────────────
TOTAL:       $0/month ⚠️ Unreliable
```

### Option 1: CockroachDB (Recommended)
```
Vercel:      $0
Render:      $0
CockroachDB: $0 (10GB, 250M RUs)
────────────────
TOTAL:       $0/month ✅ Reliable
```

### Option 2: Turso
```
Vercel:      $0
Render:      $0
Turso:       $0 (9GB)
────────────────
TOTAL:       $0/month ✅ Reliable
```

### Option 3: Neon
```
Vercel:      $0
Render:      $0
Neon:        $0 (0.5GB)
────────────────
TOTAL:       $0/month ⚠️ Limited storage
```

### Option 4: Railway
```
Vercel:      $0
Render:      $0
Railway:     $5-10
────────────────
TOTAL:       $5-10/month ✅ Most reliable
```

---

## Decision Matrix

Choose **CockroachDB** if:
- ✅ Database size < 10GB
- ✅ Want Postgres compatibility
- ✅ Need reliability
- ✅ Want zero cost
- ✅ Internal tool with <10k queries/day

Choose **Turso** if:
- ✅ Database size 5-9GB
- ✅ Okay with SQLite
- ✅ Want edge deployment
- ✅ Need more storage than CockroachDB

Choose **Neon** if:
- ✅ Database size < 500MB
- ✅ Cold starts are your main issue
- ✅ Want Postgres compatibility

Choose **Railway** if:
- ✅ Can afford $5-10/month
- ✅ Want zero restrictions
- ✅ Need maximum reliability
- ✅ Tool generates revenue

Choose **Fix Supabase** if:
- ✅ Database size < 500MB
- ✅ Willing to try connection pooling fixes
- ✅ Don't want to migrate

---

## Next Steps

### Recommended Path: CockroachDB Migration

1. **Today (4 hours):**
   - [ ] Create CockroachDB account
   - [ ] Set up serverless cluster
   - [ ] Test connection locally
   - [ ] Migrate schema

2. **Tomorrow (4 hours):**
   - [ ] Export data from Supabase
   - [ ] Import to CockroachDB
   - [ ] Test all features locally
   - [ ] Verify data integrity

3. **Day 3 (2 hours):**
   - [ ] Update Render environment variables
   - [ ] Deploy to production
   - [ ] Monitor for issues
   - [ ] Keep Supabase as backup for 1 week

### Backup Plan

If CockroachDB doesn't work:
1. Revert to Supabase (keep credentials)
2. Try Supabase connection fixes
3. Consider Turso or Railway

---

## Monitoring & Maintenance

### Weekly Checks (5 minutes/week)
- [ ] Check CockroachDB dashboard for RU usage
- [ ] Verify storage usage (should be <10GB)
- [ ] Check for slow queries
- [ ] Review error logs

### Monthly Tasks (30 minutes/month)
- [ ] Analyze most expensive queries
- [ ] Add indexes if needed
- [ ] Review and archive old data
- [ ] Update dependencies

### When to Upgrade to Paid Tier

Upgrade when you consistently:
- Hit 250M RUs/month limit
- Need >10GB storage
- Want multi-region deployment
- Need dedicated resources

**Cost:** $1/month minimum + usage-based pricing

---

## Conclusion

**For your internal loan management tool, CockroachDB Serverless is the best choice:**

✅ **Truly free** (10GB, 250M RUs/month - more than enough)
✅ **Reliable** (enterprise-grade infrastructure)
✅ **Easy migration** (1-2 days, Postgres-compatible)
✅ **No connection issues** (proper serverless architecture)
✅ **Production-ready** (used by Fortune 500 companies)

**Total cost: $0/month**
**Migration time: 1-2 days**
**Risk: Low** (can revert to Supabase if needed)

---

## Support & Resources

### CockroachDB Resources
- Docs: https://www.cockroachlabs.com/docs/
- Community: https://www.cockroachlabs.com/community/
- Status: https://status.cockroachlabs.cloud/

### Getting Help
- CockroachDB Community Slack
- GitHub Issues: https://github.com/cockroachdb/cockroach
- Stack Overflow: Tag `cockroachdb`

---

**Last Updated:** January 10, 2026
**Project:** Millenium Potters LMS
**Maintained By:** Development Team
