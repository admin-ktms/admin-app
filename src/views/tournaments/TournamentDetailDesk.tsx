import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useTournamentDetail,
  useTournamentRegistrations,
  useTournamentFixtures,
  useTournamentMutations,
} from '@/hooks/useTournaments';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { RoleGate } from '@/routes/RoleGate';

export const TournamentDetailDesk: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const { data: tournament, isLoading: isTournLoading } = useTournamentDetail(tournamentId);
  const { data: registrations = [], isLoading: isRegsLoading } =
    useTournamentRegistrations(tournamentId);
  const { data: fixtures = [], isLoading: isFixturesLoading } = useTournamentFixtures(tournamentId);
  const { transitionStage } = useTournamentMutations();

  const [activeTab, setActiveTab] = useState<'fixtures' | 'roster' | 'rules'>('fixtures');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  if (isTournLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center font-mono text-xs text-ktms-muted">
        Loading tournament details...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-ktms-muted">Tournament record not found.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/tournaments')}>
          Return to Tournaments
        </Button>
      </div>
    );
  }

  const handleStageTransition = async (nextStage: string) => {
    try {
      setTransitionError(null);
      await transitionStage.mutateAsync({
        tournament_id: tournament.tournament_id,
        next_stage: nextStage,
      });
    } catch (err: unknown) {
      setTransitionError(err instanceof Error ? err.message : 'Stage transition failed.');
    }
  };

  const fixtureColumns: Column<any>[] = [
    {
      key: 'match_code',
      header: 'Match Code',
      render: (f) => <span className="font-mono font-bold text-ktms-cyan">{f.match_code}</span>,
      width: '120px',
    },
    {
      key: 'round',
      header: 'Round / Group',
      render: (f) => (
        <span className="text-xs font-semibold text-ktms-text">
          {f.round_number ? `Round ${f.round_number}` : f.group_name || 'Knockout'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <StatusBadge label={f.fixture_status} variant="active" />,
      width: '120px',
    },
    {
      key: 'score',
      header: 'Result',
      render: (f) => (
        <span className="font-mono text-xs text-ktms-text">
          {f.home_score !== null && f.away_score !== null ? `${f.home_score} - ${f.away_score}` : 'TBD'}
        </span>
      ),
      width: '100px',
    },
  ];

  const rosterColumns: Column<any>[] = [
    {
      key: 'reg_id',
      header: 'Registration ID',
      render: (r) => <span className="font-mono text-xs text-ktms-cyan">{r.registration_id}</span>,
      width: '140px',
    },
    {
      key: 'player',
      header: 'Participant Profile',
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-ktms-text block">{r.squad_name || 'Free Agent'}</span>
          <span className="font-mono text-[10px] text-ktms-muted">{r.player_id}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Standing',
      render: (r) => <StatusBadge label={r.registration_status} variant="success" />,
      width: '120px',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Tournaments Desk
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ktms-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-ktms-cyan">
                {tournament.tournament_id}
              </span>
              <StatusBadge label={tournament.tournament_status} variant="active" />
            </div>
            <h1 className="text-xl font-bold text-ktms-text">{tournament.tournament_name}</h1>
          </div>

          <RoleGate allowedRoles={['game_master', 'platform_manager']}>
            <div className="flex items-center gap-2">
              {tournament.tournament_status === 'Registration_Open' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStageTransition('Active')}
                  isLoading={transitionStage.isPending}
                >
                  Start Competition
                </Button>
              )}
            </div>
          </RoleGate>
        </div>
      </div>

      {transitionError && (
        <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{transitionError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-ktms-border bg-ktms-panel">
          <span className="text-[10px] uppercase font-mono text-ktms-muted block mb-1">Total Roster</span>
          <span className="text-lg font-mono font-bold text-ktms-text">{registrations.length}</span>
        </div>
        <div className="p-3 rounded-xl border border-ktms-border bg-ktms-panel">
          <span className="text-[10px] uppercase font-mono text-ktms-muted block mb-1">Active Fixtures</span>
          <span className="text-lg font-mono font-bold text-ktms-cyan">{fixtures.length}</span>
        </div>
        <div className="p-3 rounded-xl border border-ktms-border bg-ktms-panel">
          <span className="text-[10px] uppercase font-mono text-ktms-muted block mb-1">Format Tier</span>
          <span className="text-xs font-bold text-ktms-gold block truncate mt-1">
            {tournament.tournament_type || 'Standard'}
          </span>
        </div>
        <div className="p-3 rounded-xl border border-ktms-border bg-ktms-panel">
          <span className="text-[10px] uppercase font-mono text-ktms-muted block mb-1">Entry Engine</span>
          <span className="text-xs font-mono text-ktms-text block truncate mt-1">
            {tournament.monetization_mode || 'Free Entry'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-ktms-border">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'fixtures'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Layers size={14} /> Fixtures Matrix
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'roster'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Users size={14} /> Registered Roster
        </button>
      </div>

      {activeTab === 'fixtures' && (
        <DataTable
          columns={fixtureColumns}
          data={fixtures}
          keyExtractor={(f) => f.fixture_id}
          isLoading={isFixturesLoading}
          emptyMessage="No fixtures scheduled for this tournament edition."
        />
      )}

      {activeTab === 'roster' && (
        <DataTable
          columns={rosterColumns}
          data={registrations}
          keyExtractor={(r) => r.registration_id}
          isLoading={isRegsLoading}
          emptyMessage="No participants currently registered in this tournament."
        />
      )}
    </div>
  );
};
