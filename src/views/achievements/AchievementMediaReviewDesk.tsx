import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Video,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Sliders,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  usePendingMediaReviews,
  useMasterAchievements,
  useAchievementMutations,
} from '@/hooks/useAchievements';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AchievementMediaReviewItem } from '@/api/achievements';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DrawerModal } from '@/components/layout/DrawerModal';
import { Textarea } from '@/components/ui/Textarea';
import { ImageViewer } from '@/components/layout/ImageViewer';

export const AchievementMediaReviewDesk: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { data: reviews = [], isLoading: isReviewsLoading } = usePendingMediaReviews();
  const { data: masterAchievements = [] } = useMasterAchievements();
  const { awardAchievement, dismissReview } = useAchievementMutations();

  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<AchievementMediaReviewItem | null>(null);
  const [actionType, setActionType] = useState<'award' | 'dismiss'>('award');
  const [chosenAchievementCode, setChosenAchievementCode] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Lightbox Media View State
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: string; title: string } | null>(null);

  const filteredReviews = reviews.filter((r) => {
    return (
      r.review_id.toLowerCase().includes(search.toLowerCase()) ||
      r.player_id.toLowerCase().includes(search.toLowerCase()) ||
      r.match_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.tournament_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenAdjudication = (review: AchievementMediaReviewItem, type: 'award' | 'dismiss') => {
    setSelectedReview(review);
    setActionType(type);
    setChosenAchievementCode(review.suggested_achievement_definition_id || '');
    setAdminNotes('');
    setFormError(null);
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      setFormError(null);

      if (actionType === 'award') {
        if (!chosenAchievementCode) {
          setFormError('Select an achievement from the catalog to award.');
          return;
        }

        await awardAchievement.mutateAsync({
          tournament_id: selectedReview.tournament_id,
          registration_id: selectedReview.submitting_registration_id,
          achievement_code: chosenAchievementCode,
          fixture_id: selectedReview.fixture_id,
          review_id: selectedReview.review_id,
          admin_notes: adminNotes.trim() || undefined,
        });
      } else {
        if (!adminNotes.trim()) {
          setFormError('A dismissal reason is required for audit records.');
          return;
        }

        await dismissReview.mutateAsync({
          review_id: selectedReview.review_id,
          dismissal_reason: adminNotes.trim(),
        });
      }

      setSelectedReview(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Adjudication failed to execute.');
    }
  };

  const columns: Column<AchievementMediaReviewItem>[] = [
    {
      key: 'review_id',
      header: 'Review ID',
      render: (r) => (
        <span className="font-mono font-bold text-ktms-cyan">{r.review_id}</span>
      ),
      width: '120px',
    },
    {
      key: 'match_code',
      header: 'Match & Context',
      render: (r) => (
        <div>
          <span className="font-mono font-semibold text-xs text-ktms-text block">{r.match_code}</span>
          <span className="text-[11px] text-ktms-muted truncate max-w-[200px] block">
            {r.tournament_name}
          </span>
        </div>
      ),
    },
    {
      key: 'media',
      header: 'Evidence Media',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMedia({
              url: r.media_url,
              type: r.media_type,
              title: `Evidence: ${r.match_code} (${r.player_id})`,
            });
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ktms-surface hover:bg-ktms-border text-xs text-ktms-cyan transition border border-ktms-border"
        >
          {r.media_type === 'SCREEN_RECORDING' ? <Video size={13} /> : <ImageIcon size={13} />}
          <span>{r.media_type === 'SCREEN_RECORDING' ? 'Play Video' : 'Inspect Image'}</span>
        </button>
      ),
      width: '140px',
    },
    {
      key: 'player',
      header: 'Participant',
      render: (r) => (
        <div>
          <span className="font-mono text-xs text-ktms-text block">{r.player_id}</span>
          <span className="text-[10px] font-mono text-ktms-muted">{r.submitting_registration_id}</span>
        </div>
      ),
    },
    {
      key: 'suggested',
      header: 'Suggested Title',
      render: (r) =>
        r.suggested_achievement_name ? (
          <span className="text-xs font-semibold text-ktms-gold flex items-center gap-1">
            <Award size={13} /> {r.suggested_achievement_name}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-ktms-muted">Open Appraisal</span>
        ),
    },
    {
      key: 'actions',
      header: 'Ruling',
      render: (r) => {
        const isSelf = user?.auth_user_id === r.player_id;

        if (isSelf) {
          return (
            <span className="text-[11px] text-ktms-coral font-mono flex items-center gap-1">
              <ShieldAlert size={12} /> Self-Submission
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenAdjudication(r, 'award')}
              icon={<CheckCircle size={14} />}
            >
              Award
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleOpenAdjudication(r, 'dismiss')}
              icon={<XCircle size={14} />}
            >
              Dismiss
            </Button>
          </div>
        );
      },
      width: '180px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Media Inspection Modal */}
      {activeMedia?.type === 'SCREEN_RECORDING' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="flex flex-col w-full max-w-3xl rounded-xl border border-ktms-border bg-ktms-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-ktms-border px-4 py-3">
              <span className="text-xs font-bold uppercase text-ktms-text">{activeMedia.title}</span>
              <button
                onClick={() => setActiveMedia(null)}
                className="text-xs text-ktms-muted hover:text-white"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <video src={activeMedia.url} controls autoPlay className="max-h-[70vh] w-full" />
            </div>
          </div>
        </div>
      ) : (
        <ImageViewer
          isOpen={!!activeMedia}
          src={activeMedia?.url || null}
          title={activeMedia?.title}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
            <Award className="h-5 w-5 text-ktms-gold" />
            DCC Media Review Queue
          </h1>
          <p className="text-xs text-ktms-muted mt-0.5">
            Appraise player highlight clips, award community achievements, and trigger AI commentary blasts.
          </p>
        </div>

        <Button
          size="md"
          variant="secondary"
          icon={<Sliders size={16} />}
          onClick={() => navigate('/achievements')}
        >
          Curate Tournament Pools
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ktms-panel p-3 rounded-lg border border-ktms-border">
        <div className="flex items-center gap-2">
          <StatusBadge label={`${reviews.length} Pending Submissions`} variant="gold" pulse />
        </div>

        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3 h-3.5 w-3.5 text-ktms-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search review, player, or match..."
            className="w-full bg-ktms-bg border border-ktms-border rounded pl-8 pr-3 py-1.5 text-xs text-ktms-text placeholder:text-ktms-muted/50 focus:border-ktms-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredReviews}
          keyExtractor={(r) => r.review_id}
          isLoading={isReviewsLoading}
          emptyMessage="No pending achievement media submissions awaiting review."
        />
      </div>

      {/* Mobile Touch Card View */}
      <div className="lg:hidden space-y-3">
        {isReviewsLoading ? (
          <div className="p-8 text-center text-xs text-ktms-muted font-mono">
            Loading achievement review queue...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-xs text-ktms-muted rounded border border-ktms-border bg-ktms-panel">
            No pending submissions.
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isSelf = user?.auth_user_id === r.player_id;

            return (
              <div
                key={r.review_id}
                className="flex flex-col gap-2.5 p-4 rounded-xl border border-ktms-border bg-ktms-panel shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-ktms-cyan">{r.review_id}</span>
                  <span className="font-mono text-xs text-ktms-text font-semibold">{r.match_code}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-ktms-muted">
                  <span>Player: {r.player_id}</span>
                  {r.suggested_achievement_name && (
                    <span className="font-semibold text-ktms-gold flex items-center gap-1">
                      <Award size={12} /> {r.suggested_achievement_name}
                    </span>
                  )}
                </div>

                {r.player_notes && (
                  <p className="text-xs text-ktms-text/90 italic bg-ktms-surface/50 p-2 rounded border border-ktms-border">
                    "{r.player_notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-ktms-border/60 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setActiveMedia({
                        url: r.media_url,
                        type: r.media_type,
                        title: `Evidence: ${r.match_code}`,
                      })
                    }
                    className="flex items-center gap-1 text-xs text-ktms-cyan font-semibold"
                  >
                    <Eye size={13} /> {r.media_type === 'SCREEN_RECORDING' ? 'Play Clip' : 'Inspect'}
                  </button>

                  {isSelf ? (
                    <span className="text-[11px] text-ktms-coral font-mono flex items-center gap-1">
                      <ShieldAlert size={12} /> Self-Submission
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenAdjudication(r, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenAdjudication(r, 'award')}
                      >
                        Award
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
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={actionType === 'award' ? 'Grant Achievement Distinction' : 'Dismiss Highlight Submission'}
        description={`Review ID #${selectedReview?.review_id} • Match ${selectedReview?.match_code}`}
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
              <span className="text-ktms-muted">Player:</span>
              <span className="font-mono text-ktms-text">{selectedReview?.player_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ktms-muted">Tournament:</span>
              <span className="text-ktms-text">{selectedReview?.tournament_name}</span>
            </div>
            {selectedReview?.player_notes && (
              <div className="pt-1">
                <span className="text-ktms-muted block mb-0.5">Player Statement:</span>
                <span className="italic text-ktms-text/90">"{selectedReview.player_notes}"</span>
              </div>
            )}
          </div>

          {actionType === 'award' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
                Select Achievement to Award
              </label>
              <select
                value={chosenAchievementCode}
                onChange={(e) => setChosenAchievementCode(e.target.value)}
                required
                className="min-h-[44px] w-full rounded border border-ktms-border bg-ktms-bg px-3 py-2 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none"
              >
                <option value="">-- Choose Master Achievement Definition --</option>
                {masterAchievements.map((def) => (
                  <option key={def.achievement_definition_id} value={def.achievement_code}>
                    [{def.tier}] {def.achievement_name} ({def.achievement_code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ktms-muted leading-relaxed mt-1">
                Awarding this distinction consumes the next sequential DCC AI roast variant and
                broadcasts an announcement into the recipient's system thread and match lobby.
              </p>
            </div>
          )}

          <Textarea
            id="review_admin_notes"
            label={actionType === 'award' ? 'Audited Admin Notes (Optional)' : 'Mandatory Dismissal Reason'}
            placeholder={
              actionType === 'award'
                ? 'Document highlight verification details...'
                : 'State why the highlight was declined (e.g. low resolution, rule violation)...'
            }
            rows={3}
            required={actionType === 'dismiss'}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedReview(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionType === 'award' ? 'gold' : 'danger'}
              size="sm"
              isLoading={awardAchievement.isPending || dismissReview.isPending}
            >
              {actionType === 'award' ? 'Grant Distinction' : 'Dismiss Submission'}
            </Button>
          </div>
        </form>
      </DrawerModal>
    </div>
  );
};
