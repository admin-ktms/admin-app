import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { PresentStaffMember } from '@/hooks/useCasePresence';

interface PresenceCollisionBannerProps {
  activeStaff: PresentStaffMember[];
  resourceLabel?: string;
}

export const PresenceCollisionBanner: React.FC<PresenceCollisionBannerProps> = ({
  activeStaff,
  resourceLabel = 'record',
}) => {
  if (activeStaff.length === 0) return null;

  const staffNames = activeStaff
    .map((s) => `${s.name} (${s.role.replace('_', ' ')})`)
    .join(', ');

  return (
    <div className="flex items-center gap-3 rounded-lg border border-ktms-gold/40 bg-ktms-gold/10 px-4 py-3 text-ktms-gold select-none animate-in fade-in duration-150">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ktms-gold/20">
        <Eye className="h-4 w-4" />
      </div>

      <div className="flex flex-col text-xs">
        <span className="font-bold flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-ktms-gold shrink-0" />
          Concurrent Review Detected
        </span>
        <p className="text-ktms-text/90 mt-0.5 leading-relaxed">
          Another staff member is actively inspecting this {resourceLabel}:{' '}
          <span className="font-semibold text-white underline">{staffNames}</span>. Coordinate
          before submitting a final ruling to avoid duplicate adjudication.
        </p>
      </div>
    </div>
  );
};
