import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PermissionGuard } from "../components/PermissionGuard";

export function Challans() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function load() {
    const { data } = await api.get("/challans", { params: { status: status || undefined } });
    setItems(data.items);
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ color: '#555', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Sales Challans</h2>
        </div>
        <div className="page-header-actions">
          <select className="search-box" style={{ margin: 0 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={load}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh
          </button>
          <PermissionGuard resource="salesChallans" action="create">
            <button className="btn btn-primary" onClick={() => navigate("/challans/new")}>
              + Create Challan
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="table-container">

      <table className="data-table">
        <thead>
          <tr><th>Challan #</th><th>Customer</th><th>Total Qty</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
              <td>{c.customer?.businessName || c.customer?.name}</td>
              <td>{c.totalQuantity}</td>
              <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} className="muted">No challans found</td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}
