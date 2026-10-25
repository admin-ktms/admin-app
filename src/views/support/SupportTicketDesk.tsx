import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  Search,
  MessageSquare,
  Clock,
  UserCheck,
  Send,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useSupportCases, useSupportMutations } from '@/hooks/useSupport';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SupportCaseSummary } from '@/api/support';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RoleGate } from '@/routes/RoleGate';

export const SupportTicketDesk: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGameMaster } = useAdminAuth();
  const { data: cases = [], isLoading } = useSupportCases();
  const { openGMChat } = useSupportMutations();

  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Direct GM Outreach Drawer state
  const [isGmChatOpen, setIsGmChatOpen] = useState(false);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [gmChatError, setGmChatError] = useState<string | null>(null);

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

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case 'OPEN':
        return 'warning';
      case 'IN_PROGRESS':
        return 'active';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
      default:
        return 'neutral';
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.support_case_id.toLowerCase().includes(search.toLowerCase()) ||
      c.player_id.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || c.case_priority === priorityFilter;

    if (!matchesSearch || !matchesPriority) return false;

    if (statusFilter === 'ACTIVE') {
      return c.case_status === 'OPEN' || c.case_status === 'IN_PROGRESS';
    }
    if (statusFilter === 'UNASSIGNED') {
      return (c.case_status === 'OPEN' || c.case_status === 'IN_PROGRESS') && !c.assigned_admin_id;
    }
    if (statusFilter === 'RESOLVED') {
      return c.case_status === 'RESOLVED' || c.case_status === 'CLOSED';
    }
    return true;
  });

  const handleOpenGMChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlayerId.trim() || !initialMessage.trim()) return;

    try {
      setGmChatError(null);
      await openGMChat.mutateAsync({
        target_player_id: targetPlayerId.trim(),
        initial_message: initialMessage.trim(),
      });

      setIsGmChatOpen(false);
      setTargetPlayerId('');
      setInitialMessage('');
    } catch (err: unknown) {
      setGmChatError(err instanceof Error ? err.message : 'Failed to initiate direct chat.');
    }
  };

  const columns: Column<SupportCaseSummary>[] = [
    {
      key: 'case_id',
      header: 'Ticket ID',
      render: (c) => (
        <span className="font-mono font-bold text-ktms-cyan">{c.support_case_id}</span>
      ),
      width: '130px',
    },
    {
      key: 'subject',
      header: 'Subject & Description',
      render: (c) => (
        <div className="max-w-[280px]">
          <span className="font-semibold text-xs text-ktms-text block truncate">{c.subject}</span>
          <span className="text-[11px] text-ktms-muted truncate block">{c.case_description}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (c) => (
        <StatusBadge label={c.case_priority} variant={getPriorityVariant(c.case_priority)} />
      ),
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <StatusBadge label={c.case_status} variant={getStatusVariant(c.case_status)} />
      ),
      width: '110px',
    },
    {
      key: 'player',
      header: 'Player ID',
      render: (c) => <span className="font-mono text-xs">{c.player_id}</span>,
      width: '130px',
    },
    {
      key: 'handler',
      header: 'Assigned Handler',
      render: (c) =>
        c.assigned_admin_id ? (
          <span className="font-mono text-xs text-ktms-text">
            {c.assigned_admin_id === user?.admin_id ? 'You' : c.assigned_admin_id}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-ktms-gold">Unassigned</span>
        ),
      width: '130px',
    },
    {
      key: 'action',
      header: '',
      render: (c) => (
        <span className="text-xs font-semibold text-ktms-cyan flex items-center gap-0.5 justify-end">
          Open Case <ArrowUpRight size={14} />
        </span>
      ),
      width: '90px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Direct GM Chat Modal */}
      <DrawerModal
        isOpen={isGmChatOpen}
        onClose={() => setIsGmChatOpen(false)}
        title="Direct Player Outreach (Game Master)"
        description="Initiate an authoritative direct message thread to an active player profile."
      >
        <form onSubmit={handleOpenGMChat} className="space-y-4">
          {gmChatError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{gmChatError}</span>
            </div>
          )}

          <Input
            id="target_player_id"
            label="Target Player Identifier (e.g. PLY-XXXXXX)"
            required
            value={targetPlayerId}
            onChange={(e) => setTargetPlayerId(e.target.value)}
            placeholder="PLY-000001"
          />

          <Textarea
            id="gm_initial_message"
            label="Inquiry / Notice Body"
            required
            rows={4}
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="State the administrative matter, tournament context, or inquiry..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsGmChatOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={openGMChat.isPending}
              icon={<Send size={14} />}
            >
              Open Direct Thread
            </Button>
          </div>
        </form>
      </DrawerModal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
            <Headphones className="h-5 w-5 text-ktms-cyan" />
            Support Triage Desk
          </h1>
          <p className="text-xs text-ktms-muted mt-0.5">
            Player inquiries, ticket triage, dispute escalations, and direct communications.
          </p>
        </div>

        <RoleGate allowedRoles={['game_master']}>
          <Button
            size="md"
            variant="gold"
            icon={<MessageSquare size={16} />}
            onClick={() => setIsGmChatOpen(true)}
          >
            Direct Player Chat
          </Button>
        </RoleGate>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ACTIVE', label: 'Active Tickets' },
            { id: 'UNASSIGNED', label: 'Unassigned' },
            { id: 'RESOLVED', label: 'Resolved / Closed' },
            { id: 'ALL', label: 'All Cases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === tab.id
                  ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                  : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-ktms-bg border border-ktms-border rounded px-2.5 py-1.5 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative flex items-center min-w-[200px]">
            <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search case, player, or topic..."
              className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredCases}
          keyExtractor={(c) => c.support_case_id}
          isLoading={isLoading}
          onRowClick={(c) => navigate(`/support/${c.support_case_id}`)}
          emptyMessage="No support cases found in this triage queue."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading support triage cases...
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No active tickets matching the selected filters.
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.support_case_id}
              onClick={() => navigate(`/support/${c.support_case_id}`)}
              className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel active:bg-ktms-surface transition cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ktms-cyan">
                  {c.support_case_id}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge
                    label={c.case_priority}
                    variant={getPriorityVariant(c.case_priority)}
                  />
                  <StatusBadge
                    label={c.case_status}
                    variant={getStatusVariant(c.case_status)}
                  />
                </div>
              </div>

              <div>
                <span className="text-sm font-bold text-ktms-text block">{c.subject}</span>
                <p className="text-xs text-ktms-muted line-clamp-2 mt-0.5">{c.case_description}</p>
              </div>

              <div className="pt-2 border-t border-ktms-border/60 flex items-center justify-between text-[11px] font-mono text-ktms-muted">
                <span>Player: {c.player_id}</span>
                <span>
                  Handler:{' '}
                  {c.assigned_admin_id
                    ? c.assigned_admin_id === user?.admin_id
                      ? 'You'
                      : c.assigned_admin_id
                    : 'Unassigned'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
