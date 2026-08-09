import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Stats = {
  customers: number | null;
  products: number | null;
  lowStock: number | null;
  challans: number | null;
};

type LoadState = "loading" | "success" | "error";

function StatCard({ label, value, colorClass }: { label: string; value: number | null | undefined; colorClass: string }) {
  // null  = role has no permission   → show N/A (grey)
  // undefined = still loading         → show …
  // number = actual value             → show it
  if (value === undefined) {
    return (
      <div className={`stat-card ${colorClass}`}>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color: "#94a3b8", fontSize: "1.5rem" }}>…</div>
      </div>
    );
  }
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value === null ? "N/A" : value}</div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();

  // undefined = loading, null = no permission, number = actual value
  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [recentChallans, setRecentChallans] = useState<any[] | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Use ref to prevent stale effect re-runs — only fire once per mount
  const hasFetched = useRef(false);

  useEffect(() => {
    // Guard: don't fetch if no user (should not happen behind ProtectedRoute)
    if (!user) return;

    // Prevent double-fetch in React StrictMode development double-invoke
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    async function load() {
      setLoadState("loading");
      try {
        const { data } = await api.get("/stats");
        if (cancelled) return;
        setStats(data.stats);
        setRecentChallans(data.recentChallans);
        setLowStockProducts(data.lowStockProducts);
        setLoadState("success");
        setErrorMsg("");
      } catch (err: any) {
        if (cancelled) return;
        console.error("Dashboard failed to load stats", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        setLoadState("error");
        setErrorMsg(
          err.response?.data?.error ||
          err.message ||
          "Failed to load dashboard data"
        );
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  // Only re-run when user identity actually changes (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function retry() {
    hasFetched.current = false;
    setStats(undefined);
    setRecentChallans(null);
    setLowStockProducts(null);
    setLoadState("loading");
    setErrorMsg("");

    if (!user) return;
    let cancelled = false;
    api.get("/stats")
      .then(({ data }) => {
        if (cancelled) return;
        setStats(data.stats);
        setRecentChallans(data.recentChallans);
        setLowStockProducts(data.lowStockProducts);
        setLoadState("success");
        setErrorMsg("");
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Dashboard retry failed:", err.response?.data || err.message);
        setLoadState("error");
        setErrorMsg(err.response?.data?.error || err.message || "Failed to load dashboard data");
      });
  }

  return (
    <div>
      {loadState === "error" && (
        <div className="error-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠ {errorMsg}</span>
          <button className="btn btn-ghost" style={{ marginLeft: 12 }} onClick={retry}>Retry</button>
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Customers"    value={stats?.customers} colorClass="blue"   />
        <StatCard label="Products"     value={stats?.products}  colorClass="green"  />
        <StatCard label="Low Stock"    value={stats?.lowStock}  colorClass="yellow" />
        <StatCard label="Sales Challans" value={stats?.challans} colorClass="purple" />
      </div>

      <div className="dashboard-bottom">
        {(stats?.challans !== null) && (
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
                  {recentChallans === null && loadState === "loading" && (
                    <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>Loading…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(stats?.products !== null) && (
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
                  {lowStockProducts === null && loadState === "loading" && (
                    <tr><td colSpan={5} style={{textAlign: 'center', color: '#888'}}>Loading…</td></tr>
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
