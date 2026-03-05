import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { NarrativeType } from '@/types/game';

const NARRATIVE_COLORS: Record<NarrativeType, string> = {
  achievement: 'text-cs2-gold',
  milestone: 'text-primary',
  breakout: 'text-cs2-green',
  drama: 'text-cs2-orange',
  struggle: 'text-destructive',
  rivalry: 'text-cs2-purple',
};

const NARRATIVE_ICONS: Record<NarrativeType, string> = {
  achievement: '🏆',
  milestone: '📍',
  breakout: '🚀',
  drama: '🎭',
  struggle: '💀',
  rivalry: '⚔️',
};

export default function WeekLog() {
  const { state } = useGame();
  const [tab, setTab] = useState<'log' | 'narrative'>('log');

  if (!state) return null;

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('log')}
          className={`flex-1 py-2 text-xs font-mono rounded-md border transition ${
            tab === 'log'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          Week {state.weeks} Log
        </button>
        <button
          onClick={() => setTab('narrative')}
          className={`flex-1 py-2 text-xs font-mono rounded-md border transition relative ${
            tab === 'narrative'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          Career Story
          {state.careerNarrative && state.careerNarrative.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cs2-gold rounded-full text-[9px] flex items-center justify-center text-black font-bold">
              {state.careerNarrative.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'log' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {state.weekLog.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">Choose an action to start the week.</p>
            ) : (
              state.weekLog.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
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
                {state.lastMatchResult.tournamentRound && ` — ${state.lastMatchResult.tournamentRound}`}
              </div>
              <div className="text-muted-foreground mt-1">
                {state.lastMatchResult.kills}/{state.lastMatchResult.deaths} ·{' '}
                {state.lastMatchResult.adr} ADR ·{' '}
                {state.lastMatchResult.rating} Rating
                {state.lastMatchResult.mvp && ' · ⭐ MVP'}
                {state.lastMatchResult.clutchMoment && ' · ⚡ Clutch!'}
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
      )}

      {tab === 'narrative' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Career Chronicle</h3>
          {!state.careerNarrative || state.careerNarrative.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono text-center py-4">
              No story moments yet.<br />
              <span className="text-[10px]">Keep playing — your story is being written.</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[...state.careerNarrative].reverse().map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-2 items-start"
                >
                  <span className="text-sm mt-0.5 flex-shrink-0">{NARRATIVE_ICONS[entry.type]}</span>
                  <div>
                    <p className={`text-xs font-mono ${NARRATIVE_COLORS[entry.type]}`}>{entry.text}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Week {entry.week}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
