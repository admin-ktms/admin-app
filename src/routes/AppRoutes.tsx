import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminShell } from '@/components/layout/AdminShell';
import { LoginView } from '@/views/auth/LoginView';
import { AcceptInviteView } from '@/views/auth/AcceptInviteView';
import { AccessDeniedView } from '@/views/auth/AccessDeniedView';
import { DashboardOverview } from '@/views/dashboard/DashboardOverview';
import { TournamentsListDesk } from '@/views/tournaments/TournamentsListDesk';
import { TournamentDetailDesk } from '@/views/tournaments/TournamentDetailDesk';
import { DisputeQueueDesk } from '@/views/adjudication/DisputeQueueDesk';
import { DisputeReviewCase } from '@/views/adjudication/DisputeReviewCase';
import { FinanceDeskShell } from '@/views/finance/FinanceDeskShell';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Entry Points */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/accept-invite" element={<AcceptInviteView />} />
      <Route path="/unauthorized" element={<AccessDeniedView />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminShell>
              <DashboardOverview />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      {/* Desk 1: Tournament Operations */}
      <Route
        path="/tournaments"
        element={
          <ProtectedRoute allowedRoles={['game_master', 'platform_manager', 'moderator']}>
            <AdminShell>
              <TournamentsListDesk />
            </AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tournaments/:tournamentId"
        element={
          <ProtectedRoute allowedRoles={['game_master', 'platform_manager', 'moderator']}>
            <AdminShell>
              <TournamentDetailDesk />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      {/* Desk 2: Adjudication & Dispute Desk */}
      <Route
        path="/disputes"
        element={
          <ProtectedRoute allowedRoles={['game_master', 'platform_manager', 'moderator']}>
            <AdminShell>
              <DisputeQueueDesk />
            </AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/disputes/:type/:id"
        element={
          <ProtectedRoute allowedRoles={['game_master', 'platform_manager', 'moderator']}>
            <AdminShell>
              <DisputeReviewCase />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      {/* Desk 3: Finance Desk & Award Disbursements */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute allowedRoles={['game_master', 'accountant', 'platform_manager']}>
            <AdminShell>
              <FinanceDeskShell />
            </AdminShell>
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
