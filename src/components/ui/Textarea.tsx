import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full rounded border border-ktms-border bg-ktms-panel p-3 text-sm text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan transition resize-y ${
          error ? 'border-ktms-coral' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-ktms-coral mt-0.5">{error}</span>}
    </div>
  );
};
