import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';

export default function GameOver() {
  const { state, dispatch } = useGame();
  if (!state?.gameOver) return null;

  const isMajor = state.stage === 'Major Contender';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <h1 className={`text-4xl font-display font-bold ${isMajor ? 'text-cs2-gold' : 'text-foreground'}`}>
          {isMajor ? '👑 LEGEND' : 'CAREER OVER'}
        </h1>
        {state.gameOverReason && <p className="text-muted-foreground">{state.gameOverReason}</p>}

        <div className="bg-card border border-border rounded-lg p-6 space-y-3 font-mono text-sm text-left">
          <div className="text-muted-foreground">Final Stage: <span className="text-primary">{state.stage}</span></div>
          <div className="text-muted-foreground">Rating: <span className="text-foreground">{state.stats.rating.toFixed(2)}</span></div>
          <div className="text-muted-foreground">Matches: <span className="text-foreground">{state.matchesPlayed}</span></div>
          <div className="text-muted-foreground">Win Rate: <span className="text-foreground">{state.matchesPlayed > 0 ? Math.round((state.matchesWon / state.matchesPlayed) * 100) : 0}%</span></div>
          <div className="text-muted-foreground">Earnings: <span className="text-cs2-gold">${state.earnings.toLocaleString()}</span></div>
          <div className="text-muted-foreground">Weeks: <span className="text-foreground">{state.weeks}</span></div>
          {state.achievements.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {state.achievements.map((a, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{a}</span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('cs2-career-save');
            window.location.reload();
          }}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition"
        >
          NEW GAME
        </button>
      </motion.div>
    </div>
  );
}
