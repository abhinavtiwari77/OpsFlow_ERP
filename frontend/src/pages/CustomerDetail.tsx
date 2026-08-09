import { useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { fetchCustomerDetail, KEYS } from "../api/queries";
import { PermissionGuard } from "../components/PermissionGuard";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState("");

  const { data: customer, isLoading, isError, error } = useQuery({
    queryKey: KEYS.customerDetail(id!),
    queryFn: () => fetchCustomerDetail(id!),
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (noteText: string) => api.post(`/customers/${id}/notes`, { note: noteText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.customerDetail(id!) });
      setNote("");
    },
  });

  function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || addNoteMutation.isPending) return;
    addNoteMutation.mutate(note);
  }

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p className="error-banner">{(error as any)?.response?.data?.error || "Failed to load customer"}</p>;
  if (!customer) return null;

  return (
    <div>
      <Link to="/customers" className="back-link">&larr; Back to customers</Link>
      <h2>{customer.name}</h2>
      <div className="detail-grid">
        <div><strong>Mobile:</strong> {customer.mobile}</div>
        <div><strong>Email:</strong> {customer.email || "-"}</div>
        <div><strong>Business:</strong> {customer.businessName || "-"}</div>
        <div><strong>GST:</strong> {customer.gstNumber || "-"}</div>
        <div><strong>Type:</strong> {customer.customerType}</div>
        <div><strong>Status:</strong> {customer.status}</div>
        <div><strong>Address:</strong> {customer.address || "-"}</div>
      </div>

      <h3>Sales Challans</h3>
      <table className="data-table">
        <thead><tr><th>Challan #</th><th>Status</th><th>Total Qty</th><th>Date</th></tr></thead>
        <tbody>
          {customer.challans?.map((c: any) => (
            <tr key={c.id}>
              <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
              <td>{c.status}</td>
              <td>{c.totalQuantity}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {(!customer.challans || customer.challans.length === 0) && (
            <tr><td colSpan={4} className="muted">No challans yet</td></tr>
          )}
        </tbody>
      </table>

      <h3>Follow-up Notes</h3>
      <PermissionGuard resource="customers" action="update">
        <form onSubmit={handleAddNote} className="inline-form">
          <input
            placeholder="Add a follow-up note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={addNoteMutation.isPending}>
            {addNoteMutation.isPending ? "Adding…" : "Add"}
          </button>
        </form>
      </PermissionGuard>
      <ul className="note-list">
        {customer.followUpNotes?.map((n: any) => (
          <li key={n.id}>
            <span>{n.note}</span>
            <span className="muted small"> — {n.createdBy?.name}, {new Date(n.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
