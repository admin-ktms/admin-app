import React, { useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Search,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { usePendingBankTransfers, useFinanceMutations } from '@/hooks/useFinance';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PendingBankTransferItem } from '@/api/finance';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Textarea } from '@/components/ui/Textarea';
import { ImageViewer } from '@/components/layout/ImageViewer';

export const BankTransferDesk: React.FC = () => {
  const { user } = useAdminAuth();
  const { data: transfers = [], isLoading } = usePendingBankTransfers();
  const { verifyBankTransfer } = useFinanceMutations();

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingBankTransferItem | null>(null);
  const [activeImage, setActiveImage] = useState<{ src: string; title: string } | null>(null);

  // Review Drawer state
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTransfers = transfers.filter((t) => {
    return (
      t.registration_reference_id.toLowerCase().includes(search.toLowerCase()) ||
      t.player_id.toLowerCase().includes(search.toLowerCase()) ||
      t.tournament_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenReview = (item: PendingBankTransferItem, action: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(action);
    setRejectionReason('');
    setFormError(null);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (actionType === 'reject' && !rejectionReason.trim()) {
      setFormError('A formal rejection reason is required for audited financial rejection.');
      return;
    }

    try {
      setFormError(null);
      await verifyBankTransfer.mutateAsync({
        registration_reference_id: selectedItem.registration_reference_id,
        decision: actionType,
        rejection_reason: actionType === 'reject' ? rejectionReason.trim() : undefined,
      });

      setSelectedItem(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Transaction adjudication failed.');
    }
  };

  const columns: Column<PendingBankTransferItem>[] = [
    {
      key: 'ref',
      header: 'Reference ID',
      render: (t) => (
        <span className="font-mono font-bold text-ktms-cyan">{t.registration_reference_id}</span>
      ),
    },
    {
      key: 'player',
      header: 'Player ID',
      render: (t) => <span className="font-mono text-xs">{t.player_id}</span>,
    },
    {
      key: 'tournament',
      header: 'Tournament',
      render: (t) => (
        <div>
          <span className="text-xs font-semibold text-ktms-text">{t.tournament_name}</span>
          <span className="text-[10px] font-mono text-ktms-muted block">{t.tournament_id}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <span className="font-mono text-xs font-bold text-ktms-green">
          {t.currency} {t.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'proof',
      header: 'Payment Slip',
      render: (t) =>
        t.payment_proof_url ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveImage({
                src: t.payment_proof_url!,
                title: `Proof Slip - Ref #${t.registration_reference_id}`,
              });
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-ktms-surface hover:bg-ktms-border text-xs text-ktms-cyan transition border border-ktms-border"
          >
            <Eye size={13} /> View Slip
          </button>
        ) : (
          <span className="text-[11px] font-mono text-ktms-muted">Missing Proof</span>
        ),
    },
    {
      key: 'created',
      header: 'Submitted At',
      render: (t) => (
        <span className="font-mono text-[11px] text-ktms-muted">
          {new Date(t.created_datetime).toLocaleDateString()}{' '}
          {new Date(t.created_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => {
        const isSelf = user?.auth_user_id === t.player_id;

        if (isSelf) {
          return (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-ktms-coral font-mono"
              title="Separation of Duties: Admin cannot verify own payment"
            >
              <ShieldAlert size={13} /> Self-Payment
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleOpenReview(t, 'approve')}
              className="p-1.5 rounded bg-ktms-green/10 text-ktms-green hover:bg-ktms-green/20 border border-ktms-green/30 transition"
              title="Approve Bank Transfer"
            >
              <CheckCircle2 size={15} />
            </button>
            <button
              onClick={() => handleOpenReview(t, 'reject')}
              className="p-1.5 rounded bg-ktms-coral/10 text-ktms-coral hover:bg-ktms-coral/20 border border-ktms-coral/30 transition"
              title="Reject Bank Transfer"
            >
              <XCircle size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Lightbox Modal */}
      <ImageViewer
        isOpen={!!activeImage}
        src={activeImage?.src || null}
        title={activeImage?.title}
        onClose={() => setActiveImage(null)}
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2">
          <StatusBadge label={`${transfers.length} Pending Transfers`} variant="warning" pulse />
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, player, or tournament..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredTransfers}
          keyExtractor={(t) => t.transaction_history_id}
          isLoading={isLoading}
          emptyMessage="No pending manual bank transfers awaiting verification."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading bank transfer queue...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No pending bank transfer submissions.
          </div>
        ) : (
          filteredTransfers.map((t) => {
            const isSelf = user?.auth_user_id === t.player_id;

            return (
              <div
                key={t.transaction_history_id}
                className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-ktms-cyan">
                    {t.registration_reference_id}
                  </span>
                  <span className="font-mono text-xs font-bold text-ktms-green">
                    {t.currency} {t.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col text-xs text-ktms-muted">
                  <span className="text-ktms-text font-semibold">{t.tournament_name}</span>
                  <span className="font-mono text-[10px]">Player: {t.player_id}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-ktms-border/60">
                  {t.payment_proof_url ? (
                    <button
                      onClick={() =>
                        setActiveImage({
                          src: t.payment_proof_url!,
                          title: `Proof Slip - Ref #${t.registration_reference_id}`,
                        })
                      }
                      className="flex items-center gap-1 text-xs text-ktms-cyan font-semibold"
                    >
                      <Eye size={13} /> View Slip
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-ktms-muted">No slip attached</span>
                  )}

                  {isSelf ? (
                    <span className="text-[11px] text-ktms-coral font-mono flex items-center gap-1">
                      <ShieldAlert size={12} /> Self-Payment
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenReview(t, 'reject')}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenReview(t, 'approve')}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjudication Drawer Modal */}
      <DrawerModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={actionType === 'approve' ? 'Confirm Payment Approval' : 'Reject Bank Transfer Payment'}
        description={`Transaction reference #${selectedItem?.registration_reference_id}`}
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          {formError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded bg-ktms-surface/50 border border-ktms-border space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ktms-muted">Amount:</span>
              <span className="font-mono font-bold text-ktms-green">
                {selectedItem?.currency} {selectedItem?.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Tournament:</span>
              <span className="text-ktms-text">{selectedItem?.tournament_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Player ID:</span>
              <span className="font-mono text-ktms-text">{selectedItem?.player_id}</span>
            </div>
          </div>

          {actionType === 'reject' && (
            <Textarea
              id="rejection_reason"
              label="Mandatory Rejection Justification (Audited)"
              placeholder="e.g. Unreadable receipt image, transaction amount mismatch, or illegible narration..."
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          )}

          {actionType === 'approve' && (
            <p className="text-xs text-ktms-muted leading-relaxed">
              Approving this bank transfer will officially provision the player's tournament slot in{' '}
              <code className="text-ktms-cyan">kt.kt_registrations</code>, lock the registration fee
              in <code className="text-ktms-cyan">finance.transaction_history</code>, and emit outbox
              events.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionType === 'approve' ? 'primary' : 'danger'}
              size="sm"
              isLoading={verifyBankTransfer.isPending}
            >
              {actionType === 'approve' ? 'Approve & Confirm Entry' : 'Reject Transfer'}
            </Button>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};
