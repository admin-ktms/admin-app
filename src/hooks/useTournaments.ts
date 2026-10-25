import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTournamentsList,
  getTournamentById,
  createTournamentRpc,
  transitionTournamentStatusRpc,
  getTournamentMatchdays,
  transitionMatchdayStatusRpc,
  getTournamentFixtures,
  rescheduleFixtureRpc,
  CreateTournamentParams,
  TournamentRow,
} from '@/api/tournaments';
import { useAdminAuth } from './useAdminAuth';

export const TOURNAMENTS_QUERY_KEY = ['admin', 'tournaments'];
export const MATCHDAYS_QUERY_KEY = ['admin', 'matchdays'];
export const FIXTURES_QUERY_KEY = ['admin', 'fixtures'];

export function useTournaments() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: TOURNAMENTS_QUERY_KEY,
    queryFn: getTournamentsList,
    enabled: !!user,
  });
}

export function useTournamentDetail(tournamentId: string | undefined) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...TOURNAMENTS_QUERY_KEY, tournamentId],
    queryFn: () => (tournamentId ? getTournamentById(tournamentId) : null),
    enabled: !!user && !!tournamentId,
  });
}

export function useTournamentMatchdays(tournamentId: string | undefined) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...MATCHDAYS_QUERY_KEY, tournamentId],
    queryFn: () => (tournamentId ? getTournamentMatchdays(tournamentId) : []),
    enabled: !!user && !!tournamentId,
  });
}

export function useTournamentFixtures(tournamentId: string | undefined) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...FIXTURES_QUERY_KEY, tournamentId],
    queryFn: () => (tournamentId ? getTournamentFixtures(tournamentId) : []),
    enabled: !!user && !!tournamentId,
  });
}

export function useTournamentMutations() {
  const queryClient = useQueryClient();

  const createTournament = useMutation({
    mutationFn: (params: CreateTournamentParams) => createTournamentRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOURNAMENTS_QUERY_KEY });
    },
  });

  const transitionStatus = useMutation({
    mutationFn: (params: {
      tournament_id: string;
      to_status: TournamentRow['tournament_status'];
      reason?: string;
      approval_id?: string;
    }) => transitionTournamentStatusRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TOURNAMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...TOURNAMENTS_QUERY_KEY, variables.tournament_id],
      });
    },
  });

  const transitionMatchday = useMutation({
    mutationFn: (params: {
      tournament_id: string;
      matchday_id: string;
      to_status: 'Scheduled' | 'Active' | 'Completed' | 'Suspended';
    }) => transitionMatchdayStatusRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...MATCHDAYS_QUERY_KEY, variables.tournament_id],
      });
    },
  });

  const rescheduleFixture = useMutation({
    mutationFn: (params: { tournament_id: string; fixture_id: string }) =>
      rescheduleFixtureRpc(params.fixture_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...FIXTURES_QUERY_KEY, variables.tournament_id],
      });
    },
  });

  return {
    createTournament,
    transitionStatus,
    transitionMatchday,
    rescheduleFixture,
  };
}
