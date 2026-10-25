import React from 'react';

interface SwitchToggleProps {
  id: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const SwitchToggle: React.FC<SwitchToggleProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-3 cursor-pointer select-none">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${
            checked ? 'bg-ktms-cyan' : 'bg-ktms-surface border border-ktms-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <div
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5 !bg-black' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-xs font-medium text-ktms-text">{label}</span>}
    </label>
  );
};
