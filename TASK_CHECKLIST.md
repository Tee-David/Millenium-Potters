# Millenium Potters LMS - Task Checklist

Last updated: January 2026

## Completed Tasks

### Authentication & Session
- [x] Fix "remember me" login - stores access token, refresh token, and user data
- [x] Fix impersonation to show correct role-based dashboard

### User Management
- [x] Bulk delete for users with checkbox selection
- [x] Single confirmation dialog with dependency warnings
- [x] Show dependency info before deletion (unions, members linked)

### Loan Management
- [x] Fix repayment schedules not showing for approved/active loans
- [x] Fix loan routes order (static routes before dynamic :id routes)
- [x] Fix loan card icons (add missing color definitions)
- [x] Fix admin loan edit permissions (can edit after approval)
- [x] Add regenerate schedule endpoint for individual loans

### UI/UX Improvements
- [x] Add user name display in header
- [x] Remove desktop hamburger icon (keep for mobile)
- [x] Add footer attribution (WDC Solutions)
- [x] Fix repayment customer display showing N/A

### Previous Fixes (From Task System)
- [x] Fix supervisor validation bug in union.service.ts
- [x] Remove current password requirement from password change
- [x] Fix theme/branding colors not applying
- [x] Remove hardcoded green background in loan management
- [x] Rename Assignment page and add tabs
- [x] Fix dark mode UI issues
- [x] Add audit logging for CRUD operations
- [x] Fix double confirmation modal for loan approval
- [x] Replace Link with router.push for URL visibility
- [x] Implement member reassignment with cascade
- [x] Add loan term validation from loan type
- [x] Add bulk assignment for members and unions
- [x] Complete supervisor reports with export and filtering
- [x] Redesign dashboard with Horizon UI patterns

---

## In Progress

### UI Redesign (Task #15)
- [ ] Redesign loan management pages with Horizon UI
  - [ ] Loan list page
  - [ ] Loan details page
  - [ ] Loan creation form
  - [ ] Repayment schedule view

---

## Pending Tasks

### Security Review & Improvements
- [ ] Full security audit
- [ ] Rate limiting review (currently 500 req/15min in production)
- [ ] RLS (Row Level Security) - already implemented via service layer
- [ ] API key exposure check
- [ ] CAPTCHA implementation (optional)
- [ ] HTTPS verification (handled by Vercel/Render)
- [ ] Input sanitization review (Zod validation in place)
- [ ] Dependency update (npm audit)

---

## Notes

### Rate Limiting (Current State)
- Production: 500 requests per 15 minutes per IP
- Development: 2000 requests per 15 minutes
- Health checks exempt

### Security Already Implemented
- JWT with refresh tokens
- Bcrypt password hashing
- CORS configured
- Helmet security headers
- Role-based access control
- Zod input validation
- Audit logging

### Deployment
- Frontend: Vercel (auto-deploys on push)
- Backend: Render (auto-deploys on push)
- Database: CockroachDB (PostgreSQL-compatible)
