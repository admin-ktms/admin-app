import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdministrativeApprovals,
  grantAdministrativeApprovalRpc,
  rejectAdministrativeApprovalRpc,
  requestAdministrativeApprovalRpc,
} from '@/api/governance';
import { useAdminAuth } from './useAdminAuth';

export const APPROVALS_QUERY_KEY = ['admin', 'governance', 'approvals'];

export function useAdministrativeApprovals() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: APPROVALS_QUERY_KEY,
    queryFn: getAdministrativeApprovals,
    enabled: !!user,
  });
}

export function useApprovalMutations() {
  const queryClient = useQueryClient();

  const grantApproval = useMutation({
    mutationFn: (params: { approval_id: string; approval_notes: string }) =>
      grantAdministrativeApprovalRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
    },
  });

  const rejectApproval = useMutation({
    mutationFn: (params: { approval_id: string; rejection_reason: string }) =>
      rejectAdministrativeApprovalRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
    },
  });

  const requestApproval = useMutation({
    mutationFn: (params: {
      permission_code: string;
      resource_entity: string;
      resource_id: string;
      request_reason: string;
      ttl_hours?: number;
    }) => requestAdministrativeApprovalRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
    },
  });

  return {
    grantApproval,
    rejectApproval,
    requestApproval,
  };
}
