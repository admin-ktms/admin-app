import React from 'react';
import { Shield, User, LogOut, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export const DashboardOverview: React.FC = () => {
  const { user, role, logout } = useAdminAuth();

  return (
    <div className="flex min-h-screen flex-col bg-ktms-bg text-ktms-text">
      {/* Top Bar */}
      <header className="flex min-h-[56px] items-center justify-between border-b border-ktms-border bg-ktms-panel px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-ktms-cyan">KTMS</span>
          <span className="text-xs text-ktms-muted">/</span>
          <span className="text-xs font-semibold text-ktms-text">Command Console</span>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-ktms-muted hover:bg-ktms-surface hover:text-white transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-xl border border-ktms-border bg-ktms-panel p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ktms-surface border border-ktms-border text-ktms-cyan">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-ktms-text">
                  Welcome, {user?.display_name || user?.full_name}
                </h1>
                <p className="font-mono text-xs text-ktms-muted mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-ktms-cyan/30 bg-ktms-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ktms-cyan w-fit">
              <Shield className="h-3.5 w-3.5" />
              <span>{role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Milestone M2 Verification Matrix Card */}
        <div className="rounded-xl border border-ktms-border bg-ktms-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-ktms-border pb-3">
            <h2 className="text-sm font-bold text-ktms-text">Milestone M2 Identity Bridge Status</h2>
            <span className="font-mono text-xs text-ktms-green flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded bg-ktms-surface/50 border border-ktms-border p-3 space-y-1">
              <span className="text-ktms-muted uppercase font-semibold text-[10px]">Staff Identifier</span>
              <p className="font-mono text-ktms-text font-bold">{user?.admin_id}</p>
            </div>
            <div className="rounded bg-ktms-surface/50 border border-ktms-border p-3 space-y-1">
              <span className="text-ktms-muted uppercase font-semibold text-[10px]">Account Link Status</span>
              <p className="font-mono text-ktms-green font-bold">{user?.admin_status}</p>
            </div>
            <div className="rounded bg-ktms-surface/50 border border-ktms-border p-3 space-y-1">
              <span className="text-ktms-muted uppercase font-semibold text-[10px]">Active Role Code</span>
              <p className="font-mono text-ktms-cyan font-bold">{role}</p>
            </div>
            <div className="rounded bg-ktms-surface/50 border border-ktms-border p-3 space-y-1">
              <span className="text-ktms-muted uppercase font-semibold text-[10px]">Assigned Tournaments</span>
              <p className="font-mono text-ktms-text font-bold">
                {user?.assigned_tournament_ids && user.assigned_tournament_ids.length > 0
                  ? user.assigned_tournament_ids.join(', ')
                  : 'Global / Platform Scope'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
