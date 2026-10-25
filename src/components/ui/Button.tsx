import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded transition focus:outline-none focus:ring-2 focus:ring-ktms-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-sm gap-2',
    lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-ktms-cyan text-black hover:bg-ktms-cyan/90',
    secondary: 'bg-ktms-surface text-ktms-text border border-ktms-border hover:bg-ktms-border/40',
    danger: 'bg-ktms-coral text-white hover:bg-ktms-coral/90',
    ghost: 'bg-transparent text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface',
    gold: 'bg-ktms-gold text-black hover:bg-ktms-gold/90',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
