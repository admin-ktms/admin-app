import { supabase } from '@/lib/supabase';

export interface SupportCaseSummary {
  support_case_id: string;
  player_id: string;
  conversation_id: string;
  subject: string;
  case_description: string;
  case_status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  case_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assigned_admin_id: string | null;
  assigned_at: string | null;
  created_at: string;
  last_activity_at: string;
  player_username?: string;
}

export interface SupportMessageItem {
  message_id: string;
  conversation_id: string;
  sequence_no: number;
  sender_type: 'ADMIN' | 'PLAYER' | 'SYSTEM';
  sender_player_id: string | null;
  sender_admin_id: string | null;
  message_body: string;
  created_at: string;
}

export interface AssignSupportCaseParams {
  case_id: string;
  target_admin_id: string;
  reason: string;
}

export interface SendSupportMessageParams {
  conversation_id: string;
  sender_admin_id: string;
  message_body: string;
}

export interface OpenGMChatParams {
  target_player_id: string;
  initial_message: string;
  tournament_id?: string;
}

/**
 * Fetch all support cases ordered by latest activity
 */
export async function getSupportCasesList(): Promise<SupportCaseSummary[]> {
  const { data, error } = await supabase
    .schema('notifications')
    .from('support_case')
    .select(`
      support_case_id,
      player_id,
      conversation_id,
      subject,
      case_description,
      case_status,
      case_priority,
      assigned_admin_id,
      assigned_at,
      created_at,
      last_activity_at
    `)
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch single case detail by ID
 */
export async function getSupportCaseById(caseId: string): Promise<SupportCaseSummary | null> {
  const { data, error } = await supabase
    .schema('notifications')
    .from('support_case')
    .select('*')
    .eq('support_case_id', caseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch chronological messages for a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<SupportMessageItem[]> {
  const { data, error } = await supabase
    .schema('notifications')
    .from('message')
    .select(`
      message_id,
      conversation_id,
      sequence_no,
      sender_type,
      sender_player_id,
      sender_admin_id,
      message_body,
      created_at
    `)
    .eq('conversation_id', conversationId)
    .order('sequence_no', { ascending: true });

  if (error) throw error;
  return (data || []) as SupportMessageItem[];
}

/**
 * Assign / Route Support Case via notifications.assign_support_case RPC
 */
export async function assignSupportCaseRpc(params: AssignSupportCaseParams) {
  const { data, error } = await supabase.rpc('assign_support_case', {
    p_case_id: params.case_id,
    p_target_admin_id: params.target_admin_id,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Send an Admin response into a support conversation thread
 */
export async function sendSupportMessageRpc(params: SendSupportMessageParams) {
  const idempotencyKey = `MSG-${params.conversation_id}-${Date.now()}`;

  const { data, error } = await supabase.rpc('append_message', {
    p_conversation_id: params.conversation_id,
    p_sender_type: 'ADMIN',
    p_sender_player_id: null,
    p_sender_admin_id: params.sender_admin_id,
    p_message_type: 'TEXT',
    p_body: params.message_body.trim(),
    p_metadata: { context: 'support_ticket_response' },
    p_reply_to_message_id: null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) throw error;

  // Touch last_activity_at on the support_case
  await supabase
    .schema('notifications')
    .from('support_case')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('conversation_id', params.conversation_id);

  return data;
}

/**
 * Initiate Direct Game Master Player Outreach via notifications.open_game_master_chat RPC
 */
export async function openGameMasterChatRpc(params: OpenGMChatParams) {
  const idempotencyKey = `GM-CHAT-${params.target_player_id}-${Date.now()}`;

  const { data, error } = await supabase.rpc('open_game_master_chat', {
    p_target_player_id: params.target_player_id,
    p_initial_message: params.initial_message.trim(),
    p_idempotency_key: idempotencyKey,
    p_tournament_id: params.tournament_id || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Update case resolution status (RESOLVED or CLOSED)
 */
export async function updateSupportCaseStatus(caseId: string, status: 'RESOLVED' | 'CLOSED', reason?: string) {
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    case_status: status,
    updated_at: now,
    last_activity_at: now,
  };

  if (status === 'RESOLVED') {
    updatePayload.resolved_at = now;
  } else if (status === 'CLOSED') {
    updatePayload.closed_at = now;
    if (reason) updatePayload.closure_reason = reason.trim();
  }

  const { data, error } = await supabase
    .schema('notifications')
    .from('support_case')
    .update(updatePayload)
    .eq('support_case_id', caseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
