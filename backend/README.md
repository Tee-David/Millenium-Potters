# Millenium Potters Backend API

Node.js + TypeScript + Express + Prisma REST API for loan management system.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Start development server
pnpm run dev
```

Server runs on: http://localhost:5000

## 📋 Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server entry point
│   ├── config/
│   │   └── env.ts             # Environment config
│   ├── controllers/           # Request handlers
│   ├── middlewares/           # Express middlewares
│   ├── routes/                # API routes
│   ├── service/               # Business logic
│   ├── utils/                 # Utilities
│   ├── validators/            # Zod schemas
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── package.json
└── tsconfig.json
```

## 🛠️ Available Scripts

```bash
# Development
pnpm run dev              # Start dev server with nodemon

# Database
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations
pnpm prisma:push          # Push schema to database
pnpm prisma:studio        # Open Prisma Studio GUI
pnpm run seed             # Seed database

# Production
pnpm run build           # Compile TypeScript
pnpm start               # Start production server

# Deployment
pnpm run render-build        # Render build (with db push)
pnpm run render-build-safe   # Render build (with migrations)
```

## 🔌 API Endpoints

Base URL: `/api`

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Users
- `GET /users` - List users
- `GET /users/:id` - Get user
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Unions
- `GET /unions` - List unions
- `POST /unions` - Create union
- `PUT /unions/:id` - Update union
- `DELETE /unions/:id` - Delete union

### Union Members
- `GET /union-members` - List members
- `POST /union-members` - Create member
- `PUT /union-members/:id` - Update member
- `DELETE /union-members/:id` - Delete member

### Loans
- `GET /loans` - List loans
- `GET /loans/:id` - Get loan details
- `POST /loans` - Create loan
- `PUT /loans/:id` - Update loan
- `POST /loans/:id/approve` - Approve loan
- `POST /loans/:id/disburse` - Disburse loan
- `GET /loans/:id/schedule` - Get repayment schedule

### Repayments
- `GET /repayments` - List repayments
- `POST /repayments` - Record repayment
- `GET /repayments/:id` - Get repayment

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents/:id` - Get document
- `DELETE /documents/:id` - Delete document

### Loan Types
- `GET /loan-types` - List loan types
- `POST /loan-types` - Create loan type
- `PUT /loan-types/:id` - Update loan type

### Reports
- `POST /supervisor-reports/generate` - Generate report
- `GET /supervisor-reports` - List reports

### Settings
- `GET /settings` - Get settings
- `PUT /settings` - Update settings

### Health
- `GET /health` - Health check
- `GET /api/health` - API health check

## 🗄️ Database Schema

18 models including:
- User, Union, UnionMember
- Loan, LoanType, RepaymentScheduleItem, Repayment, RepaymentAllocation
- Documents (UnionMemberDocument, LoanDocument, DocumentType)
- Audit (AuditLog, StaffSession, UserLoginHistory)
- Reports (ReportSession)
- Settings (CompanySetting)

See `prisma/schema.prisma` for details.

## 🔐 Authentication

- JWT-based authentication
- Access token (7 days default)
- Refresh token (30 days default)
- Role-based access control:
  - ADMIN: Full system access
  - SUPERVISOR: Manages credit officers, generates reports
  - CREDIT_OFFICER: Manages unions and loans

## 📦 Deployment (Render)

1. Connect repository to Render
2. Create PostgreSQL database
3. Configure environment variables
4. Deploy with build command: `pnpm run render-build-safe`
5. Start command: `pnpm start`

## 🧪 Testing

```bash
# Run backend tests
pnpm run test-backend
```

## 📚 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL
- **ORM**: Prisma 5.22
- **Authentication**: JWT
- **Validation**: Zod
- **File Storage**: Cloudinary
- **Security**: Helmet, CORS, bcrypt
- **Rate Limiting**: express-rate-limit

## 🤝 Development Guidelines

1. All endpoints require authentication (except /auth/*)
2. Use Zod validators for input validation
3. Follow service layer pattern (controller → service → database)
4. Add audit logging for sensitive operations
5. Use TypeScript strict mode
6. Follow existing code patterns

## 📝 Notes

- Uses Prisma migrations for database changes
- Cloudinary for file storage (can fallback to local)
- Comprehensive audit trail for all actions
- Soft deletes on most models
- Built-in rate limiting

---

For full project documentation, see main README.md
