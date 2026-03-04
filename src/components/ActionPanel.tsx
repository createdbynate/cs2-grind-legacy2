import { useGame } from '@/contexts/GameContext';
import { TrainingFocus } from '@/types/game';
import { getEligibleTournaments } from '@/lib/gameEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, MapPin, Bomb, Brain, MessageSquare, Gamepad2, Coffee, Radio, ShoppingCart, Dice1, Trophy, Users, Zap } from 'lucide-react';
import { useState } from 'react';

const TRAINING_OPTIONS: { focus: TrainingFocus; icon: React.ReactNode; label: string; desc: string }[] = [
  { focus: 'aim', icon: <Crosshair className="w-5 h-5" />, label: 'Aim Training', desc: 'DM servers & aim maps' },
  { focus: 'positioning', icon: <MapPin className="w-5 h-5" />, label: 'Positioning', desc: 'Map control & angles' },
  { focus: 'nades', icon: <Bomb className="w-5 h-5" />, label: 'Nade Lineups', desc: 'Utility & smokes' },
  { focus: 'gameIQ', icon: <Brain className="w-5 h-5" />, label: 'Demo Review', desc: 'VOD study & strategy' },
  { focus: 'communication', icon: <MessageSquare className="w-5 h-5" />, label: 'Comms Practice', desc: 'Callouts & coordination' },
];

const SHOP_ITEMS = [
  { category: 'monitor' as const, items: [{ name: '144Hz', price: 250 }, { name: '240Hz', price: 500 }, { name: '360Hz', price: 800 }] },
  { category: 'mouse' as const, items: [{ name: 'Mid-Range', price: 80 }, { name: 'Pro', price: 150 }] },
  { category: 'keyboard' as const, items: [{ name: 'Mechanical', price: 120 }, { name: 'Custom', price: 300 }] },
  { category: 'pc' as const, items: [{ name: 'Mid', price: 800 }, { name: 'High-End', price: 1500 }, { name: 'Beast', price: 3000 }] },
];

function EnergyPip({ energy }: { energy: number }) {
  const color = energy >= 50 ? 'text-cs2-green' : energy >= 20 ? 'text-yellow-400' : 'text-destructive';
  const label = energy >= 50 ? '⚡' : energy >= 20 ? '⚠️' : '💀';
  return (
    <span className={`text-xs font-mono font-bold ${color}`}>
      {label} {Math.round(energy)}/100
    </span>
  );
}

const TOURNAMENT_TYPE_COLORS: Record<string, string> = {
  'Open Qualifier': 'text-cs2-blue border-cs2-blue/40',
  'Regional': 'text-cs2-green border-cs2-green/40',
  'Pro League': 'text-primary border-primary/40',
  'Major Qualifier': 'text-cs2-orange border-cs2-orange/40',
  'Major': 'text-cs2-gold border-cs2-gold/40',
};

export default function ActionPanel() {
  const { state, dispatch } = useGame();
  const [view, setView] = useState<'actions' | 'tournament' | 'shop' | 'gamble'>('actions');
  const [gambleAmount, setGambleAmount] = useState(10);

  if (!state) return null;

  const canTrain = state.energy >= 10;
  const eligibleTournaments = getEligibleTournaments(state);
  const hasTournament = !!state.activeTournament;

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: 'actions' as const, icon: <Gamepad2 className="w-4 h-4" />, label: 'Actions' },
          { v: 'tournament' as const, icon: <Trophy className="w-4 h-4" />, label: hasTournament ? 'Tournament ●' : 'Tournament' },
          { v: 'shop' as const, icon: <ShoppingCart className="w-4 h-4" />, label: 'Shop' },
          { v: 'gamble' as const, icon: <Dice1 className="w-4 h-4" />, label: 'Gamble' },
        ].map(tab => (
          <button
            key={tab.v}
            onClick={() => setView(tab.v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-mono transition ${
              view === tab.v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            } ${tab.v === 'tournament' && hasTournament ? 'ring-1 ring-cs2-gold/60' : ''}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ─── ACTIONS TAB ─── */}
        {view === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Energy bar */}
            <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Energy</span>
              </div>
              <EnergyPip energy={state.energy} />
            </div>

            {/* Training */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Train (uses 1 week · -30 energy)</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {TRAINING_OPTIONS.map(t => (
                  <button
                    key={t.focus}
                    onClick={() => dispatch({ type: 'TRAIN', focus: t.focus })}
                    disabled={!canTrain}
                    className={`flex items-center gap-3 p-3 rounded-md border transition text-left ${
                      canTrain
                        ? 'bg-secondary border-border hover:border-primary hover:bg-primary/5'
                        : 'bg-secondary/50 border-border opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className={canTrain ? 'text-primary' : 'text-muted-foreground'}>{t.icon}</div>
                    <div>
                      <div className="font-display text-sm text-foreground">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {!canTrain && (
                <p className="mt-2 text-xs font-mono text-destructive">⚡ Too exhausted to train — rest to recover energy.</p>
              )}
              {canTrain && state.energy < 50 && (
                <p className="mt-2 text-xs font-mono text-yellow-400">⚠️ Low energy — training at reduced efficiency.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Actions (uses 1 week)</h3>
              <button
                onClick={() => dispatch({ type: 'PLAY_MATCH' })}
                className="w-full p-3 rounded-md bg-primary/20 border border-primary/40 hover:bg-primary/30 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-display text-sm font-semibold text-primary">Play Match</div>
                    <div className="text-xs text-muted-foreground">{state.stage === 'FaceIt Grind' ? 'FaceIt Pug' : state.team ? 'Official Match' : 'Scrim'}</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">-15 ⚡</span>
              </button>

              <button
                onClick={() => dispatch({ type: 'REST' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-blue transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-5 h-5 text-cs2-blue" />
                  <div className="text-left">
                    <div className="font-display text-sm text-foreground">Rest</div>
                    <div className="text-xs text-muted-foreground">Recover motivation, reduce tilt</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-cs2-green">+50 ⚡</span>
              </button>

              <button
                onClick={() => dispatch({ type: 'STREAM' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-purple transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-cs2-purple" />
                  <div className="text-left">
                    <div className="font-display text-sm text-foreground">Stream</div>
                    <div className="text-xs text-muted-foreground">Earn money, build reputation</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">-10 ⚡</span>
              </button>

              {/* Team Practice — only show if on a team */}
              {state.team && (
                <button
                  onClick={() => dispatch({ type: 'TEAM_PRACTICE' })}
                  disabled={state.energy < 10}
                  className={`w-full p-3 rounded-md border transition flex items-center justify-between ${
                    state.energy >= 10
                      ? 'bg-secondary border-border hover:border-cs2-green'
                      : 'bg-secondary/50 border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-cs2-green" />
                    <div className="text-left">
                      <div className="font-display text-sm text-foreground">Team Practice</div>
                      <div className="text-xs text-muted-foreground">Build chemistry · +Comms · +Game IQ</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-25 ⚡</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── TOURNAMENT TAB ─── */}
        {view === 'tournament' && (
          <motion.div key="tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Active Tournament */}
            {state.activeTournament && (
              <div className="bg-card border border-cs2-gold/40 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-display font-bold text-cs2-gold">{state.activeTournament.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{state.activeTournament.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-cs2-gold">${state.activeTournament.prizePool.toLocaleString()}</div>
                    <div className="text-xs font-mono text-muted-foreground">Prize Pool</div>
                  </div>
                </div>

                {/* Round progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Round Progress</span>
                    <span>{state.activeTournament.currentRound}/{state.activeTournament.rounds}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: state.activeTournament.rounds }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < state.activeTournament!.currentRound
                            ? 'bg-cs2-green'
                            : i === state.activeTournament!.currentRound
                            ? 'bg-cs2-gold animate-pulse'
                            : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => dispatch({ type: 'PLAY_TOURNAMENT_MATCH' })}
                  disabled={state.energy < 10}
                  className={`w-full py-3 rounded-md font-display font-semibold text-sm transition flex items-center justify-center gap-2 ${
                    state.energy >= 10
                      ? 'bg-cs2-gold/20 border border-cs2-gold/60 text-cs2-gold hover:bg-cs2-gold/30'
                      : 'bg-secondary border border-border text-muted-foreground opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Play Round {state.activeTournament.currentRound + 1}
                  <span className="text-xs opacity-70">(-20 ⚡)</span>
                </button>

                {state.energy < 10 && (
                  <p className="text-xs font-mono text-destructive text-center">⚡ Rest before competing!</p>
                )}
              </div>
            )}

            {/* Available Tournaments */}
            {!state.activeTournament && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Available Tournaments</h3>
                {eligibleTournaments.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-mono text-center py-4">
                    No tournaments available yet.<br />
                    <span className="text-xs">Reach FPL to unlock qualifiers.</span>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eligibleTournaments.map(t => {
                      const colorClass = TOURNAMENT_TYPE_COLORS[t.type] ?? 'text-foreground border-border';
                      return (
                        <div key={t.id} className={`rounded-lg border p-3 space-y-2 ${colorClass.split(' ')[1]}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className={`text-sm font-display font-semibold ${colorClass.split(' ')[0]}`}>{t.name}</div>
                              <div className="text-xs font-mono text-muted-foreground">{t.rounds} rounds · {t.type}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono text-cs2-gold font-bold">${t.prizePool.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">prize pool</div>
                            </div>
                          </div>
                          <button
                            onClick={() => dispatch({ type: 'ENTER_TOURNAMENT', tournamentId: t.id })}
                            className={`w-full py-2 rounded-md text-xs font-mono font-semibold transition border ${colorClass} hover:opacity-80`}
                          >
                            Enter Tournament
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tournament History */}
            {state.tournamentHistory.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Past Results</h3>
                <div className="space-y-2">
                  {[...state.tournamentHistory].reverse().slice(0, 8).map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-foreground">{t.name}</span>
                        <span className="text-muted-foreground ml-2">{t.placement}</span>
                      </div>
                      <span className="text-cs2-gold">${t.prize.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SHOP TAB ─── */}
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

        {/* ─── GAMBLE TAB ─── */}
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
