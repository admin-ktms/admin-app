/**
 * KTMS Administrative Role Codes
 * Matches the 5 active roles in identity.roles
 */
export type AdminRoleCode =
  | 'game_master'
  | 'platform_manager'
  | 'moderator'
  | 'support'
  | 'accountant';

/**
 * Status of an Administrator's Platform Profile
 */
export type AdminAccountStatus = 'Active' | 'Disabled';

/**
 * Authenticated Administrator User Profile
 * Resolved from identity.identity_resolver()
 */
export interface AdminUser {
  admin_id: string;             // Format: ADM-XXXXXX
  auth_user_id: string;         // Supabase auth.users UUID
  full_name: string;
  display_name: string;
  email: string;
  role: AdminRoleCode;
  admin_status: AdminAccountStatus;
  assigned_tournament_ids?: string[]; // Tournament scopes for Moderators
  last_sign_in_at?: string;
}

/**
 * Administrative Authentication Context State
 */
export interface AdminAuthState {
  user: AdminUser | null;
  role: AdminRoleCode | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGameMaster: boolean;
  isPlatformManager: boolean;
  isModerator: boolean;
  isSupport: boolean;
  isAccountant: boolean;
  error: string | null;
}

/**
 * Step-Up Re-Authentication Payload
 */
export interface StepUpChallengeState {
  isOpen: boolean;
  isVerifying: boolean;
  error: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}
