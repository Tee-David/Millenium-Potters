# Millenium Potters - Loan Management System

## Project Overview

**Millenium Potters** is a comprehensive backend API for a **Loan Management System (LMS)** designed to manage union-based microfinance operations. This is a **backend-only** project with no frontend code - it provides RESTful APIs for client applications to consume.

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (>=18.0.0)
- **Language**: TypeScript 5.3.3
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL (via Prisma ORM 5.22.0)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (cloud-based)
- **Validation**: Zod 3.22.4

### Key Dependencies
- **Security**: Helmet (security headers), CORS, Express Rate Limit
- **Password Hashing**: bcryptjs
- **File Handling**: Multer (multipart/form-data), Streamifier
- **Development**: Nodemon, ts-node

## Project Architecture

### Directory Structure

```
Millenium/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── prismaClient.ts        # Prisma client singleton
│   ├── config/
│   │   └── env.ts             # Environment configuration
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── union.controller.ts
│   │   ├── union-member.controller.ts
│   │   ├── loan.controller.ts
│   │   ├── repayment.controller.ts
│   │   ├── document.controller.ts
│   │   ├── loanType.controller.ts
│   │   ├── settings.controller.ts
│   │   ├── supervisor-reports.controller.ts
│   │   ├── auditLog.controller.ts
│   │   ├── user-activity.controller.ts
│   │   └── notes.controller.ts
│   ├── routes/                # API route definitions
│   │   ├── index.ts           # Main router aggregator
│   │   └── [feature].routes.ts
│   ├── service/               # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── loan.service.ts
│   │   ├── repayment.service.ts
│   │   ├── optimized-query.service.ts
│   │   └── [feature].service.ts
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── role.middleware.ts      # Role-based access control
│   │   ├── validation.middleware.ts # Zod validation
│   │   ├── audit.middleware.ts     # Audit logging
│   │   └── error.middleware.ts     # Error handling
│   ├── validators/            # Zod schemas for validation
│   ├── utils/                 # Utility functions
│   │   ├── cloudinary.service.ts   # Cloudinary integration
│   │   ├── jwt.util.ts             # JWT utilities
│   │   ├── password.util.ts        # Password hashing
│   │   ├── logger.util.ts          # Logging utilities
│   │   └── apiResponse.util.ts     # Standardized API responses
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── package.json
├── tsconfig.json
└── render.yaml                # Render deployment config

```

### Architecture Pattern

The application follows a **layered architecture**:

1. **Routes Layer** (`routes/`) - API endpoint definitions and routing
2. **Controller Layer** (`controllers/`) - Request/response handling
3. **Service Layer** (`service/`) - Business logic and database operations
4. **Middleware Layer** (`middlewares/`) - Cross-cutting concerns (auth, validation, audit)
5. **Data Access Layer** - Prisma ORM for database operations

## Database Schema

### Core Domain Models

#### 1. **User Management**
- **User**: Staff members with roles (Admin, Supervisor, Credit Officer)
  - Hierarchical structure: Supervisors manage Credit Officers
  - Activity tracking (last login, login count)
  - Profile information
  - Password hashing with bcrypt

#### 2. **Union Management**
- **Union**: Groups of members managed by a Credit Officer
  - One Union → One Credit Officer
  - One Union → Many UnionMembers
  - Location and address details

- **UnionMember**: Individual loan recipients (formerly called "Customer")
  - Belongs to one Union
  - Profile: name, contact, profession, company, etc.
  - KYC verification status
  - Document attachments

#### 3. **Loan Management**
- **LoanType**: Predefined loan products
  - Min/max amount limits
  - Term configuration (days/weeks/months)
  - Active/inactive status

- **Loan**: Individual loan records
  - Associated with UnionMember and Union
  - Lifecycle states: DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → COMPLETED/DEFAULTED/WRITTEN_OFF/CANCELED
  - Principal amount, processing fees, penalty fees
  - Created by user, assigned to officer
  - Repayment schedules

- **RepaymentScheduleItem**: Scheduled repayment installments
  - Sequence-based (1st, 2nd, 3rd payment, etc.)
  - Principal, interest, and fee breakdown
  - Status: PENDING, PARTIAL, PAID, OVERDUE
  - Tracks paid amount

- **Repayment**: Actual payment transactions
  - Payment method (CASH, TRANSFER, POS, MOBILE, USSD, OTHER)
  - Amount, date, reference
  - Received by (user)

- **RepaymentAllocation**: Links repayments to schedule items
  - Tracks which payment goes to which installment
  - Supports partial payments

#### 4. **Document Management**
- **DocumentType**: Categorization (ID, Passport, Utility Bill, etc.)
- **UnionMemberDocument**: Member KYC documents
- **LoanDocument**: Loan-related documents
- **Cloudinary Integration**: Files stored in the cloud

#### 5. **Audit & Tracking**
- **AuditLog**: Complete audit trail of all actions
  - Actor, action, entity, before/after state
  - IP address, user agent tracking

- **StaffSession**: JWT session management
  - Token tracking and revocation
  - User agent and IP logging

- **UnionAssignmentHistory**: Track union reassignments between officers
- **UnionMemberReassignment**: Track member movements between unions

#### 6. **Reporting & Analytics**
- **ReportSession**: Supervisor performance reports
  - Report types: DAILY, WEEKLY, MONTHLY, QUARTERLY, CUSTOM
  - Cached metrics snapshot
  - Officer performance breakdown

- **UserNote**: Notes about users (performance, feedback)
- **UserLoginHistory**: Login tracking with success/failure reasons

#### 7. **Settings**
- **CompanySetting**: System-wide configuration
  - Company details, currency, timezone
  - Date/time format preferences
  - Invoice/expense prefixes

### Key Enums

```typescript
Role: ADMIN | SUPERVISOR | CREDIT_OFFICER

LoanStatus: DRAFT | PENDING_APPROVAL | APPROVED | ACTIVE |
            COMPLETED | DEFAULTED | WRITTEN_OFF | CANCELED

ScheduleStatus: PENDING | PARTIAL | PAID | OVERDUE

RepaymentMethod: CASH | TRANSFER | POS | MOBILE | USSD | OTHER

TermUnit: DAY | WEEK | MONTH

ReportType: DAILY | WEEKLY | MONTHLY | QUARTERLY | CUSTOM
```

## API Structure

### Base URL
```
/api/
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

#### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Unions
- `GET /api/unions` - List unions
- `POST /api/unions` - Create union
- `PUT /api/unions/:id` - Update union
- `DELETE /api/unions/:id` - Delete union

#### Union Members (formerly Customers)
- `GET /api/union-members` - List members
- `POST /api/union-members` - Create member
- `PUT /api/union-members/:id` - Update member
- `DELETE /api/union-members/:id` - Delete member

#### Loans
- `GET /api/loans` - List loans (with filters)
- `GET /api/loans/:id` - Get loan details
- `POST /api/loans` - Create loan
- `PUT /api/loans/:id` - Update loan
- `POST /api/loans/:id/approve` - Approve loan
- `POST /api/loans/:id/disburse` - Disburse loan
- `GET /api/loans/:id/schedule` - Get repayment schedule

#### Repayments
- `GET /api/repayments` - List repayments
- `POST /api/repayments` - Record repayment
- `GET /api/repayments/:id` - Get repayment details

#### Loan Types
- `GET /api/loan-types` - List loan types
- `POST /api/loan-types` - Create loan type
- `PUT /api/loan-types/:id` - Update loan type

#### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document

#### Supervisor Reports
- `POST /api/supervisor-reports/generate` - Generate report
- `GET /api/supervisor-reports` - List reports
- `GET /api/supervisor-reports/:id` - Get report details

#### Audit Logs
- `GET /api/audit-logs` - View audit logs

#### Settings
- `GET /api/settings` - Get company settings
- `PUT /api/settings` - Update company settings

#### User Activity
- `GET /api/user-activity` - Get user activity logs

#### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - List notes

#### Health Check
- `GET /health` - Health check endpoint
- `GET /api/health` - API health check

## Authentication & Authorization

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials and generates JWT tokens (access + refresh)
3. Client stores tokens and sends access token in `Authorization: Bearer <token>` header
4. Server validates token on protected routes using `auth.middleware.ts`

### Authorization (RBAC)
- **ADMIN**: Full system access
- **SUPERVISOR**: Manages multiple Credit Officers, generates reports
- **CREDIT_OFFICER**: Manages unions and their members, processes loans

Role checks implemented via `role.middleware.ts`

## Key Features

### 1. Union-Based Structure
- Credit Officers manage Unions
- Unions contain multiple members
- All loans are associated with both a member and their union
- History tracking for union/member reassignments

### 2. Loan Lifecycle Management
- Draft creation → Approval workflow → Disbursement → Active → Closure
- Automatic schedule generation
- Payment allocation to installments
- Overdue detection and penalty calculation

### 3. Document Management
- Cloudinary integration for secure file storage
- Support for member KYC documents
- Loan supporting documents
- Document type categorization

### 4. Comprehensive Auditing
- All significant actions logged
- Before/after state tracking
- User action attribution
- IP and user agent logging

### 5. Supervisor Reporting
- Performance reports for supervised officers
- Cached metrics for historical comparison
- Custom date range reports
- Officer-level breakdown

### 6. Optimized Querying
- `optimized-query.service.ts` for complex database queries
- Efficient loan filtering and pagination
- Performance-optimized repayment schedule queries

## Security Features

1. **Helmet**: Security headers
2. **CORS**: Configurable cross-origin resource sharing
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Password Hashing**: bcryptjs with salt
5. **JWT**: Stateless authentication with refresh tokens
6. **Input Validation**: Zod schemas for all inputs
7. **SQL Injection Protection**: Prisma ORM parameterized queries
8. **Audit Trail**: Complete action logging

## Environment Variables

Required environment variables (see `.env` file):

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=development|production

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DIR=uploads
```

## Deployment

### Platform: Render.com

Configuration in `render.yaml`:
- **Service Type**: Web service
- **Runtime**: Node.js
- **Build Command**: `npm run render-build-safe`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`
- **Persistent Disk**: 10GB mounted at `/var/data` for document storage

### Build Process
1. `npm install` - Install dependencies
2. `npx prisma generate` - Generate Prisma client
3. `npx prisma migrate deploy` - Run database migrations
4. `npm run build` - Compile TypeScript to JavaScript

### Runtime
- Compiled files in `dist/` directory
- Node.js executes `dist/server.js`

## Development Commands

```bash
# Development
npm run dev              # Start dev server with nodemon

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open Prisma Studio GUI
npm run seed             # Seed database

# Build & Production
npm run build           # Compile TypeScript
npm start               # Start production server

# Deployment
npm run render-build        # Render build (with db push)
npm run render-build-safe   # Render build (with migrations)

# Testing
npm run test-backend    # Run backend tests
```

## Notable Implementation Details

### 1. Renamed Models
- `Customer` → `UnionMember` (reflecting union-based structure)
- `CustomerDocument` → `UnionMemberDocument`
- `CustomerReassignment` → `UnionMemberReassignment`
- `LoanAssignmentHistory` → `UnionAssignmentHistory`

### 2. Disabled Features
Some files have `.disabled` extension indicating deprecated/refactored features:
- `customer.controller.ts.disabled`
- `customer.routes.ts.disabled`
- `assignment-history.controller.ts.disabled`

### 3. Soft Deletes
Most models include `deletedAt` field for soft deletion pattern

### 4. Optimistic Query Service
- Specialized service for complex filtered queries
- Handles loan status filtering with schedule status calculations
- Performance-optimized pagination

## Documentation Files

The project includes extensive documentation:
- `API_DOCUMENTATION.md` - API endpoint details
- `DEPLOYMENT_STEPS.md` - Deployment guide
- `ENVIRONMENT_SETUP.md` - Environment configuration
- `REFACTORING_GUIDE.md` - Code refactoring history
- Various implementation and fix reports

## Project Status

Based on the documentation files, the project appears to be in **production-ready** state with:
- Complete backend implementation
- Database schema finalized
- Cloudinary integration complete
- Deployment configuration ready
- Comprehensive testing and verification completed

## Frontend

**IMPORTANT**: This repository contains **ONLY the backend API**. There is **NO frontend code** in this project.

The frontend would be a separate application (likely React, Vue, or Angular) that consumes these REST APIs. Client applications would need to:
1. Authenticate via `/api/auth/login`
2. Store JWT tokens
3. Make authenticated requests to API endpoints
4. Handle file uploads for documents
5. Display loan data, repayment schedules, and reports

## Key Business Logic

### Loan Creation Flow
1. Create loan in DRAFT status
2. Generate repayment schedule based on term and amount
3. Submit for approval (PENDING_APPROVAL)
4. Admin/Supervisor approves (APPROVED)
5. Disburse loan (ACTIVE)
6. Track repayments against schedule
7. Close when fully paid (COMPLETED) or handle defaults

### Repayment Processing
1. Receive payment from member
2. Allocate payment to oldest unpaid schedule items first
3. Update schedule item status (PARTIAL/PAID)
4. Calculate overdue penalties if applicable
5. Log all allocations for audit trail

### Union Management
1. Supervisor assigns Credit Officers to Unions
2. Credit Officer manages union members
3. All loans for union members tracked under union
4. Reassignment history maintained for transparency

## Contact & Repository

- **Repository**: https://github.com/Tee-David/Millenium-Potters
- **Project Name**: lms-new (Loan Management System)
- **Version**: 1.0.0

---

*This documentation was generated by analyzing the codebase structure, database schema, and existing project documentation.*
