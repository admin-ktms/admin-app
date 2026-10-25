import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  useDisputeCaseDetail,
  useNoShowCaseDetail,
  useDisputeMutations,
} from '@/hooks/useDisputes';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCasePresence } from '@/hooks/useCasePresence';
import { PresenceCollisionBanner } from '@/components/feedback/PresenceCollisionBanner';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { ImageViewer } from '@/components/layout/ImageViewer';

export const DisputeReviewCase: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const isDispute = type === 'dispute';
  const { data: disputeCase, isLoading: isDisputeLoading } = useDisputeCaseDetail(
    isDispute ? id : undefined
  );
  const { data: noShowCase, isLoading: isNoShowLoading } = useNoShowCaseDetail(
    !isDispute ? id : undefined
  );
  const { resolveDispute, resolveNoShow } = useDisputeMutations();

  const { isConflicted, activeStaff } = useCasePresence(
    isDispute ? 'dispute' : 'noshow',
    id || null
  );

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [rulingReason, setRulingReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Resolution states
  const [chosenWinnerRegId, setChosenWinnerRegId] = useState<string>('');
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const isLoading = isDispute ? isDisputeLoading : isNoShowLoading;
  const targetCase = isDispute ? disputeCase : noShowCase;

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center font-mono text-xs text-ktms-muted">
        Loading adjudication case dossier...
      </div>
    );
  }

  if (!targetCase) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-ktms-muted">Adjudication file not found or already closed.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/disputes')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  // Anti-Collusion: Check if admin is one of the players
  const isPlayer1 = user?.auth_user_id === (isDispute ? disputeCase?.player1_id : noShowCase?.reporting_player_id);
  const isPlayer2 = user?.auth_user_id === (isDispute ? disputeCase?.player2_id : noShowCase?.reported_player_id);
  const hasAntiCollusionConflict = isPlayer1 || isPlayer2;

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeCase || !chosenWinnerRegId || !rulingReason.trim()) {
      setFormError('Winner selection and mandatory audited ruling rationale are required.');
      return;
    }

    try {
      setFormError(null);
      await resolveDispute.mutateAsync({
        dispute_id: disputeCase.dispute_id,
        fixture_id: disputeCase.fixture_id,
        tournament_id: disputeCase.tournament_id,
        winner_registration_id: chosenWinnerRegId,
        home_score: homeScore,
        away_score: awayScore,
        admin_reason: rulingReason.trim(),
      });
      navigate('/disputes');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Ruling commitment failed.');
    }
  };

  const handleResolveNoShow = async (verdict: 'UPHELD' | 'DISMISSED') => {
    if (!noShowCase || !rulingReason.trim()) {
      setFormError('Mandatory audited rationale is required.');
      return;
    }

    try {
      setFormError(null);
      await resolveNoShow.mutateAsync({
        claim_id: noShowCase.no_show_claim_id,
        fixture_id: noShowCase.fixture_id,
        verdict,
        admin_reason: rulingReason.trim(),
      });
      navigate('/disputes');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No-show adjudication failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ImageViewer
        src={activeImage}
        alt="Adjudication Evidence"
        isOpen={!!activeImage}
        onClose={() => setActiveImage(null)}
      />

      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate('/disputes')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Adjudication Queue
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ktms-border pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-ktms-cyan">{id}</span>
              <StatusBadge label={isDispute ? 'Dispute' : 'No-Show'} variant="danger" />
            </div>
            <h1 className="text-lg font-bold text-ktms-text">
              Case Adjudication: {isDispute ? disputeCase?.match_code : noShowCase?.match_code}
            </h1>
          </div>
        </div>
      </div>

      {isConflicted && (
        <PresenceCollisionBanner activeStaff={activeStaff} resourceLabel="adjudication case" />
      )}

      {hasAntiCollusionConflict && (
        <div className="p-4 rounded-xl bg-ktms-coral/15 border border-ktms-coral/40 text-xs text-ktms-coral flex items-center gap-2">
          <ShieldAlert size={16} className="shrink-0" />
          <span>
            <strong>Anti-Collusion Invariant Triggered:</strong> You are registered as a participant
            in this fixture. Adjudication privileges are strictly disabled under Separation of Duties.
          </span>
        </div>
      )}

      {formError && (
        <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Evidence Inspection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isDispute && disputeCase ? (
          <>
            <div className="p-4 rounded-xl border border-ktms-border bg-ktms-panel space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ktms-text">{disputeCase.player1_username}</span>
                <span className="font-mono text-xs text-ktms-cyan">Score: {disputeCase.player1_claimed_score ?? 'N/A'}</span>
              </div>
              {disputeCase.player1_evidence_url ? (
                <button
                  type="button"
                  onClick={() => setActiveImage(disputeCase.player1_evidence_url)}
                  className="w-full h-40 rounded-lg overflow-hidden border border-ktms-border bg-black/40 flex items-center justify-center group"
                >
                  <img
                    src={disputeCase.player1_evidence_url}
                    alt="Player 1 Submission"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </button>
              ) : (
                <div className="h-40 rounded-lg border border-dashed border-ktms-border flex items-center justify-center text-xs text-ktms-muted font-mono">
                  No screenshot uploaded
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-ktms-border bg-ktms-panel space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ktms-text">{disputeCase.player2_username}</span>
                <span className="font-mono text-xs text-ktms-cyan">Score: {disputeCase.player2_claimed_score ?? 'N/A'}</span>
              </div>
              {disputeCase.player2_evidence_url ? (
                <button
                  type="button"
                  onClick={() => setActiveImage(disputeCase.player2_evidence_url)}
                  className="w-full h-40 rounded-lg overflow-hidden border border-ktms-border bg-black/40 flex items-center justify-center group"
                >
                  <img
                    src={disputeCase.player2_evidence_url}
                    alt="Player 2 Submission"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </button>
              ) : (
                <div className="h-40 rounded-lg border border-dashed border-ktms-border flex items-center justify-center text-xs text-ktms-muted font-mono">
                  No screenshot uploaded
                </div>
              )}
            </div>
          </>
        ) : (
          noShowCase && (
            <div className="md:col-span-2 p-4 rounded-xl border border-ktms-border bg-ktms-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ktms-muted">Claimant:</span>
                <span className="font-bold text-xs text-ktms-text">{noShowCase.reporting_player_username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ktms-muted">Reported Missing Player:</span>
                <span className="font-bold text-xs text-ktms-coral">{noShowCase.reported_player_username}</span>
              </div>
            </div>
          )
        )}
      </div>

      {/* Ruling Form */}
      <form onSubmit={handleResolveDispute} className="p-5 rounded-xl border border-ktms-border bg-ktms-panel space-y-4">
        <h3 className="text-sm font-bold text-ktms-text">Adjudicator Determination</h3>

        {isDispute && disputeCase && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Official Winning Participant
              </label>
              <select
                value={chosenWinnerRegId}
                onChange={(e) => setChosenWinnerRegId(e.target.value)}
                disabled={hasAntiCollusionConflict}
                className="min-h-[44px] rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
              >
                <option value="">-- Select Winner --</option>
                <option value={disputeCase.player1_registration_id}>{disputeCase.player1_username}</option>
                <option value={disputeCase.player2_registration_id}>{disputeCase.player2_username}</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                  Home Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
                  disabled={hasAntiCollusionConflict}
                  className="min-h-[44px] rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs font-mono text-ktms-text focus:border-ktms-cyan focus:outline-none"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                  Away Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
                  disabled={hasAntiCollusionConflict}
                  className="min-h-[44px] rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs font-mono text-ktms-text focus:border-ktms-cyan focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <Textarea
          id="adjudication_reason"
          label="Mandatory Audited Ruling Rationale"
          placeholder="Document evidence verification, score discrepancies observed, and ruling basis..."
          rows={3}
          required
          disabled={hasAntiCollusionConflict}
          value={rulingReason}
          onChange={(e) => setRulingReason(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          {isDispute ? (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={hasAntiCollusionConflict || resolveDispute.isPending}
              isLoading={resolveDispute.isPending}
            >
              Commit Ruling
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={hasAntiCollusionConflict || resolveNoShow.isPending}
                onClick={() => handleResolveNoShow('DISMISSED')}
              >
                Dismiss Allegation
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={hasAntiCollusionConflict || resolveNoShow.isPending}
                onClick={() => handleResolveNoShow('UPHELD')}
              >
                Upheld (Award Walkover)
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
