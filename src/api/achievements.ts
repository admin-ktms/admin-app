import { supabase } from '@/lib/supabase';

export interface MasterAchievementDefinition {
  achievement_definition_id: string;
  achievement_code: string;
  achievement_name: string;
  achievement_description: string;
  tier: 'Common' | 'Rare' | 'Unique';
  badge_icon_url: string | null;
  reward_kind: 'COINS' | 'COUPON';
  default_coins_reward: number;
  default_coupon_code: string | null;
  default_max_per_player: number;
  default_max_tournament_total: number;
  status: 'active' | 'inactive';
}

export interface TournamentCuratedAchievement {
  tournament_achievement_id: string;
  tournament_id: string;
  achievement_definition_id: string;
  achievement_name: string;
  achievement_code: string;
  tier: 'Common' | 'Rare' | 'Unique';
  max_per_player: number;
  max_tournament_total: number;
  coins_reward: number;
  times_awarded_total: number;
  is_enabled: boolean;
}

export interface AchievementMediaReviewItem {
  review_id: string;
  tournament_id: string;
  tournament_name?: string;
  fixture_id: string;
  match_code?: string;
  submitting_registration_id: string;
  player_id: string;
  media_url: string;
  media_type: 'SCREENSHOT' | 'SCREEN_RECORDING';
  player_notes: string | null;
  suggested_achievement_definition_id: string | null;
  suggested_achievement_name?: string | null;
  review_status: 'PENDING' | 'AWARDED' | 'DISMISSED';
  created_at: string;
}

export interface CurateTournamentAchievementsParams {
  tournament_id: string;
  curated_achievements: {
    achievement_definition_id: string;
    max_per_player?: number;
    max_tournament_total?: number;
    coins_reward?: number;
    is_enabled?: boolean;
  }[];
}

export interface AwardAchievementParams {
  tournament_id: string;
  registration_id: string;
  achievement_code: string;
  fixture_id?: string | null;
  review_id?: string | null;
  admin_notes?: string;
}

export interface DismissMediaReviewParams {
  review_id: string;
  dismissal_reason: string;
}

/**
 * Fetch all global master achievement definitions from platform.achievement_definitions
 */
export async function getMasterAchievementDefinitions(): Promise<MasterAchievementDefinition[]> {
  const { data, error } = await supabase
    .schema('platform')
    .from('achievement_definitions')
    .select('*')
    .order('achievement_code', { ascending: true });

  if (error) throw error;
  return (data || []) as MasterAchievementDefinition[];
}

/**
 * Fetch curated achievements for a specific tournament
 */
export async function getTournamentCuratedAchievements(
  tournamentId: string
): Promise<TournamentCuratedAchievement[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('tournament_achievements')
    .select(`
      tournament_achievement_id,
      tournament_id,
      achievement_definition_id,
      max_per_player,
      max_tournament_total,
      coins_reward,
      times_awarded_total,
      is_enabled,
      platform_achievement_definitions:achievement_definition_id (
        achievement_name,
        achievement_code,
        tier
      )
    `)
    .eq('tournament_id', tournamentId);

  if (error) throw error;

  return (data || []).map((ta: any) => ({
    tournament_achievement_id: ta.tournament_achievement_id,
    tournament_id: ta.tournament_id,
    achievement_definition_id: ta.achievement_definition_id,
    achievement_name: ta.platform_achievement_definitions?.achievement_name || 'Achievement',
    achievement_code: ta.platform_achievement_definitions?.achievement_code || '',
    tier: ta.platform_achievement_definitions?.tier || 'Common',
    max_per_player: ta.max_per_player,
    max_tournament_total: ta.max_tournament_total,
    coins_reward: ta.coins_reward,
    times_awarded_total: ta.times_awarded_total,
    is_enabled: ta.is_enabled,
  }));
}

/**
 * Fetch pending media reviews submitted by players
 */
export async function getPendingMediaReviews(): Promise<AchievementMediaReviewItem[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('achievement_media_reviews')
    .select(`
      review_id,
      tournament_id,
      fixture_id,
      submitting_registration_id,
      player_id,
      media_url,
      media_type,
      player_notes,
      suggested_achievement_definition_id,
      review_status,
      created_at,
      kt_tournaments:tournament_id (
        tournament_name
      ),
      kt_fixtures:fixture_id (
        match_code
      ),
      platform_achievement_definitions:suggested_achievement_definition_id (
        achievement_name
      )
    `)
    .eq('review_status', 'PENDING')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    review_id: r.review_id,
    tournament_id: r.tournament_id,
    tournament_name: r.kt_tournaments?.tournament_name || r.tournament_id,
    fixture_id: r.fixture_id,
    match_code: r.kt_fixtures?.match_code || r.fixture_id,
    submitting_registration_id: r.submitting_registration_id,
    player_id: r.player_id,
    media_url: r.media_url,
    media_type: r.media_type,
    player_notes: r.player_notes,
    suggested_achievement_definition_id: r.suggested_achievement_definition_id,
    suggested_achievement_name:
      r.platform_achievement_definitions?.achievement_name || null,
    review_status: r.review_status,
    created_at: r.created_at,
  }));
}

/**
 * Curate achievement pool for a tournament via kt.admin_curate_tournament_achievements RPC
 */
export async function curateTournamentAchievementsRpc(params: CurateTournamentAchievementsParams) {
  const { data, error } = await supabase.rpc('admin_curate_tournament_achievements', {
    p_tournament_id: params.tournament_id,
    p_curated_achievements: params.curated_achievements,
  });

  if (error) throw error;
  return data;
}

/**
 * Award achievement to player via kt.admin_award_achievement RPC (triggers dual-chat blast)
 */
export async function awardAchievementRpc(params: AwardAchievementParams) {
  const { data, error } = await supabase.rpc('admin_award_achievement', {
    p_tournament_id: params.tournament_id,
    p_registration_id: params.registration_id,
    p_achievement_code: params.achievement_code,
    p_fixture_id: params.fixture_id || null,
    p_review_id: params.review_id || null,
    p_admin_notes: params.admin_notes ? params.admin_notes.trim() : null,
  });

  if (error) throw error;
  return data;
}

/**
 * Dismiss media review submission via kt.admin_dismiss_achievement_review RPC
 */
export async function dismissMediaReviewRpc(params: DismissMediaReviewParams) {
  const { data, error } = await supabase.rpc('admin_dismiss_achievement_review', {
    p_review_id: params.review_id,
    p_dismissal_reason: params.dismissal_reason.trim(),
  });

  if (error) throw error;
  return data;
}
