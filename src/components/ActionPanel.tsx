import { useGame } from '@/contexts/GameContext';
import { TrainingFocus, EQUIPMENT_PRICES } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, MapPin, Bomb, Brain, MessageSquare, Gamepad2, Coffee, Radio, ShoppingCart, Dice1 } from 'lucide-react';
import { useState } from 'react';

const TRAINING_OPTIONS: { focus: TrainingFocus; icon: React.ReactNode; label: string }[] = [
  { focus: 'aim', icon: <Crosshair className="w-5 h-5" />, label: 'Aim Training' },
  { focus: 'positioning', icon: <MapPin className="w-5 h-5" />, label: 'Positioning' },
  { focus: 'nades', icon: <Bomb className="w-5 h-5" />, label: 'Nade Lineups' },
  { focus: 'gameIQ', icon: <Brain className="w-5 h-5" />, label: 'Demo Review' },
  { focus: 'communication', icon: <MessageSquare className="w-5 h-5" />, label: 'Comms Practice' },
];

const SHOP_ITEMS = [
  { category: 'monitor' as const, items: [{ name: '144Hz', price: 250 }, { name: '240Hz', price: 500 }, { name: '360Hz', price: 800 }] },
  { category: 'mouse' as const, items: [{ name: 'Mid-Range', price: 80 }, { name: 'Pro', price: 150 }] },
  { category: 'keyboard' as const, items: [{ name: 'Mechanical', price: 120 }, { name: 'Custom', price: 300 }] },
  { category: 'pc' as const, items: [{ name: 'Mid', price: 800 }, { name: 'High-End', price: 1500 }, { name: 'Beast', price: 3000 }] },
];

export default function ActionPanel() {
  const { state, dispatch } = useGame();
  const [view, setView] = useState<'actions' | 'shop' | 'gamble'>('actions');
  const [gambleAmount, setGambleAmount] = useState(10);

  if (!state) return null;

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex gap-2">
        {[
          { v: 'actions' as const, icon: <Gamepad2 className="w-4 h-4" />, label: 'Actions' },
          { v: 'shop' as const, icon: <ShoppingCart className="w-4 h-4" />, label: 'Shop' },
          { v: 'gamble' as const, icon: <Dice1 className="w-4 h-4" />, label: 'Gamble' },
        ].map(tab => (
          <button
            key={tab.v}
            onClick={() => setView(tab.v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-mono transition ${
              view === tab.v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Training */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Train (uses 1 week)</h3>
              <div className="grid grid-cols-1 gap-2">
                {TRAINING_OPTIONS.map(t => (
                  <button
                    key={t.focus}
                    onClick={() => dispatch({ type: 'TRAIN', focus: t.focus })}
                    className="flex items-center gap-3 p-3 rounded-md bg-secondary border border-border hover:border-primary hover:bg-primary/5 transition text-left"
                  >
                    <div className="text-primary">{t.icon}</div>
                    <span className="font-display text-sm text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Actions (uses 1 week)</h3>
              <button
                onClick={() => dispatch({ type: 'PLAY_MATCH' })}
                className="w-full p-3 rounded-md bg-primary/20 border border-primary/40 hover:bg-primary/30 transition flex items-center gap-3"
              >
                <Gamepad2 className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-display text-sm font-semibold text-primary">Play Match</div>
                  <div className="text-xs text-muted-foreground">{state.stage === 'FaceIt Grind' ? 'FaceIt Pug' : state.team ? 'Official Match' : 'Scrim'}</div>
                </div>
              </button>
              <button
                onClick={() => dispatch({ type: 'REST' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-blue transition flex items-center gap-3"
              >
                <Coffee className="w-5 h-5 text-cs2-blue" />
                <div className="text-left">
                  <div className="font-display text-sm text-foreground">Rest</div>
                  <div className="text-xs text-muted-foreground">Recover motivation, reduce tilt</div>
                </div>
              </button>
              <button
                onClick={() => dispatch({ type: 'STREAM' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-purple transition flex items-center gap-3"
              >
                <Radio className="w-5 h-5 text-cs2-purple" />
                <div className="text-left">
                  <div className="font-display text-sm text-foreground">Stream</div>
                  <div className="text-xs text-muted-foreground">Earn money, build reputation</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'shop' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {SHOP_ITEMS.map(cat => (
              <div key={cat.category} className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">{cat.category}</h3>
                <div className="space-y-2">
                  {cat.items.map(item => {
                    const owned = (state.equipment as any)[cat.category] === item.name;
                    const canAfford = state.money >= item.price;
                    return (
                      <button
                        key={item.name}
                        disabled={owned || !canAfford}
                        onClick={() => dispatch({ type: 'BUY_EQUIPMENT', item: item.name, category: cat.category })}
                        className={`w-full flex justify-between items-center p-3 rounded-md border transition text-sm font-mono ${
                          owned ? 'border-primary bg-primary/10 text-primary' : canAfford ? 'border-border bg-secondary hover:border-cs2-gold text-foreground' : 'border-border bg-secondary text-muted-foreground opacity-50'
                        }`}
                      >
                        <span>{item.name}</span>
                        <span>{owned ? '✓ Owned' : `$${item.price}`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {view === 'gamble' && (
          <motion.div key="gamble" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Skin Gambling</h3>
              <p className="text-xs text-muted-foreground">5% jackpot (10x), 30% small win (1.5x), 65% loss. High risk.</p>
              <div>
                <label className="text-sm font-mono text-muted-foreground">Amount: ${gambleAmount}</label>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, state.money)}
                  value={Math.min(gambleAmount, state.money)}
                  onChange={e => setGambleAmount(Number(e.target.value))}
                  className="w-full mt-1 accent-accent"
                />
              </div>
              <button
                onClick={() => dispatch({ type: 'GAMBLE', amount: gambleAmount })}
                disabled={state.money < 1}
                className="w-full py-3 rounded-md bg-accent text-accent-foreground font-display font-semibold hover:opacity-90 transition disabled:opacity-40"
              >
                SPIN (${Math.min(gambleAmount, state.money)})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
