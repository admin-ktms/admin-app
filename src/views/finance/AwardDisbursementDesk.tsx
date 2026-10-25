import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, AlertCircle, ShieldAlert, DollarSign } from 'lucide-react';
import { usePendingAwards, useFinanceMutations } from '@/hooks/useFinance';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PendingAwardItem } from '@/api/finance';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Textarea } from '@/components/ui/Textarea';

export const AwardDisbursementDesk: React.FC = () => {
  const { user } = useAdminAuth();
  const { data: awards = [], isLoading } = usePendingAwards();
  const { adjudicateAward } = useFinanceMutations();

  const [selectedAward, setSelectedAward] = useState<PendingAwardItem | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Disapproved'>('Approved');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAdjudication = (award: PendingAwardItem, nextDecision: 'Approved' | 'Disapproved') => {
    setSelectedAward(award);
    setDecision(nextDecision);
    setNotes('');
    setFormError(null);
  };

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAward) return;

    if (!notes.trim()) {
      setFormError('Adjudication notes are required for immutable financial logging.');
      return;
    }

    try {
      setFormError(null);
      await adjudicateAward.mutateAsync({
        award_id: selectedAward.award_id,
        decision,
        notes: notes.trim(),
      });

      setSelectedAward(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Award disbursement failed.');
    }
  };

  const columns: Column<PendingAwardItem>[] = [
    {
      key: 'reward',
      header: 'Prize / Distinction',
      render: (a) => (
        <div>
          <span className="font-bold text-sm text-ktms-text flex items-center gap-1.5">
            <Award size={15} className="text-ktms-gold" />
            {a.reward_name}
          </span>
          <span className="font-mono text-[10px] text-ktms-muted">ID: {a.award_id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Category',
      render: (a) => (
        <StatusBadge
          label={a.reward_type}
          variant={a.reward_type === 'Cash' ? 'gold' : 'active'}
        />
      ),
    },
    {
      key: 'value',
      header: 'Prize Value',
      render: (a) => (
        <span className="font-mono text-xs font-bold text-ktms-gold">
          {a.reward_type === 'Cash'
            ? `₦${Number(a.reward_value).toLocaleString()}`
            : a.reward_value}
        </span>
      ),
    },
    {
      key: 'tournament',
      header: 'Tournament',
      render: (a) => (
        <div>
          <span className="text-xs font-semibold text-ktms-text">{a.tournament_name}</span>
          <span className="text-[10px] font-mono text-ktms-muted block">{a.tournament_id}</span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient Registration',
      render: (a) => <span className="font-mono text-xs">{a.registration_id}</span>,
    },
    {
      key: 'actions',
      header: 'Disbursement Ruling',
      render: (a) => {
        const isSelf = user?.auth_user_id === a.player_id;

        if (isSelf) {
          return (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-ktms-coral font-mono"
              title="Separation of Duties: Admin cannot approve own payout"
            >
              <ShieldAlert size={13} /> Self-Award
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="gold"
              onClick={() => handleOpenAdjudication(a, 'Approved')}
            >
              Approve Payout
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleOpenAdjudication(a, 'Disapproved')}
            >
              Decline
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="flex items-center justify-between bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2">
          <StatusBadge label={`${awards.length} Pending Podium Payouts`} variant="gold" pulse />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={awards}
          keyExtractor={(a) => a.award_id}
          isLoading={isLoading}
          emptyMessage="No pending podium award disbursements requiring approval."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading podium awards...
          </div>
        ) : awards.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No podium awards pending settlement.
          </div>
        ) : (
          awards.map((a) => {
            const isSelf = user?.auth_user_id === a.player_id;

            return (
              <div
                key={a.award_id}
                className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ktms-text flex items-center gap-1.5">
                    <Award size={15} className="text-ktms-gold" />
                    {a.reward_name}
                  </span>
                  <StatusBadge
                    label={a.reward_type}
                    variant={a.reward_type === 'Cash' ? 'gold' : 'active'}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-ktms-muted font-mono">Reg: {a.registration_id}</span>
                  <span className="font-mono font-bold text-ktms-gold">
                    {a.reward_type === 'Cash'
                      ? `₦${Number(a.reward_value).toLocaleString()}`
                      : a.reward_value}
                  </span>
                </div>

                <div className="pt-2 border-t border-ktms-border/60 flex items-center justify-between">
                  <span className="text-[10px] text-ktms-muted">{a.tournament_name}</span>

                  {isSelf ? (
                    <span className="text-[11px] text-ktms-coral font-mono flex items-center gap-1">
                      <ShieldAlert size={12} /> Self-Award
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenAdjudication(a, 'Disapproved')}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleOpenAdjudication(a, 'Approved')}
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

      {/* Adjudication Modal */}
      <DrawerModal
        isOpen={!!selectedAward}
        onClose={() => setSelectedAward(null)}
        title={decision === 'Approved' ? 'Authorize Prize Disbursement' : 'Decline Award Payout'}
        description={`Award #${selectedAward?.award_id} • ${selectedAward?.reward_name}`}
      >
        <form onSubmit={handleConfirmDisbursement} className="space-y-4">
          {formError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded bg-ktms-surface/50 border border-ktms-border space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ktms-muted">Award Distinction:</span>
              <span className="font-bold text-ktms-text">{selectedAward?.reward_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Prize Value:</span>
              <span className="font-mono font-bold text-ktms-gold">
                {selectedAward?.reward_type === 'Cash'
                  ? `₦${Number(selectedAward?.reward_value).toLocaleString()}`
                  : selectedAward?.reward_value}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Tournament:</span>
              <span className="text-ktms-text">{selectedAward?.tournament_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Recipient Registration:</span>
              <span className="font-mono text-ktms-text">{selectedAward?.registration_id}</span>
            </div>
          </div>

          <Textarea
            id="adjudication_notes"
            label="Mandatory Payout Notes (Audited)"
            placeholder="Document payment provider transaction reference, qualification confirmation, or reason for decline..."
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
              onClick={() => setSelectedAward(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decision === 'Approved' ? 'gold' : 'danger'}
              size="sm"
              isLoading={adjudicateAward.isPending}
            >
              {decision === 'Approved' ? 'Confirm Disbursement' : 'Decline Award'}
            </Button>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};
