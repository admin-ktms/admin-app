import React from 'react';

interface NotificationBadgeProps {
  count: number;
  hasUrgent?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, hasUrgent = false }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span className="relative flex items-center justify-center">
      {hasUrgent && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ktms-coral opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ktms-coral" />
        </span>
      )}
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full border transition-all ${
          hasUrgent
            ? 'bg-ktms-coral text-white border-ktms-coral/50 shadow-[0_0_8px_rgba(255,107,107,0.5)]'
            : 'bg-ktms-cyan text-ktms-bg border-ktms-cyan/50 font-bold'
        }`}
      >
        {displayCount}
      </span>
    </span>
  );
};
