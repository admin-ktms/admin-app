import React from 'react';
import { Database, Archive, Clock } from 'lucide-react';
import { useArchiveBatches } from '@/hooks/useAdminOperationsFeed';
import { ArchiveBatchItem } from '@/api/governance';
import { DataTable, Column } from '@/components/ui/DataTable';

export const ArchiveExplorerDesk: React.FC = () => {
  const { data: batches = [], isLoading } = useArchiveBatches();

  const columns: Column<ArchiveBatchItem>[] = [
    {
      key: 'batch_id',
      header: 'Batch ID',
      render: (b) => (
        <span className="font-mono font-bold text-ktms-cyan">#{b.archive_batch_id}</span>
      ),
      width: '110px',
    },
    {
      key: 'tournament',
      header: 'Archived Tournament',
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-ktms-text">
          {b.tournament_id}
        </span>
      ),
    },
    {
      key: 'archivist',
      header: 'Executed By',
      render: (b) => (
        <span className="font-mono text-xs text-ktms-muted">{b.archived_by_admin_id}</span>
      ),
      width: '140px',
    },
    {
      key: 'time',
      header: 'Archival Datetime',
      render: (b) => (
        <span className="font-mono text-[11px] text-ktms-muted">
          {new Date(b.archived_datetime).toLocaleString()}
        </span>
      ),
      width: '180px',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-ktms-border bg-ktms-panel space-y-1">
        <h3 className="text-sm font-bold text-ktms-text flex items-center gap-2">
          <Database size={16} className="text-ktms-cyan" />
          Cold-Storage Competition Batches
        </h3>
        <p className="text-xs text-ktms-muted leading-relaxed">
          Completed tournament editions migrated to cold-storage in the <code className="text-ktms-cyan">archive.*</code> database schema.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        keyExtractor={(b) => b.archive_batch_id.toString()}
        isLoading={isLoading}
        emptyMessage="No completed tournaments have been migrated to cold storage."
      />
    </div>
  );
};
