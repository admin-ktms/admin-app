import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPendingResultDisputes,
  getPendingNoShows,
  resolveKtResultRpc,
  ResolveDisputeParams,
} from '@/api/adjudication';
import { useAdminAuth } from './useAdminAuth';

export const DISPUTES_QUERY_KEY = ['admin', 'disputes', 'result-disputes'];
export const NO_SHOWS_QUERY_KEY = ['admin', 'disputes', 'no-shows'];

export function usePendingDisputes() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: DISPUTES_QUERY_KEY,
    queryFn: getPendingResultDisputes,
    enabled: !!user,
  });
}

export function usePendingNoShows() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: NO_SHOWS_QUERY_KEY,
    queryFn: getPendingNoShows,
    enabled: !!user,
  });
}

export function useAdjudicationMutations() {
  const queryClient = useQueryClient();

  const resolveCase = useMutation({
    mutationFn: (params: ResolveDisputeParams) => resolveKtResultRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPUTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NO_SHOWS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
    },
  });

  return { resolveCase };
}
