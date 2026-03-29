import { useGame } from '@/contexts/GameContext';
import { TrainingFocus, ContractOffer, TournamentInvite } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, MapPin, Bomb, Brain, MessageSquare, Gamepad2, Coffee, Radio,
  ShoppingCart, Dice1, Trophy, Users, Zap, FileSignature, X, LogOut,
  Skull, CalendarDays, Star, HeartPulse, BarChart2, Tv2,
} from 'lucide-react';
import { useState } from 'react';

const TRAINING_OPTIONS: { focus: TrainingFocus; icon: React.ReactNode; label: string; desc: string }[] = [
  { focus: 'aim',           icon: <Crosshair className="w-4 h-4" />,     label: 'Aim Training',    desc: 'DM servers & aim maps' },
  { focus: 'positioning',   icon: <MapPin className="w-4 h-4" />,        label: 'Positioning',     desc: 'Map control & angles' },
  { focus: 'nades',         icon: <Bomb className="w-4 h-4" />,          label: 'Nade Lineups',    desc: 'Utility & smokes' },
  { focus: 'gameIQ',        icon: <Brain className="w-4 h-4" />,         label: 'Demo Review',     desc: 'VOD study & strategy' },
  { focus: 'communication', icon: <MessageSquare className="w-4 h-4" />, label: 'Comms Practice',  desc: 'Callouts & coordination' },
];

const SHOP_ITEMS = [
  { category: 'monitor' as const,  items: [{ name: '144Hz', price: 250 }, { name: '240Hz', price: 500 }, { name: '360Hz', price: 800 }] },
  { category: 'mouse' as const,    items: [{ name: 'Mid-Range', price: 80 }, { name: 'Pro', price: 150 }] },
  { category: 'keyboard' as const, items: [{ name: 'Mechanical', price: 120 }, { name: 'Custom', price: 300 }] },
  { category: 'pc' as const,       items: [{ name: 'Mid', price: 800 }, { name: 'High-End', price: 1500 }, { name: 'Beast', price: 3000 }] },
];

const TIER_COLORS: Record<string, string> = {
  'Academy':         'text-cs2-blue border-cs2-blue/40 bg-cs2-blue/5',
  'Tier 3':          'text-cs2-green border-cs2-green/40 bg-cs2-green/5',
  'Tier 2':          'text-cs2-orange border-cs2-orange/40 bg-cs2-orange/5',
  'Tier 1':          'text-primary border-primary/40 bg-primary/5',
  'Major Contender': 'text-cs2-gold border-cs2-gold/40 bg-cs2-gold/5',
};

const TOURNAMENT_PRESTIGE_COLOR: Record<number, string> = {
  1: 'text-muted-foreground border-border',
  2: 'text-cs2-blue border-cs2-blue/30',
  3: 'text-cs2-blue border-cs2-blue/40',
  4: 'text-cs2-green border-cs2-green/40',
  5: 'text-cs2-green border-cs2-green/50',
  6: 'text-cs2-orange border-cs2-orange/40',
  7: 'text-primary border-primary/40',
  8: 'text-cs2-gold border-cs2-gold/50',
  9: 'text-cs2-gold border-cs2-gold/60',
  10: 'text-cs2-gold border-cs2-gold/80',
};

function ContractCard({ offer, onSign, onReject }: { offer: ContractOffer; onSign: () => void; onReject: () => void }) {
  const colorClass = TIER_COLORS[offer.tier] ?? 'text-foreground border-border bg-secondary';
  const durationLabel = offer.durationWeeks === 26 ? '6 months' : offer.durationWeeks === 52 ? '1 year' : '1.5 years';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 space-y-3 ${colorClass}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-display font-bold text-sm">{offer.teamName}</div>
          <div className="text-xs font-mono opacity-70">{offer.tier} · {durationLabel}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-sm">${offer.monthlyUSD.toLocaleString()}<span className="text-xs opacity-70">/mo</span></div>
          <div className="text-xs font-mono opacity-70">+${offer.signingBonus.toLocaleString()} bonus</div>
        </div>
      </div>
      <div className="text-xs font-mono opacity-60 bg-black/20 rounded px-2 py-1">
        Performance clause: min {offer.performanceClause} rating or release
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSign}
          className="flex-1 py-2 rounded-md text-xs font-mono font-bold bg-cs2-green/20 border border-cs2-green/50 text-cs2-green hover:bg-cs2-green/30 transition flex items-center justify-center gap-1"
        >
          <FileSignature className="w-3 h-3" /> Sign Contract
        </button>
        <button
          onClick={onReject}
          className="px-3 py-2 rounded-md text-xs font-mono text-muted-foreground bg-secondary border border-border hover:border-destructive hover:text-destructive transition"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

function TournamentInviteCard({ invite, onAccept, onDecline }: { invite: TournamentInvite; onAccept: () => void; onDecline: () => void }) {
  const colorClass = TOURNAMENT_PRESTIGE_COLOR[invite.prestige] ?? 'text-foreground border-border';
  const prestigeStars = '★'.repeat(Math.min(invite.prestige, 5));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 space-y-3 bg-card ${colorClass}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-display font-bold text-sm">{invite.name}</div>
          <div className="text-xs font-mono opacity-70">{invite.type} · {invite.rounds} rounds</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-sm text-cs2-gold">${invite.prizePool.toLocaleString()}</div>
          <div className="text-xs opacity-60">{prestigeStars}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 py-2 rounded-md text-xs font-mono font-bold bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition flex items-center justify-center gap-1"
        >
          <Trophy className="w-3 h-3" /> Accept Invite
        </button>
        <button
          onClick={onDecline}
          className="px-3 py-2 rounded-md text-xs font-mono text-muted-foreground bg-secondary border border-border hover:border-destructive hover:text-destructive transition"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function ActionPanel() {
  const { state, dispatch } = useGame();
  const [view, setView] = useState<'actions' | 'tournament' | 'contracts' | 'shop' | 'gamble'>('actions');
  const [gambleAmount, setGambleAmount] = useState(10);
  const [confirmRetire, setConfirmRetire] = useState(false);

  if (!state) return null;

  const canTrain = state.energy >= 10;
  const hasTournament = !!state.activeTournament;
  const pendingOffers = state.pendingOffers ?? [];
  const pendingInvites = state.pendingTournamentInvites ?? [];
  const hasOffers = pendingOffers.length > 0;
  const hasInvites = pendingInvites.length > 0;
  const notifBadge = (count: number) => count > 0 ? (
    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cs2-orange text-black leading-none">{count}</span>
  ) : null;

  const tabs = [
    { v: 'actions' as const,   icon: <Gamepad2 className="w-4 h-4" />,     label: 'Actions' },
    { v: 'tournament' as const, icon: <Trophy className="w-4 h-4" />,       label: hasTournament ? 'Match ●' : 'Tournaments', badge: hasInvites && !hasTournament ? pendingInvites.length : 0 },
    { v: 'contracts' as const,  icon: <FileSignature className="w-4 h-4" />, label: 'Offers',  badge: hasOffers ? pendingOffers.length : 0 },
    { v: 'shop' as const,       icon: <ShoppingCart className="w-4 h-4" />, label: 'Shop' },
    { v: 'gamble' as const,     icon: <Dice1 className="w-4 h-4" />,        label: 'Gamble' },
  ];

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.v}
            onClick={() => setView(tab.v)}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-mono font-medium transition ${
              view === tab.v
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            } ${tab.v === 'tournament' && hasTournament ? 'ring-1 ring-cs2-gold/60' : ''}
              ${tab.v === 'contracts' && hasOffers ? 'ring-1 ring-cs2-orange/60' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge ? notifBadge(tab.badge) : null}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ─── ACTIONS TAB ─── */}
        {view === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Energy */}
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Energy</span>
                </div>
                <span className={`text-xs font-mono font-bold ${state.energy >= 50 ? 'text-cs2-green' : state.energy >= 20 ? 'text-yellow-400' : 'text-destructive'}`}>
                  {Math.round(state.energy)}/100 · {state.energy >= 50 ? 'Ready' : state.energy >= 20 ? 'Tired' : 'Exhausted'}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${state.energy >= 50 ? 'bg-cs2-green' : state.energy >= 20 ? 'bg-yellow-400' : 'bg-destructive'}`}
                  style={{ width: `${state.energy}%` }}
                />
              </div>
            </div>

            {/* Training */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                Train <span className="opacity-50">· 1 week · -30⚡</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {TRAINING_OPTIONS.map(t => (
                  <button
                    key={t.focus}
                    onClick={() => dispatch({ type: 'TRAIN', focus: t.focus })}
                    disabled={!canTrain}
                    className={`flex items-center gap-3 p-2.5 rounded-md border transition text-left ${
                      canTrain
                        ? 'bg-secondary border-border hover:border-primary hover:bg-primary/5'
                        : 'bg-secondary/40 border-border opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className={canTrain ? 'text-primary' : 'text-muted-foreground'}>{t.icon}</div>
                    <div>
                      <div className="font-display text-xs text-foreground font-semibold">{t.label}</div>
                      <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {!canTrain && <p className="mt-2 text-xs font-mono text-destructive">⚡ Too exhausted — rest to recover.</p>}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                Actions <span className="opacity-50">· 1 week each</span>
              </h3>

              {/* Play Match */}
              {hasTournament ? (
                <button
                  onClick={() => { dispatch({ type: 'PLAY_TOURNAMENT_MATCH' }); setView('tournament'); }}
                  disabled={state.energy < 10}
                  className={`w-full p-3 rounded-md border transition flex items-center justify-between ${
                    state.energy >= 10
                      ? 'bg-cs2-gold/10 border-cs2-gold/50 hover:bg-cs2-gold/20'
                      : 'bg-secondary/40 border-border opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-cs2-gold" />
                    <div className="text-left">
                      <div className="font-display text-xs font-bold text-cs2-gold">Tournament Match</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{state.activeTournament?.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-20⚡</span>
                </button>
              ) : (
                <button
                  onClick={() => dispatch({ type: 'PLAY_MATCH' })}
                  className="w-full p-3 rounded-md bg-primary/10 border border-primary/30 hover:bg-primary/20 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="font-display text-xs font-semibold text-primary">
                        {state.stage === 'FaceIt Grind' ? 'FACEIT Match' : state.team ? 'Official Match' : 'Scrim / PUG'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {state.stage === 'FaceIt Grind' ? `ELO: ${state.faceitElo} · Level ${state.faceitLevel}` : 'Competitive'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-15⚡</span>
                </button>
              )}

              <button
                onClick={() => dispatch({ type: 'REST' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-blue transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-4 h-4 text-cs2-blue" />
                  <div className="text-left">
                    <div className="font-display text-xs text-foreground font-semibold">Rest</div>
                    <div className="text-[10px] text-muted-foreground">Recover energy, reduce tilt</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-cs2-green">+50⚡</span>
              </button>

              <button
                onClick={() => dispatch({ type: 'STREAM' })}
                className="w-full p-3 rounded-md bg-secondary border border-border hover:border-cs2-purple transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-cs2-purple" />
                  <div className="text-left">
                    <div className="font-display text-xs text-foreground font-semibold">Stream</div>
                    <div className="text-[10px] text-muted-foreground">Earn money, build brand</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground">-10⚡</span>
              </button>

              {state.team && (
                <button
                  onClick={() => dispatch({ type: 'TEAM_PRACTICE' })}
                  disabled={state.energy < 10}
                  className={`w-full p-3 rounded-md border transition flex items-center justify-between ${
                    state.energy >= 10
                      ? 'bg-secondary border-border hover:border-cs2-green'
                      : 'bg-secondary/40 border-border opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-cs2-green" />
                    <div className="text-left">
                      <div className="font-display text-xs font-semibold text-foreground">Team Practice</div>
                      <div className="text-[10px] text-muted-foreground">+Chemistry · +Comms · +Game IQ</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">-25⚡</span>
                </button>
              )}

              {/* Life Actions */}
              <div className="pt-1 border-t border-border space-y-1.5">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Life</h3>
                <button
                  onClick={() => dispatch({ type: 'MENTAL_COACHING' })}
                  disabled={state.money < 500}
                  className={`w-full p-3 rounded-md border transition flex items-center justify-between ${
                    state.money >= 500
                      ? 'bg-secondary border-border hover:border-cs2-purple'
                      : 'bg-secondary/40 border-border opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HeartPulse className="w-4 h-4 text-cs2-purple" />
                    <div className="text-left">
                      <div className="font-display text-xs font-semibold text-foreground">Mental Coach</div>
                      <div className="text-[10px] text-muted-foreground">Clear tilt · +Mental Strength</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-destructive">-$500</span>
                </button>
                <button
                  onClick={() => dispatch({ type: 'HIRE_ANALYST' })}
                  disabled={state.money < 300}
                  className={`w-full p-3 rounded-md border transition flex items-center justify-between ${
                    state.money >= 300
                      ? 'bg-secondary border-border hover:border-cs2-blue'
                      : 'bg-secondary/40 border-border opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-cs2-blue" />
                    <div className="text-left">
                      <div className="font-display text-xs font-semibold text-foreground">Hire Analyst</div>
                      <div className="text-[10px] text-muted-foreground">VOD review · +GameIQ +Positioning</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-destructive">-$300</span>
                </button>
                <button
                  onClick={() => dispatch({ type: 'POST_CONTENT' })}
                  className="w-full p-3 rounded-md border border-border bg-secondary hover:border-cs2-green transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Tv2 className="w-4 h-4 text-cs2-green" />
                    <div className="text-left">
                      <div className="font-display text-xs font-semibold text-foreground">Post Content</div>
                      <div className="text-[10px] text-muted-foreground">Clips / socials · Build brand · Chance to go viral</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Free</span>
                </button>
              </div>

              {/* Leave team / Retire */}
              <div className="pt-1 border-t border-border space-y-1.5">
                {state.team && (
                  <button
                    onClick={() => dispatch({ type: 'LEAVE_TEAM' })}
                    className="w-full p-2.5 rounded-md bg-secondary border border-border hover:border-destructive hover:text-destructive transition flex items-center gap-2 text-xs font-mono text-muted-foreground"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Request Release from {state.team.name}
                    <span className="ml-auto opacity-50">−Prof</span>
                  </button>
                )}
                {state.age >= 28 && (
                  !confirmRetire ? (
                    <button
                      onClick={() => setConfirmRetire(true)}
                      className="w-full p-2.5 rounded-md bg-secondary border border-border hover:border-destructive transition flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-destructive"
                    >
                      <Skull className="w-3.5 h-3.5" /> Retire
                    </button>
                  ) : (
                    <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                      <p className="text-xs font-mono text-destructive">Are you sure? This ends your career.</p>
                      <div className="flex gap-2">
                        <button onClick={() => dispatch({ type: 'RETIRE' })} className="flex-1 py-1.5 rounded bg-destructive text-destructive-foreground text-xs font-mono font-bold">Retire</button>
                        <button onClick={() => setConfirmRetire(false)} className="flex-1 py-1.5 rounded bg-secondary text-muted-foreground text-xs font-mono border border-border">Cancel</button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── TOURNAMENT TAB ─── */}
        {view === 'tournament' && (
          <motion.div key="tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Active Tournament Progress */}
            {state.activeTournament && (
              <div className="bg-card border border-cs2-gold/40 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-cs2-gold uppercase tracking-wider mb-0.5">{state.activeTournament.type}</div>
                    <h3 className="text-sm font-display font-bold text-foreground">{state.activeTournament.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-cs2-gold">${state.activeTournament.prizePool.toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">Prize Pool</div>
                  </div>
                </div>

                {/* Round pips */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                    <span>Round {state.activeTournament.currentRound + 1} of {state.activeTournament.rounds}</span>
                    <span>{state.activeTournament.wins}W-{state.activeTournament.currentRound - state.activeTournament.wins}L</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: state.activeTournament.rounds }).map((_, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${
                        i < state.activeTournament!.currentRound ? 'bg-cs2-green' :
                        i === state.activeTournament!.currentRound ? 'bg-cs2-gold animate-pulse' : 'bg-secondary'
                      }`} />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => dispatch({ type: 'PLAY_TOURNAMENT_MATCH' })}
                  disabled={state.energy < 10}
                  className={`w-full py-3 rounded-md font-display font-bold text-sm transition flex items-center justify-center gap-2 ${
                    state.energy >= 10
                      ? 'bg-cs2-gold/20 border border-cs2-gold/60 text-cs2-gold hover:bg-cs2-gold/30'
                      : 'bg-secondary border border-border text-muted-foreground opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Play Round {state.activeTournament.currentRound + 1}
                  <span className="text-xs opacity-70">(-20⚡)</span>
                </button>
                {state.energy < 10 && <p className="text-xs font-mono text-destructive text-center">Rest before competing!</p>}
              </div>
            )}

            {/* Pending invites */}
            {!state.activeTournament && pendingInvites.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Tournament Invites</h3>
                {pendingInvites.map(invite => (
                  <TournamentInviteCard
                    key={invite.id}
                    invite={invite}
                    onAccept={() => dispatch({ type: 'ACCEPT_TOURNAMENT_INVITE', inviteId: invite.id })}
                    onDecline={() => dispatch({ type: 'DECLINE_TOURNAMENT_INVITE', inviteId: invite.id })}
                  />
                ))}
              </div>
            )}

            {/* No tournament / no invites */}
            {!state.activeTournament && pendingInvites.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground font-mono">No tournament invites right now.</p>
                <p className="text-xs text-muted-foreground mt-1">Keep performing — invites come based on your reputation and stage.</p>
              </div>
            )}

            {/* Tournament history */}
            {state.tournamentHistory.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Past Results</h3>
                <div className="space-y-1.5">
                  {[...state.tournamentHistory].reverse().slice(0, 10).map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-mono">
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground truncate block">{t.name}</span>
                        <span className="text-muted-foreground text-[10px]">{t.placement}</span>
                      </div>
                      <span className="text-cs2-gold ml-2 shrink-0">${t.prize.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── CONTRACTS TAB ─── */}
        {view === 'contracts' && (
          <motion.div key="contracts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Active contract */}
            {state.activeContract && (
              <div className="bg-card border border-cs2-green/40 rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-mono text-cs2-green uppercase tracking-wider">Active Contract</h3>
                <div className="flex justify-between">
                  <div>
                    <div className="font-display font-bold text-sm text-foreground">{state.activeContract.teamName}</div>
                    <div className="text-xs font-mono text-muted-foreground">{state.activeContract.tier}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-cs2-gold">${state.activeContract.monthlyUSD.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span></div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {Math.max(0, state.activeContract.endWeek - state.weeks)}wk remaining
                    </div>
                  </div>
                </div>
                {/* Contract progress bar */}
                <div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cs2-green rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, ((state.activeContract.endWeek - state.weeks) / state.activeContract.durationWeeks) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  Performance clause: maintain {state.activeContract.performanceClause} avg rating
                  {(state.activeContract.poorFormStreak ?? 0) > 0 && (
                    <span className="ml-1 text-cs2-orange">⚠️ {state.activeContract.poorFormStreak} poor weeks</span>
                  )}
                </div>
              </div>
            )}

            {/* Pending offers */}
            {pendingOffers.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Contract Offers <span className="text-cs2-orange">({pendingOffers.length})</span>
                </h3>
                {pendingOffers.map(offer => (
                  <ContractCard
                    key={offer.id}
                    offer={offer}
                    onSign={() => dispatch({ type: 'SIGN_CONTRACT', offerId: offer.id })}
                    onReject={() => dispatch({ type: 'REJECT_OFFER', offerId: offer.id })}
                  />
                ))}
              </div>
            ) : (
              !state.activeContract && (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <FileSignature className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground font-mono">No offers yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Orgs are watching. Keep performing consistently.</p>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* ─── SHOP TAB ─── */}
        {view === 'shop' && (
          <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Equipment</h3>
                <span className="text-sm font-mono font-bold text-cs2-gold">${state.money.toLocaleString()}</span>
              </div>
              <div className="space-y-4">
                {SHOP_ITEMS.map(cat => (
                  <div key={cat.category}>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">{cat.category}</div>
                    <div className="space-y-1">
                      {cat.items.map(item => {
                        const owned = (state.equipment as any)[cat.category] === item.name;
                        const canAfford = state.money >= item.price;
                        return (
                          <button
                            key={item.name}
                            disabled={owned || !canAfford}
                            onClick={() => dispatch({ type: 'BUY_EQUIPMENT', item: item.name, category: cat.category })}
                            className={`w-full flex justify-between items-center px-3 py-2.5 rounded-md border transition text-xs font-mono ${
                              owned ? 'border-primary/50 bg-primary/10 text-primary' :
                              canAfford ? 'border-border bg-secondary hover:border-cs2-gold hover:text-foreground text-muted-foreground' :
                              'border-border bg-secondary/40 text-muted-foreground opacity-40'
                            }`}
                          >
                            <span>{item.name}</span>
                            <span>{owned ? '✓ Owned' : `$${item.price.toLocaleString()}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── GAMBLE TAB ─── */}
        {view === 'gamble' && (
          <motion.div key="gamble" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex justify-between">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Skin Gambling</h3>
                <span className="text-xs font-mono text-cs2-gold">${state.money.toLocaleString()} available</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-secondary rounded p-2">
                  <div className="text-cs2-gold font-bold">5%</div>
                  <div className="text-muted-foreground">Jackpot (10×)</div>
                </div>
                <div className="bg-secondary rounded p-2">
                  <div className="text-cs2-green font-bold">30%</div>
                  <div className="text-muted-foreground">Win (1.5×)</div>
                </div>
                <div className="bg-secondary rounded p-2">
                  <div className="text-destructive font-bold">65%</div>
                  <div className="text-muted-foreground">Loss</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>Bet amount</span>
                  <span className="text-foreground font-bold">${Math.min(gambleAmount, state.money)}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, state.money)}
                  value={Math.min(gambleAmount, state.money)}
                  onChange={e => setGambleAmount(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <button
                onClick={() => dispatch({ type: 'GAMBLE', amount: Math.min(gambleAmount, state.money) })}
                disabled={state.money < 1}
                className="w-full py-3 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:opacity-90 transition disabled:opacity-40"
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
