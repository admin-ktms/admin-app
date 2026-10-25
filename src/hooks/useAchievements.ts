import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMasterAchievementDefinitions,
  getTournamentCuratedAchievements,
  getPendingMediaReviews,
  curateTournamentAchievementsRpc,
  awardAchievementRpc,
  dismissMediaReviewRpc,
  CurateTournamentAchievementsParams,
  AwardAchievementParams,
  DismissMediaReviewParams,
} from '@/api/achievements';
import { useAdminAuth } from './useAdminAuth';

export const MASTER_ACHIEVEMENTS_QUERY_KEY = ['admin', 'achievements', 'master-catalog'];
export const CURATED_ACHIEVEMENTS_QUERY_KEY = ['admin', 'achievements', 'curated'];
export const MEDIA_REVIEWS_QUERY_KEY = ['admin', 'achievements', 'media-reviews'];

export function useMasterAchievements() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: MASTER_ACHIEVEMENTS_QUERY_KEY,
    queryFn: getMasterAchievementDefinitions,
    enabled: !!user,
  });
}

export function useTournamentCuratedAchievements(tournamentId: string | undefined) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...CURATED_ACHIEVEMENTS_QUERY_KEY, tournamentId],
    queryFn: () => (tournamentId ? getTournamentCuratedAchievements(tournamentId) : []),
    enabled: !!user && !!tournamentId,
  });
}

export function usePendingMediaReviews() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: MEDIA_REVIEWS_QUERY_KEY,
    queryFn: getPendingMediaReviews,
    enabled: !!user,
  });
}

export function useAchievementMutations() {
  const queryClient = useQueryClient();

  const curatePool = useMutation({
    mutationFn: (params: CurateTournamentAchievementsParams) =>
      curateTournamentAchievementsRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...CURATED_ACHIEVEMENTS_QUERY_KEY, variables.tournament_id],
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
    },
  });

  const awardAchievement = useMutation({
    mutationFn: (params: AwardAchievementParams) => awardAchievementRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MEDIA_REVIEWS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CURATED_ACHIEVEMENTS_QUERY_KEY, variables.tournament_id],
      });
    },
  });

  const dismissReview = useMutation({
    mutationFn: (params: DismissMediaReviewParams) => dismissMediaReviewRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_REVIEWS_QUERY_KEY });
    },
  });

  return {
    curatePool,
    awardAchievement,
    dismissReview,
  };
}
