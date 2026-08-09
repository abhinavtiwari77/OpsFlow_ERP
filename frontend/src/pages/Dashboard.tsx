import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

export function Dashboard() {
  const { can } = usePermission();
  const [stats, setStats] = useState<{ customers?: number; products?: number; lowStock?: number; challans?: number }>({});
  const [recentChallans, setRecentChallans] = useState<any[] | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[] | null>(null);

  useEffect(() => {
    async function load() {
      const tasks = [];
      const keys: string[] = [];
      
      if (can("customers", "list")) {
        tasks.push(api.get("/customers?pageSize=1"));
        keys.push("customers");
      }
      
      if (can("products", "list")) {
        tasks.push(api.get("/products?pageSize=1"));
        keys.push("products");
        
        tasks.push(api.get("/products?lowStock=true&pageSize=5"));
        keys.push("lowStock");
      }
      
      if (can("salesChallans", "list")) {
        tasks.push(api.get("/challans?pageSize=1"));
        keys.push("challans");
        
        tasks.push(api.get("/challans?pageSize=5"));
        keys.push("recentChallans");
      }
      
      if (tasks.length === 0) return;

      try {
        const results = await Promise.all(tasks);
        const newStats: any = {};
        
        results.forEach((res, index) => {
          const key = keys[index];
          if (key === "customers") newStats.customers = res.data.pagination.total;
          if (key === "products") newStats.products = res.data.pagination.total;
          if (key === "lowStock") {
            newStats.lowStock = res.data.pagination?.total || res.data.items.length;
            setLowStockProducts(res.data.items || []);
          }
          if (key === "challans") newStats.challans = res.data.pagination.total;
          if (key === "recentChallans") setRecentChallans(res.data.items || []);
        });
        
        setStats(newStats);
      } catch (err) {
        console.error("Dashboard failed to load one or more protected resources", err);
      }
    }
    load();
  }, [can]);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats.customers !== undefined ? stats.customers : "N/A"}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats.products !== undefined ? stats.products : "N/A"}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{stats.lowStock !== undefined ? stats.lowStock : "N/A"}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Sales Challans</div>
          <div className="stat-value">{stats.challans !== undefined ? stats.challans : "N/A"}</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        {can("salesChallans", "list") && (
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
                  {recentChallans?.map(c => (
                    <tr key={c.id}>
                      <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                      <td>{c.customer?.businessName || c.customer?.name || '-'}</td>
                      <td>{c.totalQuantity}</td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentChallans?.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>No recent challans</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {can("products", "list") && (
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
                  {lowStockProducts?.map(p => (
                    <tr key={p.id}>
                      <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                      <td>{p.sku}</td>
                      <td>{p.currentStock}</td>
                      <td>{p.minStockAlert}</td>
                      <td><span className="badge badge-cancelled" style={{color: '#ef4444', backgroundColor: '#fee2e2'}}>Low Stock</span></td>
                    </tr>
                  ))}
                  {lowStockProducts?.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>All products sufficiently stocked</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
