import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminRoleCode } from '@/types/auth.types';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: AdminRoleCode[];
  fallback?: React.ReactNode;
}

/**
 * Component-Level Permission Shield
 * Hides or renders fallback elements based on active administrative role.
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { role } = useAdminAuth();

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
