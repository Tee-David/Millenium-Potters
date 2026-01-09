# Millenium Potters - Loan Management System

A complete loan management system for union-based microfinance operations.

## 📁 Project Structure

```
Millenium/
├── backend/          # Node.js + TypeScript + Express + Prisma API
│   ├── src/         # Source code
│   ├── prisma/      # Database schema & migrations
│   └── README.md    # Backend documentation
│
└── frontend/         # Next.js 16 + React 19 + TypeScript
    ├── app/         # Next.js app directory
    ├── components/  # React components
    └── README.md    # Frontend documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm (recommended) or npm
- PostgreSQL database

### Backend Setup

```bash
cd backend
pnpm install
cp .env.example .env  # Configure your environment variables
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local  # Configure API URL
npm run dev
```

Frontend runs on: http://localhost:3000

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL (via Prisma ORM 5.22)
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Validation**: Zod
- **Deployment**: Render.com

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI + shadcn/ui
- **State**: React Context API
- **API Client**: Axios
- **Deployment**: Vercel

## 📚 Documentation

- Backend API Documentation: See `backend/README.md`
- Frontend Documentation: See `frontend/README.md`

## 🌐 Live URLs

- **Frontend**: TBD (Deploy to Vercel)
- **Backend API**: TBD (Deploy to Render)

## 🔑 Key Features

- User management with role-based access control (Admin, Supervisor, Credit Officer)
- Union and member management
- Loan lifecycle management (Draft → Approval → Disbursement → Active → Completed)
- Repayment tracking and schedule management
- Document management with Cloudinary integration
- Comprehensive audit logging
- Supervisor reporting and analytics

## 📝 Development

### Running Both Services

```bash
# Terminal 1 - Backend
cd backend && pnpm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Building for Production

```bash
# Backend
cd backend && pnpm run build

# Frontend
cd frontend && npm run build
```

## 🚢 Deployment

### Backend (Render)
- Configure environment variables in Render dashboard
- Deploy from `backend/` directory
- Ensure PostgreSQL database is connected

### Frontend (Vercel)
- Connect GitHub repository
- Set root directory to `frontend/`
- Configure environment variables (API URL)
- Deploy

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC

## 👥 Team

Developed for Millenium Potters microfinance operations.

---

For detailed setup and API documentation, see individual README files in `backend/` and `frontend/` directories.
