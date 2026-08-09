import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-container">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', overflow: 'hidden', position: 'relative', borderRadius: '4px' }}>
              <img src="https://idurar-prod.ams3.digitaloceanspaces.com/public/uploads/setting/cloud/idurar-app-large-3brl7.png" alt="Logo" style={{ position: 'absolute', top: 0, left: 0, height: '36px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#0056D2', marginLeft: '12px' }}>OpsFlow ERP</span>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </NavLink>
          
          <div className="nav-section">CRM</div>
          <NavLink to="/customers">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Customers
          </NavLink>

          <div className="nav-section">Inventory</div>
          <NavLink to="/products">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            Products
          </NavLink>

          <div className="nav-section">Sales</div>
          <NavLink to="/challans">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Sales Challans
          </NavLink>
        </nav>
      </aside>
      <div className="main-area">
        <header className="top-header">
          <h2 className="header-title"></h2>
          <div className="user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
            <div className="user-menu">
              <div className="user-menu-item" onClick={logout}>
                Sign out
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
