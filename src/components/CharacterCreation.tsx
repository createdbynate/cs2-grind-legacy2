import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Role, Region } from '@/types/game';
import { motion } from 'framer-motion';
import { Crosshair, Target, Brain, Shield, Eye } from 'lucide-react';

const ROLES: { role: Role; icon: React.ReactNode; desc: string }[] = [
  { role: 'Entry Fragger', icon: <Crosshair className="w-6 h-6" />, desc: 'First in, first kill. High risk, high reward.' },
  { role: 'AWPer', icon: <Target className="w-6 h-6" />, desc: 'One shot, one kill. The sniper specialist.' },
  { role: 'IGL', icon: <Brain className="w-6 h-6" />, desc: 'The brain. Call strats, read the enemy.' },
  { role: 'Support', icon: <Shield className="w-6 h-6" />, desc: 'Enable your team. Flashes, smokes, trades.' },
  { role: 'Lurker', icon: <Eye className="w-6 h-6" />, desc: 'Silent predator. Timing is everything.' },
];

const REGIONS: { region: Region; flag: string }[] = [
  { region: 'EU', flag: '🇪🇺' },
  { region: 'CIS', flag: '🇷🇺' },
  { region: 'NA', flag: '🇺🇸' },
  { region: 'SA', flag: '🇧🇷' },
  { region: 'Asia', flag: '🇰🇷' },
];

export default function CharacterCreation() {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [age, setAge] = useState(16);
  const [role, setRole] = useState<Role>('Entry Fragger');
  const [region, setRegion] = useState<Region>('EU');
  const [step, setStep] = useState(0);

  const handleStart = () => {
    if (!name.trim()) return;
    dispatch({ type: 'NEW_GAME', name: name.trim(), age, role, region });
  };

  const canLoadSave = !!localStorage.getItem('cs2-career-save');

  const loadSave = () => {
    try {
      const save = JSON.parse(localStorage.getItem('cs2-career-save')!);
      dispatch({ type: 'LOAD_GAME', state: save });
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold font-display tracking-tight"
          >
            <span className="text-primary">CS2</span>
            <span className="text-foreground"> CAREER</span>
          </motion.h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">From bedroom warrior to Major champion</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Player Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your IGN..."
                  maxLength={16}
                  className="w-full mt-2 bg-secondary border border-border rounded-md px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Starting Age: {age}</label>
                <input
                  type="range"
                  min={15}
                  max={18}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>15</span><span>16</span><span>17</span><span>18</span>
                </div>
              </div>

              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold tracking-wide hover:opacity-90 transition disabled:opacity-40"
              >
                CONTINUE
              </button>

              {canLoadSave && (
                <button
                  onClick={loadSave}
                  className="w-full py-2 rounded-md border border-border text-muted-foreground font-mono text-sm hover:text-foreground hover:border-primary transition"
                >
                  Load Save
                </button>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Choose Your Role</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <button
                    key={r.role}
                    onClick={() => setRole(r.role)}
                    className={`w-full flex items-center gap-4 p-4 rounded-md border transition ${
                      role === r.role ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-muted-foreground'
                    }`}
                  >
                    <div className={role === r.role ? 'text-primary' : 'text-muted-foreground'}>{r.icon}</div>
                    <div className="text-left">
                      <div className={`font-display font-semibold ${role === r.role ? 'text-primary' : 'text-foreground'}`}>{r.role}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold tracking-wide hover:opacity-90 transition"
              >
                CONTINUE
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Region</label>
              <div className="grid grid-cols-5 gap-2">
                {REGIONS.map(r => (
                  <button
                    key={r.region}
                    onClick={() => setRegion(r.region)}
                    className={`flex flex-col items-center p-3 rounded-md border transition ${
                      region === r.region ? 'border-primary bg-primary/10' : 'border-border bg-secondary hover:border-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl">{r.flag}</span>
                    <span className={`text-xs font-mono mt-1 ${region === r.region ? 'text-primary' : 'text-muted-foreground'}`}>{r.region}</span>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-secondary rounded-md p-4 font-mono text-sm space-y-1">
                <div className="text-muted-foreground">Name: <span className="text-foreground">{name}</span></div>
                <div className="text-muted-foreground">Age: <span className="text-foreground">{age}</span></div>
                <div className="text-muted-foreground">Role: <span className="text-primary">{role}</span></div>
                <div className="text-muted-foreground">Region: <span className="text-foreground">{region}</span></div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-bold text-lg tracking-wide hover:opacity-90 transition glow-primary"
              >
                START GRINDING
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
