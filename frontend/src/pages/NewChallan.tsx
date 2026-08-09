import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { fetchCustomers, fetchProducts, KEYS } from "../api/queries";
import { useAuth } from "../context/AuthContext";

type Line = { productId: string; quantity: number };

export function NewChallan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");

  // Re-use cached customer/product lists — no duplicate fetch if already loaded
  const { data: customers = [] } = useQuery({
    queryKey: [...KEYS.customers, ""],
    queryFn: () => fetchCustomers(""),
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: [...KEYS.products, ""],
    queryFn: () => fetchProducts(""),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: ({ items, status }: { items: Line[]; status: string }) =>
      api.post("/challans", { customerId, items, status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: KEYS.challans });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
      navigate(`/challans/${res.data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || "Failed to create challan");
    },
  });

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function submit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    const items = lines.filter((l) => l.productId && l.quantity > 0);
    if (!customerId || items.length === 0) {
      setError("Select a customer and at least one product line");
      return;
    }
    createMutation.mutate({ items, status });
  }

  return (
    <div>
      <h2>New Sales Challan</h2>
      {error && <div className="error-banner">{error}</div>}
      <form className="panel-form" onSubmit={(e) => { e.preventDefault(); submit("DRAFT"); }}>
        <label>Customer</label>
        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer</option>
          {(customers as any[]).map((c) => (
            <option key={c.id} value={c.id}>{c.businessName || c.name} ({c.mobile})</option>
          ))}
        </select>

        <h4>Products</h4>
        {lines.map((line, i) => {
          const product = (products as any[]).find((p) => p.id === line.productId);
          return (
            <div className="challan-line" key={i}>
              <select value={line.productId} onChange={(e) => updateLine(i, { productId: e.target.value })}>
                <option value="">Select product</option>
                {(products as any[]).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sku} (stock: {p.currentStock})</option>
                ))}
              </select>
              <input
                type="number" min={1} value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value) || 1 })}
              />
              {product && <span className="muted small">₹{product.unitPrice} each</span>}
              <button type="button" className="btn btn-ghost" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          );
        })}
        <button type="button" className="btn btn-small" onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}>+ Add product line</button>

        <div className="row-gap" style={{ marginTop: 16 }}>
          <button type="submit" className="btn btn-ghost" disabled={createMutation.isPending}>Save as Draft</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={createMutation.isPending}
            onClick={() => submit("CONFIRMED")}
          >
            {createMutation.isPending ? "Saving…" : "Save & Confirm (reduces stock)"}
          </button>
        </div>
      </form>
    </div>
  );
}
