import { supabase } from '@/lib/supabase';
import { AdminRoleCode } from '@/types/auth.types';

export interface AdministrativeApprovalItem {
  approval_id: string;
  permission_code: string;
  resource_entity: string;
  resource_id: string;
  requested_by_admin_id: string;
  requested_at: string;
  request_reason: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected' | 'Consumed' | 'Expired';
  approved_by_admin_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  expires_at: string;
}

export interface StaffDirectoryItem {
  admin_id: string;
  full_name: string;
  display_name: string;
  email_address: string;
  admin_status: 'Active' | 'Disabled';
  active_role: AdminRoleCode | null;
  assigned_tournaments: string[];
  created_datetime: string;
}

export interface PendingAdminInvitation {
  invitation_id: string;
  invited_email: string;
  role_code: AdminRoleCode;
  invitation_status: 'Pending' | 'Accepted' | 'Revoked' | 'Expired';
  invited_by_admin_id: string;
  created_at: string;
  expires_at: string;
}

export interface AuditLogItem {
  audit_log_id: string;
  tournament_id: string | null;
  action_time: string;
  action_source: string;
  action_status: string;
  action_summary: string;
  related_entity: string | null;
  related_record_id: string | null;
  previous_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  reason: string | null;
  performed_by_id: string | null;
  performed_by_type: string;
}

export interface ArchiveBatchItem {
  archive_batch_id: number;
  tournament_id: string;
  archived_datetime: string;
  archived_by_admin_id: string;
  record_count: number;
}

/**
 * Fetch all pending and recent administrative approvals
 */
export async function getAdministrativeApprovals(): Promise<AdministrativeApprovalItem[]> {
  const { data, error } = await supabase
    .schema('identity')
    .from('administrative_approvals')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AdministrativeApprovalItem[];
}

/**
 * Request administrative approval via identity.request_administrative_approval RPC
 */
export async function requestAdministrativeApprovalRpc(params: {
  permission_code: string;
  resource_entity: string;
  resource_id: string;
  request_reason: string;
  ttl_hours?: number;
}) {
  const { data, error } = await supabase.rpc('request_administrative_approval', {
    p_permission_code: params.permission_code,
    p_resource_entity: params.resource_entity,
    p_resource_id: params.resource_id,
    p_request_reason: params.request_reason.trim(),
    p_ttl_hours: params.ttl_hours || 48,
  });

  if (error) throw error;
  return data;
}

/**
 * Grant approval via identity.grant_administrative_approval RPC
 */
export async function grantAdministrativeApprovalRpc(params: {
  approval_id: string;
  approval_notes: string;
}) {
  const { data, error } = await supabase.rpc('grant_administrative_approval', {
    p_approval_id: params.approval_id,
    p_approval_notes: params.approval_notes.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Reject approval via identity.reject_administrative_approval RPC
 */
export async function rejectAdministrativeApprovalRpc(params: {
  approval_id: string;
  rejection_reason: string;
}) {
  const { data, error } = await supabase.rpc('reject_administrative_approval', {
    p_approval_id: params.approval_id,
    p_rejection_reason: params.rejection_reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch staff directory with active roles and scopes
 */
export async function getStaffDirectory(): Promise<StaffDirectoryItem[]> {
  const { data: admins, error: adminErr } = await supabase
    .schema('identity')
    .from('admin')
    .select('admin_id, full_name, display_name, email_address, admin_status, created_datetime')
    .order('created_datetime', { ascending: true });

  if (adminErr) throw adminErr;

  const { data: roles } = await supabase
    .schema('identity')
    .from('admin_role_assignments')
    .select('admin_id, role_code, status')
    .eq('status', 'active');

  const { data: scopes } = await supabase
    .schema('identity')
    .from('admin_tournament_assignments')
    .select('admin_id, tournament_id, status')
    .eq('status', 'active');

  const roleMap = new Map<string, AdminRoleCode>();
  (roles || []).forEach((r: any) => roleMap.set(r.admin_id, r.role_code));

  const scopeMap = new Map<string, string[]>();
  (scopes || []).forEach((s: any) => {
    const list = scopeMap.get(s.admin_id) || [];
    list.push(s.tournament_id);
    scopeMap.set(s.admin_id, list);
  });

  return (admins || []).map((a: any) => ({
    admin_id: a.admin_id,
    full_name: a.full_name,
    display_name: a.display_name,
    email_address: a.email_address,
    admin_status: a.admin_status,
    active_role: roleMap.get(a.admin_id) || null,
    assigned_tournaments: scopeMap.get(a.admin_id) || [],
    created_datetime: a.created_datetime,
  }));
}

/**
 * Fetch pending administrator invitations
 */
export async function getPendingInvitations(): Promise<PendingAdminInvitation[]> {
  const { data, error } = await supabase
    .schema('identity')
    .from('admin_invitation')
    .select('*')
    .eq('invitation_status', 'Pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PendingAdminInvitation[];
}

/**
 * Invite admin staff member via identity.invite_admin RPC
 */
export async function inviteAdminRpc(params: {
  invited_email: string;
  role_code: AdminRoleCode;
  expires_at: string;
}) {
  const { data, error } = await supabase.rpc('invite_admin', {
    p_invited_email: params.invited_email.trim().toLowerCase(),
    p_role_code: params.role_code,
    p_expires_at: params.expires_at,
  });

  if (error) throw error;
  return data;
}

/**
 * Revoke admin invitation via identity.revoke_admin_invite RPC
 */
export async function revokeAdminInviteRpc(invitationId: string) {
  const { data, error } = await supabase.rpc('revoke_admin_invite', {
    p_invitation_id: invitationId,
  });

  if (error) throw error;
  return data;
}

/**
 * Assign role to admin via identity.assign_admin_role RPC
 */
export async function assignAdminRoleRpc(params: {
  target_admin_id: string;
  role_code: AdminRoleCode;
  reason: string;
}) {
  const { data, error } = await supabase.rpc('assign_admin_role', {
    p_target_admin_id: params.target_admin_id,
    p_role_code: params.role_code,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Revoke role from admin via identity.revoke_admin_role RPC
 */
export async function revokeAdminRoleRpc(params: {
  target_admin_id: string;
  reason: string;
}) {
  const { data, error } = await supabase.rpc('revoke_admin_role', {
    p_target_admin_id: params.target_admin_id,
    p_reason: params.reason.trim(),
  });

  if (error) throw error;
  return data;
}

/**
 * Query immutable audit log
 */
export async function getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  const { data, error } = await supabase
    .schema('audit')
    .from('audit_log')
    .select('*')
    .order('action_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AuditLogItem[];
}

/**
 * Query archived tournament batches
 */
export async function getArchiveBatches(): Promise<ArchiveBatchItem[]> {
  const { data, error } = await supabase
    .schema('archive')
    .from('archive_batches')
    .select('*')
    .order('archived_datetime', { ascending: false });

  if (error) throw error;
  return (data || []) as ArchiveBatchItem[];
}
