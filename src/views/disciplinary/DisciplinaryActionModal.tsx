import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, UserX, Ban, CheckCircle, RotateCcw } from 'lucide-react';
import { PlayerDirectoryItem } from '@/api/disciplinary';
import { useDisciplinaryMutations } from '@/hooks/useDisciplinary';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useStepUpAuth } from '@/hooks/useStepUpAuth';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { StepUpAuthModal } from '@/components/feedback/StepUpAuthModal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RoleGate } from '@/routes/RoleGate';

interface DisciplinaryActionModalProps {
  isOpen: boolean;
  player: PlayerDirectoryItem | null;
  onClose: () => void;
}

type ActionCategory = 'disqualify' | 'suspend' | 'ban' | 'reinstate';

export const DisciplinaryActionModal: React.FC<DisciplinaryActionModalProps> = ({
  isOpen,
  player,
  onClose,
}) => {
  const { isGameMaster } = useAdminAuth();
  const { disqualifyPlayer, suspendPlayer, banPlayer, reinstatePlayer } = useDisciplinaryMutations();
  const stepUp = useStepUpAuth();

  const [category, setCategory] = useState<ActionCategory>('disqualify');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('');
  const [duration, setDuration] = useState('7 days');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFormError('A formal disciplinary reason is mandatory for audit compliance.');
      return;
    }

    setFormError(null);

    try {
      if (category === 'disqualify') {
        if (!selectedTournamentId || !selectedRegistrationId) {
          setFormError('Select an active tournament registration to disqualify.');
          return;
        }

        await disqualifyPlayer.mutateAsync({
          tournament_id: selectedTournamentId,
          registration_id: selectedRegistrationId,
          reason: reason.trim(),
        });
        onClose();
      } else if (category === 'suspend') {
        // High-risk: require step-up re-authentication
        await stepUp.executeWithFreshAuth(async () => {
          await suspendPlayer.mutateAsync({
            player_id: player.player_id,
            duration_interval: duration,
            reason: reason.trim(),
          });
          onClose();
        });
      } else if (category === 'ban') {
        // High-risk: require step-up re-authentication
        await stepUp.executeWithFreshAuth(async () => {
          await banPlayer.mutateAsync({
            player_id: player.player_id,
            reason: reason.trim(),
          });
          onClose();
        });
      } else if (category === 'reinstate') {
        await reinstatePlayer.mutateAsync({
          player_id: player.player_id,
          scope: 'GLOBAL',
          reason: reason.trim(),
        });
        onClose();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Disciplinary operation failed.');
    }
  };

  const isPending =
    disqualifyPlayer.isPending ||
    suspendPlayer.isPending ||
    banPlayer.isPending ||
    reinstatePlayer.isPending;

  return (
    <>
      <StepUpAuthModal
        isOpen={stepUp.isOpen}
        isVerifying={stepUp.isVerifying}
        error={stepUp.error}
        onConfirm={stepUp.confirmPassword}
        onCancel={stepUp.cancelChallenge}
      />

      <DrawerModal
        isOpen={isOpen}
        onClose={onClose}
        title="Disciplinary Sanction Console"
        description={`Target Account: ${player.username} (${player.player_id})`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Target Profile Summary */}
          <div className="p-3 rounded bg-ktms-surface/50 border border-ktms-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ktms-muted">Player Name:</span>
              <span className="font-semibold text-ktms-text">{player.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Current Status:</span>
              <span
                className={`font-mono font-bold ${
                  player.player_status === 'Active'
                    ? 'text-ktms-green'
                    : player.player_status === 'Suspended'
                    ? 'text-ktms-gold'
                    : 'text-ktms-coral'
                }`}
              >
                {player.player_status}
              </span>
            </div>
            {player.suspended_until_datetime && (
              <div className="flex justify-between text-ktms-gold">
                <span>Suspended Until:</span>
                <span className="font-mono">
                  {new Date(player.suspended_until_datetime).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Sanction Category Tabs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Select Sanction Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('disqualify')}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold border transition ${
                  category === 'disqualify'
                    ? 'bg-ktms-coral/10 text-ktms-coral border-ktms-coral/40'
                    : 'bg-ktms-surface text-ktms-muted border-ktms-border'
                }`}
              >
                <UserX size={14} /> Disqualify
              </button>

              <RoleGate
                allowedRoles={['game_master']}
                fallback={
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold bg-ktms-surface/30 text-ktms-muted/40 border border-ktms-border cursor-not-allowed"
                    title="Game Master Exclusive"
                  >
                    <ShieldAlert size={14} /> Suspend (GM)
                  </button>
                }
              >
                <button
                  type="button"
                  onClick={() => setCategory('suspend')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold border transition ${
                    category === 'suspend'
                      ? 'bg-ktms-gold/10 text-ktms-gold border-ktms-gold/40'
                      : 'bg-ktms-surface text-ktms-muted border-ktms-border'
                  }`}
                >
                  <ShieldAlert size={14} /> Suspend Account
                </button>
              </RoleGate>

              <RoleGate
                allowedRoles={['game_master']}
                fallback={
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold bg-ktms-surface/30 text-ktms-muted/40 border border-ktms-border cursor-not-allowed"
                    title="Game Master Exclusive"
                  >
                    <Ban size={14} /> Ban (GM)
                  </button>
                }
              >
                <button
                  type="button"
                  onClick={() => setCategory('ban')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold border transition ${
                    category === 'ban'
                      ? 'bg-ktms-coral/20 text-ktms-coral border-ktms-coral/60'
                      : 'bg-ktms-surface text-ktms-muted border-ktms-border'
                  }`}
                >
                  <Ban size={14} /> Permanent Ban
                </button>
              </RoleGate>

              <button
                type="button"
                onClick={() => setCategory('reinstate')}
                disabled={player.player_status === 'Active'}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  category === 'reinstate'
                    ? 'bg-ktms-green/10 text-ktms-green border-ktms-green/40'
                    : 'bg-ktms-surface text-ktms-muted border-ktms-border'
                }`}
              >
                <RotateCcw size={14} /> Reinstate
              </button>
            </div>
          </div>

          {/* Disqualification Tournament Picker */}
          {category === 'disqualify' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Active Tournament Registration
              </label>
              {player.active_registrations && player.active_registrations.length > 0 ? (
                <select
                  value={selectedRegistrationId}
                  onChange={(e) => {
                    const regId = e.target.value;
                    setSelectedRegistrationId(regId);
                    const match = player.active_registrations?.find((r) => r.registration_id === regId);
                    if (match) setSelectedTournamentId(match.tournament_id);
                  }}
                  required
                  className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
                >
                  <option value="">-- Select Active Registration --</option>
                  {player.active_registrations.map((r) => (
                    <option key={r.registration_id} value={r.registration_id}>
                      {r.tournament_name} ({r.registration_id})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-ktms-muted italic">
                  Player has no active tournament registrations.
                </p>
              )}
              <p className="text-[11px] text-ktms-muted mt-1 leading-relaxed">
                Disqualifying a player triggers an automatic cascade across remaining fixtures, awarding
                3-0 walkovers to opponents and updating leaderboards atomically.
              </p>
            </div>
          )}

          {/* Suspension Duration Picker */}
          {category === 'suspend' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Suspension Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
              >
                <option value="24 hours">24 Hours (Cool-down)</option>
                <option value="3 days">3 Days (Minor Infraction)</option>
                <option value="7 days">7 Days (Standard)</option>
                <option value="30 days">30 Days (Severe / Match Fixing)</option>
              </select>
            </div>
          )}

          {/* Permanent Ban Warning */}
          {category === 'ban' && (
            <div className="p-3 rounded bg-ktms-coral/15 border border-ktms-coral/40 text-xs text-ktms-coral leading-relaxed">
              <strong>High-Risk Action:</strong> Permanent account bans deactivate all platform
              account links immediately and block future logins. Requires 5-minute password
              freshness confirmation.
            </div>
          )}

          {/* Mandatory Reason */}
          <Textarea
            id="disciplinary_reason"
            label="Mandatory Sanction Justification (Audited)"
            placeholder="Document infraction evidence, dispute ID, or tournament rule violated..."
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={category === 'reinstate' ? 'primary' : 'danger'}
              size="sm"
              isLoading={isPending}
            >
              {category === 'disqualify' && 'Confirm Disqualification'}
              {category === 'suspend' && 'Apply Suspension'}
              {category === 'ban' && 'Execute Permanent Ban'}
              {category === 'reinstate' && 'Reinstate Account'}
            </Button>
          </div>
        </form>
      </DrawerModal>
    </>
  );
};
