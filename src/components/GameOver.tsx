import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { NarrativeType } from '@/types/game';

const NARRATIVE_ICONS: Record<NarrativeType, string> = {
  achievement: '🏆',
  milestone: '📍',
  breakout: '🚀',
  drama: '🎭',
  struggle: '💀',
  rivalry: '⚔️',
};

export default function GameOver() {
  const { state, dispatch } = useGame();
  if (!state?.gameOver) return null;

  const isMajor = state.achievements.includes('Major Champion');
  const winRate = state.matchesPlayed > 0 ? Math.round((state.matchesWon / state.matchesPlayed) * 100) : 0;

  // Career grade
  let grade = 'D';
  let gradeColor = 'text-muted-foreground';
  if (isMajor) { grade = 'S+'; gradeColor = 'text-cs2-gold'; }
  else if (state.stage === 'Major Contender') { grade = 'S'; gradeColor = 'text-cs2-gold'; }
  else if (state.stage === 'Tier 1') { grade = 'A+'; gradeColor = 'text-cs2-green'; }
  else if (state.stage === 'Tier 2') { grade = 'A'; gradeColor = 'text-cs2-green'; }
  else if (state.stage === 'Tier 3') { grade = 'B'; gradeColor = 'text-primary'; }
  else if (state.stage === 'Academy') { grade = 'C+'; gradeColor = 'text-cs2-blue'; }
  else if (state.stage === 'FPL') { grade = 'C'; gradeColor = 'text-cs2-blue'; }

  // Determine career archetype
  let archetype = '';
  if (state.personality) {
    const p = state.personality;
    if (p.clutchReputation > 70) archetype = 'Clutch King';
    else if (p.toxicity > 60) archetype = 'The Villain';
    else if (p.professionalism > 80) archetype = 'The Professional';
    else if (p.dedication > 80) archetype = 'The Grinder';
    else if (state.streak.longestWin >= 8) archetype = 'Prodigy Run';
    else archetype = 'Career Pro';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full space-y-5"
      >
        {/* Title */}
        <div className="text-center">
          <div className={`text-6xl font-mono font-black ${gradeColor}`}>{grade}</div>
          <h1 className={`text-3xl font-display font-bold mt-2 ${isMajor ? 'text-cs2-gold' : 'text-foreground'}`}>
            {isMajor ? '👑 MAJOR CHAMPION' : state.age > 33 ? 'CAREER OVER' : 'END OF THE ROAD'}
          </h1>
          {archetype && (
            <div className="mt-2 text-sm font-mono text-muted-foreground">
              Career Archetype: <span className="text-primary">{archetype}</span>
            </div>
          )}
          {state.gameOverReason && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{state.gameOverReason}</p>
          )}
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3 font-mono text-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground mb-0.5">Final Stage</div>
              <div className="text-primary font-semibold">{state.stage}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Peak Team</div>
              <div className="text-foreground">{state.team?.name ?? 'Solo'}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Rating</div>
              <div className="text-foreground">{state.stats.rating.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Win Rate</div>
              <div className="text-foreground">{winRate}%</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Career Earnings</div>
              <div className="text-cs2-gold font-bold">${state.earnings.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Career Length</div>
              <div className="text-foreground">{state.weeks} weeks</div>
            </div>
            {state.streak && (
              <>
                <div>
                  <div className="text-muted-foreground mb-0.5">Longest Win Streak</div>
                  <div className="text-cs2-green">{state.streak.longestWin}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-0.5">Tournaments Won</div>
                  <div className="text-foreground">
                    {state.tournamentHistory.filter(t => t.placement.includes('1st')).length}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Achievements */}
          {state.achievements.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Achievements</div>
              <div className="flex flex-wrap gap-1">
                {state.achievements.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent border border-accent/20">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Career Narrative Highlights */}
        {state.careerNarrative && state.careerNarrative.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Career Highlights</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.careerNarrative.filter(e => e.type !== 'struggle').map((entry, i) => (
                <div key={i} className="flex gap-2 items-start text-xs font-mono">
                  <span>{NARRATIVE_ICONS[entry.type]}</span>
                  <div>
                    <span className="text-foreground">{entry.text}</span>
                    <span className="text-muted-foreground ml-2">· Wk {entry.week}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rival fate */}
        {state.rival && (
          <div className="bg-card border border-cs2-orange/20 rounded-lg p-4 text-xs font-mono text-center text-muted-foreground">
            ⚔️ Rivalry with <span className="text-cs2-orange">{state.rival.name}</span> ends here —{' '}
            <span className="text-cs2-green">{state.rival.wins}W</span> /{' '}
            <span className="text-destructive">{state.rival.losses}L</span>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.removeItem('cs2-career-save');
            window.location.reload();
          }}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition"
        >
          NEW CAREER
        </button>
      </motion.div>
    </div>
  );
}
