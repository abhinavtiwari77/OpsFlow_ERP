import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ customers: 0, products: 0, lowStock: 0, challans: 0 });
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [customers, products, lowStock, challans, recent] = await Promise.all([
        api.get("/customers?pageSize=1"),
        api.get("/products?pageSize=1"),
        api.get("/products?lowStock=true&pageSize=5"),
        api.get("/challans?pageSize=1"),
        api.get("/challans?pageSize=5")
      ]);
      setStats({
        customers: customers.data.pagination.total,
        products: products.data.pagination.total,
        lowStock: lowStock.data.pagination?.total || lowStock.data.items.length,
        challans: challans.data.pagination.total,
      });
      setLowStockProducts(lowStock.data.items || []);
      setRecentChallans(recent.data.items || []);
    }
    load();
  }, []);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats.customers}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats.products}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{stats.lowStock}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Sales Challans</div>
          <div className="stat-value">{stats.challans}</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="dashboard-panel">
          <h3>Recent Challans</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.map(c => (
                  <tr key={c.id}>
                    <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                    <td>{c.customer?.name || '-'}</td>
                    <td>{c.totalQuantity}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentChallans.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>No recent challans</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel">
          <h3>Low Stock Products</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p.id}>
                    <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                    <td>{p.sku}</td>
                    <td>{p.currentStock}</td>
                    <td>{p.minStockAlert}</td>
                    <td><span className="badge badge-cancelled" style={{color: '#ef4444', backgroundColor: '#fee2e2'}}>Low Stock</span></td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>All products sufficiently stocked</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
