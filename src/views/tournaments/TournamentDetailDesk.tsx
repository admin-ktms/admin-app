import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Play,
  RotateCw,
  Clock,
  Swords,
  ChevronRight,
} from 'lucide-react';
import {
  useTournamentDetail,
  useTournamentMatchdays,
  useTournamentFixtures,
  useTournamentMutations,
} from '@/hooks/useTournaments';
import { Button } from '@/components/ui/Button';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { RoleGate } from '@/routes/RoleGate';
import { FixtureRow, MatchdaySummary, TournamentRow } from '@/api/tournaments';

export const TournamentDetailDesk: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const { data: tournament, isLoading: isTournLoading } = useTournamentDetail(tournamentId);
  const { data: matchdays = [], isLoading: isMatchdaysLoading } = useTournamentMatchdays(tournamentId);
  const { data: fixtures = [], isLoading: isFixturesLoading } = useTournamentFixtures(tournamentId);

  const { transitionStatus, transitionMatchday, rescheduleFixture } = useTournamentMutations();

  const [activeTab, setActiveTab] = useState<'matchdays' | 'fixtures'>('matchdays');

  if (isTournLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-xs font-mono text-ktms-muted">
        Loading tournament workspace...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-ktms-muted">Tournament record not found or inaccessible.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/tournaments')}>
          Return to Tournaments Directory
        </Button>
      </div>
    );
  }

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

  const handleStageAdvance = async (nextStatus: TournamentRow['tournament_status']) => {
    if (!tournamentId) return;
    await transitionStatus.mutateAsync({
      tournament_id: tournamentId,
      to_status: nextStatus,
      reason: `Advanced via Operations Console to ${nextStatus}`,
    });
  };

  const handleMatchdayToggle = async (matchday: MatchdaySummary) => {
    if (!tournamentId) return;
    const nextStatus = matchday.matchday_status === 'Active' ? 'Completed' : 'Active';
    await transitionMatchday.mutateAsync({
      tournament_id: tournamentId,
      matchday_id: matchday.matchday_id,
      to_status: nextStatus,
    });
  };

  const fixtureColumns: Column<FixtureRow>[] = [
    {
      key: 'match_code',
      header: 'Match Code',
      render: (f) => <span className="font-mono font-bold text-ktms-cyan">{f.match_code}</span>,
    },
    {
      key: 'round_name',
      header: 'Round',
      render: (f) => <span className="text-xs text-ktms-muted">{f.round_name}</span>,
    },
    {
      key: 'participants',
      header: 'Pairing (A vs B)',
      render: (f) => (
        <span className="font-mono text-xs">
          {f.registration_a_id} <span className="text-ktms-muted">vs</span> {f.registration_b_id}
        </span>
      ),
    },
    {
      key: 'fixture_status',
      header: 'Status',
      render: (f) => (
        <StatusBadge
          label={f.fixture_status}
          variant={f.fixture_status === 'Official' ? 'success' : f.fixture_status === 'In Progress' ? 'active' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (f) => (
        <RoleGate allowedRoles={['game_master', 'platform_manager', 'moderator']}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (tournamentId) {
                rescheduleFixture.mutate({ tournament_id: tournamentId, fixture_id: f.fixture_id });
              }
            }}
            disabled={rescheduleFixture.isPending || f.fixture_status === 'Official'}
            className="px-2 py-1 rounded bg-ktms-surface hover:bg-ktms-border text-xs text-ktms-muted hover:text-white transition disabled:opacity-40"
          >
            Reschedule
          </button>
        </RoleGate>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link & Title */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ktms-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ktms-muted">{tournament.tournament_id}</span>
              <StatusBadge
                label={tournament.tournament_status}
                variant={getStatusVariant(tournament.tournament_status)}
              />
            </div>
            <h1 className="text-xl font-black text-ktms-text">{tournament.tournament_name}</h1>
          </div>

          {/* Quick Lifecycle Stage Triggers */}
          <RoleGate allowedRoles={['game_master', 'platform_manager']}>
            <div className="flex flex-wrap items-center gap-2">
              {tournament.tournament_status === 'Upcoming' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStageAdvance('Registration Open')}
                  isLoading={transitionStatus.isPending}
                >
                  Open Registrations
                </Button>
              )}
              {tournament.tournament_status === 'Registration Open' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStageAdvance('Registration Closed')}
                  isLoading={transitionStatus.isPending}
                >
                  Close Registrations
                </Button>
              )}
              {tournament.tournament_status === 'Registration Closed' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStageAdvance('Group Stage')}
                  isLoading={transitionStatus.isPending}
                >
                  Start Group Stage
                </Button>
              )}
              {tournament.tournament_status === 'Group Stage' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStageAdvance('Knockout Stage')}
                  isLoading={transitionStatus.isPending}
                >
                  Advance to Knockouts
                </Button>
              )}
              {tournament.tournament_status === 'Knockout Stage' && (
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => handleStageAdvance('Completed')}
                  isLoading={transitionStatus.isPending}
                >
                  Conclude Tournament
                </Button>
              )}
            </div>
          </RoleGate>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ktms-border">
        <button
          onClick={() => setActiveTab('matchdays')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'matchdays'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Calendar size={14} /> Matchdays ({matchdays.length})
        </button>
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'fixtures'
              ? 'border-ktms-cyan text-ktms-cyan'
              : 'border-transparent text-ktms-muted hover:text-white'
          }`}
        >
          <Swords size={14} /> Fixtures Directory ({fixtures.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'matchdays' && (
        <div className="space-y-3">
          {isMatchdaysLoading ? (
            <div className="p-8 text-center text-xs text-ktms-muted">Loading matchdays...</div>
          ) : matchdays.length === 0 ? (
            <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
              No matchday rounds generated yet. Matchdays will populate when registrations close.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchdays.map((m: MatchdaySummary) => (
                <div
                  key={m.matchday_id}
                  className="flex items-center justify-between p-4 rounded-xl border border-ktms-border bg-ktms-panel"
                >
                  <div>
                    <span className="font-mono text-[10px] text-ktms-muted uppercase">
                      Round #{m.round_number} • {m.stage_name}
                    </span>
                    <h4 className="text-sm font-bold text-ktms-text">{m.matchday_id}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge
                        label={m.matchday_status}
                        variant={m.matchday_status === 'Active' ? 'active' : m.matchday_status === 'Completed' ? 'success' : 'neutral'}
                      />
                    </div>
                  </div>

                  <RoleGate allowedRoles={['game_master', 'platform_manager', 'moderator']}>
                    <Button
                      size="sm"
                      variant={m.matchday_status === 'Active' ? 'secondary' : 'primary'}
                      onClick={() => handleMatchdayToggle(m)}
                      isLoading={transitionMatchday.isPending}
                    >
                      {m.matchday_status === 'Active' ? 'Complete Round' : 'Activate Round'}
                    </Button>
                  </RoleGate>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'fixtures' && (
        <DataTable
          columns={fixtureColumns}
          data={fixtures}
          keyExtractor={(f) => f.fixture_id}
          isLoading={isFixturesLoading}
          emptyMessage="No fixtures generated for this tournament."
        />
      )}
    </div>
  );
};
