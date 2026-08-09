# OpsFlow ERP

> **Live Application Deployment**
>
> - 🌐 **Frontend:** https://opsflow-erp-frontend.onrender.com
> - ⚡ **Backend API:** https://opsflow-erp.onrender.com
>
> **CI/CD:** GitHub Actions → Render

OpsFlow ERP is a modern, full-stack **Mini ERP + CRM Operations Portal** designed for wholesale and distribution businesses.

The application manages customers, products, inventory, stock movements, and sales challans while enforcing strict role-based access control across both the frontend and backend.

The project was built as a full-stack developer case study with a focus on **real-world business workflows, API security, database integrity, responsive UI, and automated CI/CD**.

---

## Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing using Bcrypt
- Role-Based Access Control (RBAC)
- Four application roles:
  - Admin
  - Sales
  - Warehouse
  - Accounts
- Centralized permission matrix shared between frontend and backend
- Backend API authorization using granular permission middleware
- Frontend route and action-level permission guards

### 📊 Dashboard

- Total customers
- Total products
- Low-stock products
- Total sales challans
- Recent sales challans
- Low-stock product alerts
- Role-aware dashboard statistics

### 👥 Customer CRM

Each customer supports:

- Customer name
- Mobile number
- Email
- Business name
- GST number
- Customer type
  - Retail
  - Wholesale
  - Distributor
- Address
- Status
  - Lead
  - Active
  - Inactive
- Follow-up date
- Notes

Supported operations:

- Add customer
- Edit customer
- Search customers
- View customer details
- Add follow-up notes
- Role-based create/edit/delete permissions

### 📦 Product & Inventory Management

Each product contains:

- Product name
- SKU
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Warehouse/location

Supported operations:

- Add product
- Edit product
- View products
- Search products
- Stock-in
- Stock-out
- Low-stock alerts

### 📋 Stock Movement Tracking

Every inventory movement records:

- Product
- Quantity changed
- Movement type
  - IN
  - OUT
- Reason
- Created by
- Timestamp

This provides an audit trail for inventory changes.

### 🧾 Sales Challans

Sales users can:

- Select a customer
- Add multiple products
- Specify quantities
- Automatically generate challan numbers
- Save challans as drafts
- Confirm challans

Business rules:

- Draft challans do not affect stock
- Confirmed challans reduce inventory
- Stock can never become negative
- Insufficient stock returns a proper API error
- Confirmation is performed atomically
- Product information is stored as a snapshot inside the challan

Supported statuses:

- Draft
- Confirmed
- Cancelled

---

# Role-Based Access Control

OpsFlow ERP uses a centralized RBAC system.

| Module | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Customers | Full | Create / Read / Update | ❌ | Read |
| Products | Full | Read | Create / Read / Update | Read |
| Stock Movements | Full | ❌ | Full | ❌ |
| Sales Challans | Full | Create / Read / Confirm | Read | Read |
| Dashboard | Full | Role-based | Role-based | Role-based |

Authorization is enforced at **two levels**:

### Backend

REST APIs use:

```ts
requirePermission(resource, action)