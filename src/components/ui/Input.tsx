import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`min-h-[44px] w-full rounded border border-ktms-border bg-ktms-panel px-3 py-2 text-sm text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan transition ${
          error ? 'border-ktms-coral' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-ktms-coral mt-0.5">{error}</span>}
      {!error && helperText && <span className="text-xs text-ktms-muted mt-0.5">{helperText}</span>}
    </div>
  );
};
