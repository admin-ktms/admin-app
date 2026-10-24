import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './useAdminAuth';
import { FRESHNESS_WINDOW_MINUTES } from '@/lib/constants';

/**
 * Step-Up Authentication Hook
 * Intercepts high-risk mutations and verifies 5-minute session freshness
 * against identity.check_reauthentication_freshness().
 */
export function useStepUpAuth() {
  const { user } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithFreshAuth = useCallback(
    async (action: () => Promise<void>) => {
      if (!user) return;

      try {
        // Query the live database freshness function
        const { data: isFresh, error: freshnessError } = await supabase.rpc(
          'check_reauthentication_freshness',
          {
            p_auth_user_id: user.auth_user_id,
            p_window_minutes: FRESHNESS_WINDOW_MINUTES,
          }
        );

        if (freshnessError) throw freshnessError;

        if (isFresh) {
          await action();
        } else {
          setPendingAction(() => action);
          setError(null);
          setIsOpen(true);
        }
      } catch (err: unknown) {
        // Fail closed into challenge modal if evaluation errors
        setPendingAction(() => action);
        setError(null);
        setIsOpen(true);
      }
    },
    [user]
  );

  const confirmPassword = async (password: string) => {
    if (!user?.email) return;

    try {
      setIsVerifying(true);
      setError(null);

      // Re-authenticate to refresh auth.users.last_sign_in_at
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError) throw authError;

      setIsOpen(false);
      if (pendingAction) {
        await pendingAction();
        setPendingAction(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid administrator password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const cancelChallenge = () => {
    setIsOpen(false);
    setPendingAction(null);
    setError(null);
  };

  return {
    isOpen,
    isVerifying,
    error,
    executeWithFreshAuth,
    confirmPassword,
    cancelChallenge,
  };
}
