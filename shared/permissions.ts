export type Role = "admin" | "sales" | "warehouse" | "accounts";
export type Resource = "customers" | "products" | "stockMovements" | "salesChallans";
export type Action = "create" | "read" | "update" | "delete" | "list" | "confirm" | "cancel" | "stock_in" | "stock_out";

export const permissions: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    customers: ["create", "read", "update", "delete", "list"],
    products: ["create", "read", "update", "delete", "list", "stock_in", "stock_out"],
    stockMovements: ["create", "read", "list"],
    salesChallans: ["create", "read", "list", "confirm", "cancel"]
  },
  sales: {
    customers: ["create", "read", "update", "list"],
    products: ["read", "list"],
    stockMovements: [],
    salesChallans: ["create", "read", "list", "confirm"]
  },
  warehouse: {
    customers: [],
    products: ["create", "read", "update", "list", "stock_in", "stock_out"],
    stockMovements: ["create", "read", "list"],
    salesChallans: ["read", "list"]
  },
  accounts: {
    customers: ["read", "list"],
    products: ["read", "list"],
    stockMovements: [],
    salesChallans: ["read", "list"]
  }
};

export function hasPermission(role: string | undefined | null, resource: Resource, action: Action): boolean {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  
  const allowedActions = permissions[normalizedRole][resource] || [];
  return allowedActions.includes(action);
}

export function normalizeRole(role: string | undefined | null): Role | null {
  if (!role) return null;
  const lower = role.toLowerCase();
  if (["admin", "sales", "warehouse", "accounts"].includes(lower)) {
    return lower as Role;
  }
  return null;
}
