# OpsFlow ERP - System Documentation

Welcome to the comprehensive system documentation for **OpsFlow ERP**, a full-stack Enterprise Resource Planning and Customer Relationship Management application.

---

## 1. System Architecture

The application uses a modern decoupled architecture:

- **Frontend (Client):** A Single Page Application (SPA) built with React and TypeScript, powered by Vite for lightning-fast HMR and bundling. It uses React Router for client-side routing.
- **Backend (API):** A RESTful API built with Node.js and Express, heavily typed with TypeScript.
- **Database Layer:** Prisma ORM is used for type-safe database access. The database is configured for SQLite by default to allow zero-config local development, but can be seamlessly migrated to PostgreSQL by changing the provider in `schema.prisma`.
- **Authentication:** Stateless authentication using JSON Web Tokens (JWT). Passwords are encrypted at rest using `bcryptjs`.

---

## 2. Directory Structure

```text
opsflow-erp/
│
├── backend/                  # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema definition
│   │   ├── seed.ts           # Database mock data seeder
│   │   └── dev.db            # SQLite database file
│   ├── src/
│   │   ├── controllers/      # Request handlers/Business logic
│   │   ├── lib/              # Shared libraries (Prisma client singleton)
│   │   ├── middleware/       # Express middlewares (Auth, Error handling)
│   │   ├── routes/           # Express route definitions
│   │   ├── utils/            # Helper functions
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Server entry point
│   ├── .env                  # Backend environment variables
│   └── package.json
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── api/              # Axios client and interceptors
    │   ├── components/       # Shared UI components (Layout, ProtectedRoute)
    │   ├── context/          # React Contexts (AuthContext)
    │   ├── pages/            # Application views (Dashboard, CRM, Inventory)
    │   ├── App.tsx           # React router configuration
    │   ├── main.tsx          # React DOM entry point
    │   └── styles.css        # Global highly-optimized CSS system
    ├── .env                  # Frontend environment variables
    ├── index.html
    └── package.json
```

---

## 3. Database Schema

The database utilizes relational data modeling.

* **User**: Represents staff members. Contains `email`, `passwordHash`, and `role` (ADMIN, SALES, WAREHOUSE, ACCOUNTS).
* **Customer**: CRM entity for wholesale/retail clients. Tracks `businessName`, `customerType`, `mobile`, and `address`.
* **Product**: Inventory entity. Tracks `sku`, `unitPrice`, `currentStock`, `minStockAlert`, and physical `location`.
* **StockMovement**: Audit trail of inventory changes (+ In / - Out).
* **SalesChallan**: Invoice/Challan entity linking a `Customer` to multiple products. 
* **ChallanItem**: Line items for Challans. *Architecture Note: This uses "Snapshot Fields" (`unitPriceSnapshot`, `productNameSnapshot`) to freeze historical pricing and names at the time the challan is generated, ensuring past invoices remain accurate if a product's price changes later.*

---

## 4. API Endpoints Reference

### Authentication
* `POST /auth/login` - Authenticate a user and receive a JWT.
* `GET /auth/me` - Retrieve the currently authenticated user's profile.

### Customers (CRM)
* `GET /customers` - List customers (supports `?search=` and `?pageSize=`).
* `GET /customers/:id` - Get customer details, including their challans.
* `POST /customers` - Create a new customer.

### Products (Inventory)
* `GET /products` - List inventory (supports `?search=`, `?lowStock=true`, and `?pageSize=`).
* `POST /products` - Add a new product to the inventory.
* `POST /products/:id/stock-movement` - Record an In/Out stock movement and update `currentStock`.

### Sales Challans
* `GET /challans` - List challans (supports `?status=`).
* `GET /challans/:id` - View a specific challan and its line items.
* `POST /challans` - Generate a new challan (requires customer ID and array of items/quantities).

---

## 5. Environment Variables

### Backend (`backend/.env`)
```env
# Change this to postgresql:// if switching to PostgreSQL
DATABASE_URL="file:./dev.db"

# JWT Secret for signing tokens (Use a secure random string in production)
JWT_SECRET="super-secret-jwt-key"
JWT_EXPIRES_IN="8h"

# Application Port
PORT=4000
```

### Frontend (`frontend/.env`)
```env
# The URL where the backend API is hosted
VITE_API_URL="http://localhost:4000"
```

---

## 6. Security Features

* **Global Error Handler:** The backend wraps routes in an `asyncHandler` that intercepts errors. Expected errors are thrown via a custom `ApiError` class (returning clean JSON responses), while unexpected crashes are caught gracefully without leaking stack traces.
* **Axios Interceptors:** The frontend globally attaches the JWT token to every request. A response interceptor automatically detects `401 Unauthorized` responses (like an expired session) and routes the user back to the login screen securely.

---

## 7. Deployment Guidelines

1. **Database Migration:** 
   If moving to production, change the Prisma provider in `schema.prisma` from `sqlite` to `postgresql`, update your `DATABASE_URL`, and run `npx prisma migrate deploy` on your CI/CD pipeline.
2. **Frontend Build:** 
   Run `npm run build` in the frontend directory to output static files to `dist/`. These files can be hosted globally on Vercel, Netlify, or an S3 bucket.
3. **Backend Hosting:**
   Run `npm run build` (tsc) in the backend to compile TypeScript. Host the output `dist/` directory on any Node.js compatible platform (Render, Railway, Heroku, AWS EC2) using `node dist/server.js`. Ensure you inject the production environment variables securely.
