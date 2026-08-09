import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchDashboardStats, KEYS } from "../api/queries";

/**
 * StatCard renders one of:
 *   undefined → data still loading (first load, no cache yet)  → shows "…"
 *   null      → role has no permission for this metric          → shows "N/A"
 *   number    → actual value                                    → shows the number
 */
function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number | null | undefined;
  colorClass: string;
}) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value === undefined ? (
          <span style={{ color: "#94a3b8", fontSize: "1.5rem" }}>…</span>
        ) : value === null ? (
          "N/A"
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: KEYS.dashboardStats,
    queryFn: fetchDashboardStats,
    // Only execute when user is authenticated
    enabled: !!user,
    // staleTime/gcTime come from global QueryClient defaults (30s / 5min)
    // Navigation back to Dashboard within staleTime shows cached data instantly.
  });

  const stats = data?.stats;
  const recentChallans = data?.recentChallans ?? null;
  const lowStockProducts = data?.lowStockProducts ?? null;

  return (
    <div>
      {/* Error banner — only shown if no cached data exists at all */}
      {isError && !data && (
        <div
          className="error-banner"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>⚠ {(error as any)?.response?.data?.error || (error as any)?.message || "Failed to load dashboard"}</span>
          <button className="btn btn-ghost" style={{ marginLeft: 12 }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Background refresh indicator — subtle, does NOT replace existing data */}
      {isFetching && !!data && (
        <div style={{ textAlign: "right", fontSize: "12px", color: "#94a3b8", padding: "4px 8px" }}>
          Refreshing…
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Customers"     value={isLoading && !data ? undefined : stats?.customers} colorClass="blue"   />
        <StatCard label="Products"      value={isLoading && !data ? undefined : stats?.products}  colorClass="green"  />
        <StatCard label="Low Stock"     value={isLoading && !data ? undefined : stats?.lowStock}  colorClass="yellow" />
        <StatCard label="Sales Challans" value={isLoading && !data ? undefined : stats?.challans} colorClass="purple" />
      </div>

      <div className="dashboard-bottom">
        {/* Only hide these panels if the role explicitly has no challan access (null) */}
        {stats?.challans !== null && (
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
                  {recentChallans?.map((c) => (
                    <tr key={c.id}>
                      <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                      <td>{c.customer?.businessName || c.customer?.name || "-"}</td>
                      <td>{c.totalQuantity}</td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                      </td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentChallans?.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#888" }}>No recent challans</td></tr>
                  )}
                  {!recentChallans && isLoading && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#888" }}>Loading…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats?.products !== null && (
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
                  {lowStockProducts?.map((p) => (
                    <tr key={p.id}>
                      <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                      <td>{p.sku}</td>
                      <td>{p.currentStock}</td>
                      <td>{p.minStockAlert}</td>
                      <td>
                        <span className="badge badge-cancelled" style={{ color: "#ef4444", backgroundColor: "#fee2e2" }}>
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStockProducts?.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#888" }}>All products sufficiently stocked</td></tr>
                  )}
                  {!lowStockProducts && isLoading && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#888" }}>Loading…</td></tr>
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
