import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Calendar, Users, ArrowUpRight, Search } from 'lucide-react';
import { useTournaments, useTournamentMutations } from '@/hooks/useTournaments';
import { TournamentSummary } from '@/api/tournaments';
import { Button } from '@/components/ui/Button';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Input } from '@/components/ui/Input';
import { RoleGate } from '@/routes/RoleGate';

export const TournamentsListDesk: React.FC = () => {
  const navigate = useNavigate();
  const { data: tournaments = [], isLoading } = useTournaments();
  const { createTournament } = useTournamentMutations();

  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Creation form state
  const [name, setName] = useState('');
  const [regFee, setRegFee] = useState('1000');
  const [maxPlayers, setMaxPlayers] = useState('100');
  const [minAge, setMinAge] = useState('16');
  const [regOpenDate, setRegOpenDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case 'Registration Open':
      case 'Group Stage':
      case 'Playoff Stage':
      case 'Knockout Stage':
        return 'active';
      case 'Completed':
        return 'success';
      case 'Suspended':
        return 'danger';
      case 'Upcoming':
      case 'Registration Closed':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch = t.tournament_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tournament_id.toLowerCase().includes(search.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    if (filter === 'ACTIVE') {
      return matchesSearch && ['Group Stage', 'Playoff Stage', 'Knockout Stage'].includes(t.tournament_status);
    }
    if (filter === 'REGISTRATION') {
      return matchesSearch && ['Registration Open', 'Registration Closed', 'Upcoming'].includes(t.tournament_status);
    }
    if (filter === 'COMPLETED') {
      return matchesSearch && t.tournament_status === 'Completed';
    }
    return matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regOpenDate) {
      setFormError('Tournament name and registration open date are required.');
      return;
    }

    try {
      setFormError(null);
      await createTournament.mutateAsync({
        tournament_type_id: 'KT', // Defaulting to KickOff Tournament Format
        tournament_name: name.trim(),
        registration_open_datetime: new Date(regOpenDate).toISOString(),
        registration_fee: parseFloat(regFee) || 0,
        maximum_players: parseInt(maxPlayers, 10) || 100,
        minimum_age: parseInt(minAge, 10) || 16,
      });

      setIsCreateOpen(false);
      setName('');
      setRegOpenDate('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tournament.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Desk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
            <Trophy className="h-5 w-5 text-ktms-cyan" />
            Tournament Operations Desk
          </h1>
          <p className="text-xs text-ktms-muted mt-0.5">
            Lifecycle monitoring, stage progression, matchdays, and fixture orchestration.
          </p>
        </div>

        <RoleGate allowedRoles={['game_master', 'platform_manager']}>
          <Button
            size="md"
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Tournament
          </Button>
        </RoleGate>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'REGISTRATION', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                filter === tab
                  ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                  : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative flex items-center min-w-[220px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournament or ID..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Tournament Cards Grid */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded border border-ktms-border bg-ktms-panel">
          <div className="flex items-center gap-2 text-xs font-mono text-ktms-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ktms-cyan border-t-transparent" />
            <span>Loading tournaments...</span>
          </div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded border border-ktms-border bg-ktms-panel p-6 text-center">
          <p className="text-xs text-ktms-muted">No tournaments match the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTournaments.map((t: TournamentSummary) => (
            <div
              key={t.tournament_id}
              onClick={() => navigate(`/tournaments/${t.tournament_id}`)}
              className="flex flex-col justify-between rounded-xl border border-ktms-border bg-ktms-panel p-4 shadow-sm hover:border-ktms-cyan/40 transition cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-ktms-muted tracking-wider">
                    {t.tournament_id} • Edition #{t.tournament_edition}
                  </span>
                  <StatusBadge
                    label={t.tournament_status}
                    variant={getStatusVariant(t.tournament_status)}
                  />
                </div>

                <h3 className="text-sm font-bold text-ktms-text group-hover:text-ktms-cyan transition line-clamp-1">
                  {t.tournament_name}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-ktms-muted font-mono">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-ktms-muted/70" />
                    <span>Cap: {t.maximum_players} players</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-ktms-muted/70" />
                    <span>Fee: ₦{Number(t.registration_fee).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ktms-border/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-ktms-muted">
                  Opened {new Date(t.registration_open_datetime).toLocaleDateString()}
                </span>
                <span className="font-semibold text-ktms-cyan flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Open Desk <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Drawer Modal */}
      <DrawerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Tournament"
        description="Initialize a new competitive edition and publish registration requirements."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral">
              {formError}
            </div>
          )}

          <Input
            id="tournament_name"
            label="Tournament Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. KickOff Premier Cup Season 1"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="registration_fee"
              label="Registration Fee (NGN)"
              type="number"
              min="0"
              required
              value={regFee}
              onChange={(e) => setRegFee(e.target.value)}
            />
            <Input
              id="max_players"
              label="Max Players"
              type="number"
              min="8"
              max="256"
              required
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="min_age"
              label="Minimum Age"
              type="number"
              min="13"
              max="99"
              required
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
            />
            <Input
              id="registration_open_datetime"
              label="Registration Opens"
              type="datetime-local"
              required
              value={regOpenDate}
              onChange={(e) => setRegOpenDate(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createTournament.isPending}
            >
              Initialize Tournament
            </Button>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};
