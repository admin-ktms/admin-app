import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginView } from '@/views/auth/LoginView';
import { AcceptInviteView } from '@/views/auth/AcceptInviteView';
import { AccessDeniedView } from '@/views/auth/AccessDeniedView';
import { DashboardOverview } from '@/views/dashboard/DashboardOverview';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Entry Points */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/accept-invite" element={<AcceptInviteView />} />
      <Route path="/unauthorized" element={<AccessDeniedView />} />

      {/* Fail-Closed Authenticated Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
