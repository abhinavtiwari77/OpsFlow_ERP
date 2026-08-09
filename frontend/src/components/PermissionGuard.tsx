import { ReactNode } from "react";
import { Resource, Action } from "../../../shared/permissions";
import { usePermission } from "../hooks/usePermission";

type Props = {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGuard({ resource, action, children, fallback = null }: Props) {
  const { can } = usePermission();
  
  if (!can(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
