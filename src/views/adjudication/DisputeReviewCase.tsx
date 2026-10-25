import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Swords,
  ShieldAlert,
  ZoomIn,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { usePendingDisputes, usePendingNoShows, useAdjudicationMutations } from '@/hooks/useDisputes';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCasePresence } from '@/hooks/useCasePresence';
import { PresenceCollisionBanner } from '@/components/feedback/PresenceCollisionBanner';
import { ImageViewer } from '@/components/layout/ImageViewer';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const DisputeReviewCase: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const { data: disputes = [] } = usePendingDisputes();
  const { data: noShows = [] } = usePendingNoShows();
  const { resolveCase } = useAdjudicationMutations();

  // Realtime Presence Collision Guard
  const { isConflicted, activeStaff } = useCasePresence('dispute', id || null);

  // Lightbox State
  const [activeImage, setActiveImage] = useState<{ src: string; title: string } | null>(null);

  // Adjudication Form State
  const [decision, setDecision] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const isDispute = type === 'dispute';
  const disputeCase = isDispute ? disputes.find((d) => d.dispute_id === id) : null;
  const noShowCase = !isDispute ? noShows.find((n) => n.no_show_report_id === id) : null;

  if (!disputeCase && !noShowCase) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-ktms-muted">Case not found or already resolved by another moderator.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/disputes')}>
          Return to Adjudication Queue
        </Button>
      </div>
    );
  }

  // Separation of Duties (Anti-Collusion) Pre-check
  // Admin cannot resolve if they verified the submission earlier
  const isVerifier =
    isDispute &&
    user &&
    (disputeCase?.original_submission?.verified_by_admin_id === user.admin_id ||
      disputeCase?.counter_submission?.verified_by_admin_id === user.admin_id);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      setFormError('A definitive adjudication ruling is required.');
      return;
    }
    if (!reason.trim()) {
      setFormError('A detailed resolution reason is required for immutable audit logging.');
      return;
    }

    try {
      setFormError(null);
      await resolveCase.mutateAsync({
        case_type: isDispute ? 'Result Dispute' : 'No-show',
        case_id: id!,
        resolution_decision: decision as any,
        resolution_reason: reason.trim(),
      });

      navigate('/disputes');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Adjudication failed to execute.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Lightbox Modal */}
      <ImageViewer
        isOpen={!!activeImage}
        src={activeImage?.src || null}
        title={activeImage?.title}
        onClose={() => setActiveImage(null)}
      />

      {/* Navigation Header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate('/disputes')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Adjudication Desk
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ktms-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ktms-muted">Case #{id}</span>
              <StatusBadge
                label={isDispute ? 'Result Dispute' : 'Contested No-show'}
                variant={isDispute ? 'danger' : 'warning'}
              />
            </div>
            <h1 className="text-lg font-bold text-ktms-text">
              Arbitration Case: {isDispute ? disputeCase?.match_code : noShowCase?.match_code} (
              {isDispute ? disputeCase?.round_name : noShowCase?.round_name})
            </h1>
          </div>
        </div>
      </div>

      {/* Realtime Collision Banner */}
      {isConflicted && (
        <PresenceCollisionBanner activeStaff={activeStaff} resourceLabel="dispute case" />
      )}

      {/* Anti-Collusion Shield Warning */}
      {isVerifier && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-ktms-coral/40 bg-ktms-coral/10 text-xs text-ktms-coral">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Separation of Duties Restriction:</span>
            <p className="mt-0.5 leading-relaxed text-ktms-text">
              You previously performed administrative verification on a submission for this match.
              Database security constraints prohibit you from adjudicating this dispute. Another
              moderator or Game Master must decide this case.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Evidence Inspection */}
      {isDispute && disputeCase && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submission A */}
          <div className="flex flex-col justify-between rounded-xl border border-ktms-border bg-ktms-panel p-4 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-ktms-border pb-2 mb-3">
                <span className="font-mono text-xs font-bold text-ktms-cyan">
                  Original Submission (Player A)
                </span>
                <span className="font-mono text-xs text-ktms-muted">
                  {disputeCase.original_submission?.registration_id}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[10px] font-mono text-ktms-muted uppercase">Claimed Score</span>
                <p className="text-xl font-black text-ktms-text">
                  {disputeCase.original_submission?.submitted_score}
                </p>
              </div>

              {/* Screenshot Proof Preview */}
              <div className="mt-2">
                <span className="text-[10px] font-mono text-ktms-muted uppercase block mb-1">
                  Screenshot Proof
                </span>
                {disputeCase.original_submission?.screenshot_url ? (
                  <div
                    onClick={() =>
                      setActiveImage({
                        src: disputeCase.original_submission!.screenshot_url!,
                        title: `Evidence - Player A (${disputeCase.original_submission!.registration_id})`,
                      })
                    }
                    className="relative group cursor-pointer overflow-hidden rounded border border-ktms-border bg-black/40 h-48 flex items-center justify-center"
                  >
                    <img
                      src={disputeCase.original_submission.screenshot_url}
                      alt="Player A Evidence"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition">
                      <ZoomIn size={16} /> Tap to Zoom
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded border border-ktms-border bg-ktms-surface/40 flex items-center justify-center text-xs text-ktms-muted font-mono">
                    No screenshot submitted
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission B */}
          <div className="flex flex-col justify-between rounded-xl border border-ktms-border bg-ktms-panel p-4 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-ktms-border pb-2 mb-3">
                <span className="font-mono text-xs font-bold text-ktms-coral">
                  Counter Submission (Player B)
                </span>
                <span className="font-mono text-xs text-ktms-muted">
                  {disputeCase.counter_submission?.registration_id}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[10px] font-mono text-ktms-muted uppercase">Claimed Score</span>
                <p className="text-xl font-black text-ktms-text">
                  {disputeCase.counter_submission?.submitted_score}
                </p>
              </div>

              {/* Screenshot Proof Preview */}
              <div className="mt-2">
                <span className="text-[10px] font-mono text-ktms-muted uppercase block mb-1">
                  Screenshot Proof
                </span>
                {disputeCase.counter_submission?.screenshot_url ? (
                  <div
                    onClick={() =>
                      setActiveImage({
                        src: disputeCase.counter_submission!.screenshot_url!,
                        title: `Evidence - Player B (${disputeCase.counter_submission!.registration_id})`,
                      })
                    }
                    className="relative group cursor-pointer overflow-hidden rounded border border-ktms-border bg-black/40 h-48 flex items-center justify-center"
                  >
                    <img
                      src={disputeCase.counter_submission.screenshot_url}
                      alt="Player B Evidence"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition">
                      <ZoomIn size={16} /> Tap to Zoom
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded border border-ktms-border bg-ktms-surface/40 flex items-center justify-center text-xs text-ktms-muted font-mono">
                    No screenshot submitted
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No-Show Review Details */}
      {!isDispute && noShowCase && (
        <div className="rounded-xl border border-ktms-border bg-ktms-panel p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono text-ktms-muted uppercase">Reporting Participant</span>
              <p className="font-mono text-sm font-bold text-ktms-cyan">
                {noShowCase.reporting_registration_id}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-ktms-muted uppercase">Reported Participant</span>
              <p className="font-mono text-sm font-bold text-ktms-coral">
                {noShowCase.reported_registration_id}
              </p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-ktms-muted uppercase">Claim Justification</span>
            <p className="text-xs text-ktms-text/90 mt-1 p-3 rounded bg-ktms-surface border border-ktms-border">
              {noShowCase.report_reason || 'Opponent failed to connect to match lobby within deadline window.'}
            </p>
          </div>
        </div>
      )}

      {/* Adjudication Decision Panel */}
      <div className="rounded-xl border border-ktms-border bg-ktms-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-ktms-text flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-ktms-cyan" />
          Administrative Ruling Submission
        </h3>

        {formError && (
          <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleResolve} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
              Select Adjudication Decision
            </label>
            <select
              value={decision}
              disabled={isVerifier}
              onChange={(e) => setDecision(e.target.value)}
              className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-sm text-ktms-text focus:border-ktms-cyan focus:outline-none"
            >
              <option value="">-- Choose formal ruling --</option>
              {isDispute ? (
                <>
                  <option value="Accept Original">Accept Original Submission (Player A)</option>
                  <option value="Accept Counter">Accept Counter Submission (Player B)</option>
                  <option value="Reschedule">Reschedule Fixture to Catch-Up Matchday</option>
                </>
              ) : (
                <>
                  <option value="Award Walkover - Reporting Player">
                    Award Walkover to Reporting Player (3-0 default win)
                  </option>
                  <option value="Award Walkover - Reported Player">
                    Award Walkover to Reported Player (3-0 default win)
                  </option>
                  <option value="Declare Double No-show">
                    Declare Double No-Show (0 points awarded to both)
                  </option>
                  <option value="Reschedule">Reschedule Fixture</option>
                </>
              )}
            </select>
          </div>

          <Textarea
            id="adjudication_reason"
            label="Formal Adjudication Justification (Audited)"
            placeholder="Document screenshot inspection details and justification for this ruling..."
            rows={3}
            required
            disabled={isVerifier}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/disputes')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isVerifier || resolveCase.isPending}
              isLoading={resolveCase.isPending}
            >
              Commit Formal Ruling
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
