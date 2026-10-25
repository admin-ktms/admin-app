import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, refetchAuth, isAuthenticated } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to destination or dashboard root
  React.useEffect(() => {
    if (isAuthenticated) {
      const origin = (location.state as any)?.from?.pathname || '/';
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await login(email, password);
      // Force immediate identity hydration
      refetchAuth();

      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid administrative credentials';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ktms-bg px-4 py-8 text-ktms-text">
      <div className="mb-8">
        <BrandLogo size="lg" />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-ktms-border bg-ktms-panel p-6 shadow-2xl">
        <div className="mb-6 border-b border-ktms-border pb-4">
          <h1 className="text-base font-bold text-ktms-text">Staff Console Sign-In</h1>
          <p className="mt-1 text-xs text-ktms-muted leading-relaxed">
            Authorized administrative personnel only. System activity is logged and audited.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded border border-ktms-coral/40 bg-ktms-coral/10 p-3 text-xs text-ktms-coral">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-email"
              className="text-xs font-semibold uppercase tracking-wider text-ktms-muted"
            >
              Staff Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-ktms-muted pointer-events-none" />
              <input
                id="staff-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@kickoff.ng"
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg pl-9 pr-3 py-2 text-sm text-ktms-text placeholder:text-ktms-muted/40 focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="staff-password"
              className="text-xs font-semibold uppercase tracking-wider text-ktms-muted"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-4 w-4 text-ktms-muted pointer-events-none" />
              <input
                id="staff-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg pl-9 pr-3 py-2 text-sm text-ktms-text placeholder:text-ktms-muted/40 focus:border-ktms-cyan focus:outline-none focus:ring-1 focus:ring-ktms-cyan transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-ktms-cyan px-4 py-2 text-sm font-bold text-black transition hover:bg-ktms-cyan/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Access Console</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center font-mono text-[11px] text-ktms-muted">
        KickOff Tournament Management System • Admin Gateway v1.0
      </p>
    </div>
  );
};
