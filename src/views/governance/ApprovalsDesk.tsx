import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAdministrativeApprovals, useApprovalMutations } from '@/hooks/useApprovals';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdministrativeApprovalItem } from '@/api/governance';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Textarea } from '@/components/ui/Textarea';

export const ApprovalsDesk: React.FC = () => {
  const { user } = useAdminAuth();
  const { data: approvals = [], isLoading } = useAdministrativeApprovals();
  const { grantApproval, rejectApproval } = useApprovalMutations();

  const [search, setSearch] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<AdministrativeApprovalItem | null>(null);
  const [decision, setDecision] = useState<'grant' | 'reject'>('grant');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const getStatusVariant = (status: string): StatusVariant => {
    switch (status) {
      case 'Approved':
      case 'Consumed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
      case 'Expired':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    return (
      a.approval_id.toLowerCase().includes(search.toLowerCase()) ||
      a.permission_code.toLowerCase().includes(search.toLowerCase()) ||
      a.requested_by_admin_id.toLowerCase().includes(search.toLowerCase()) ||
      a.resource_entity.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenAdjudication = (
    approval: AdministrativeApprovalItem,
    action: 'grant' | 'reject'
  ) => {
    setSelectedApproval(approval);
    setDecision(action);
    setNotes('');
    setFormError(null);
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    if (!notes.trim()) {
      setFormError('Mandatory justification notes are required for compliance logging.');
      return;
    }

    try {
      setFormError(null);
      if (decision === 'grant') {
        await grantApproval.mutateAsync({
          approval_id: selectedApproval.approval_id,
          approval_notes: notes.trim(),
        });
      } else {
        await rejectApproval.mutateAsync({
          approval_id: selectedApproval.approval_id,
          rejection_reason: notes.trim(),
        });
      }
      setSelectedApproval(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Decision execution failed.');
    }
  };

  const columns: Column<AdministrativeApprovalItem>[] = [
    {
      key: 'approval_id',
      header: 'Approval ID',
      render: (a) => (
        <span className="font-mono font-bold text-ktms-cyan">{a.approval_id}</span>
      ),
      width: '130px',
    },
    {
      key: 'permission',
      header: 'Requested Authority',
      render: (a) => (
        <div>
          <span className="font-mono text-xs font-semibold text-ktms-text block">
            {a.permission_code}
          </span>
          <span className="text-[10px] font-mono text-ktms-muted">
            Target: {a.resource_entity} ({a.resource_id})
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Maker Reason',
      render: (a) => (
        <span className="text-xs text-ktms-text/90 line-clamp-1 max-w-[260px]">
          {a.request_reason}
        </span>
      ),
    },
    {
      key: 'requester',
      header: 'Requested By',
      render: (a) => (
        <span className="font-mono text-xs text-ktms-muted">{a.requested_by_admin_id}</span>
      ),
      width: '130px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <StatusBadge label={a.approval_status} variant={getStatusVariant(a.approval_status)} />
      ),
      width: '110px',
    },
    {
      key: 'actions',
      header: 'Checker Ruling',
      render: (a) => {
        if (a.approval_status !== 'Pending') {
          return (
            <span className="text-[11px] font-mono text-ktms-muted">
              {a.approved_by_admin_id ? `By: ${a.approved_by_admin_id}` : 'Resolved'}
            </span>
          );
        }

        // Anti-Self-Approval Guard: Requester cannot approve their own request
        const isSelf = user?.admin_id === a.requested_by_admin_id;

        if (isSelf) {
          return (
            <span className="text-[11px] text-ktms-coral font-mono flex items-center gap-1">
              <ShieldAlert size={12} /> Self-Requested (Dual Control)
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenAdjudication(a, 'grant')}
              icon={<CheckCircle2 size={13} />}
            >
              Grant
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleOpenAdjudication(a, 'reject')}
              icon={<XCircle size={13} />}
            >
              Reject
            </Button>
          </div>
        );
      },
      width: '190px',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2">
          <StatusBadge
            label={`${approvals.filter((a) => a.approval_status === 'Pending').length} Pending Approvals`}
            variant="warning"
            pulse
          />
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approval, permission, or admin..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <DataTable
        columns={columns}
        data={filteredApprovals}
        keyExtractor={(a) => a.approval_id}
        isLoading={isLoading}
        emptyMessage="No pending administrative approval requests."
      />

      {/* Adjudication Modal */}
      <DrawerModal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={decision === 'grant' ? 'Grant Maker-Checker Authorization' : 'Reject Authorization Request'}
        description={`Approval #${selectedApproval?.approval_id} • Permission: ${selectedApproval?.permission_code}`}
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          {formError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded bg-ktms-surface/50 border border-ktms-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ktms-muted">Requested Authority:</span>
              <span className="font-mono font-bold text-ktms-cyan">
                {selectedApproval?.permission_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Maker (Requester):</span>
              <span className="font-mono text-ktms-text">
                {selectedApproval?.requested_by_admin_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Target Entity:</span>
              <span className="font-mono text-ktms-text">
                {selectedApproval?.resource_entity} ({selectedApproval?.resource_id})
              </span>
            </div>
            <div className="pt-1">
              <span className="text-ktms-muted block mb-0.5">Maker Justification:</span>
              <span className="italic text-ktms-text/90">"{selectedApproval?.request_reason}"</span>
            </div>
          </div>

          <Textarea
            id="approval_notes"
            label={decision === 'grant' ? 'Checker Approval Notes' : 'Mandatory Rejection Reason'}
            placeholder="Document verification checks, policy compliance, and audit rationale..."
            rows={3}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedApproval(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decision === 'grant' ? 'primary' : 'danger'}
              size="sm"
              isLoading={grantApproval.isPending || rejectApproval.isPending}
            >
              {decision === 'grant' ? 'Authorize Action' : 'Reject Request'}
            </Button>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};
