import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { acceptAdminInviteRpc } from '@/api/auth';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const AcceptInviteView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('token') || searchParams.get('invitation_id') || '';

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationId) {
      setErrorMessage('Missing invitation token. Please follow the link provided in your invite.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 1. Update password for authenticated invited session (if Supabase Auth invite link was used)
      const { error: pwdError } = await supabase.auth.updateUser({ password });
      if (pwdError) throw pwdError;

      // 2. Call identity.accept_admin_invite procedure
      const result = await acceptAdminInviteRpc({
        invitation_id: invitationId,
        full_name: fullName,
        display_name: displayName,
        username: username,
      });

      if (!result?.success) {
        throw new Error(result?.message || result?.reason_code || 'Failed to accept invitation');
      }

      // 3. Onboarded successfully -> Redirect to root console
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error completing staff registration';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ktms-bg px-4 py-8 text-ktms-text">
      <div className="mb-6">
        <BrandLogo size="lg" />
      </div>

      <div className="w-full max-w-md rounded-xl border border-ktms-border bg-ktms-panel p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-ktms-border pb-4 text-ktms-cyan">
          <UserCheck className="h-6 w-6 shrink-0" />
          <div>
            <h1 className="text-base font-bold text-ktms-text">Staff Onboarding</h1>
            <p className="font-mono text-xs text-ktms-muted uppercase tracking-wider">
              Profile & Security Setup
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded border border-ktms-coral/40 bg-ktms-coral/10 p-3 text-xs text-ktms-coral">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Samuel Adeyemi"
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sam A."
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Console Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. sam_mod"
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Create Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Confirm Admin Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-ktms-cyan px-4 py-2 text-sm font-bold text-black transition hover:bg-ktms-cyan/90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Provisioning Profile...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Complete Staff Activation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
