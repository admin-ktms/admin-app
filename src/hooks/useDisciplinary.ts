import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlayerDirectory,
  disqualifyTournamentPlayerRpc,
  suspendPlayerAccountRpc,
  banPlayerAccountRpc,
  reinstatePlayerRpc,
  DisqualifyPlayerParams,
  SuspendPlayerParams,
  BanPlayerParams,
  ReinstatePlayerParams,
} from '@/api/disciplinary';
import { useAdminAuth } from './useAdminAuth';

export const PLAYERS_QUERY_KEY = ['admin', 'disciplinary', 'players'];

export function usePlayerDirectory() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: getPlayerDirectory,
    enabled: !!user,
  });
}

export function useDisciplinaryMutations() {
  const queryClient = useQueryClient();

  const disqualifyPlayer = useMutation({
    mutationFn: (params: DisqualifyPlayerParams) => disqualifyTournamentPlayerRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
    },
  });

  const suspendPlayer = useMutation({
    mutationFn: (params: SuspendPlayerParams) => suspendPlayerAccountRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
  });

  const banPlayer = useMutation({
    mutationFn: (params: BanPlayerParams) => banPlayerAccountRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
  });

  const reinstatePlayer = useMutation({
    mutationFn: (params: ReinstatePlayerParams) => reinstatePlayerRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
  });

  return {
    disqualifyPlayer,
    suspendPlayer,
    banPlayer,
    reinstatePlayer,
  };
}
