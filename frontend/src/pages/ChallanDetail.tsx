import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { usePermission } from "../hooks/usePermission";

export function ChallanDetail() {
  const { id } = useParams();
  const { can } = usePermission();
  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get(`/challans/${id}`);
    setChallan(data);
  }

  useEffect(() => { load(); }, [id]);

  async function confirm() {
    setError("");
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to confirm challan");
    }
  }

  async function cancel() {
    setError("");
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cancel challan");
    }
  }

  if (!challan) return <p>Loading...</p>;

  const canConfirm = can("salesChallans", "confirm");
  const canCancel = can("salesChallans", "cancel");

  return (
    <div>
      <Link to="/challans" className="back-link">&larr; Back to challans</Link>
      <div className="page-header">
        <h2>{challan.challanNumber}</h2>
        <span className={`badge badge-${challan.status.toLowerCase()}`}>{challan.status}</span>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="detail-grid">
        <div><strong>Customer:</strong> {challan.customer?.businessName || challan.customer?.name}</div>
        <div><strong>Created by:</strong> {challan.createdBy?.name}</div>
        <div><strong>Date:</strong> {new Date(challan.createdAt).toLocaleString()}</div>
        <div><strong>Total quantity:</strong> {challan.totalQuantity}</div>
      </div>

      <table className="data-table">
        <thead><tr><th>Product</th><th>SKU</th><th>Unit Price</th><th>Qty</th><th>Line Total</th></tr></thead>
        <tbody>
          {challan.items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.productNameSnapshot}</td>
              <td>{item.productSkuSnapshot}</td>
              <td>₹{item.unitPriceSnapshot}</td>
              <td>{item.quantity}</td>
              <td>₹{(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {challan.status === "DRAFT" && (canConfirm || canCancel) && (
        <div className="row-gap" style={{ marginTop: '20px' }}>
          {canConfirm && <button className="btn btn-primary" onClick={confirm}>Confirm Challan (reduces stock)</button>}
          {canCancel && <button className="btn btn-ghost" onClick={cancel}>Cancel Challan</button>}
        </div>
      )}
      {canCancel && challan.status === "CONFIRMED" && (
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={cancel}>Cancel Challan (restores stock)</button>
        </div>
      )}
    </div>
  );
}
