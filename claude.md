# Claude Code Context - Millenium Potters LMS

This document provides essential context for Claude Code when working on this project. Read this before making any changes.

## Project Overview

**Millenium Potters Loan Management System (LMS)** is a complete loan management system for union-based microfinance operations in Nigeria. It enables credit officers to manage unions, union members, and loans with proper role-based access control.

### Live URLs
- **Frontend**: https://app.millenniumpotters.com.ng (Vercel)
- **Backend API**: https://millenium-potters.onrender.com/api (Render)

### Business Context
- **Users**: 50-100 credit officers using simultaneously
- **Currency**: Nigerian Naira (NGN / ₦)
- **Loan Model**: Processing fees (NOT interest rates) - flat fees collected upfront
- **Repayment Calculation**: Simple division (Principal / Term Count = Payment per period)
- **No Interest**: System does NOT use interest calculations

## Technology Stack

### Backend (`/backend`)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **Database**: CockroachDB (PostgreSQL-compatible)
- **ORM**: Prisma 5.22
- **Authentication**: JWT (access + refresh tokens)
- **File Storage**: Cloudinary
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt, express-rate-limit

### Frontend (`/frontend`)
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI + shadcn/ui
- **State**: React Context API (useAuth, useCompany)
- **API Client**: Axios
- **Charts**: Recharts
- **Exports**: jspdf + jspdf-autotable, xlsx

## Project Structure

```
Millenium/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app config, CORS, rate limiting
│   │   ├── server.ts              # Server entry point
│   │   ├── config/env.ts          # Environment configuration
│   │   ├── controllers/           # Request handlers
│   │   ├── middlewares/           # Auth, validation, error handling
│   │   ├── routes/                # API route definitions
│   │   ├── service/               # Business logic layer
│   │   ├── utils/                 # JWT, API response utilities
│   │   ├── validators/            # Zod schemas
│   │   └── types/                 # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (CockroachDB)
│   │   └── seed.ts                # Database seeding
│   └── uploads/                   # Local file uploads (fallback)
│
├── frontend/
│   ├── app/                       # Next.js App Router pages
│   │   ├── login/                 # Login page
│   │   ├── dashboard/             # Protected dashboard routes
│   │   │   ├── business-management/  # Unions, Members, Loans, Repayments
│   │   │   ├── staff-management/     # User management
│   │   │   ├── supervisor-reports/   # Reporting dashboard
│   │   │   ├── system-configuration/ # Settings, Audit logs
│   │   │   └── settings/             # User settings
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── modals/                # Modal dialogs
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── settings/              # Settings components
│   │   └── repayment/             # Payment-related components
│   ├── contexts/                  # React Context (CompanyContext)
│   ├── lib/api.ts                 # API client with interceptors
│   └── types/                     # TypeScript types
│
├── DEPLOYMENT.md                  # Deployment guide
├── TEST_PLAN.md                   # Comprehensive test plan
└── claude.md                      # This file
```

## User Roles & Permissions

### ADMIN
- Full system access
- Create/manage all users, unions, union members
- Create loans (must assign to credit officer - status: ACTIVE immediately)
- Approve/reject credit officer loans
- Edit loans BEFORE and AFTER approval
- Access audit logs, reports, settings
- Change member verification status

### SUPERVISOR
- Supervise multiple credit officers
- View all data from supervised credit officers
- Generate reports for supervised teams
- View-only access to loans and members
- Cannot directly manage loans

### CREDIT_OFFICER
- Manage members in ASSIGNED unions only
- Create loans for their union members (status: PENDING_APPROVAL)
- Edit loans ONLY BEFORE approval (not after)
- Process repayments for their union loans
- Cannot access other unions' data
- Cannot approve loans or change loan status

## Database Schema (CockroachDB)

### Key Models
- **User**: Staff accounts (admin, supervisor, credit_officer)
- **Union**: Groups of union members, assigned to a credit officer
- **UnionMember**: Customers/borrowers (belong to a union)
- **LoanType**: Loan product definitions (amount ranges, term limits)
- **Loan**: Individual loans with status lifecycle
- **RepaymentScheduleItem**: Payment schedule entries
- **Repayment**: Recorded payments
- **RepaymentAllocation**: Payment-to-schedule mapping
- **StaffSession**: Active user sessions (for multi-device support)
- **AuditLog**: Activity tracking

### Loan Status Lifecycle
```
DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE -> COMPLETED
                                    \-> DEFAULTED
                                    \-> WRITTEN_OFF
                                    \-> CANCELED
```

### Important Rules
1. **One active loan per member**: Same member cannot have multiple active/pending loans
2. **No overpayments**: System prevents paying more than total balance
3. **No payment editing/deletion**: Payments are permanent financial records
4. **Union-based access**: Credit officers only see their assigned unions
5. **Processing fees**: Collected upfront, not calculated as interest

## API Endpoints

Base URL: `/api`

### Authentication
- `POST /auth/register` - Register (admin only)
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Current user profile
- `PUT /auth/change-password` - Change password
- `GET /auth/sessions` - Active sessions
- `DELETE /auth/sessions/:id` - Revoke session

### Unions
- `GET /unions` - List unions (filtered by role)
- `POST /unions` - Create union
- `PUT /unions/:id` - Update union
- `POST /unions/:id/assign` - Assign to credit officer

### Union Members
- `GET /union-members` - List members
- `POST /union-members` - Create member
- `PUT /union-members/:id` - Update member
- `PATCH /union-members/:id/toggle-verification` - Toggle verified status
- `POST /union-members/:id/reassign` - Move to another union

### Loans
- `GET /loans` - List loans (filtered by role/union)
- `POST /loans` - Create loan
- `PUT /loans/:id` - Update loan
- `PUT /loans/:id/status` - Change status
- `POST /loans/:id/disburse` - Disburse loan
- `GET /loans/:id/schedule` - Get repayment schedule

### Repayments
- `GET /repayments` - List repayments
- `POST /repayments` - Record payment
- `GET /repayments/schedules` - Get all schedules
- `GET /repayments/schedules/:loanId` - Get loan schedule

## Known Issues & Pending Fixes

From `Millenium fixes.txt`:

1. **Loan Editing Permissions**: Only admin and credit officer can edit loans BEFORE approval
2. **Audit Logs**: Need comprehensive CRUD action logging for supervisor oversight
3. **Double Confirmation Modals**: Some modals have issues (loan approval)
4. **Member Verification Toggle**: Admin should be able to change verified status
5. **Supervisor Reports**: Many placeholder functions need implementation
6. **URL Visibility**: User doesn't want URLs visible when hovering (use router.push)
7. **Session Invalidation**: Union reassignment should refresh logged-in user's session
8. **Union Assignment Cascade**: When union assigned to new officer, all members/loans should transfer
9. **Member Reassignment**: Changing member's union should update credit officer too
10. **Form Dropdowns**: Some dropdowns appear cut off, need responsive fixes
11. **Date of Birth**: Optional but validate min 16 years if provided
12. **Loan Term Validation**: Enforce min/max term from loan type
13. **Settings Page Issues**:
    - Remove current password requirement for password change
    - Theme/branding colors don't actually apply
    - Hardcoded green background in loan management
14. **Assignment Page**: Rename "Union Assignment" to "Assignment" with tabs
15. **Dark Mode**: Many white backgrounds and text visibility issues

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...    # CockroachDB connection (pooled)
DIRECT_URL=postgresql://...      # CockroachDB direct connection
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://app.millenniumpotters.com.ng
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://millenium-potters.onrender.com/api
```

## Development Guidelines

### Code Patterns
1. **Service Layer Pattern**: Controller -> Service -> Prisma
2. **Zod Validation**: All inputs validated with Zod schemas
3. **API Response Format**: `{ success: boolean, message: string, data?: T }`
4. **Error Handling**: Centralized error middleware
5. **Audit Logging**: Log sensitive operations to AuditLog table

### Key Files to Know
- `backend/src/app.ts` - CORS config, rate limiting (500 req/15min production)
- `backend/src/prismaClient.ts` - DB connection with retry logic
- `frontend/lib/api.ts` - Axios interceptors, retry logic, all API methods
- `frontend/components/ui/app-sidebar.tsx` - Main navigation
- `frontend/components/layout/dashboard-layout.tsx` - Protected route wrapper

### Before Making Changes
1. Check role-based permissions in middleware
2. Consider union-based filtering for credit officers
3. Test with all three roles (admin, supervisor, credit_officer)
4. Verify mobile responsiveness
5. Check dark mode compatibility
6. Add audit logging for sensitive operations

### Rate Limiting
- Production: 500 requests per 15 minutes per IP
- Development: 2000 requests per 15 minutes
- Health checks exempt: `/health`, `/api/health`

### Connection Pooling
Database URL should include: `?connection_limit=20&pool_timeout=20`

## Test Users (Development)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password |
| Supervisor | supervisor@test.com | password |
| Credit Officer A | officer.a@test.com | password |
| Credit Officer B | officer.b@test.com | password |

## Common Tasks

### Adding a New API Endpoint
1. Add route in `backend/src/routes/`
2. Create/update controller in `backend/src/controllers/`
3. Implement business logic in `backend/src/service/`
4. Add Zod validator in `backend/src/validators/`
5. Add API method in `frontend/lib/api.ts`

### Adding a New Page
1. Create page in `frontend/app/dashboard/...`
2. Add to sidebar navigation in `frontend/components/ui/app-sidebar.tsx`
3. Implement role-based visibility check
4. Add route protection if needed

### Database Changes
1. Modify `backend/prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma migrate dev --name description`
4. Update affected services and controllers

## Deployment

### Backend (Render)
- Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- Start: `npm start`
- Auto-deploys on push to main

### Frontend (Vercel)
- Root directory: `frontend`
- Auto-deploys on push to main
- Environment: Set `NEXT_PUBLIC_API_URL`

## Important Notes

1. **CockroachDB**: Not PostgreSQL - some features may differ
2. **Render Free Tier**: Backend sleeps after 15 min inactivity
3. **No Interest**: This is a processing-fee-only system
4. **Nigerian Context**: Currency is NGN, date format DD/MM/YYYY
5. **Mobile Priority**: Many users access via mobile devices
6. **Dark Mode**: Has issues - many components not properly styled

## Related Documentation

- **README.md** (root) - Project overview, quick start, tech stack summary
- **backend/README.md** - Backend API documentation, endpoints list, environment setup
- **frontend/README.md** - Next.js default README (minimal)
- **DEPLOYMENT.md** - Complete deployment guide for Render + Vercel
- **TEST_PLAN.md** - Comprehensive test scenarios with results
- **VERCEL_UPDATE_GUIDE.md** - Vercel-specific deployment updates
- **DATABASE_MIGRATION_OPTIONS.md** - Database migration strategies

---

*Last updated: January 2026*
