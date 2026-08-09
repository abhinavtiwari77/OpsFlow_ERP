# OpsFlow ERP

> **Live Application Deployment:**
> - 🌐 **Frontend App:** [https://opsflow-erp-frontend.onrender.com](https://opsflow-erp-frontend.onrender.com)
> - ⚡ **Backend API:** [https://opsflow-erp.onrender.com](https://opsflow-erp.onrender.com)

OpsFlow ERP is a modern, full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) application built for growing businesses. It features a sleek, high-end user interface designed for maximum productivity and ease of use.

## Features

- **Split-Screen Authentication:** Modern login system with feature highlights and password visibility toggle.
- **Strict Role-Based Access Control (RBAC):** Centralized permission system enforcing Admin, Sales, Warehouse, and Accounts access across UI and API.
- **Beautiful Dashboard:** Clean, card-based analytics with real-time stats and recent activity.
- **Customer Relationship Management (CRM):** Track leads, wholesale customers, and retail clients.
- **Inventory Management:** Real-time tracking of products, stock alerts (+In / -Out movements), and warehouse locations.
- **Sales & Invoicing:** Create, draft, and confirm Sales Challans instantly with pricing snapshots.
- **Fully Responsive UI:** Carefully crafted styling optimized for desktop and mobile displays.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router DOM, Axios
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL hosted on Supabase (Cloud Database)
- **Security:** JWT Authentication, Bcrypt password hashing, Granular Permission Guards

## Quick Start Guide (Local Development)

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npm run seed
npm run dev
```

The backend server will run on `http://localhost:4000`.

### 2. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Test Accounts

The database comes pre-seeded with enterprise test data. You can log in using any of the following accounts:

- **Admin:** `admin@opsflow.com` | **Password:** `opsflow2026`
- **Sales:** `sales@opsflow.com` | **Password:** `opsflow2026`
- **Warehouse:** `warehouse@opsflow.com` | **Password:** `opsflow2026`
- **Accounts:** `accounts@opsflow.com` | **Password:** `opsflow2026`

## Architecture Highlights

- **Single Source of Truth Authorization:** A centralized `shared/permissions.ts` file defines the role matrix and acts as the sole authority for both UI and API authorization.
- **Granular API Defense:** Express `requirePermission(resource, action)` middleware locks down REST endpoints against unauthorized access.
- **Conditional UI Rendering:** React `PermissionGuard` component dynamically hides/shows action buttons (Edit, Delete, Stock In/Out) based on role.
- **Custom Styled UI:** Bypasses heavy CSS frameworks for a purely custom, ultra-lightweight `.css` architecture.
- **Snapshot Architecture:** Sales Challans utilize snapshot fields for historical accuracy (prices and product names remain accurate even if inventory items are updated later).
