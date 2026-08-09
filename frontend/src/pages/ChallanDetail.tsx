import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { fetchChallanDetail, KEYS } from "../api/queries";
import { usePermission } from "../hooks/usePermission";

export function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();

  const { data: challan, isLoading, isError, error } = useQuery({
    queryKey: KEYS.challanDetail(id!),
    queryFn: () => fetchChallanDetail(id!),
    enabled: !!id,
  });

  // Confirm mutation — invalidates challans, products (stock), dashboard
  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/challans/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.challanDetail(id!) });
      queryClient.invalidateQueries({ queryKey: KEYS.challans });
      queryClient.invalidateQueries({ queryKey: KEYS.products });
      queryClient.invalidateQueries({ queryKey: KEYS.stockMovements });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
    },
  });

  // Cancel mutation — invalidates same set
  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/challans/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.challanDetail(id!) });
      queryClient.invalidateQueries({ queryKey: KEYS.challans });
      queryClient.invalidateQueries({ queryKey: KEYS.products });
      queryClient.invalidateQueries({ queryKey: KEYS.stockMovements });
      queryClient.invalidateQueries({ queryKey: KEYS.dashboardStats });
    },
  });

  const mutationError =
    (confirmMutation.error as any)?.response?.data?.error ||
    (cancelMutation.error as any)?.response?.data?.error ||
    "";

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p className="error-banner">{(error as any)?.response?.data?.error || "Failed to load challan"}</p>;
  if (!challan) return null;

  const canConfirm = can("salesChallans", "confirm");
  const canCancel = can("salesChallans", "cancel");

  return (
    <div>
      <Link to="/challans" className="back-link">&larr; Back to challans</Link>
      <div className="page-header">
        <h2>{challan.challanNumber}</h2>
        <span className={`badge badge-${challan.status.toLowerCase()}`}>{challan.status}</span>
      </div>
      {mutationError && <div className="error-banner">{mutationError}</div>}

      <div className="detail-grid">
        <div><strong>Customer:</strong> {challan.customer?.businessName || challan.customer?.name}</div>
        <div><strong>Created by:</strong> {challan.createdBy?.name}</div>
        <div><strong>Date:</strong> {new Date(challan.createdAt).toLocaleString()}</div>
        <div><strong>Total quantity:</strong> {challan.totalQuantity}</div>
      </div>

      <table className="data-table">
        <thead>
          <tr><th>Product</th><th>SKU</th><th>Unit Price</th><th>Qty</th><th>Line Total</th></tr>
        </thead>
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
        <div className="row-gap" style={{ marginTop: "20px" }}>
          {canConfirm && (
            <button
              className="btn btn-primary"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "Confirming…" : "Confirm Challan (reduces stock)"}
            </button>
          )}
          {canCancel && (
            <button
              className="btn btn-ghost"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              Cancel Challan
            </button>
          )}
        </div>
      )}
      {canCancel && challan.status === "CONFIRMED" && (
        <div style={{ marginTop: "20px" }}>
          <button
            className="btn btn-ghost"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "Cancelling…" : "Cancel Challan (restores stock)"}
          </button>
        </div>
      )}
    </div>
  );
}
