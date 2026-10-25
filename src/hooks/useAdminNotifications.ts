import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './useAdminAuth';
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  AdminNotificationItem,
} from '@/api/notifications';

export const ADMIN_NOTIFICATIONS_KEY = ['admin', 'notifications', 'list'];
export const ADMIN_UNREAD_COUNT_KEY = ['admin', 'notifications', 'unread-count'];

export function useAdminNotifications() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const adminId = user?.admin_id;

  // 1. Fetch notification records
  const notificationsQuery = useQuery({
    queryKey: [...ADMIN_NOTIFICATIONS_KEY, adminId],
    queryFn: () => (adminId ? getAdminNotifications(adminId) : []),
    enabled: !!adminId,
    staleTime: 1000 * 15,
  });

  // 2. Fetch unread count
  const unreadCountQuery = useQuery({
    queryKey: [...ADMIN_UNREAD_COUNT_KEY, adminId],
    queryFn: () => (adminId ? getAdminUnreadNotificationCount(adminId) : 0),
    enabled: !!adminId,
    staleTime: 1000 * 15,
  });

  // 3. Realtime subscription to new notifications
  useEffect(() => {
    if (!adminId) return;

    const channel = supabase
      .channel(`admin-incidents:${adminId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'notifications',
          table: 'notification',
          filter: `recipient_id=eq.${adminId}`,
        },
        (payload) => {
          // Re-fetch notification lists and badge counts
          queryClient.invalidateQueries({ queryKey: [...ADMIN_NOTIFICATIONS_KEY, adminId] });
          queryClient.invalidateQueries({ queryKey: [...ADMIN_UNREAD_COUNT_KEY, adminId] });

          // Invalidate operational desk caches dynamically based on source entity
          const newRecord = payload.new as Partial<AdminNotificationItem>;
          if (newRecord?.source_entity) {
            const entity = newRecord.source_entity.toLowerCase();
            if (entity.includes('dispute') || entity.includes('no_show')) {
              queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
            } else if (entity.includes('transaction') || entity.includes('award')) {
              queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
            } else if (entity.includes('fixture') || entity.includes('matchday')) {
              queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
            } else if (entity.includes('case') || entity.includes('message')) {
              queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId, queryClient]);

  // 4. Mutations
  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_NOTIFICATIONS_KEY, adminId] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_UNREAD_COUNT_KEY, adminId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => (adminId ? markAllNotificationsAsRead(adminId) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_NOTIFICATIONS_KEY, adminId] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_UNREAD_COUNT_KEY, adminId] });
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    markAsRead,
    markAllAsRead,
  };
}
