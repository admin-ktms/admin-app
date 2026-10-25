import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPendingBankTransfers,
  getPendingAwards,
  verifyBankTransferPaymentRpc,
  approveAwardPayoutRpc,
} from '@/api/finance';
import { useAdminAuth } from './useAdminAuth';

export const BANK_TRANSFERS_QUERY_KEY = ['admin', 'finance', 'bank-transfers'];
export const AWARDS_QUERY_KEY = ['admin', 'finance', 'awards'];

export function usePendingBankTransfers() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: BANK_TRANSFERS_QUERY_KEY,
    queryFn: getPendingBankTransfers,
    enabled: !!user,
  });
}

export function usePendingAwards() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: AWARDS_QUERY_KEY,
    queryFn: getPendingAwards,
    enabled: !!user,
  });
}

export function useFinanceMutations() {
  const queryClient = useQueryClient();

  // 1. Verify / Reject Bank Transfer
  const verifyBankTransfer = useMutation({
    mutationFn: (params: {
      registration_reference_id: string;
      decision: 'approve' | 'reject';
      rejection_reason?: string;
    }) => verifyBankTransferPaymentRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_TRANSFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
    },
  });

  // 2. Approve / Disapprove Podium Award Payout
  const adjudicateAward = useMutation({
    mutationFn: (params: {
      award_id: string;
      decision: 'Approved' | 'Disapproved';
      notes: string;
    }) => approveAwardPayoutRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AWARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BANK_TRANSFERS_QUERY_KEY });
    },
  });

  return {
    verifyBankTransfer,
    adjudicateAward,
  };
}
