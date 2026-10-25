gimport { supabase } from '@/lib/supabase';

export interface PendingBankTransferItem {
  transaction_history_id: string;
  registration_reference_id: string;
  player_id: string;
  tournament_id: string;
  tournament_name?: string;
  amount: number;
  currency: string;
  payment_proof_url: string | null;
  payment_status: 'Pending' | 'Success' | 'Rejected';
  created_datetime: string;
  player_name?: string;
}

export interface PendingAwardItem {
  award_id: string;
  tournament_id: string;
  tournament_name?: string;
  registration_id: string;
  player_id: string;
  player_name?: string;
  reward_definition_id: string;
  reward_name: string;
  reward_type: 'Cash' | 'Qualification' | 'Badge';
  reward_value: string;
  prize_status: 'Pending' | 'Approved' | 'Disapproved';
  awarded_datetime: string;
}

/**
 * Fetch pending bank transfers awaiting administrative verification.
 */
export async function getPendingBankTransfers(): Promise<PendingBankTransferItem[]> {
  const { data, error } = await supabase
    .schema('finance')
    .from('transaction_history')
    .select(`
      transaction_history_id,
      registration_reference_id,
      player_id,
      tournament_id,
      amount,
      currency,
      payment_proof_url,
      payment_status,
      created_datetime,
      kt_tournaments:tournament_id (
        tournament_name
      )
    `)
    .eq('payment_provider', 'Bank Transfer')
    .eq('payment_status', 'Pending')
    .order('created_datetime', { ascending: false });

  if (error) throw error;

  return (data || []).map((t: any) => ({
    transaction_history_id: t.transaction_history_id,
    registration_reference_id: t.registration_reference_id,
    player_id: t.player_id,
    tournament_id: t.tournament_id,
    tournament_name: t.kt_tournaments?.tournament_name || t.tournament_id,
    amount: Number(t.amount) || 0,
    currency: t.currency || 'NGN',
    payment_proof_url: t.payment_proof_url,
    payment_status: t.payment_status,
    created_datetime: t.created_datetime,
  }));
}

/**
 * Fetch pending podium awards awaiting disbursement approval.
 */
export async function getPendingAwards(): Promise<PendingAwardItem[]> {
  const { data, error } = await supabase
    .schema('kt')
    .from('kt_awards')
    .select(`
      award_id,
      tournament_id,
      registration_id,
      reward_definition_id,
      prize_status,
      awarded_datetime,
      kt_tournaments:tournament_id (
        tournament_name
      ),
      kt_registrations:registration_id (
        player_id
      ),
      platform_reward_definitions:reward_definition_id (
        reward_name,
        reward_type,
        reward_value
      )
    `)
    .eq('prize_status', 'Pending')
    .order('awarded_datetime', { ascending: false });

  if (error) throw error;

  return (data || []).map((a: any) => ({
    award_id: a.award_id,
    tournament_id: a.tournament_id,
    tournament_name: a.kt_tournaments?.tournament_name || a.tournament_id,
    registration_id: a.registration_id,
    player_id: a.kt_registrations?.player_id || 'Unknown',
    reward_definition_id: a.reward_definition_id,
    reward_name: a.platform_reward_definitions?.reward_name || 'Prize',
    reward_type: a.platform_reward_definitions?.reward_type || 'Cash',
    reward_value: a.platform_reward_definitions?.reward_value || '0',
    prize_status: a.prize_status,
    awarded_datetime: a.awarded_datetime,
  }));
}

/**
 * Verify or Reject a manual bank transfer payment via kt.verify_bank_transfer_payment RPC.
 */
export async function verifyBankTransferPaymentRpc(params: {
  registration_reference_id: string;
  decision: 'approve' | 'reject';
  rejection_reason?: string;
}) {
  const { data, error } = await supabase.rpc('verify_bank_transfer_payment', {
    p_registration_reference_id: params.registration_reference_id,
    p_decision: params.decision,
    p_rejection_reason: params.rejection_reason ? params.rejection_reason.trim() : null,
  });

  if (error) throw error;
  return data;
}

/**
 * Approve or Disapprove a podium award payout via kt.admin_approve_award_payout RPC.
 */
export async function approveAwardPayoutRpc(params: {
  award_id: string;
  decision: 'Approved' | 'Disapproved';
  notes: string;
}) {
  const { data, error } = await supabase.rpc('admin_approve_award_payout', {
    p_award_id: params.award_id,
    p_decision: params.decision,
    p_notes: params.notes.trim(),
  });

  if (error) throw error;
  return data;
}
