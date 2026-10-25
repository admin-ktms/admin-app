import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type TournamentRow = Database['kt']['Tables']['kt_tournaments']['Row'];
export type FixtureRow = Database['kt']['Tables']['kt_fixtures']['Row'];

export interface TournamentSummary extends TournamentRow {
  registered_players_count?: number;
}

export interface MatchdaySummary {
  matchday_id: string;
  tournament_id: string;
  stage_name: string;
  round_number: number;
  matchday_status: 'Scheduled' | 'Active' | 'Completed' | 'Suspended';
  start_datetime: string;
  end_datetime: string;
}

export interface CreateTournamentParams {
  tournament_type_id: string;
  tournament_name: string;
  registration_open_datetime: string;
  minimum_age: number;
  registration_fee: number;
  maximum_players: number;
  payment_configuration_id?: string | null;
}

/**
 * Fetch all tournaments visible to the caller (enforcing RLS & scope).
 */
export async function getTournamentsList(): Promise<TournamentSummary[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_tournaments')
    .select(`
      tournament_id,
      tournament_type_id,
      tournament_edition,
      tournament_name,
      tournament_status,
      registration_fee,
      maximum_players,
      minimum_age,
      payment_deadline_datetime,
      registration_open_datetime,
      created_datetime
    `)
    .order('created_datetime', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single tournament by ID.
 */
export async function getTournamentById(tournamentId: string): Promise<TournamentSummary | null> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_tournaments')
    .select('*')
    .eq('tournament_id', tournamentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new tournament via kt.create_kt_tournament RPC.
 */
export async function createTournamentRpc(params: CreateTournamentParams) {
  const { data, error } = await supabase.rpc('create_kt_tournament', {
    p_tournament_type_id: params.tournament_type_id,
    p_tournament_name: params.tournament_name.trim(),
    p_registration_open_datetime: params.registration_open_datetime,
    p_minimum_age: params.minimum_age,
    p_registration_fee: params.registration_fee,
    p_maximum_players: params.maximum_players,
    p_payment_configuration_id: params.payment_configuration_id || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Execute stage/status transition via kt.execute_kt_tournament_status_transition RPC.
 */
export async function transitionTournamentStatusRpc(params: {
  tournament_id: string;
  to_status: TournamentRow['tournament_status'];
  reason?: string;
  approval_id?: string;
}) {
  const { data, error } = await supabase.rpc('execute_kt_tournament_status_transition', {
    p_tournament_id: params.tournament_id,
    p_to_status: params.to_status,
    p_reason: params.reason ? params.reason.trim() : null,
    p_approval_id: params.approval_id || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch matchdays for a specific tournament.
 */
export async function getTournamentMatchdays(tournamentId: string): Promise<MatchdaySummary[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_matchdays')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Transition matchday status via kt.transition_kt_matchday_status RPC.
 */
export async function transitionMatchdayStatusRpc(params: {
  matchday_id: string;
  to_status: 'Scheduled' | 'Active' | 'Completed' | 'Suspended';
}) {
  const { data, error } = await supabase.rpc('transition_kt_matchday_status', {
    p_matchday_id: params.matchday_id,
    p_to_status: params.to_status,
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch fixtures for a tournament or matchday.
 */
export async function getTournamentFixtures(tournamentId: string): Promise<FixtureRow[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_fixtures')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Reschedule fixture via kt.reschedule_kt_fixture RPC.
 */
export async function rescheduleFixtureRpc(fixtureId: string) {
  const { data, error } = await supabase.rpc('reschedule_kt_fixture', {
    p_fixture_id: fixtureId,
  });

  if (error) throw error;
  return data;
}
