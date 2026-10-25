import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './useAdminAuth';

export interface PresentStaffMember {
  admin_id: string;
  name: string;
  role: string;
  online_at: string;
}

/**
 * Ephemeral Realtime Presence Engine
 * Binds staff to a shared topic channel based on resource category and ID.
 * Tracks concurrent active viewers without writing state to the database.
 */
export function useCasePresence(caseType: 'dispute' | 'payment' | 'support', caseId: string | null) {
  const { user, role } = useAdminAuth();
  const [activeStaff, setActiveStaff] = useState<PresentStaffMember[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!caseId || !user) return;

    const channelName = `presence:${caseType}:${caseId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.admin_id,
        },
      },
    });

    channelRef.current = channel;

    // Track active viewers on sync and join/leave events
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const staffList: PresentStaffMember[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            // Exclude current user from their own collision list
            if (p.admin_id !== user.admin_id) {
              staffList.push({
                admin_id: p.admin_id,
                name: p.display_name || p.full_name || 'Staff Member',
                role: p.role,
                online_at: p.online_at,
              });
            }
          });
        });

        setActiveStaff(staffList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            admin_id: user.admin_id,
            display_name: user.display_name || user.full_name,
            role: role || 'admin',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, [caseType, caseId, user?.admin_id, user?.display_name, role]);

  return {
    isConflicted: activeStaff.length > 0,
    activeStaff,
  };
}
