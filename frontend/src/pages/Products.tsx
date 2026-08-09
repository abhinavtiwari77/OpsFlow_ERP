import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { fetchProducts, KEYS } from "../api/queries";
import { PermissionGuard } from "../components/PermissionGuard";
import { useAuth } from "../context/AuthContext";

type Product = {
  id: string; name: string; sku: string; category?: string;
  unitPrice: string; currentStock: number; minStockAlert: number; location?: string;
};

const emptyForm = { name: "", sku: "", category: "", unitPrice: 0, currentStock: 0, minStockAlert: 0, location: "" };

export function Products() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [movement, setMovement] = useState<{ id: string; type: "IN" | "OUT" } | null>(null);
  const [movementQty, setMovementQty] = useState(1);
  const [movementReason, setMovementReason] = useState("");
  const [movementError, setMovementError] = useState("");

  // ── List query ────────────────────────────────────────────────────────────
  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: [...KEYS.products, search],
    queryFn: () => fetchProducts(search),
    enabled: !!user,
    placeholderData: (prev) => prev,
  });

  // ── Create product mutation ───────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) => api.post("/products", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.products });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to create product");
    },
  });

  // ── Stock movement mutation ───────────────────────────────────────────────
  const movementMutation = useMutation({
    mutationFn: ({ id, type, qty, reason }: { id: string; type: string; qty: number; reason: string }) =>
      api.post(`/products/${id}/stock-movement`, { quantity: qty, movementType: type, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.products });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
      queryClient.invalidateQueries({ queryKey: KEYS.stockMovements });
      setMovement(null);
      setMovementQty(1);
      setMovementReason("");
      setMovementError("");
    },
    onError: (err: any) => {
      setMovementError(err.response?.data?.error || "Failed to record stock movement");
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.products });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to delete product");
    },
  });

  function handleMovement(e: FormEvent) {
    e.preventDefault();
    if (!movement || movementMutation.isPending) return;
    setMovementError("");
    movementMutation.mutate({ id: movement.id, type: movement.type, qty: movementQty, reason: movementReason });
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
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>Product List</h2>
        </div>
        <div className="page-header-actions">
          <input className="search-box" style={{ margin: 0 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => refetch()}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <PermissionGuard resource="products" action="create">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add New Product"}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {isError && (
        <div className="error-banner">
          {(error as any)?.response?.data?.error || (error as any)?.message || "Failed to load products"}
        </div>
      )}

      {showForm && (
        <PermissionGuard resource="products" action="create">
          <form className="panel-form" onSubmit={(e) => { e.preventDefault(); if (!createMutation.isPending) createMutation.mutate(form); }}>
            <div className="form-grid">
              <input placeholder="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input type="number" placeholder="Unit price" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) })} />
              <input type="number" placeholder="Starting stock" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) })} />
              <input type="number" placeholder="Minimum stock alert" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: parseInt(e.target.value) })} />
              <input placeholder="Location/Warehouse" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Product"}
            </button>
          </form>
        </PermissionGuard>
      )}

      {movement && (
        <form className="panel-form" onSubmit={handleMovement}>
          <h4>Record Stock {movement.type === "IN" ? "In" : "Out"}</h4>
          {movementError && <div className="error-banner">{movementError}</div>}
          <div className="form-grid">
            <input type="number" min={1} required placeholder="Quantity" value={movementQty} onChange={(e) => setMovementQty(parseInt(e.target.value))} />
            <input required placeholder="Reason" value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
          </div>
          <div className="row-gap">
            <button type="submit" className="btn btn-primary" disabled={movementMutation.isPending}>
              {movementMutation.isPending ? "Saving..." : "Confirm"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setMovement(null)}>Cancel</button>
          </div>
        </form>
      )}

      {isLoading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading products…</div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Location</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {(items as Product[]).map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category || "-"}</td>
                <td>₹{p.unitPrice}</td>
                <td className={p.currentStock <= p.minStockAlert ? "low-stock" : ""}>
                  {p.currentStock}{p.currentStock <= p.minStockAlert && " ⚠"}
                </td>
                <td>{p.location || "-"}</td>
                <td>
                  <PermissionGuard resource="stockMovements" action="create">
                    <button className="btn btn-small" onClick={() => setMovement({ id: p.id, type: "IN" })}>+ In</button>{" "}
                    <button className="btn btn-small" onClick={() => setMovement({ id: p.id, type: "OUT" })}>- Out</button>
                  </PermissionGuard>
                  <PermissionGuard resource="products" action="delete">
                    <button
                      className="btn btn-small"
                      style={{ marginLeft: 8, background: "#fee2e2", color: "#b91c1c", border: "none" }}
                      onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }}
                    >
                      Delete
                    </button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && !isError && (
              <tr><td colSpan={7} className="muted">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
