import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStaffDirectory,
  getPendingInvitations,
  inviteAdminRpc,
  revokeAdminInviteRpc,
  assignAdminRoleRpc,
  revokeAdminRoleRpc,
  getAuditLogs,
  getArchiveBatches,
} from '@/api/governance';
import { AdminRoleCode } from '@/types/auth.types';
import { useAdminAuth } from './useAdminAuth';

export const STAFF_QUERY_KEY = ['admin', 'governance', 'staff'];
export const INVITATIONS_QUERY_KEY = ['admin', 'governance', 'invitations'];
export const AUDIT_LOGS_QUERY_KEY = ['admin', 'governance', 'audit-logs'];
export const ARCHIVES_QUERY_KEY = ['admin', 'governance', 'archives'];

export function useStaffDirectory() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: getStaffDirectory,
    enabled: !!user,
  });
}

export function usePendingInvitations() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: INVITATIONS_QUERY_KEY,
    queryFn: getPendingInvitations,
    enabled: !!user,
  });
}

export function useAuditLogs(limit = 100) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, limit],
    queryFn: () => getAuditLogs(limit),
    enabled: !!user,
    refetchInterval: 30000, // Background telemetry poll every 30s
  });
}

export function useArchiveBatches() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: ARCHIVES_QUERY_KEY,
    queryFn: getArchiveBatches,
    enabled: !!user,
  });
}

export function useGovernanceMutations() {
  const queryClient = useQueryClient();

  const inviteStaff = useMutation({
    mutationFn: (params: { invited_email: string; role_code: AdminRoleCode; expires_at: string }) =>
      inviteAdminRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (invitationId: string) => revokeAdminInviteRpc(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
    },
  });

  const assignRole = useMutation({
    mutationFn: (params: { target_admin_id: string; role_code: AdminRoleCode; reason: string }) =>
      assignAdminRoleRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
  });

  const revokeRole = useMutation({
    mutationFn: (params: { target_admin_id: string; reason: string }) =>
      revokeAdminRoleRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
  });

  return {
    inviteStaff,
    revokeInvite,
    assignRole,
    revokeRole,
  };
}
