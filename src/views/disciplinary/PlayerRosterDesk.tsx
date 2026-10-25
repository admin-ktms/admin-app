import React, { useState } from 'react';
import { Users, Search, ShieldAlert, UserX, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { usePlayerDirectory } from '@/hooks/useDisciplinary';
import { PlayerDirectoryItem } from '@/api/disciplinary';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DisciplinaryActionModal } from './DisciplinaryActionModal';

export const PlayerRosterDesk: React.FC = () => {
  const { data: players = [], isLoading } = usePlayerDirectory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SANCTIONED'>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDirectoryItem | null>(null);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.player_id.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'ACTIVE') return matchesSearch && p.player_status === 'Active';
    if (statusFilter === 'SANCTIONED') {
      return matchesSearch && (p.player_status === 'Suspended' || p.player_status === 'Banned');
    }
    return matchesSearch;
  });

  const columns: Column<PlayerDirectoryItem>[] = [
    {
      key: 'username',
      header: 'Player Identity',
      render: (p) => (
        <div>
          <span className="font-bold text-sm text-ktms-text block">{p.username}</span>
          <span className="font-mono text-[10px] text-ktms-muted">ID: {p.player_id}</span>
        </div>
      ),
    },
    {
      key: 'full_name',
      header: 'Full Legal Name',
      render: (p) => <span className="text-xs text-ktms-text/90">{p.full_name}</span>,
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (p) => {
        let variant: 'success' | 'warning' | 'danger' = 'success';
        if (p.player_status === 'Suspended') variant = 'warning';
        if (p.player_status === 'Banned') variant = 'danger';

        return <StatusBadge label={p.player_status} variant={variant} />;
      },
    },
    {
      key: 'registrations',
      header: 'Active Tournaments',
      render: (p) =>
        p.active_registrations && p.active_registrations.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {p.active_registrations.map((r) => (
              <span key={r.registration_id} className="font-mono text-[11px] text-ktms-cyan truncate max-w-[180px]">
                {r.tournament_name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-ktms-muted">None</span>
        ),
    },
    {
      key: 'suspended_until',
      header: 'Sanction Notes',
      render: (p) =>
        p.player_status === 'Suspended' && p.suspended_until_datetime ? (
          <div className="flex flex-col text-[10px] font-mono text-ktms-gold">
            <span className="flex items-center gap-1">
              <Clock size={11} /> Until: {new Date(p.suspended_until_datetime).toLocaleDateString()}
            </span>
            <span className="truncate max-w-[160px] text-ktms-muted">{p.status_reason}</span>
          </div>
        ) : p.player_status === 'Banned' ? (
          <span className="text-[10px] font-mono text-ktms-coral truncate max-w-[160px] block">
            {p.status_reason || 'Permanent Ban'}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-ktms-muted">Good Standing</span>
        ),
    },
    {
      key: 'actions',
      header: 'Discipline',
      render: (p) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPlayer(p);
          }}
        >
          Sanction
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sanctions Modal */}
      <DisciplinaryActionModal
        isOpen={!!selectedPlayer}
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
          <Users className="h-5 w-5 text-ktms-cyan" />
          Disciplinary & Player Sanctions Desk
        </h1>
        <p className="text-xs text-ktms-muted mt-0.5">
          Participant roster management, tournament disqualifications, suspensions, and account bans.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              statusFilter === 'ALL'
                ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            All Accounts ({players.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-ktms-green/10 text-ktms-green border border-ktms-green/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            Active ({players.filter((p) => p.player_status === 'Active').length})
          </button>
          <button
            onClick={() => setStatusFilter('SANCTIONED')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              statusFilter === 'SANCTIONED'
                ? 'bg-ktms-coral/10 text-ktms-coral border border-ktms-coral/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            Sanctioned ({players.filter((p) => p.player_status !== 'Active').length})
          </button>
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, ID, or name..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredPlayers}
          keyExtractor={(p) => p.player_id}
          isLoading={isLoading}
          onRowClick={(p) => setSelectedPlayer(p)}
          emptyMessage="No player accounts matching the selected criteria."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading player roster...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No player accounts match search.
          </div>
        ) : (
          filteredPlayers.map((p) => {
            let variant: 'success' | 'warning' | 'danger' = 'success';
            if (p.player_status === 'Suspended') variant = 'warning';
            if (p.player_status === 'Banned') variant = 'danger';

            return (
              <div
                key={p.player_id}
                className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-ktms-text block">{p.username}</span>
                    <span className="font-mono text-[10px] text-ktms-muted">{p.player_id}</span>
                  </div>
                  <StatusBadge label={p.player_status} variant={variant} />
                </div>

                <div className="text-xs text-ktms-muted flex justify-between">
                  <span>Name: {p.full_name}</span>
                  {p.active_registrations && p.active_registrations.length > 0 && (
                    <span className="text-ktms-cyan font-mono text-[11px]">
                      {p.active_registrations.length} Active Tourn.
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-ktms-border/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ktms-muted truncate max-w-[180px]">
                    {p.status_reason || 'Good standing'}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedPlayer(p)}>
                    Sanction
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
