import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, UserX, AlertCircle, Clock, ArrowUpRight, Search } from 'lucide-react';
import { usePendingDisputes, usePendingNoShows } from '@/hooks/useDisputes';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';

interface UnifiedCaseItem {
  key: string;
  id: string;
  type: 'dispute' | 'noshow';
  typeLabel: 'Result Dispute' | 'No-show';
  tournamentId: string;
  matchCode: string;
  roundName: string;
  createdDatetime: string;
  details: string;
}

export const DisputeQueueDesk: React.FC = () => {
  const navigate = useNavigate();
  const { data: disputes = [], isLoading: isDisputesLoading } = usePendingDisputes();
  const { data: noShows = [], isLoading: isNoShowsLoading } = usePendingNoShows();

  const [filter, setFilter] = useState<'ALL' | 'DISPUTES' | 'NOSHOWS'>('ALL');
  const [search, setSearch] = useState('');

  const isLoading = isDisputesLoading || isNoShowsLoading;

  // Unify disputes and no-shows into a single actionable queue
  const unifiedCases: UnifiedCaseItem[] = [
    ...disputes.map((d) => ({
      key: `dispute-${d.dispute_id}`,
      id: d.dispute_id,
      type: 'dispute' as const,
      typeLabel: 'Result Dispute' as const,
      tournamentId: d.tournament_id,
      matchCode: d.match_code,
      roundName: d.round_name,
      createdDatetime: d.created_datetime,
      details: `Disputed scores: [${d.original_submission?.submitted_score || '?'}] vs [${d.counter_submission?.submitted_score || '?'}]`,
    })),
    ...noShows.map((n) => ({
      key: `noshow-${n.no_show_report_id}`,
      id: n.no_show_report_id,
      type: 'noshow' as const,
      typeLabel: 'No-show' as const,
      tournamentId: n.tournament_id,
      matchCode: n.match_code,
      roundName: n.round_name,
      createdDatetime: n.created_datetime,
      details: `Reported by ${n.reporting_registration_id} (Reason: ${n.report_reason || 'Absent'})`,
    })),
  ].sort((a, b) => new Date(b.createdDatetime).getTime() - new Date(a.createdDatetime).getTime());

  const filteredCases = unifiedCases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.matchCode.toLowerCase().includes(search.toLowerCase()) ||
      c.tournamentId.toLowerCase().includes(search.toLowerCase());

    if (filter === 'DISPUTES') return matchesSearch && c.type === 'dispute';
    if (filter === 'NOSHOWS') return matchesSearch && c.type === 'noshow';
    return matchesSearch;
  });

  const columns: Column<UnifiedCaseItem>[] = [
    {
      key: 'type',
      header: 'Case Type',
      render: (c) => (
        <StatusBadge
          label={c.typeLabel}
          variant={c.type === 'dispute' ? 'danger' : 'warning'}
          pulse
        />
      ),
      width: '140px',
    },
    {
      key: 'match',
      header: 'Match / Round',
      render: (c) => (
        <div>
          <span className="font-mono font-bold text-ktms-cyan">{c.matchCode}</span>
          <span className="text-[11px] text-ktms-muted block">{c.roundName}</span>
        </div>
      ),
    },
    {
      key: 'tournamentId',
      header: 'Tournament',
      render: (c) => <span className="font-mono text-xs">{c.tournamentId}</span>,
    },
    {
      key: 'details',
      header: 'Context Summary',
      render: (c) => <span className="text-xs text-ktms-text/90">{c.details}</span>,
    },
    {
      key: 'createdDatetime',
      header: 'Received At',
      render: (c) => (
        <span className="font-mono text-[11px] text-ktms-muted">
          {new Date(c.createdDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (c) => (
        <span className="text-xs font-semibold text-ktms-cyan flex items-center gap-0.5 justify-end">
          Review <ArrowUpRight size={14} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
          <Swords className="h-5 w-5 text-ktms-coral" />
          Adjudication & Dispute Desk
        </h1>
        <p className="text-xs text-ktms-muted mt-0.5">
          Arbitration queue for contested match scores and walkover validation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              filter === 'ALL'
                ? 'bg-ktms-cyan/10 text-ktms-cyan border border-ktms-cyan/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            All Active ({unifiedCases.length})
          </button>
          <button
            onClick={() => setFilter('DISPUTES')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              filter === 'DISPUTES'
                ? 'bg-ktms-coral/10 text-ktms-coral border border-ktms-coral/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            Score Conflicts ({disputes.length})
          </button>
          <button
            onClick={() => setFilter('NOSHOWS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              filter === 'NOSHOWS'
                ? 'bg-ktms-gold/10 text-ktms-gold border border-ktms-gold/30'
                : 'text-ktms-muted hover:text-ktms-text hover:bg-ktms-surface'
            }`}
          >
            No-Show Claims ({noShows.length})
          </button>
        </div>

        <div className="relative flex items-center min-w-[220px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search match, case, or tournament..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredCases}
          keyExtractor={(c) => c.key}
          isLoading={isLoading}
          onRowClick={(c) => navigate(`/disputes/${c.type}/${c.id}`)}
          emptyMessage="No pending disputes or no-show claims requiring review."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading arbitration queue...
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No active arbitration cases.
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.key}
              onClick={() => navigate(`/disputes/${c.type}/${c.id}`)}
              className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel active:bg-ktms-surface transition cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between">
                <StatusBadge
                  label={c.typeLabel}
                  variant={c.type === 'dispute' ? 'danger' : 'warning'}
                />
                <span className="font-mono text-[10px] text-ktms-muted flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(c.createdDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <span className="font-mono text-sm font-bold text-ktms-cyan block">
                  {c.matchCode} • {c.roundName}
                </span>
                <span className="font-mono text-[11px] text-ktms-muted">{c.tournamentId}</span>
              </div>

              <p className="text-xs text-ktms-text/90 line-clamp-2">{c.details}</p>

              <div className="pt-2 border-t border-ktms-border/60 flex justify-end items-center gap-1 text-xs font-semibold text-ktms-cyan">
                <span>Inspect Evidence</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
