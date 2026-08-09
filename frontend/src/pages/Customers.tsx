import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { fetchCustomers, KEYS } from "../api/queries";
import { PermissionGuard } from "../components/PermissionGuard";
import { useAuth } from "../context/AuthContext";

type Customer = {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  customerType: string;
  status: string;
};

const emptyForm = {
  name: "", mobile: "", email: "", businessName: "", gstNumber: "",
  customerType: "RETAIL", address: "", status: "LEAD", notes: "",
};

export function Customers() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  // ── List query ────────────────────────────────────────────────────────────
  // queryKey includes search so different searches are cached independently.
  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: [...KEYS.customers, search],
    queryFn: () => fetchCustomers(search),
    enabled: !!user,
    placeholderData: (prev) => prev, // keep previous search result visible while new one loads
  });

  // ── Create mutation ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) => api.post("/customers", payload),
    onSuccess: () => {
      // Invalidate the list and dashboard counts — they will refetch in the background.
      queryClient.invalidateQueries({ queryKey: KEYS.customers });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
      setForm(emptyForm);
      setShowForm(false);
      setFormError("");
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || "Failed to create customer");
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.customers });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to delete customer");
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (createMutation.isPending) return;
    setFormError("");
    createMutation.mutate(form);
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/" style={{ color: "#555", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>Client List</h2>
        </div>
        <div className="page-header-actions">
          <input
            className="search-box"
            style={{ margin: 0 }}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => refetch()}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <PermissionGuard resource="customers" action="create">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add New Client"}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {showForm && (
        <PermissionGuard resource="customers" action="create">
          <form className="panel-form" onSubmit={handleCreate}>
            {formError && <div className="error-banner">{formError}</div>}
            <div className="form-grid">
              <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Mobile" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <input placeholder="GST number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {/* Disabled while pending — prevents double POST */}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Customer"}
            </button>
          </form>
        </PermissionGuard>
      )}

      {isError && !showForm && (
        <div className="error-banner">
          {(error as any)?.response?.data?.error || (error as any)?.message || "Failed to load customers"}
        </div>
      )}

      {isLoading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading customers…</div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Mobile</th><th>Business</th><th>Type</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items as Customer[]).map((c) => (
              <tr key={c.id}>
                <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                <td>{c.mobile}</td>
                <td>{c.businessName || "-"}</td>
                <td>{c.customerType}</td>
                <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>
                  <PermissionGuard resource="customers" action="delete">
                    <button
                      className="btn btn-small"
                      style={{ background: "#fee2e2", color: "#b91c1c", border: "none" }}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && !isError && (
              <tr><td colSpan={6} className="muted">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
