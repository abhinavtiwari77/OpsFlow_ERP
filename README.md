# OpsFlow ERP

> **Live Deployment**
>
> | Service | URL |
> |---|---|
> | 🌐 Frontend | https://opsflow-erp-frontend.onrender.com |
> | ⚡ Backend API | https://opsflow-erp.onrender.com |
> | 🔍 Health Check | https://opsflow-erp.onrender.com/health |
>
> **CI/CD:** GitHub Actions → Render (auto-deploys on every push to `main`)

OpsFlow ERP is a modern, full-stack **Mini ERP + CRM Operations Portal** for wholesale and distribution businesses.

It manages customers, products, inventory, stock movements, and sales challans while enforcing strict **Role-Based Access Control** (RBAC) across both frontend and backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Server State | TanStack Query (React Query v5) |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Render (backend + frontend static) |
| CI/CD | GitHub Actions |

---

## Features

### 🔐 Authentication & Authorization
- JWT-based stateless authentication (8h expiry)
- Secure password hashing with Bcrypt
- 4 application roles: **Admin**, **Sales**, **Warehouse**, **Accounts**
- Centralized permission matrix shared between frontend (`shared/permissions.ts`) and backend
- Backend enforces permissions via `requirePermission(resource, action)` middleware
- Frontend hides unauthorized UI via `<PermissionGuard>` and `<ProtectedRoute>`

### 📊 Dashboard
- Real-time stats: total customers, products, low-stock count, challan count
- Recent 5 challans table
- Low-stock product alerts table
- Role-aware: unauthorized metrics show **N/A**, not a loading error
- Cached with TanStack Query — instant display on re-navigation (no refetch within 30s stale window)

### 👥 Customer CRM
- Full customer profile: name, mobile, email, business name, GST number, type, address, status, notes
- Follow-up notes with timestamp and author
- Search, create, view detail, delete
- Role-based access (Warehouse has no customer access)

### 📦 Product & Inventory Management
- Product catalog: name, SKU, category, unit price, stock level, minimum stock alert, warehouse location
- Visual low-stock warnings (⚠) in the product list
- Create, view, search, delete products
- Stock In / Stock Out movements with reason logging

### 📋 Stock Movement Audit Trail
- Every +In / -Out records: product, quantity, movement type, reason, created-by user, timestamp
- Immutable audit history

### 🧾 Sales Challans
- Create challans by selecting a customer and adding multiple product lines
- Save as **Draft** (no stock impact) or **Confirm** (reduces stock atomically)
- Confirm validates sufficient stock — returns proper error if stock would go negative
- Product data (name, SKU, price) frozen as snapshot at creation time for financial accuracy
- Challan statuses: **Draft → Confirmed / Cancelled**
- Cancelling a confirmed challan restores stock

### 📄 Sales Challan PDF Export
- Sales Challans can be exported as professional PDFs.
- PDFs use persisted snapshot data to guarantee historical accuracy regardless of current product prices.
- PDF generation is protected by authentication and RBAC.
- PDF generation happens entirely on the backend in memory.
- The PDF is downloaded directly by the frontend without saving temporary files to disk.

---

## Role-Based Access Control

| Module | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Customers | Full | Create / Read / Update | ❌ | Read only |
| Products | Full | Read only | Create / Read / Update | Read only |
| Stock Movements | Full | ❌ | Full | ❌ |
| Sales Challans | Full | Create / Read / Confirm | Read only | Read only |
| Dashboard stats | All metrics | All metrics | Products & Challans | All metrics |

Authorization is enforced at **two levels**:

**Backend** — every protected route checks:
```ts
requirePermission("customers", "create")
```
Returns HTTP `403 Forbidden` if the role lacks the action. Backend is the **authority** — frontend guards are UX only.

**Frontend** — unauthorized buttons/routes are hidden using:
```tsx
<PermissionGuard resource="salesChallans" action="confirm">
  <button>Confirm Challan</button>
</PermissionGuard>
```

---

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and continuous deployment.

### Workflow: `.github/workflows/ci-cd.yml`

**Triggers:**
- Every push to `main`
- Every pull request targeting `main`

**Jobs:**

```
Push to main
    │
    ├── Backend CI (ubuntu-latest)
    │   ├── Checkout code
    │   ├── Setup Node.js 20
    │   ├── npm ci
    │   ├── npx prisma generate
    │   └── npm run build  ✓
    │
    ├── Frontend CI (ubuntu-latest)
    │   ├── Checkout code
    │   ├── Setup Node.js 20
    │   ├── npm ci
    │   └── npm run build  ✓
    │
    └── Deploy to Render (only on push to main, after both CI jobs pass)
        └── curl -X POST $RENDER_DEPLOY_HOOK_URL
```

**Secrets required in GitHub repository:**

| Secret | Description |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL (triggers auto-deployment) |

PRs are build-checked before merge. Deployments only trigger on successful builds merged to `main`.

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- A Supabase or PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/abhinavtiwari77/OpsFlow_ERP.git
cd OpsFlow_ERP
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env     # fill in DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed       # creates default admin/sales/warehouse/accounts users
npm run dev
```

Backend runs on: `http://localhost:4000`

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env     # set VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Default Login Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@opsflow.com | opsflow2026 |
| Sales | sales@opsflow.com | opsflow2026 |
| Warehouse | warehouse@opsflow.com | opsflow2026 |
| Accounts | accounts@opsflow.com | opsflow2026 |

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="8h"
PORT=4000
NODE_ENV=production
CORS_ORIGIN="https://opsflow-erp-frontend.onrender.com"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="https://opsflow-erp.onrender.com"
```

---

## Project Structure

```
opsflow-erp/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions CI/CD pipeline
│
├── shared/
│   └── permissions.ts          # Single source of truth: roles, resources, actions
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema
│   │   └── seed.ts             # Database seeder
│   └── src/
│       ├── controllers/        # Business logic handlers
│       ├── lib/prisma.ts       # Shared Prisma client singleton
│       ├── middleware/
│       │   ├── auth.ts         # JWT verification + requirePermission
│       │   └── errorHandler.ts # Global error handler
│       ├── routes/             # Express route definitions
│       ├── utils/              # asyncHandler, ApiError
│       ├── app.ts              # Express app + routes
│       └── server.ts           # Startup: prisma.$connect() → app.listen()
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.ts       # Axios instance + JWT interceptor
        │   └── queries.ts      # TanStack Query keys + query functions
        ├── lib/
        │   └── queryClient.ts  # QueryClient config (staleTime: 30s, gcTime: 5min)
        ├── components/         # Layout, ProtectedRoute, PermissionGuard
        ├── context/
        │   └── AuthContext.tsx # Auth state (user, login, logout)
        ├── hooks/
        │   └── usePermission.ts
        ├── pages/
        │   ├── Dashboard.tsx   # useQuery — cached, instant re-navigation
        │   ├── Customers.tsx   # useQuery + useMutation
        │   ├── Products.tsx    # useQuery + useMutation (stock movements)
        │   ├── Challans.tsx    # useQuery
        │   ├── ChallanDetail.tsx # useMutation (confirm/cancel)
        │   ├── NewChallan.tsx  # useMutation + re-uses cached lists
        │   └── CustomerDetail.tsx # useQuery + useMutation (notes)
        └── App.tsx             # QueryClientProvider + BrowserRouter + routes
```