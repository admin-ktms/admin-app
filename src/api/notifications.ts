import { supabase } from '@/lib/supabase';

export interface AdminNotificationItem {
  notification_id: string;
  tournament_id: string | null;
  recipient_type: 'Admin' | 'Player';
  recipient_id: string;
  source_entity: string | null;
  source_record_id: string | null;
  notification_type: string;
  notification_subject: string;
  notification_body: string;
  notification_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  delivery_status: 'Pending' | 'Delivered' | 'Failed';
  read_status: 'Read' | 'Unread';
  created_datetime: string;
  sent_datetime: string | null;
}

/**
 * Fetch notifications addressed to the active administrator
 */
export async function getAdminNotifications(adminId: string, limit = 50): Promise<AdminNotificationItem[]> {
  const { data, error } = await supabase
    .schema('notifications')
    .from('notification')
    .select('*')
    .eq('recipient_type', 'Admin')
    .eq('recipient_id', adminId)
    .order('created_datetime', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AdminNotificationItem[];
}

/**
 * Fetch unread notification count for the active administrator
 */
export async function getAdminUnreadNotificationCount(adminId: string): Promise<number> {
  const { count, error } = await supabase
    .schema('notifications')
    .from('notification')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_type', 'Admin')
    .eq('recipient_id', adminId)
    .eq('read_status', 'Unread');

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a single notification as Read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .schema('notifications')
    .from('notification')
    .update({ read_status: 'Read' })
    .eq('notification_id', notificationId);

  if (error) throw error;
}

/**
 * Mark all unread notifications for this administrator as Read
 */
export async function markAllNotificationsAsRead(adminId: string): Promise<void> {
  const { error } = await supabase
    .schema('notifications')
    .from('notification')
    .update({ read_status: 'Read' })
    .eq('recipient_type', 'Admin')
    .eq('recipient_id', adminId)
    .eq('read_status', 'Unread');

  if (error) throw error;
}
