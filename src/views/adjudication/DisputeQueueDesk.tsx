import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Search, Clock, ArrowUpRight } from 'lucide-react';
import { useDisputeCases, useNoShowCases } from '@/hooks/useDisputes';
import { DisputeCaseItem, NoShowCaseItem } from '@/api/adjudication';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const DisputeQueueDesk: React.FC = () => {
  const navigate = useNavigate();
  const { data: disputes = [], isLoading: isDisputesLoading } = useDisputeCases();
  const { data: noShows = [], isLoading: isNoShowsLoading } = useNoShowCases();

  const [activeQueue, setActiveQueue] = useState<'disputes' | 'noshows'>('disputes');
  const [search, setSearch] = useState('');

  const filteredDisputes = disputes.filter((d) => {
    return (
      d.dispute_id.toLowerCase().includes(search.toLowerCase()) ||
      d.match_code.toLowerCase().includes(search.toLowerCase()) ||
      d.tournament_name.toLowerCase().includes(search.toLowerCase()) ||
      d.player1_id.toLowerCase().includes(search.toLowerCase()) ||
      d.player2_id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredNoShows = noShows.filter((n) => {
    return (
      n.no_show_claim_id.toLowerCase().includes(search.toLowerCase()) ||
      n.match_code.toLowerCase().includes(search.toLowerCase()) ||
      n.tournament_name.toLowerCase().includes(search.toLowerCase()) ||
      n.reporting_player_id.toLowerCase().includes(search.toLowerCase()) ||
      n.reported_player_id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const disputeColumns: Column<DisputeCaseItem>[] = [
    {
      key: 'dispute_id',
      header: 'Dispute ID',
      render: (d) => <span className="font-mono font-bold text-ktms-cyan">{d.dispute_id}</span>,
      width: '120px',
    },
    {
      key: 'match',
      header: 'Match & Tournament',
      render: (d) => (
        <div>
          <span className="font-mono font-semibold text-xs text-ktms-text block">{d.match_code}</span>
          <span className="text-[11px] text-ktms-muted truncate max-w-[200px] block">
            {d.tournament_name}
          </span>
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Contesting Players',
      render: (d) => (
        <div className="font-mono text-xs text-ktms-text">
          <span>{d.player1_username || d.player1_id}</span>
          <span className="text-ktms-muted mx-1">vs</span>
          <span>{d.player2_username || d.player2_id}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge label={d.status} variant="warning" />,
      width: '120px',
    },
    {
      key: 'time',
      header: 'Elapsed',
      render: (d) => (
        <span className="font-mono text-[11px] text-ktms-muted flex items-center gap-1">
          <Clock size={12} />
          {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
      width: '110px',
    },
    {
      key: 'action',
      header: '',
      render: (d) => (
        <span className="text-xs font-semibold text-ktms-cyan flex items-center gap-0.5 justify-end">
          Review <ArrowUpRight size={13} />
        </span>
      ),
      width: '90px',
    },
  ];

  const noShowColumns: Column<NoShowCaseItem>[] = [
    {
      key: 'claim_id',
      header: 'Claim ID',
      render: (n) => <span className="font-mono font-bold text-ktms-cyan">{n.no_show_claim_id}</span>,
      width: '120px',
    },
    {
      key: 'match',
      header: 'Match & Tournament',
      render: (n) => (
        <div>
          <span className="font-mono font-semibold text-xs text-ktms-text block">{n.match_code}</span>
          <span className="text-[11px] text-ktms-muted truncate max-w-[200px] block">
            {n.tournament_name}
          </span>
        </div>
      ),
    },
    {
      key: 'reporting',
      header: 'Reporting Player',
      render: (n) => (
        <span className="font-mono text-xs text-ktms-text">
          {n.reporting_player_username || n.reporting_player_id}
        </span>
      ),
    },
    {
      key: 'reported',
      header: 'Accused No-Show',
      render: (n) => (
        <span className="font-mono text-xs text-ktms-coral">
          {n.reported_player_username || n.reported_player_id}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (n) => <StatusBadge label={n.status} variant="warning" />,
      width: '120px',
    },
    {
      key: 'action',
      header: '',
      render: (n) => (
        <span className="text-xs font-semibold text-ktms-cyan flex items-center gap-0.5 justify-end">
          Adjudicate <ArrowUpRight size={13} />
        </span>
      ),
      width: '100px',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
          <Swords className="h-5 w-5 text-ktms-coral" />
          Adjudication & Dispute Resolution Queue
        </h1>
        <p className="text-xs text-ktms-muted mt-0.5">
          Dual-control match outcome conflicts, score mismatches, and no-show claims.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveQueue('disputes')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              activeQueue === 'disputes'
                ? 'bg-ktms-coral/10 text-ktms-coral border border-ktms-coral/30'
                : 'text-ktms-muted hover:text-ktms-text'
            }`}
          >
            Disputes ({disputes.length})
          </button>
          <button
            onClick={() => setActiveQueue('noshows')}
            className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
              activeQueue === 'noshows'
                ? 'bg-ktms-coral/10 text-ktms-coral border border-ktms-coral/30'
                : 'text-ktms-muted hover:text-ktms-text'
            }`}
          >
            No-Shows ({noShows.length})
          </button>
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claim, match, or player..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {activeQueue === 'disputes' ? (
        <DataTable
          columns={disputeColumns}
          data={filteredDisputes}
          keyExtractor={(d) => d.dispute_id}
          isLoading={isDisputesLoading}
          onRowClick={(d) => navigate(`/disputes/dispute/${d.dispute_id}`)}
          emptyMessage="No pending match result disputes in queue."
        />
      ) : (
        <DataTable
          columns={noShowColumns}
          data={filteredNoShows}
          keyExtractor={(n) => n.no_show_claim_id}
          isLoading={isNoShowsLoading}
          onRowClick={(n) => navigate(`/disputes/noshow/${n.no_show_claim_id}`)}
          emptyMessage="No pending no-show allegations in queue."
        />
      )}
    </div>
  );
};
