import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import {
  useMasterAchievements,
  useTournamentCuratedAchievements,
  useAchievementMutations,
} from '@/hooks/useAchievements';
import { MasterAchievementDefinition } from '@/api/achievements';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SwitchToggle } from '@/components/ui/SwitchToggle';

export const AchievementCurationDesk: React.FC = () => {
  const navigate = useNavigate();
  const { data: tournaments = [] } = useTournaments();
  const { data: masterDefs = [] } = useMasterAchievements();
  const { curatePool } = useAchievementMutations();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const { data: curated = [] } = useTournamentCuratedAchievements(
    selectedTournamentId || undefined
  );

  const [localPool, setLocalPool] = useState<
    Record<
      string,
      { is_enabled: boolean; max_per_player: number; max_tournament_total: number; coins_reward: number }
    >
  >({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(tournaments[0].tournament_id);
    }
  }, [tournaments, selectedTournamentId]);

  React.useEffect(() => {
    const draft: typeof localPool = {};
    masterDefs.forEach((def) => {
      const existing = curated.find((c) => c.achievement_definition_id === def.achievement_definition_id);
      draft[def.achievement_definition_id] = {
        is_enabled: existing ? existing.is_enabled : true,
        max_per_player: existing ? existing.max_per_player : def.default_max_per_player,
        max_tournament_total: existing ? existing.max_tournament_total : def.default_max_tournament_total,
        coins_reward: existing ? existing.coins_reward : def.default_coins_reward,
      };
    });
    setLocalPool(draft);
    setSaveSuccess(false);
    setSaveError(null);
  }, [curated, masterDefs, selectedTournamentId]);

  const handleToggle = (defId: string, enabled: boolean) => {
    setLocalPool((prev) => ({
      ...prev,
      [defId]: { ...prev[defId], is_enabled: enabled },
    }));
  };

  const handleCoinsChange = (defId: string, coins: number) => {
    setLocalPool((prev) => ({
      ...prev,
      [defId]: { ...prev[defId], coins_reward: coins },
    }));
  };

  const handleSaveCuration = async () => {
    if (!selectedTournamentId) return;

    try {
      setSaveError(null);
      setSaveSuccess(false);

      const payload = Object.entries(localPool).map(([defId, config]) => ({
        achievement_definition_id: defId,
        is_enabled: config.is_enabled,
        max_per_player: config.max_per_player,
        max_tournament_total: config.max_tournament_total,
        coins_reward: config.coins_reward,
      }));

      await curatePool.mutateAsync({
        tournament_id: selectedTournamentId,
        curated_achievements: payload,
      });

      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save tournament curation.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate('/achievements/reviews')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ktms-muted hover:text-ktms-cyan transition w-fit"
        >
          <ArrowLeft size={14} /> Back to Media Reviews
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ktms-border pb-4">
          <div>
            <h1 className="text-lg font-bold text-ktms-text flex items-center gap-2">
              <Sliders className="h-5 w-5 text-ktms-cyan" />
              Tournament Gamification Curator
            </h1>
            <p className="text-xs text-ktms-muted mt-0.5">
              Enable achievement pools, configure coin payouts, and enforce anti-inflation caps.
            </p>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={handleSaveCuration}
            isLoading={curatePool.isPending}
            icon={<Save size={16} />}
          >
            Save Curation
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded bg-ktms-green/10 border border-ktms-green/30 text-xs text-ktms-green flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>Tournament gamification pool successfully updated and locked.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded bg-ktms-coral/10 border border-ktms-coral/30 text-xs text-ktms-coral flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="flex items-center justify-between bg-ktms-panel p-4 rounded-xl border border-ktms-border">
        <label className="text-xs font-semibold uppercase tracking-wider text-ktms-muted">
          Active Tournament Scope:
        </label>
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="min-h-[40px] rounded border border-ktms-border bg-ktms-bg px-3 py-1.5 text-xs text-ktms-text focus:border-ktms-cyan focus:outline-none min-w-[280px]"
        >
          {tournaments.map((t) => (
            <option key={t.tournament_id} value={t.tournament_id}>
              {t.tournament_name} ({t.tournament_id})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {masterDefs.map((def: MasterAchievementDefinition) => {
          const config = localPool[def.achievement_definition_id] || {
            is_enabled: true,
            max_per_player: def.default_max_per_player,
            max_tournament_total: def.default_max_tournament_total,
            coins_reward: def.default_coins_reward,
          };

          return (
            <div
              key={def.achievement_definition_id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                config.is_enabled
                  ? 'bg-ktms-panel border-ktms-border'
                  : 'bg-ktms-surface/30 border-ktms-border/40 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-ktms-surface border border-ktms-border shrink-0 text-ktms-gold mt-0.5">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-ktms-text">{def.achievement_name}</span>
                    <StatusBadge
                      label={def.tier}
                      variant={def.tier === 'Unique' ? 'gold' : def.tier === 'Rare' ? 'active' : 'neutral'}
                    />
                    <span className="font-mono text-[10px] text-ktms-muted">{def.achievement_code}</span>
                  </div>
                  <p className="text-xs text-ktms-muted leading-relaxed max-w-lg">
                    {def.achievement_description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 border-ktms-border pt-3 sm:pt-0 shrink-0">
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[10px] font-mono uppercase text-ktms-muted">Reward (Coins)</span>
                  <input
                    type="number"
                    min="0"
                    disabled={!config.is_enabled}
                    value={config.coins_reward}
                    onChange={(e) =>
                      handleCoinsChange(def.achievement_definition_id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 rounded border border-ktms-border bg-ktms-bg px-2 py-1 text-xs text-ktms-text font-mono text-right focus:border-ktms-cyan focus:outline-none disabled:opacity-40"
                  />
                </div>

                <div className="flex flex-col items-center gap-1.5 pl-2 border-l border-ktms-border">
                  <span className="text-[10px] font-mono uppercase text-ktms-muted">Pool State</span>
                  <SwitchToggle
                    id={`toggle-${def.achievement_definition_id}`}
                    checked={config.is_enabled}
                    onChange={(checked) => handleToggle(def.achievement_definition_id, checked)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
