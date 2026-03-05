import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { EventEffects } from '@/types/game';

function EffectPreview({ effects }: { effects: Partial<EventEffects> }) {
  const items: { label: string; value: number; good: boolean }[] = [];

  const add = (label: string, v: number | undefined, higherIsBetter = true) => {
    if (v && v !== 0) items.push({ label, value: v, good: higherIsBetter ? v > 0 : v < 0 });
  };

  add('Money', effects.money);
  add('Motivation', effects.motivation);
  add('Tilt', effects.tiltLevel, false);
  add('Reputation', effects.reputation);
  add('Energy', effects.energy);
  add('Mental', effects.mentalStrength);
  add('Aim', effects.aim);
  add('Game IQ', effects.gameIQ);
  add('Comms', effects.communication);
  add('Health', effects.physicalHealth);
  add('Sleep', effects.sleepQuality);
  add('Chemistry', effects.teamChemistry);
  add('Professionalism', effects.professionalism);
  add('Toxicity', effects.toxicity, false);
  add('Clutch Rep', effects.clutchReputation);
  add('Reliability', effects.reliability);
  add('Dedication', effects.dedication);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
            item.good
              ? 'bg-cs2-green/10 text-cs2-green border-cs2-green/30'
              : 'bg-destructive/10 text-destructive border-destructive/30'
          }`}
        >
          {item.value > 0 ? '+' : ''}{item.label === 'Money' ? `$${item.value}` : item.value} {item.label}
        </span>
      ))}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  team_drama: '🤼',
  breakout: '🚀',
  burnout: '🔥',
  injury: '🩹',
  meta: '🎮',
  social: '📱',
  opportunity: '💼',
  personal: '🏠',
  rivalry: '⚔️',
  financial: '💰',
};

export default function EventModal() {
  const { state, dispatch } = useGame();
  if (!state?.currentEvent) return null;

  const event = state.currentEvent;
  const category = (event as any).category as string | undefined;
  const icon = category ? CATEGORY_ICONS[category] ?? '📋' : '📋';
  const arcLabel = state.arc?.type !== 'none' ? state.arc?.label : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-card border border-primary/30 rounded-lg p-6 max-w-lg w-full glow-primary max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">
              {category?.replace('_', ' ') ?? 'Event'}
            </span>
            {arcLabel && (
              <span className="ml-auto text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                {arcLabel}
              </span>
            )}
          </div>

          <h2 className="text-xl font-display font-bold text-foreground mb-2">{event.title}</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{event.description}</p>

          {/* Confidence / Streak context */}
          {state.streak && Math.abs(state.streak.current) >= 3 && (
            <div className={`text-xs font-mono mb-4 px-3 py-2 rounded border ${
              state.streak.current > 0
                ? 'text-cs2-green bg-cs2-green/5 border-cs2-green/20'
                : 'text-destructive bg-destructive/5 border-destructive/20'
            }`}>
              {state.streak.current > 0
                ? `🔥 You're on a ${state.streak.current}-game win streak. Confidence is high — choose boldly.`
                : `😰 ${Math.abs(state.streak.current)}-game losing streak. Confidence is shaken — be careful.`
              }
            </div>
          )}

          {/* Choices */}
          <div className="space-y-3">
            {event.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => dispatch({ type: 'RESOLVE_EVENT', choice, eventId: event.id })}
                className="w-full p-4 rounded-md bg-secondary border border-border hover:border-primary hover:bg-primary/5 transition text-left group"
              >
                <span className="text-sm font-display text-foreground">{choice.text}</span>
                {choice.outcomeText && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{choice.outcomeText}</p>
                )}
                <EffectPreview effects={choice.effects} />
              </button>
            ))}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dispatch({ type: 'DISMISS_EVENT', eventId: event.id })}
            className="mt-3 w-full py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition"
          >
            Ignore this situation
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
