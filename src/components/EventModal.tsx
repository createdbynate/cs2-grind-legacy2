import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventModal() {
  const { state, dispatch } = useGame();
  if (!state?.currentEvent) return null;

  const event = state.currentEvent;

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
          className="bg-card border border-primary/30 rounded-lg p-6 max-w-md w-full glow-primary"
        >
          <div className="text-xs font-mono text-primary uppercase tracking-wider mb-1">Event</div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">{event.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{event.description}</p>

          <div className="space-y-2">
            {event.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => dispatch({ type: 'RESOLVE_EVENT', choice })}
                className="w-full p-4 rounded-md bg-secondary border border-border hover:border-primary hover:bg-primary/5 transition text-left"
              >
                <span className="text-sm font-display text-foreground">{choice.text}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
