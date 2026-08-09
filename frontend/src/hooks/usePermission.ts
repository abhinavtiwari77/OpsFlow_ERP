import { useAuth } from "../context/AuthContext";
import { hasPermission, Resource, Action } from "../../../shared/permissions";

export function usePermission() {
  const { user } = useAuth();

  const can = (resource: Resource, action: Action) => {
    if (!user) return false;
    return hasPermission(user.role, resource, action);
  };

  return { can };
}
