# OpsFlow ERP — System Documentation

> **Live Deployment**
>
> | Service | URL |
> |---|---|
> | 🌐 Frontend | https://opsflow-erp-frontend.onrender.com |
> | ⚡ Backend API | https://opsflow-erp.onrender.com |
> | 🔍 Health Check | https://opsflow-erp.onrender.com/health |
>
> **Repository:** https://github.com/abhinavtiwari77/OpsFlow_ERP  
> **CI/CD:** GitHub Actions → Render (auto-deploys on push to `main`)

---

## 1. System Architecture

OpsFlow ERP uses a modern decoupled architecture:

```
┌─────────────────────────────┐     HTTPS      ┌──────────────────────────────┐
│   React SPA (Vite)          │ ─────────────► │  Node.js / Express API       │
│   TanStack Query cache       │                │  Prisma ORM                  │
│   React Router v6            │ ◄───────────── │  JWT Auth                    │
│   Render Static Site         │    JSON REST   │  RBAC Middleware             │
└─────────────────────────────┘                └──────────────┬───────────────┘
                                                              │
                                                      PostgreSQL (Supabase)
                                                   pgbouncer transaction-mode
```

| Component | Technology | Hosting |
|---|---|---|
| Frontend SPA | React 18 + TypeScript + Vite | Render Static Site |
| Server state cache | TanStack Query (React Query v5) | — |
| Backend API | Node.js + Express + TypeScript | Render Web Service |
| ORM | Prisma | — |
| Database | PostgreSQL | Supabase (ap-southeast-1) |
| Auth | JWT + bcryptjs | — |
| CI/CD | GitHub Actions | GitHub |
| Shared permissions | TypeScript module (`shared/permissions.ts`) | — |

---

## 2. Directory Structure

```
opsflow-erp/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions CI/CD pipeline
│
├── shared/
│   └── permissions.ts              # Single source of truth: roles, resources, actions
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # PostgreSQL schema definition
│   │   └── seed.ts                 # Database seeder (default users)
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── customer.controller.ts
│       │   ├── product.controller.ts
│       │   ├── challan.controller.ts
│       │   └── stats.controller.ts  # RBAC-aware dashboard stats
│       ├── lib/
│       │   └── prisma.ts            # Shared Prisma client singleton
│       ├── middleware/
│       │   ├── auth.ts              # JWT verification + requirePermission
│       │   └── errorHandler.ts      # Global error handler
│       ├── routes/                  # Express routers
│       ├── utils/
│       │   ├── asyncHandler.ts      # Async error wrapper
│       │   └── apiError.ts          # Typed HTTP error class
│       ├── app.ts                   # Express app + CORS + routes + /health
│       └── server.ts                # Entry: prisma.$connect() → app.listen()
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.ts            # Axios instance + JWT interceptor + 401 redirect
        │   └── queries.ts           # TanStack Query keys (KEYS) + query functions
        ├── lib/
        │   └── queryClient.ts       # QueryClient (staleTime: 30s, gcTime: 5min)
        ├── components/
        │   ├── Layout.tsx
        │   ├── ProtectedRoute.tsx   # Route-level RBAC guard
        │   └── PermissionGuard.tsx  # Component-level RBAC guard
        ├── context/
        │   └── AuthContext.tsx      # user, login(), logout() — reads localStorage
        ├── hooks/
        │   └── usePermission.ts     # can(resource, action) helper
        ├── pages/
        │   ├── Dashboard.tsx        # useQuery — cached, instant on re-navigation
        │   ├── Customers.tsx        # useQuery + useMutation
        │   ├── CustomerDetail.tsx   # useQuery + useMutation (notes)
        │   ├── Products.tsx         # useQuery + useMutation (stock movements)
        │   ├── Challans.tsx         # useQuery
        │   ├── NewChallan.tsx       # useMutation + re-uses cached lists
        │   └── ChallanDetail.tsx    # useMutation (confirm / cancel)
        ├── App.tsx                  # QueryClientProvider + BrowserRouter + routes
        ├── main.tsx                 # React DOM root
        └── styles.css               # Global CSS
```

---

## 3. CI/CD Pipeline

The project uses **GitHub Actions** for automated build validation and deployment.

### Workflow file: `.github/workflows/ci-cd.yml`

**Triggers:**

| Event | Branches |
|---|---|
| `push` | `main` |
| `pull_request` | `main` |

**Pipeline flow:**

```
Push to main / Pull Request
        │
        ├─ Job: Backend CI  (ubuntu-latest)
        │   ├─ actions/checkout@v4
        │   ├─ actions/setup-node@v4  (Node 20, npm cache)
        │   ├─ npm ci
        │   ├─ npx prisma generate
        │   └─ npm run build  ──────────────────── must pass ✓
        │
        ├─ Job: Frontend CI  (ubuntu-latest)
        │   ├─ actions/checkout@v4
        │   ├─ actions/setup-node@v4  (Node 20, npm cache)
        │   ├─ npm ci
        │   └─ npm run build  ──────────────────── must pass ✓
        │
        └─ Job: Deploy to Render  (only on push to main, needs both CI jobs)
            └─ curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

**Deployment only triggers after both CI jobs pass**, ensuring broken code is never deployed.

**Required GitHub secret:**

| Secret | Description |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render webhook URL that triggers a new production build |

---

## 4. Role-Based Access Control (RBAC) Matrix

Authorization is enforced by `shared/permissions.ts` — used by **both** the backend middleware and the frontend guards.

| Resource | Action | Admin | Sales | Warehouse | Accounts |
|---|---|:---:|:---:|:---:|:---:|
| `customers` | `list` / `read` | ✅ | ✅ | ❌ | ✅ |
| `customers` | `create` / `update` | ✅ | ✅ | ❌ | ❌ |
| `customers` | `delete` | ✅ | ❌ | ❌ | ❌ |
| `products` | `list` / `read` | ✅ | ✅ | ✅ | ✅ |
| `products` | `create` / `update` | ✅ | ❌ | ✅ | ❌ |
| `products` | `delete` | ✅ | ❌ | ❌ | ❌ |
| `stockMovements` | `create` (stock in/out) | ✅ | ❌ | ✅ | ❌ |
| `stockMovements` | `list` / `read` | ✅ | ❌ | ✅ | ❌ |
| `salesChallans` | `list` / `read` | ✅ | ✅ | ✅ | ✅ |
| `salesChallans` | `create` | ✅ | ✅ | ❌ | ❌ |
| `salesChallans` | `confirm` | ✅ | ✅ | ❌ | ❌ |
| `salesChallans` | `cancel` | ✅ | ❌ | ❌ | ❌ |

**Dashboard metric visibility per role:**

| Metric | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| Customers count | ✅ | ✅ | N/A | ✅ |
| Products count | ✅ | ✅ | ✅ | ✅ |
| Low Stock count | ✅ | ✅ | ✅ | ✅ |
| Challans count | ✅ | ✅ | ✅ | ✅ |

> **N/A** on the Dashboard means the role has no permission for that resource — it is not an error or loading state.

---

## 5. API Endpoints Reference

**Base URL:** `https://opsflow-erp.onrender.com`

All endpoints except `/health` and `/auth/*` require `Authorization: Bearer <JWT>`.

### Health
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Checks server and DB connection | None |

Response: `{ "status": "ok", "database": "connected" }`  
Returns `503` if the database is unreachable.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login — returns `{ token, user }` |
| `GET` | `/auth/me` | Get current authenticated user |

### Dashboard
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/stats` | Role-aware dashboard stats + recent challans + low stock | Any authenticated role |

Response shape:
```json
{
  "stats": { "customers": 6, "products": 8, "lowStock": 2, "challans": 14 },
  "recentChallans": [...],
  "lowStockProducts": [...]
}
```
Unauthorized metrics return `null` (not 0, not an error).

### Customers
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/customers` | List customers (`?search=`, `?pageSize=`) | `customers:list` |
| `GET` | `/customers/:id` | Customer detail + challans + notes | `customers:read` |
| `POST` | `/customers` | Create customer | `customers:create` |
| `PUT` | `/customers/:id` | Update customer | `customers:update` |
| `POST` | `/customers/:id/notes` | Add follow-up note | `customers:update` |
| `DELETE` | `/customers/:id` | Delete customer (blocked if has challans) | `customers:delete` |

### Products
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/products` | List products (`?search=`) | `products:list` |
| `POST` | `/products` | Create product | `products:create` |
| `DELETE` | `/products/:id` | Delete product | `products:delete` |
| `POST` | `/products/:id/stock-movement` | Record +In / -Out | `stockMovements:create` |

### Sales Challans
| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/challans` | List challans (`?status=`) | `salesChallans:list` |
| `GET` | `/challans/:id` | Challan detail + line items | `salesChallans:read` |
| `POST` | `/challans` | Create challan (DRAFT or CONFIRMED) | `salesChallans:create` |
| `POST` | `/challans/:id/confirm` | Confirm — atomically reduces stock | `salesChallans:confirm` |
| `POST` | `/challans/:id/cancel` | Cancel — restores stock if was confirmed | `salesChallans:cancel` |

---

## 6. Frontend Data Fetching Architecture

The frontend uses **TanStack Query** for server-state caching and synchronization.

### Query Client Configuration (`src/lib/queryClient.ts`)

| Option | Value | Effect |
|---|---|---|
| `staleTime` | 30 seconds | No refetch on re-navigation within 30s |
| `gcTime` | 5 minutes | Cache retained 5 minutes after last use |
| `retry` | 1 | One automatic retry on failure |
| `refetchOnWindowFocus` | `false` | No refetch on tab focus |

### Query Keys (`src/api/queries.ts` — `KEYS`)

| Key | Invalidated by |
|---|---|
| `["dashboard", "stats"]` | Any create/update/delete/confirm/cancel mutation |
| `["customers"]` | Customer create / delete |
| `["customers", id]` | Add note to customer |
| `["products"]` | Product create / delete / stock movement |
| `["challans"]` | Challan create / confirm / cancel |
| `["challans", id]` | Challan confirm / cancel |
| `["stockMovements"]` | Stock movement create / challan confirm / cancel |

### Navigation behavior

```
First visit to Dashboard:
  GET /stats → 200 → data cached

Navigate: Dashboard → Customers → Dashboard (within 30s):
  No GET /stats — React Query serves cached data immediately ✓

Navigate: Dashboard → Customers → Dashboard (after 30s):
  Stale cache displayed instantly
  GET /stats fires in background ("Refreshing…" indicator)
  Data updates silently ✓

Mutation (e.g., create customer):
  POST /customers → success
  → invalidate ["customers", *] → customer list refetches
  → invalidate ["dashboard", "stats"] → counts update ✓
```

---

## 7. Database Schema

PostgreSQL managed by Prisma. Key models:

| Model | Key Fields |
|---|---|
| `User` | `id`, `name`, `email`, `passwordHash`, `role` |
| `Customer` | `id`, `name`, `mobile`, `email`, `businessName`, `gstNumber`, `customerType`, `address`, `status`, `createdById` |
| `Product` | `id`, `name`, `sku`, `category`, `unitPrice`, `currentStock`, `minStockAlert`, `location` |
| `StockMovement` | `id`, `productId`, `quantity`, `movementType (IN/OUT)`, `reason`, `createdById` |
| `SalesChallan` | `id`, `challanNumber`, `customerId`, `status (DRAFT/CONFIRMED/CANCELLED)`, `totalQuantity`, `createdById` |
| `ChallanItem` | `id`, `challanId`, `productId`, `quantity`, `unitPriceSnapshot`, `productNameSnapshot`, `productSkuSnapshot` |
| `FollowUpNote` | `id`, `customerId`, `note`, `createdById` |

**Design decisions:**
- `ChallanItem` stores **price and product name snapshots** — challan records remain accurate even if a product is later edited or deleted
- `currentStock` can never go below 0 — validated atomically in `POST /challans/:id/confirm`
- `connection_limit=1` in `DATABASE_URL` — compatible with Supabase free-tier pgbouncer transaction-mode pooler

---

## 8. Environment Variables

### Backend (`backend/.env` / Render environment)

```env
# Supabase transaction-mode pooler (use for all runtime queries)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase direct connection (used by prisma migrate/seed only)
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="8h"

PORT=4000
NODE_ENV=production

# Comma-separated list of allowed frontend origins
CORS_ORIGIN="https://opsflow-erp-frontend.onrender.com"
```

### Frontend (`frontend/.env` / Render build env)

```env
VITE_API_URL="https://opsflow-erp.onrender.com"
```

---

## 9. Local Development Setup

### Prerequisites
- Node.js 20+
- A PostgreSQL database (Supabase free tier works)

### Steps

```bash
# 1. Clone
git clone https://github.com/abhinavtiwari77/OpsFlow_ERP.git
cd OpsFlow_ERP

# 2. Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed           # creates default admin/sales/warehouse/accounts users
npm run dev                  # runs on http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:4000
npm install
npm run dev                  # runs on http://localhost:5173
```

### Default seed credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@opsflow.com | opsflow2026 |
| Sales | sales@opsflow.com | opsflow2026 |
| Warehouse | warehouse@opsflow.com | opsflow2026 |
| Accounts | accounts@opsflow.com | opsflow2026 |

---

## 10. Security Highlights

| Concern | Implementation |
|---|---|
| Password storage | `bcryptjs` — passwords never stored in plaintext |
| API authentication | JWT verified on every request via `requireAuth` middleware |
| Authorization | `requirePermission(resource, action)` returns `403` for unauthorized roles |
| JWT revocation | Tokens expire after 8h — new login required |
| CORS | Explicit origin whitelist via `CORS_ORIGIN` env var |
| Input validation | Zod schema validation on all POST/PUT request bodies |
| Error exposure | Stack traces logged server-side only, never sent to client |
| DB connection | Prisma singleton — no per-request client instantiation |
| Double submission | Frontend `useMutation.isPending` disables submit button during requests |
| Atomic stock | Challan confirmation uses Prisma transaction — no partial updates |
