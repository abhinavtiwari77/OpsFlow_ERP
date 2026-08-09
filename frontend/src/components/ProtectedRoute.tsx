import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission, Resource, Action } from "../../../shared/permissions";

// Wraps a route so it redirects to /login when there's no authenticated user.
// Optionally restricts access based on a required permission.
export function ProtectedRoute({ children, resource, action }: { children: ReactNode; resource?: Resource; action?: Action }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (resource && action && !hasPermission(user.role, resource, action)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', marginTop: '10vh' }}>
        <h1 style={{ fontSize: '48px', color: '#ff4d4f', margin: 0 }}>403</h1>
        <h2 style={{ fontWeight: 500 }}>Forbidden</h2>
        <p style={{ color: '#666', marginTop: '16px' }}>
          Your current role (<strong>{user.role}</strong>) does not have permission to access this page.
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}
