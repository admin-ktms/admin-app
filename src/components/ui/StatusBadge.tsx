import React from 'react';

export type StatusVariant = 'active' | 'success' | 'warning' | 'danger' | 'neutral' | 'gold';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<StatusVariant, string> = {
    active: 'bg-ktms-cyan/10 text-ktms-cyan border-ktms-cyan/30',
    success: 'bg-ktms-green/10 text-ktms-green border-ktms-green/30',
    warning: 'bg-ktms-gold/10 text-ktms-gold border-ktms-gold/30',
    danger: 'bg-ktms-coral/10 text-ktms-coral border-ktms-coral/30',
    neutral: 'bg-ktms-surface text-ktms-muted border-ktms-border',
    gold: 'bg-ktms-gold/20 text-ktms-gold border-ktms-gold/40',
  };

  const dotStyles: Record<StatusVariant, string> = {
    active: 'bg-ktms-cyan',
    success: 'bg-ktms-green',
    warning: 'bg-ktms-gold',
    danger: 'bg-ktms-coral',
    neutral: 'bg-ktms-muted',
    gold: 'bg-ktms-gold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border tracking-wider uppercase whitespace-nowrap ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]} ${pulse ? 'animate-pulse' : ''}`}
      />
      {label}
    </span>
  );
};
