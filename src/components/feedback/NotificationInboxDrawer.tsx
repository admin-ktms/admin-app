import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  Swords,
  Receipt,
  Headphones,
  Trophy,
  AlertTriangle,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { AdminNotificationItem } from '@/api/notifications';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

interface NotificationInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationInboxDrawer: React.FC<NotificationInboxDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useAdminNotifications();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');

  if (!isOpen) return null;

  const getPriorityVariant = (priority: string): StatusVariant => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'NORMAL':
        return 'active';
      case 'LOW':
      default:
        return 'neutral';
    }
  };

  const getEntityIcon = (entity: string | null) => {
    const e = entity?.toLowerCase() || '';
    if (e.includes('dispute') || e.includes('no_show')) return <Swords size={14} className="text-ktms-coral" />;
    if (e.includes('transaction') || e.includes('award')) return <Receipt size={14} className="text-ktms-green" />;
    if (e.includes('case') || e.includes('message')) return <Headphones size={14} className="text-ktms-cyan" />;
    if (e.includes('tournament') || e.includes('fixture')) return <Trophy size={14} className="text-ktms-gold" />;
    return <AlertTriangle size={14} className="text-ktms-muted" />;
  };

  const handleNotificationClick = async (n: AdminNotificationItem) => {
    if (n.read_status === 'Unread') {
      await markAsRead.mutateAsync(n.notification_id);
    }

    onClose();

    // Resolve target desk route based on source entity and record ID
    const entity = n.source_entity?.toLowerCase() || '';
    if (entity.includes('dispute')) {
      navigate(`/disputes/dispute/${n.source_record_id || ''}`);
    } else if (entity.includes('no_show')) {
      navigate(`/disputes/noshow/${n.source_record_id || ''}`);
    } else if (entity.includes('transaction') || entity.includes('award')) {
      navigate('/finance');
    } else if (entity.includes('case') || entity.includes('support')) {
      navigate(`/support/${n.source_record_id || ''}`);
    } else if (entity.includes('tournament') && n.tournament_id) {
      navigate(`/tournaments/${n.tournament_id}`);
    } else {
      navigate('/');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return n.read_status === 'Unread';
    if (filter === 'URGENT') return n.notification_priority === 'URGENT' || n.notification_priority === 'HIGH';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-ktms-panel border-l border-ktms-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-ktms-border bg-ktms-surface/50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-ktms-cyan" />
              <h2 className="text-sm font-bold text-ktms-text">Operational Incident Feed</h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-ktms-cyan/20 text-ktms-cyan border border-ktms-cyan/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-ktms-muted hover:text-ktms-cyan hover:bg-ktms-surface transition disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-ktms-border bg-ktms-bg/50">
            {[
              { id: 'ALL', label: `All (${notifications.length})` },
              { id: 'UNREAD', label: `Unread (${unreadCount})` },
              {
                id: 'URGENT',
                label: `Urgent (${
                  notifications.filter(
                    (n) => n.notification_priority === 'URGENT' || n.notification_priority === 'HIGH'
                  ).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  filter === tab.id
                    ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                    : 'text-ktms-muted hover:text-ktms-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-ktms-muted font-mono">
                Loading incidents stream...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-surface/30">
                No incidents in this view.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex flex-col gap-2 p-3 rounded-xl border transition cursor-pointer group ${
                    n.read_status === 'Unread'
                      ? 'bg-ktms-surface/80 border-ktms-cyan/40 hover:border-ktms-cyan'
                      : 'bg-ktms-panel border-ktms-border/70 hover:border-ktms-border opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getEntityIcon(n.source_entity)}
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ktms-muted">
                        {n.source_entity || 'SYSTEM'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <StatusBadge
                        label={n.notification_priority}
                        variant={getPriorityVariant(n.notification_priority)}
                      />
                      {n.read_status === 'Unread' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-ktms-cyan shrink-0" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-ktms-text group-hover:text-ktms-cyan transition">
                      {n.notification_subject}
                    </h4>
                    <p className="text-[11px] text-ktms-muted line-clamp-2 mt-0.5 leading-relaxed">
                      {n.notification_body}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-ktms-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(n.created_datetime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-ktms-cyan font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Resolve <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
