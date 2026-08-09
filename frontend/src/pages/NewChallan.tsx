import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

type Line = { productId: string; quantity: number };

export function NewChallan() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/customers", { params: { pageSize: 100 } }).then((r) => setCustomers(r.data.items));
    api.get("/products", { params: { pageSize: 100 } }).then((r) => setProducts(r.data.items));
  }, []);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines([...lines, { productId: "", quantity: 1 }]);
  }

  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  async function submit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    const items = lines.filter((l) => l.productId && l.quantity > 0);
    if (!customerId || items.length === 0) {
      setError("Select a customer and at least one product line");
      return;
    }
    try {
      const { data } = await api.post("/challans", { customerId, items, status });
      navigate(`/challans/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create challan");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit("DRAFT");
  }

  return (
    <div>
      <h2>New Sales Challan</h2>
      {error && <div className="error-banner">{error}</div>}
      <form className="panel-form" onSubmit={handleSubmit}>
        <label>Customer</label>
        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.businessName || c.name} ({c.mobile})</option>
          ))}
        </select>

        <h4>Products</h4>
        {lines.map((line, i) => {
          const product = products.find((p) => p.id === line.productId);
          return (
            <div className="challan-line" key={i}>
              <select value={line.productId} onChange={(e) => updateLine(i, { productId: e.target.value })}>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sku} (stock: {p.currentStock})</option>
                ))}
              </select>
              <input
                type="number" min={1} value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value) || 1 })}
              />
              {product && <span className="muted small">₹{product.unitPrice} each</span>}
              <button type="button" className="btn btn-ghost" onClick={() => removeLine(i)}>Remove</button>
            </div>
          );
        })}
        <button type="button" className="btn btn-small" onClick={addLine}>+ Add product line</button>

        <div className="row-gap" style={{ marginTop: 16 }}>
          <button type="submit" className="btn btn-ghost">Save as Draft</button>
          <button type="button" className="btn btn-primary" onClick={() => submit("CONFIRMED")}>Save & Confirm (reduces stock)</button>
        </div>
      </form>
    </div>
  );
}
