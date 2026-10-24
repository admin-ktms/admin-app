import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface StepUpAuthModalProps {
  isOpen: boolean;
  isVerifying: boolean;
  error: string | null;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export const StepUpAuthModal: React.FC<StepUpAuthModalProps> = ({
  isOpen,
  isVerifying,
  error,
  onConfirm,
  onCancel,
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onConfirm(password);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-ktms-gold/40 bg-ktms-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ktms-border pb-3">
          <div className="flex items-center gap-2 text-ktms-gold">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-base font-bold text-ktms-text">Step-Up Authentication Required</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-ktms-muted hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 mb-4 text-xs leading-relaxed text-ktms-muted">
          This operation is classified as a sensitive administrative action. Enter your account password to confirm identity freshness (required every 5 minutes for security-level actions).
        </p>

        {error && (
          <div className="mb-4 rounded border border-ktms-coral/40 bg-ktms-coral/10 p-2.5 text-xs text-ktms-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="stepup-pwd"
              className="text-xs font-semibold uppercase tracking-wider text-ktms-muted"
            >
              Administrator Password
            </label>
            <input
              id="stepup-pwd"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan transition"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded px-4 py-2 text-xs font-semibold text-ktms-muted hover:text-ktms-text transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="min-h-[44px] rounded bg-ktms-gold px-4 py-2 text-xs font-bold text-black hover:bg-ktms-gold/90 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Proceed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
