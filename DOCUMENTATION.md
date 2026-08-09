# OpsFlow ERP - System Documentation

> **Live Application Deployment:**
> - 🌐 **Frontend App:** [https://opsflow-erp-frontend.onrender.com](https://opsflow-erp-frontend.onrender.com)
> - ⚡ **Backend API:** [https://opsflow-erp.onrender.com](https://opsflow-erp.onrender.com)

Welcome to the comprehensive system documentation for **OpsFlow ERP**, a full-stack Enterprise Resource Planning and Customer Relationship Management application.

---

## 1. System Architecture

The application uses a modern decoupled architecture:

- **Frontend (Client):** A Single Page Application (SPA) built with React and TypeScript, powered by Vite for lightning-fast HMR and bundling. It uses React Router for client-side routing.
- **Backend (API):** A RESTful API built with Node.js and Express, heavily typed with TypeScript.
- **Database Layer:** Prisma ORM with PostgreSQL hosted on **Supabase**.
- **Shared Permissions:** A shared TypeScript module (`shared/permissions.ts`) containing the exact permission matrix used by both frontend and backend.
- **Authentication:** Stateless authentication using JSON Web Tokens (JWT). Passwords are encrypted at rest using `bcryptjs`.

---

## 2. Directory Structure

```text
opsflow-erp/
│
├── shared/                   # Shared TypeScript Module
│   └── permissions.ts        # Single source of truth for Role Matrix & permissions
│
├── backend/                  # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma     # PostgreSQL schema definition
│   │   └── seed.ts           # Database mock data seeder
│   ├── src/
│   │   ├── controllers/      # Request handlers / Business logic
│   │   ├── lib/              # Prisma client singleton
│   │   ├── middleware/       # Express middlewares (Auth, Granular RBAC, Error handling)
│   │   ├── routes/           # Express route definitions
│   │   ├── utils/            # Helper utilities
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Server entry point
│   ├── .env                  # Backend environment variables
│   └── package.json
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── api/              # Axios client and request/response interceptors
    │   ├── components/       # UI components (Layout, ProtectedRoute, PermissionGuard)
    │   ├── context/          # React Contexts (AuthContext)
    │   ├── hooks/            # Custom hooks (usePermission)
    │   ├── pages/            # Application views (Dashboard, CRM, Inventory, Invoices)
    │   ├── App.tsx           # React router configuration
    │   ├── main.tsx          # React DOM entry point
    │   └── styles.css        # Global custom-styled CSS system
    ├── .env                  # Frontend environment variables
    ├── index.html
    └── package.json
```

---

## 3. Role-Based Access Control (RBAC) Matrix

Authorization is governed by `shared/permissions.ts`. There are exactly four roles: `admin`, `sales`, `warehouse`, and `accounts`.

| Resource | Action | Admin | Sales | Warehouse | Accounts |
|---|---|:---:|:---:|:---:|:---:|
| `customers` | `list` / `read` | ✅ | ✅ | ❌ | ✅ |
| `customers` | `create` / `update` | ✅ | ✅ | ❌ | ❌ |
| `customers` | `delete` | ✅ | ❌ | ❌ | ❌ |
| `products` | `list` / `read` | ✅ | ✅ | ✅ | ✅ |
| `products` | `create` / `update` | ✅ | ❌ | ✅ | ❌ |
| `products` | `delete` | ✅ | ❌ | ❌ | ❌ |
| `stockMovements` | `create` (+In / -Out) | ✅ | ❌ | ✅ | ❌ |
| `salesChallans` | `list` / `read` | ✅ | ✅ | ✅ | ✅ |
| `salesChallans` | `create` | ✅ | ✅ | ❌ | ❌ |
| `salesChallans` | `confirm` | ✅ | ✅ | ❌ | ❌ |
| `salesChallans` | `cancel` | ✅ | ❌ | ❌ | ❌ |

---

## 4. Database Schema

The database utilizes relational data modeling with PostgreSQL:

* **User**: Staff accounts (`email`, `passwordHash`, `role`).
* **Customer**: CRM entity (`name`, `mobile`, `email`, `businessName`, `customerType`, `address`, `status`).
* **Product**: Inventory entity (`name`, `sku`, `category`, `unitPrice`, `currentStock`, `minStockAlert`, `location`).
* **StockMovement**: Audit trail of inventory changes (+In / -Out).
* **SalesChallan**: Invoice/Challan entity linking a `Customer` to multiple line items.
* **ChallanItem**: Line items using **Snapshot Fields** (`unitPriceSnapshot`, `productNameSnapshot`, `productSkuSnapshot`) to freeze price and product data at creation time for financial accuracy.

---

## 5. API Endpoints Reference

### Authentication
* `POST /auth/login` - Authenticate user & get JWT.
* `GET /auth/me` - Get current user profile.

### Customers (CRM)
* `GET /customers` - List customers (`?search=`, `?pageSize=`). Requires `customers:list`.
* `GET /customers/:id` - Customer details & history. Requires `customers:read`.
* `POST /customers` - Create customer. Requires `customers:create`.
* `DELETE /customers/:id` - Delete customer. Requires `customers:delete`.

### Products (Inventory)
* `GET /products` - List products (`?search=`, `?lowStock=true`). Requires `products:list`.
* `POST /products` - Create product. Requires `products:create`.
* `DELETE /products/:id` - Delete product. Requires `products:delete`.
* `POST /products/:id/stock-movement` - Record +In / -Out stock change. Requires `stockMovements:create`.

### Sales Challans
* `GET /challans` - List sales challans (`?status=`). Requires `salesChallans:list`.
* `GET /challans/:id` - View challan & line items. Requires `salesChallans:read`.
* `POST /challans` - Draft new challan. Requires `salesChallans:create`.
* `POST /challans/:id/confirm` - Confirm challan. Requires `salesChallans:confirm`.
* `POST /challans/:id/cancel` - Cancel challan. Requires `salesChallans:cancel`.

---

## 6. Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="8h"
PORT=4000
CORS_ORIGIN="https://opsflow-erp-frontend.onrender.com"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="https://opsflow-erp.onrender.com"
```

---

## 7. Security & Architecture Highlights

* **Granular Permission Middleware:** Backend endpoints pass through `requirePermission(resource, action)`, returning HTTP `403 Forbidden` if unauthorized.
* **Component-Level UI Protection:** Frontend components use `<PermissionGuard resource="..." action="...">` to conditionally hide buttons for unauthorized roles.
* **Global Error Handling:** All backend async handlers catch crashes safely via `ApiError` without leaking database tracebacks.
* **JWT Request Interceptor:** Frontend automatically attaches Bearer tokens and redirects to `/login` upon HTTP `401 Unauthorized` token expiry.
