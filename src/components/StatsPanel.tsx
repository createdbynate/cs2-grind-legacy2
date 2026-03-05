import { GameState, FACEIT_LEVEL_ELO } from '@/types/game';
import { ARC_LABELS } from '@/lib/storyEngine';

interface Props { state: GameState }

function Bar({ label, value, max = 99, color = 'primary', inverse = false }: {
  label: string; value: number; max?: number; color?: string; inverse?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    primary: 'bg-primary',
    green: 'bg-cs2-green',
    blue: 'bg-cs2-blue',
    orange: 'bg-cs2-orange',
    red: 'bg-destructive',
    yellow: 'bg-yellow-400',
    purple: 'bg-cs2-purple',
    gold: 'bg-cs2-gold',
  };
  const barColor = colorMap[color] ?? 'bg-primary';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={`${inverse && value > 40 ? 'text-cs2-orange' : 'text-foreground'}`}>{Math.round(value)}</span>
      </div>
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatChip({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="text-center bg-secondary/60 rounded-md py-2 px-1">
      <div className={`text-base font-mono font-bold ${good ? 'text-cs2-green' : 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground font-mono">{label}</div>
    </div>
  );
}

function FaceitEloBar({ elo, level }: { elo: number; level: number }) {
  const range = FACEIT_LEVEL_ELO[level];
  if (!range) return null;
  const [min, max] = range;
  const pct = Math.min(100, ((elo - min) / (max - min)) * 100);
  const levelColor = level >= 9 ? 'text-cs2-gold' : level >= 7 ? 'text-cs2-orange' : level >= 5 ? 'text-cs2-green' : 'text-cs2-blue';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className={`font-bold ${levelColor}`}>FACEIT Level {level}</span>
        <span className="text-foreground font-bold">{elo} ELO</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${level >= 9 ? 'bg-cs2-gold' : level >= 7 ? 'bg-cs2-orange' : 'bg-cs2-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{min}</span>
        {level < 10 && <span>Next level: {max + 1} ELO</span>}
        {level === 10 && <span>🔥 MAX LEVEL</span>}
        <span>{max === 9999 ? '∞' : max}</span>
      </div>
    </div>
  );
}

export default function StatsPanel({ state }: Props) {
  const winRate = state.matchesPlayed > 0 ? Math.round((state.matchesWon / state.matchesPlayed) * 100) : 0;
  const arc = state.arc;
  const streak = state.streak;
  const rival = state.rival;
  const personality = state.personality;

  const confidenceColor = !streak ? 'text-muted-foreground' :
    streak.confidence >= 70 ? 'text-cs2-green' :
    streak.confidence >= 40 ? 'text-muted-foreground' : 'text-destructive';

  const stageColors: Record<string, string> = {
    'FaceIt Grind': 'bg-secondary text-muted-foreground border-border',
    'FPL-C': 'bg-cs2-blue/10 text-cs2-blue border-cs2-blue/30',
    'FPL': 'bg-primary/10 text-primary border-primary/30',
    'Academy': 'bg-cs2-blue/10 text-cs2-blue border-cs2-blue/30',
    'Tier 3': 'bg-cs2-green/10 text-cs2-green border-cs2-green/30',
    'Tier 2': 'bg-cs2-orange/10 text-cs2-orange border-cs2-orange/30',
    'Tier 1': 'bg-primary/10 text-primary border-primary/30',
    'Major Contender': 'bg-cs2-gold/10 text-cs2-gold border-cs2-gold/40',
    'Retired': 'bg-secondary text-muted-foreground border-border',
  };
  const stageColor = stageColors[state.stage] ?? 'bg-secondary text-muted-foreground';

  return (
    <div className="space-y-3">

      {/* ── HEADER ── */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground leading-tight">{state.playerName}</h2>
            <p className="text-xs font-mono text-primary">{state.role} · {state.region}</p>
          </div>
          <div className="text-right text-xs font-mono text-muted-foreground">
            <div>Age {state.age}</div>
            <div>Week {state.weeks}</div>
          </div>
        </div>

        {/* Stage + arc + team */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${stageColor}`}>{state.stage}</span>
          {state.team && (
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-secondary text-secondary-foreground border border-border">
              {state.team.name}
            </span>
          )}
          {arc?.type !== 'none' && arc?.label && (
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
              {arc.label}
            </span>
          )}
        </div>

        {/* Streak */}
        {streak && streak.current !== 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {(() => {
              const isHot = streak.current > 0;
              const abs = Math.abs(streak.current);
              const color = isHot
                ? abs >= 5 ? 'text-cs2-gold border-cs2-gold/50 bg-cs2-gold/10' : 'text-cs2-green border-cs2-green/40 bg-cs2-green/10'
                : abs >= 5 ? 'text-destructive border-destructive/50 bg-destructive/10' : 'text-cs2-orange border-cs2-orange/40 bg-cs2-orange/10';
              const icon = isHot ? (abs >= 5 ? '🔥🔥' : '🔥') : (abs >= 5 ? '💀' : '📉');
              return (
                <span className={`px-2 py-0.5 rounded border text-xs font-mono font-bold ${color}`}>
                  {icon} {isHot ? `${abs}W` : `${abs}L`} streak
                </span>
              );
            })()}
            <span className={`text-xs font-mono ${confidenceColor}`}>
              Confidence {Math.round(streak.confidence)}/100
            </span>
          </div>
        )}
      </div>

      {/* ── FACEIT ELO (only during grind) ── */}
      {state.stage === 'FaceIt Grind' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">FACEIT Progress</h3>
          <FaceitEloBar elo={state.faceitElo} level={state.faceitLevel} />
          <div className="mt-2 text-[10px] font-mono text-muted-foreground">
            Reach Level 10 + 3200 ELO → FPL-C invitation
          </div>
        </div>
      )}

      {/* ── HLTV STATS ── */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">HLTV Stats</h3>
          <div className="text-[10px] font-mono text-muted-foreground">{state.matchesPlayed}M · {winRate}%WR</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Rating" value={state.stats.rating.toFixed(2)} good={state.stats.rating > 1.1} />
          <StatChip label="ADR"    value={Math.round(state.stats.adr).toString()} good={state.stats.adr > 75} />
          <StatChip label="K/D"    value={state.stats.kd.toFixed(2)} good={state.stats.kd > 1.0} />
          <StatChip label="HS%"    value={`${Math.round(state.stats.hsPercent)}%`} good={state.stats.hsPercent > 45} />
          <StatChip label="KAST"   value={`${Math.round(state.stats.kast)}%`} good={state.stats.kast > 65} />
          <StatChip label="Clutch" value={`${Math.round(state.stats.clutchPercent)}%`} good={state.stats.clutchPercent > 10} />
        </div>
      </div>

      {/* ── ATTRIBUTES ── */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Attributes</h3>
        <Bar label="Aim" value={state.attributes.aim} color="primary" />
        <Bar label="Positioning" value={state.attributes.positioning} color="blue" />
        <Bar label="Game IQ" value={state.attributes.gameIQ} color="blue" />
        <Bar label="Nades" value={state.attributes.nadeUsage} color="blue" />
        <Bar label="Communication" value={state.attributes.communication} color="blue" />
        <Bar label="Mental" value={state.attributes.mentalStrength} color="green" />
        <Bar label="Consistency" value={state.attributes.consistency} color="green" />
      </div>

      {/* ── LIFESTYLE ── */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Lifestyle</h3>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${state.energy >= 50 ? 'bg-cs2-green' : state.energy >= 20 ? 'bg-yellow-400' : 'bg-destructive'}`} />
            <span className={`text-[10px] font-mono ${state.energy >= 50 ? 'text-cs2-green' : state.energy >= 20 ? 'text-yellow-400' : 'text-destructive'}`}>
              {Math.round(state.energy)}⚡
            </span>
          </div>
        </div>
        <Bar label="Motivation"    value={state.lifestyle.motivation}    max={100} color="green" />
        <Bar label="Physical"      value={state.lifestyle.physicalHealth} max={100} color="green" />
        <Bar label="Sleep"         value={state.lifestyle.sleepQuality}  max={100} color="blue" />
        <Bar label="Tilt"          value={state.lifestyle.tiltLevel}     max={100} color="red" inverse />
      </div>

      {/* ── PERSONALITY ── */}
      {personality && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Reputation</h3>
          <Bar label="Professionalism" value={personality.professionalism} max={100} color="green" />
          <Bar label="Toxicity"        value={personality.toxicity}        max={100} color="red" inverse />
          <Bar label="Clutch Rep"      value={personality.clutchReputation} max={100} color="yellow" />
          <Bar label="Reliability"     value={personality.reliability}     max={100} color="blue" />
          {personality.toxicity > 60 && (
            <p className="text-[10px] text-destructive font-mono mt-1">⚠️ High toxicity — orgs may refuse to sign you</p>
          )}
          {personality.clutchReputation > 70 && (
            <p className="text-[10px] text-yellow-400 font-mono mt-1">👑 Known clutch player — bonus in big moments</p>
          )}
        </div>
      )}

      {/* ── RIVAL ── */}
      {rival && (
        <div className="bg-card border border-cs2-orange/30 rounded-lg p-4">
          <h3 className="text-xs font-mono text-cs2-orange uppercase tracking-wider mb-2">⚔️ Rival</h3>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-display font-bold text-foreground">{rival.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{rival.team} · {rival.stage}</div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="text-cs2-green font-bold">{rival.wins}W</div>
              <div className="text-destructive font-bold">{rival.losses}L</div>
            </div>
          </div>
          <Bar label="Their Skill" value={rival.skill} max={99} color="orange" />
          <div className="mt-1">
            <Bar label="Beef Level" value={rival.beefLevel} max={100} color="red" />
          </div>
        </div>
      )}

      {/* ── TEAM ── */}
      {state.team && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Team</h3>
            <span className="text-xs font-mono text-cs2-gold font-bold">${Math.floor((state.activeContract?.monthlyUSD ?? state.team.salary / 4)).toLocaleString()}<span className="text-muted-foreground font-normal">/mo</span></span>
          </div>
          <div className="font-display font-semibold text-sm text-foreground mb-2">{state.team.name}</div>
          <Bar label="Chemistry" value={state.team.chemistry} max={100} color="green" />
          <div className="mt-1">
            <Bar label="Morale" value={state.team.morale ?? 70} max={100} color="blue" />
          </div>
          {state.team.teammates.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Teammates</div>
              {state.team.teammates.map((t, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono text-foreground">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">({t.personality})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-muted-foreground">{t.role}</span>
                    <span className={t.chemistry >= 70 ? 'text-cs2-green' : t.chemistry >= 40 ? 'text-yellow-400' : 'text-destructive'}>
                      ♥{Math.round(t.chemistry)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ECONOMY ── */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Economy</h3>
        <div className="text-2xl font-mono font-bold text-cs2-gold">${state.money.toLocaleString()}</div>
        <div className="text-[10px] text-muted-foreground font-mono mb-3">Career: ${state.earnings.toLocaleString()}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
          <span className="text-muted-foreground">Monitor: <span className="text-foreground">{state.equipment.monitor}</span></span>
          <span className="text-muted-foreground">Mouse: <span className="text-foreground">{state.equipment.mouse}</span></span>
          <span className="text-muted-foreground">Keyboard: <span className="text-foreground">{state.equipment.keyboard}</span></span>
          <span className="text-muted-foreground">PC: <span className="text-foreground">{state.equipment.pc}</span></span>
        </div>
        <div className="mt-2 pt-2 border-t border-border text-[10px] font-mono text-muted-foreground">
          Reputation: <span className="text-foreground">{Math.round(state.reputation)}/100</span>
        </div>
      </div>

      {/* ── AGE WARNING ── */}
      {state.age >= 27 && (
        <div className={`rounded-lg border p-3 text-xs font-mono ${state.age >= 30 ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-cs2-orange/40 bg-cs2-orange/5 text-cs2-orange'}`}>
          {state.age >= 30
            ? `⚠️ Age ${state.age} — significant skill decay. Consider retirement timeline.`
            : `⚡ Age ${state.age} — slight reflex decline starting. Train harder.`}
        </div>
      )}
    </div>
  );
}
