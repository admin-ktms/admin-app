import React from 'react';
import { ShieldX, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const AccessDeniedView: React.FC = () => {
  const { error, logout } = useAdminAuth();

  const getExplanation = () => {
    if (error === 'PLAYER_ACCOUNT_FORBIDDEN') {
      return 'The authenticated account is registered as a Player. Access to the KTMS Operations Console is strictly restricted to administrative personnel.';
    }
    if (error === 'ADMIN_ACCOUNT_DISABLED' || error === 'ACCOUNT_LINK_DISABLED') {
      return 'Your administrative access has been deactivated or revoked by a Game Master.';
    }
    if (error === 'NO_ACTIVE_ROLE_ASSIGNED') {
      return 'Your administrator profile does not have an active role assignment. Contact a Game Master for role provisioning.';
    }
    return 'You do not have the required role privileges to access this operational desk.';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ktms-bg p-4 text-ktms-text">
      <div className="mb-6">
        <BrandLogo size="lg" />
      </div>

      <div className="w-full max-w-md rounded-xl border border-ktms-coral/30 bg-ktms-panel p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-ktms-border pb-4 text-ktms-coral">
          <ShieldX className="h-7 w-7 shrink-0" />
          <div>
            <h1 className="text-base font-bold text-ktms-text">Access Restricted</h1>
            <p className="font-mono text-xs text-ktms-coral uppercase tracking-wider">
              Error: 403 Forbidden
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ktms-muted">
          {getExplanation()}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => logout()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-ktms-surface px-4 py-2 text-xs font-semibold text-ktms-text border border-ktms-border hover:bg-ktms-border/40 transition active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Current Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
