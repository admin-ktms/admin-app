import { supabase } from '@/lib/supabase';
import { AdminRoleCode, AdminUser } from '@/types/auth.types';

/**
 * Resolves the authenticated admin identity via PostgREST queries against
 * identity.account_link, identity.admin, and identity.admin_role_assignments.
 */
export async function resolveAdminIdentity(): Promise<AdminUser | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // 1. Verify identity.account_link for Admin status
  const { data: linkData, error: linkError } = await supabase
    .schema('identity')
    .from('account_link')
    .select('admin_id, account_type, link_status')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (linkError || !linkData) {
    throw new Error('UNLINKED_ACCOUNT');
  }

  // Fail closed if the authenticated user is a Player or has been Disabled
  if (linkData.account_type !== 'Admin') {
    throw new Error('PLAYER_ACCOUNT_FORBIDDEN');
  }

  if (linkData.link_status !== 'Active') {
    throw new Error('ACCOUNT_LINK_DISABLED');
  }

  // 2. Fetch admin master record from identity.admin
  const { data: adminData, error: adminError } = await supabase
    .schema('identity')
    .from('admin')
    .select('admin_id, full_name, display_name, email_address, admin_status')
    .eq('admin_id', linkData.admin_id)
    .single();

  if (adminError || !adminData) {
    throw new Error('ADMIN_RECORD_NOT_FOUND');
  }

  if (adminData.admin_status !== 'Active') {
    throw new Error('ADMIN_ACCOUNT_DISABLED');
  }

  // 3. Resolve single active role from identity.admin_role_assignments
  const { data: roleData, error: roleError } = await supabase
    .schema('identity')
    .from('admin_role_assignments')
    .select('role_code')
    .eq('admin_id', adminData.admin_id)
    .eq('status', 'active')
    .maybeSingle();

  if (roleError || !roleData) {
    throw new Error('NO_ACTIVE_ROLE_ASSIGNED');
  }

  // 4. Resolve tournament scope if active role is moderator
  let assignedTournaments: string[] = [];
  if (roleData.role_code === 'moderator') {
    const { data: scopes } = await supabase
      .schema('identity')
      .from('admin_tournament_assignments')
      .select('tournament_id')
      .eq('admin_id', adminData.admin_id)
      .eq('status', 'active');

    assignedTournaments = (scopes || []).map((s: { tournament_id: string }) => s.tournament_id);
  }

  return {
    admin_id: adminData.admin_id,
    auth_user_id: authUser.id,
    full_name: adminData.full_name,
    display_name: adminData.display_name,
    email: adminData.email_address,
    role: roleData.role_code as AdminRoleCode,
    admin_status: adminData.admin_status,
    assigned_tournament_ids: assignedTournaments,
    last_sign_in_at: authUser.last_sign_in_at,
  };
}

/**
 * Signs in with email and password via Supabase Auth.
 */
export async function adminSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out the current user session and clears storage.
 */
export async function adminSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Accepts an administrative invitation and provisions profile, account link, and role assignment.
 */
export async function acceptAdminInviteRpc(params: {
  invitation_id: string;
  full_name: string;
  display_name: string;
  username: string;
}) {
  const { data, error } = await supabase.rpc('accept_admin_invite', {
    p_invitation_id: params.invitation_id,
    p_full_name: params.full_name.trim(),
    p_display_name: params.display_name.trim(),
    p_username: params.username.trim(),
  });

  if (error) throw error;
  return data;
}
