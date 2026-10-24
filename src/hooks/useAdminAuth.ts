import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveAdminIdentity, adminSignIn, adminSignOut } from '@/api/auth';
import { AdminAuthState, AdminUser } from '@/types/auth.types';

export const ADMIN_AUTH_QUERY_KEY = ['admin', 'auth', 'current-user'];

export function useAdminAuth(): AdminAuthState & {
  login: typeof adminSignIn;
  logout: () => Promise<void>;
  refetchAuth: () => void;
} {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<AdminUser | null>({
    queryKey: ADMIN_AUTH_QUERY_KEY,
    queryFn: resolveAdminIdentity,
    staleTime: 1000 * 60 * 5, // Cache session for 5 minutes
    retry: (failureCount, err: unknown) => {
      // Do not retry authorization rejections (e.g., player or disabled account)
      if (err instanceof Error && err.message.includes('FORBIDDEN')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Listen to Supabase Auth state changes (sign-in, token refresh, sign-out)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_QUERY_KEY });
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(ADMIN_AUTH_QUERY_KEY, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: adminSignOut,
    onSuccess: () => {
      queryClient.setQueryData(ADMIN_AUTH_QUERY_KEY, null);
      window.location.href = '/login';
    },
  });

  const role = user?.role ?? null;

  return {
    user: user ?? null,
    role,
    isLoading,
    isAuthenticated: !!user && user.admin_status === 'Active',
    isGameMaster: role === 'game_master',
    isPlatformManager: role === 'platform_manager',
    isModerator: role === 'moderator',
    isSupport: role === 'support',
    isAccountant: role === 'accountant',
    error: error instanceof Error ? error.message : null,
    login: adminSignIn,
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refetchAuth: () => {
      refetch();
    },
  };
}
