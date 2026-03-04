import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';

export default function WeekLog() {
  const { state } = useGame();
  if (!state) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Week {state.weeks} Log</h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {state.weekLog.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">Choose an action to start the week.</p>
        ) : (
          state.weekLog.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm font-mono text-foreground"
            >
              {log}
            </motion.div>
          ))
        )}
      </div>

      {/* Last Match Result */}
      {state.lastMatchResult && (
        <div className={`mt-3 p-3 rounded-md border text-xs font-mono ${
          state.lastMatchResult.won ? 'border-cs2-green/30 bg-cs2-green/5' : 'border-destructive/30 bg-destructive/5'
        }`}>
          <div className={`font-bold ${state.lastMatchResult.won ? 'text-cs2-green' : 'text-destructive'}`}>
            Last Match: {state.lastMatchResult.won ? 'WIN' : 'LOSS'}
          </div>
          <div className="text-muted-foreground mt-1">
            {state.lastMatchResult.kills}/{state.lastMatchResult.deaths} • {state.lastMatchResult.adr} ADR • {state.lastMatchResult.rating} Rating
            {state.lastMatchResult.mvp && ' • ⭐ MVP'}
          </div>
        </div>
      )}

      {/* Achievements */}
      {state.achievements.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {state.achievements.map((a, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-accent/20 text-accent">{a}</span>
          ))}
        </div>
      )}
    </div>
  );
}
