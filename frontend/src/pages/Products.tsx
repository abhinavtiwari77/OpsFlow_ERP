import { useEffect, useState, useRef, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PermissionGuard } from "../components/PermissionGuard";

type Product = {
  id: string; name: string; sku: string; category?: string;
  unitPrice: string; currentStock: number; minStockAlert: number; location?: string;
};

const emptyForm = { name: "", sku: "", category: "", unitPrice: 0, currentStock: 0, minStockAlert: 0, location: "" };

export function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [movement, setMovement] = useState<{ id: string; type: "IN" | "OUT" } | null>(null);
  const [movementQty, setMovementQty] = useState(1);
  const [movementReason, setMovementReason] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function load(keepExisting = false) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    if (!keepExisting) setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products", { params: { search }, signal: abortRef.current.signal });
      setItems(data.items);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      setError(err.response?.data?.error || err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", form);
      setForm(emptyForm);
      setShowForm(false);
      load(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create product");
    }
  }

  async function handleMovement(e: FormEvent) {
    e.preventDefault();
    if (!movement) return;
    setError("");
    try {
      await api.post(`/products/${movement.id}/stock-movement`, {
        quantity: movementQty, movementType: movement.type, reason: movementReason,
      });
      setMovement(null); setMovementQty(1); setMovementReason("");
      load(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to record stock movement");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    try {
      await api.delete(`/products/${id}`);
      load(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete product");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ color: '#555', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Product List</h2>
        </div>
        <div className="page-header-actions">
          <input className="search-box" style={{ margin: 0 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => load()}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh
          </button>
          <PermissionGuard resource="products" action="create">
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add New Product"}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <PermissionGuard resource="products" action="create">
          <form className="panel-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <input placeholder="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input type="number" placeholder="Unit price" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) })} />
              <input type="number" placeholder="Starting stock" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) })} />
              <input type="number" placeholder="Minimum stock alert" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: parseInt(e.target.value) })} />
              <input placeholder="Location/Warehouse" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{marginTop: 12}}>Save Product</button>
          </form>
        </PermissionGuard>
      )}

      {movement && (
        <form className="panel-form" onSubmit={handleMovement}>
          <h4>Record Stock {movement.type === "IN" ? "In" : "Out"}</h4>
          <div className="form-grid">
            <input type="number" min={1} required placeholder="Quantity" value={movementQty} onChange={(e) => setMovementQty(parseInt(e.target.value))} />
            <input required placeholder="Reason" value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
          </div>
          <div className="row-gap">
            <button type="submit" className="btn btn-primary">Confirm</button>
            <button type="button" className="btn btn-ghost" onClick={() => setMovement(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading products…</div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Location</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
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
                    <button className="btn btn-small" style={{marginLeft: 8, background: '#fee2e2', color: '#b91c1c', border: 'none'}} onClick={() => handleDelete(p.id)}>Delete</button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && !error && (
              <tr><td colSpan={7} className="muted">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
