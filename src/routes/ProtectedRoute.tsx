import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminRoleCode } from '@/types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRoleCode[];
}

/**
 * Fail-Closed Administrative Route Shield
 * Verifies active session, admin account link, and role authority.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isLoading, isAuthenticated, error } = useAdminAuth();
  const location = useLocation();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-ktms-bg text-ktms-text">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ktms-cyan border-t-transparent" />
          <span className="font-mono text-xs uppercase tracking-widest text-ktms-muted">
            Verifying Staff Credentials...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Redirect to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Ejection State: User is linked to a player account or disabled
  if (error && (error.includes('PLAYER_ACCOUNT') || error.includes('DISABLED'))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Role Authorization State
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
