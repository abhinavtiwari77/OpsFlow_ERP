/**
 * Central file for all API query functions and their canonical query keys.
 *
 * Query keys are exported as constants so every component and mutation
 * uses the same key — preventing cache mismatches.
 *
 * Query functions return typed data from the API and throw on error
 * (React Query will surface the error through the `error` return value).
 */

import { api } from "./client";

// ─── Query Keys ────────────────────────────────────────────────────────────
// Exported as arrays for easy partial matching in invalidateQueries.

export const KEYS = {
  dashboardStats:    ["dashboard", "stats"]            as const,
  customers:         ["customers"]                     as const,
  customerDetail:    (id: string) => ["customers", id] as const,
  products:          ["products"]                      as const,
  productDetail:     (id: string) => ["products", id]  as const,
  challans:          ["challans"]                      as const,
  challanDetail:     (id: string) => ["challans", id]  as const,
  stockMovements:    ["stockMovements"]                as const,
} as const;

// ─── Query Functions ────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const { data } = await api.get("/stats");
  return data as {
    stats: {
      customers: number | null;
      products:  number | null;
      lowStock:  number | null;
      challans:  number | null;
    };
    recentChallans:   any[];
    lowStockProducts: any[];
  };
}

export async function fetchCustomers(search = "") {
  const { data } = await api.get("/customers", { params: { search, pageSize: 100 } });
  return data.items as any[];
}

export async function fetchCustomerDetail(id: string) {
  const { data } = await api.get(`/customers/${id}`);
  return data;
}

export async function fetchProducts(search = "") {
  const { data } = await api.get("/products", { params: { search, pageSize: 100 } });
  return data.items as any[];
}

export async function fetchChallans(status = "") {
  const { data } = await api.get("/challans", {
    params: { status: status || undefined, pageSize: 100 },
  });
  return data.items as any[];
}

export async function fetchChallanDetail(id: string) {
  const { data } = await api.get(`/challans/${id}`);
  return data;
}
