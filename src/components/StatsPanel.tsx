import { GameState } from '@/types/game';

interface Props {
  state: GameState;
}

function StatBar({ label, value, max = 99, color = 'primary' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === 'primary' ? 'bg-primary' : color === 'green' ? 'bg-cs2-green' : color === 'orange' ? 'bg-cs2-orange' : color === 'red' ? 'bg-destructive' : color === 'yellow' ? 'bg-yellow-400' : 'bg-cs2-blue'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EnergyBar({ energy }: { energy: number }) {
  const pct = Math.min(100, energy);
  const color = energy >= 50 ? 'bg-cs2-green' : energy >= 20 ? 'bg-yellow-400' : 'bg-destructive';
  const label = energy >= 50 ? 'Fresh' : energy >= 20 ? 'Tired' : 'Exhausted';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">Energy</span>
        <span className={energy >= 50 ? 'text-cs2-green' : energy >= 20 ? 'text-yellow-400' : 'text-destructive'}>
          {Math.round(energy)}/100 · {label}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsPanel({ state }: Props) {
  const winRate = state.matchesPlayed > 0 ? Math.round((state.matchesWon / state.matchesPlayed) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">{state.playerName}</h2>
            <p className="text-xs font-mono text-primary">{state.role} · {state.region}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-muted-foreground">Age {state.age}</div>
            <div className="text-xs font-mono text-muted-foreground">Week {state.weeks}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-primary/20 text-primary">{state.stage}</span>
          {state.team && <span className="px-2 py-0.5 rounded text-xs font-mono bg-secondary text-secondary-foreground">{state.team.name}</span>}
        </div>
      </div>

      {/* Energy */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Energy</h3>
        <EnergyBar energy={state.energy} />
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Training: -30 · Match: -15 · Stream: -10 · Rest: +50 · Weekly: +10
        </p>
      </div>

      {/* HLTV Stats */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">HLTV Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Rating', value: state.stats.rating.toFixed(2), good: state.stats.rating > 1.1 },
            { label: 'ADR', value: Math.round(state.stats.adr).toString(), good: state.stats.adr > 75 },
            { label: 'K/D', value: state.stats.kd.toFixed(2), good: state.stats.kd > 1.0 },
            { label: 'HS%', value: `${Math.round(state.stats.hsPercent)}%`, good: state.stats.hsPercent > 45 },
            { label: 'KAST', value: `${Math.round(state.stats.kast)}%`, good: state.stats.kast > 65 },
            { label: 'Clutch', value: `${Math.round(state.stats.clutchPercent)}%`, good: state.stats.clutchPercent > 10 },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-mono font-bold ${s.good ? 'text-cs2-green' : 'text-foreground'}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs font-mono text-muted-foreground">
          <span>{state.matchesPlayed} matches</span>
          <span>{winRate}% winrate</span>
          <span>FaceIt Lvl {state.faceitLevel}</span>
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Attributes</h3>
        <StatBar label="Aim" value={state.attributes.aim} color="primary" />
        <StatBar label="Positioning" value={state.attributes.positioning} color="blue" />
        <StatBar label="Game IQ" value={state.attributes.gameIQ} color="blue" />
        <StatBar label="Nades" value={state.attributes.nadeUsage} color="blue" />
        <StatBar label="Communication" value={state.attributes.communication} color="blue" />
        <StatBar label="Mental" value={state.attributes.mentalStrength} color="green" />
        <StatBar label="Consistency" value={state.attributes.consistency} color="green" />
      </div>

      {/* Lifestyle */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Lifestyle</h3>
        <StatBar label="Motivation" value={state.lifestyle.motivation} max={100} color="green" />
        <StatBar label="Physical Health" value={state.lifestyle.physicalHealth} max={100} color="green" />
        <StatBar label="Sleep Quality" value={state.lifestyle.sleepQuality} max={100} color="blue" />
        <StatBar label="Tilt Level" value={state.lifestyle.tiltLevel} max={100} color="red" />
      </div>

      {/* Team */}
      {state.team && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Team</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-display font-semibold text-foreground">{state.team.name}</span>
            <span className="text-xs font-mono text-cs2-gold">${(state.team.salary / 4).toLocaleString()}/wk</span>
          </div>
          <StatBar label="Team Chemistry" value={state.team.chemistry} max={100} color="green" />
          {state.team.teammates.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Teammates</div>
              {state.team.teammates.map((t, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-mono">
                  <span className="text-foreground">{t.name}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{t.role}</span>
                    <span className={t.chemistry >= 70 ? 'text-cs2-green' : t.chemistry >= 40 ? 'text-yellow-400' : 'text-destructive'}>
                      ♥ {Math.round(t.chemistry)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tournament History */}
      {state.tournamentHistory.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Tournament History</h3>
          <div className="space-y-2">
            {state.tournamentHistory.slice(-5).reverse().map((t, i) => (
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

      {/* Money & Equipment */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Equipment & Money</h3>
        <div className="text-2xl font-mono font-bold text-cs2-gold">${state.money.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground font-mono mb-3">Total earned: ${state.earnings.toLocaleString()}</div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="text-muted-foreground">Monitor: <span className="text-foreground">{state.equipment.monitor}</span></div>
          <div className="text-muted-foreground">Mouse: <span className="text-foreground">{state.equipment.mouse}</span></div>
          <div className="text-muted-foreground">Keyboard: <span className="text-foreground">{state.equipment.keyboard}</span></div>
          <div className="text-muted-foreground">PC: <span className="text-foreground">{state.equipment.pc}</span></div>
        </div>
        <div className="mt-2 text-xs font-mono text-muted-foreground">
          Reputation: <span className="text-foreground">{Math.round(state.reputation)}/100</span>
        </div>
      </div>
    </div>
  );
}
