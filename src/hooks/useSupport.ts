import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getSupportCasesList,
  getSupportCaseById,
  getConversationMessages,
  assignSupportCaseRpc,
  sendSupportMessageRpc,
  openGameMasterChatRpc,
  updateSupportCaseStatus,
  AssignSupportCaseParams,
  SendSupportMessageParams,
  OpenGMChatParams,
} from '@/api/support';
import { useAdminAuth } from './useAdminAuth';

export const SUPPORT_CASES_QUERY_KEY = ['admin', 'support', 'cases'];
export const SUPPORT_MESSAGES_QUERY_KEY = ['admin', 'support', 'messages'];

export function useSupportCases() {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: SUPPORT_CASES_QUERY_KEY,
    queryFn: getSupportCasesList,
    enabled: !!user,
  });
}

export function useSupportCaseDetail(caseId: string | undefined) {
  const { user } = useAdminAuth();

  return useQuery({
    queryKey: [...SUPPORT_CASES_QUERY_KEY, caseId],
    queryFn: () => (caseId ? getSupportCaseById(caseId) : null),
    enabled: !!user && !!caseId,
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUPPORT_MESSAGES_QUERY_KEY, conversationId],
    queryFn: () => (conversationId ? getConversationMessages(conversationId) : []),
    enabled: !!user && !!conversationId,
  });

  // Realtime subscription for incoming thread messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`support:conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'notifications',
          table: 'message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [...SUPPORT_MESSAGES_QUERY_KEY, conversationId],
          });
          queryClient.invalidateQueries({
            queryKey: SUPPORT_CASES_QUERY_KEY,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSupportMutations() {
  const queryClient = useQueryClient();

  const assignCase = useMutation({
    mutationFn: (params: AssignSupportCaseParams) => assignSupportCaseRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_CASES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...SUPPORT_CASES_QUERY_KEY, variables.case_id],
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: (params: SendSupportMessageParams) => sendSupportMessageRpc(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...SUPPORT_MESSAGES_QUERY_KEY, variables.conversation_id],
      });
      queryClient.invalidateQueries({ queryKey: SUPPORT_CASES_QUERY_KEY });
    },
  });

  const openGMChat = useMutation({
    mutationFn: (params: OpenGMChatParams) => openGameMasterChatRpc(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_CASES_QUERY_KEY });
    },
  });

  const changeStatus = useMutation({
    mutationFn: (params: { caseId: string; status: 'RESOLVED' | 'CLOSED'; reason?: string }) =>
      updateSupportCaseStatus(params.caseId, params.status, params.reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_CASES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...SUPPORT_CASES_QUERY_KEY, variables.caseId],
      });
    },
  });

  return {
    assignCase,
    sendMessage,
    openGMChat,
    changeStatus,
  };
}
