import { supabase } from '@/lib/supabase';

export interface PlayerDirectoryItem {
  player_id: string;
  username: string;
  full_name: string;
  phone_number: string | null;
  player_status: 'Active' | 'Suspended' | 'Banned';
  suspended_until_datetime: string | null;
  status_reason: string | null;
  created_at: string;
  active_registrations?: {
    registration_id: string;
    tournament_id: string;
    tournament_name: string;
    registration_status: string;
    squad_name: string;
  }[];
}

export interface DisqualifyPlayerParams {
  tournament_id: string;
  registration_id: string;
  reason: string;
}

export interface SuspendPlayerParams {
  player_id: string;
  duration_interval: string; // e.g. '7 days', '24 hours'
  reason: string;
}

export interface BanPlayerParams {
  player_id: string;
  reason: string;
}

export interface ReinstatePlayerParams {
  player_id: string;
  scope: 'GLOBAL' | 'TOURNAMENT_TYPE';
  reason: string;
  tournament_type_id?: string;
}

/**
 * Fetch player roster with status and active tournament registrations
 */
export async function getPlayerDirectory(): Promise<PlayerDirectoryItem[]> {
  const { data: players, error: playersError } = await supabase
    .schema('identity')
    .from('players')
    .select(`
      player_id,
      username,
      full_name,
      phone_number,
      player_status,
      suspended_until_datetime,
      status_reason,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (playersError) throw playersError;

  // Retrieve active registrations for players
  const { data: regs, error: regsError } = await supabase
    .schema('kt')
    .from('kt_registrations')
    .select(`
      registration_id,
      player_id,
      tournament_id,
      registration_status,
      squad_name,
      kt_tournaments:tournament_id (
        tournament_name
      )
    `)
    .in('registration_status', ['Registered', 'Active', 'Pending']);

  if (regsError) throw regsError;

  const regMap = new Map<string, any[]>();
  (regs || []).forEach((r: any) => {
    const list = regMap.get(r.player_id) || [];
    list.push({
      registration_id: r.registration_id,
      tournament_id: r.tournament_id,
      tournament_name: r.kt_tournaments?.tournament_name || r.tournament_id,
      registration_status: r.registration_status,
      squad_name: r.squad_name,
    });
    regMap.set(r.player_id, list);
  });

  return (players || []).map((p: any) => ({
    player_id: p.player_id,
    username: p.username,
    full_name: p.full_name,
    phone_number: p.phone_number,
    player_status: p.player_status,
    suspended_until_datetime: p.suspended_until_datetime,
    status_reason: p.status_reason,
    created_at: p.created_at,
    active_registrations: regMap.get(p.player_id) || [],
  }));
}

/**
 * Disqualify a participant from a tournament via kt.admin_disqualify_tournament_player RPC.
 * Triggers automatic walkover cascades and leaderboard recalculation.
 */
export async function disqualifyTournamentPlayerRpc(params: DisqualifyPlayerParams) {
  const { data, error } = await supabase.rpc('admin_disqualify_tournament_player', {
    p_tournament_id: params.tournament_id,
    p_target_registration_id: params.registration_id,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Suspend player account platform-wide via identity.admin_suspend_player_account RPC.
 */
export async function suspendPlayerAccountRpc(params: SuspendPlayerParams) {
  const { data, error } = await supabase.rpc('admin_suspend_player_account', {
    p_target_player_id: params.player_id,
    p_duration: params.duration_interval,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Permanently ban player account via identity.admin_ban_player_account RPC.
 */
export async function banPlayerAccountRpc(params: BanPlayerParams) {
  const { data, error } = await supabase.rpc('admin_ban_player_account', {
    p_target_player_id: params.player_id,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Lift player suspension or ban via identity.admin_reinstate_player RPC.
 */
export async function reinstatePlayerRpc(params: ReinstatePlayerParams) {
  const { data, error } = await supabase.rpc('admin_reinstate_player', {
    p_target_player_id: params.player_id,
    p_scope: params.scope,
    p_reason: params.reason.trim(),
    p_tournament_type_id: params.tournament_type_id || null,
  });

  if (error) throw error;
  return data;
}
