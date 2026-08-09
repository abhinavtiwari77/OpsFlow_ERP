# OpsFlow ERP

OpsFlow ERP is a modern, full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) application built for growing businesses. It features a sleek, high-end user interface designed for maximum productivity and ease of use.

## Features

- **Split-Screen Authentication:** Modern login system with feature highlights.
- **Beautiful Dashboard:** Clean, card-based analytics with recent activity tables.
- **Customer Relationship Management (CRM):** Track leads, wholesale customers, and retail clients in a powerful list view.
- **Inventory Management:** Real-time tracking of products, stock alerts, and multi-warehouse locations.
- **Sales & Invoicing:** Create, draft, and confirm Sales Challans instantly.
- **Fully Responsive UI:** Carefully crafted styling optimized for desktop and mobile displays.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router DOM, Axios
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** SQLite (local-ready out of the box, easily configurable to PostgreSQL)
- **Security:** JWT Authentication, Bcrypt password hashing

## Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
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

The frontend will run on `http://localhost:5174` (or port 5173).

## Test Accounts

The database comes pre-seeded with enterprise test data. You can log in using any of the following accounts:

- **Email:** `admin@opsflow.com` | **Password:** `opsflow2026`
- **Email:** `sales@opsflow.com` | **Password:** `opsflow2026`
- **Email:** `warehouse@opsflow.com` | **Password:** `opsflow2026`
- **Email:** `accounts@opsflow.com` | **Password:** `opsflow2026`

## Architecture Highlights

- **Custom Styled UI:** Bypasses heavy CSS frameworks for a purely custom, ultra-lightweight `.css` architecture.
- **JWT Interceptor:** Smart Axios interceptors automatically handle token attachment and session timeouts.
- **Snapshot Architecture:** Sales Challans utilize snapshot fields for historical accuracy (prices and product names remain accurate even if inventory items are updated later).

## License

MIT License
