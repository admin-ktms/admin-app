import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAdminOperationsFeed';
import { AuditLogItem } from '@/api/governance';
import { DataTable, Column } from '@/components/ui/DataTable';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Button } from '@/components/ui/Button';

export const AuditExplorerDesk: React.FC = () => {
  const limit = 100;
  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs(limit);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((l) => {
    return (
      l.audit_log_id.toLowerCase().includes(search.toLowerCase()) ||
      l.action_source.toLowerCase().includes(search.toLowerCase()) ||
      l.action_summary.toLowerCase().includes(search.toLowerCase()) ||
      l.performed_by_id?.toLowerCase().includes(search.toLowerCase()) ||
      l.related_entity?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'time',
      header: 'Timestamp',
      render: (l) => (
        <span className="font-mono text-[11px] text-ktms-muted">
          {new Date(l.action_time).toLocaleDateString()}{' '}
          {new Date(l.action_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      ),
      width: '160px',
    },
    {
      key: 'source',
      header: 'Operation / Action Source',
      render: (l) => (
        <div>
          <span className="font-mono text-xs font-semibold text-ktms-cyan block">
            {l.action_source}
          </span>
          <span className="text-[11px] text-ktms-text/90 line-clamp-1 max-w-[340px]">
            {l.action_summary}
          </span>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (l) => (
        <span className="font-mono text-xs text-ktms-muted">
          {l.related_entity ? `${l.related_entity} (${l.related_record_id || '-'})` : 'Platform'}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'actor',
      header: 'Performed By',
      render: (l) => (
        <span className="font-mono text-xs text-ktms-text">
          {l.performed_by_id || l.performed_by_type}
        </span>
      ),
      width: '130px',
    },
    {
      key: 'inspect',
      header: '',
      render: (l) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(l);
          }}
        >
          Inspect Diff
        </Button>
      ),
      width: '110px',
    },
  ];

  return (
    <div className="space-y-4">
      <DrawerModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Telemetry Diff"
        description={`Log ID: ${selectedLog?.audit_log_id} • Source: ${selectedLog?.action_source}`}
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 rounded bg-ktms-surface/50 border border-ktms-border space-y-1">
            <div>
              <span className="text-ktms-muted">Summary:</span>{' '}
              <span className="text-ktms-text font-bold">{selectedLog?.action_summary}</span>
            </div>
            <div>
              <span className="text-ktms-muted">Actor ID:</span>{' '}
              <span className="text-ktms-cyan">{selectedLog?.performed_by_id}</span>
            </div>
            {selectedLog?.reason && (
              <div>
                <span className="text-ktms-muted">Audited Reason:</span>{' '}
                <span className="text-ktms-gold">{selectedLog?.reason}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ktms-muted block mb-1">
                Previous Value:
              </span>
              <pre className="p-3 rounded bg-black/60 border border-ktms-border text-ktms-coral/90 overflow-x-auto max-h-60 text-[11px]">
                {selectedLog?.previous_value
                  ? JSON.stringify(selectedLog.previous_value, null, 2)
                  : '// null'}
              </pre>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ktms-muted block mb-1">
                New Value:
              </span>
              <pre className="p-3 rounded bg-black/60 border border-ktms-border text-ktms-green/90 overflow-x-auto max-h-60 text-[11px]">
                {selectedLog?.new_value
                  ? JSON.stringify(selectedLog.new_value, null, 2)
                  : '// null'}
              </pre>
            </div>
          </div>
        </div>
      </DrawerModal>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            isLoading={isFetching}
            icon={<RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />}
          >
            Refresh Feed
          </Button>
          <span className="text-xs text-ktms-muted font-mono">
            Tracking latest {logs.length} events
          </span>
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, or entity..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.audit_log_id}
        isLoading={isLoading}
        onRowClick={(l) => setSelectedLog(l)}
        emptyMessage="No audit logs recorded in telemetry."
      />
    </div>
  );
};
