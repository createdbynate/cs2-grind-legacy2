import {
  GameState, CareerArc, ArcType, Rival, CareerNarrativeEntry,
  NarrativeType, GameEvent, Region, CareerStage,
} from '@/types/game';
import { getAvailableEvents } from '@/lib/events';

// ─── RIVAL NAME POOLS ───
const RIVAL_NAMES: Record<Region, string[]> = {
  EU:   ['m0NESY', 'siuhy', 'railin', 'torzsi', 'Zeytennnn', 'xertioN', 'degster', 'Jimpphat'],
  CIS:  ['sh1ro', 'w0nderful', 'HObbit', 'KaiR0N', 'FL1T', 'iDISBALANCE', 'Patsi'],
  NA:   ['Stewie2K', 'oSee', 'Grim', 'floppy', 'junior', 'wiz', 'EliGE'],
  SA:   ['arT', 'saffee', 'dumau', 'chelo', 'KSCERATO', 'yuurih'],
  Asia: ['BnTeT', 'Techno4K', 'Skyfire', 'xccurate', 'mzinho', 'Woro2k'],
};

const RIVAL_TEAMS: Record<CareerStage, string[]> = {
  'FaceIt Grind': ['FaceIt Supremacy', 'pug lords'],
  'FPL-C': ['FPL-C Elite', 'Contender Clique'],
  'FPL': ['FPL Veterans', 'Invite Circle'],
  'Academy': ['NaVi Junior', 'G2 Academy', 'FaZe Rising'],
  'Tier 3': ['ENCE Prospect', 'Monte B', 'Apeks Rising'],
  'Tier 2': ['MOUZ NXT', 'paiN Gaming', 'OG Rising'],
  'Tier 1': ['Vitality', 'NaVi', 'G2'],
  'Major Contender': ['FaZe Clan', 'Team Spirit', 'heroic'],
  'Retired': ['Retired Legends'],
};

// ─── ARC DETECTION ───
export function detectArc(state: GameState): ArcType {
  const { streak, lifestyle, personality, weeks, stage, stats } = state;
  const currentArc = state.arc?.type ?? 'none';

  // Burnout arc: spiraling down
  if (lifestyle.motivation < 30 && lifestyle.physicalHealth < 40) return 'burnout';
  if (currentArc === 'burnout' && lifestyle.motivation < 50) return 'burnout'; // sticky

  // Injury recovery
  if (currentArc === 'injury_recovery' && lifestyle.physicalHealth < 70) return 'injury_recovery';

  // Toxic spiral: personality becoming problematic
  if (personality.toxicity > 60 && personality.professionalism < 40) return 'toxic_spiral';
  if (currentArc === 'toxic_spiral' && personality.toxicity > 45) return 'toxic_spiral';

  // Comeback arc: recovering from long loss streak
  if (streak.current <= -4) return 'comeback';
  if (currentArc === 'comeback' && streak.current < 0) return 'comeback';

  // Rival war: active rivalry with high beef
  if (state.rival && state.rival.beefLevel > 50) return 'rival_war';
  if (currentArc === 'rival_war' && state.rival && state.rival.beefLevel > 30) return 'rival_war';

  // Clutch king: building that reputation
  if (personality.clutchReputation > 60 && stats.clutchPercent > 12) return 'clutch_king';

  // Prodigy: fast early career
  if (weeks < 52 && stage !== 'FaceIt Grind' && stage !== 'FPL-C') return 'prodigy';

  // Breakout: sudden peak performance
  if (streak.current >= 5) return 'breakout';
  if (currentArc === 'breakout' && streak.current >= 2) return 'breakout';

  return 'none';
}

export const ARC_LABELS: Record<ArcType, string> = {
  none: '',
  burnout: '🔥 Burnout Arc',
  comeback: '⬆️ Comeback Arc',
  prodigy: '⚡ Prodigy Run',
  toxic_spiral: '☠️ Toxic Spiral',
  clutch_king: '👑 Clutch King',
  rival_war: '⚔️ Rival War',
  injury_recovery: '🩹 Recovery Arc',
  breakout: '🚀 Breakout',
};

// ─── WEIGHTED EVENT SELECTION ───
export function rollForStoryEvent(state: GameState): GameEvent | null {
  // Base 35% chance of event (vs original 30%)
  const eventChance = 0.35 + (state.arc?.type !== 'none' ? 0.1 : 0);
  if (Math.random() > eventChance) return null;

  const pool = getAvailableEvents(state);
  if (pool.length === 0) return null;

  // Weighted random selection
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return pool[pool.length - 1];
}

// ─── STREAK UPDATES ───
export function updateStreak(state: GameState, won: boolean): GameState {
  const s = { ...state, streak: { ...state.streak } };

  if (won) {
    s.streak.current = Math.max(0, s.streak.current) + 1;
    s.streak.longestWin = Math.max(s.streak.longestWin, s.streak.current);
    // Hot streak boosts confidence
    s.streak.confidence = Math.min(100, s.streak.confidence + (s.streak.current >= 3 ? 6 : 3));
  } else {
    s.streak.current = Math.min(0, s.streak.current) - 1;
    s.streak.longestLoss = Math.max(s.streak.longestLoss, Math.abs(s.streak.current));
    // Cold streak tanks confidence
    s.streak.confidence = Math.max(0, s.streak.confidence - (s.streak.current <= -3 ? 8 : 4));
  }

  return s;
}

// ─── CONFIDENCE MODIFIER ───
export function confidenceMultiplier(confidence: number): number {
  // 0.85 at confidence=0, 1.0 at confidence=50, 1.15 at confidence=100
  return 0.85 + (confidence / 100) * 0.3;
}

// ─── ARC STATE UPDATE ───
export function updateArc(state: GameState): GameState {
  const detectedArc = detectArc(state);
  const currentArc = state.arc;

  if (detectedArc === currentArc.type) return state; // no change

  const s = { ...state };

  if (detectedArc !== 'none' && detectedArc !== currentArc.type) {
    s.arc = {
      type: detectedArc,
      startWeek: state.weeks,
      intensity: 50,
      resolved: false,
      label: ARC_LABELS[detectedArc],
    };

    // Log arc transition to career narrative
    const arcStartTexts: Record<ArcType, string> = {
      burnout: 'The grind is taking its toll. Burnout is setting in.',
      comeback: 'Rock bottom hit. But that\'s where the story gets interesting.',
      prodigy: 'A prodigy run — the scene is taking notice of how fast you\'re rising.',
      toxic_spiral: 'The toxicity is starting to define you. Orgs are noticing.',
      clutch_king: 'You\'re becoming known for performing when it matters most.',
      rival_war: 'The rivalry is real. Every match against them means everything now.',
      injury_recovery: 'The body is sending signals. Recovery mode activated.',
      breakout: 'This is it — the breakthrough everyone saw coming but nobody predicted when.',
      none: '',
    };

    if (arcStartTexts[detectedArc]) {
      s.careerNarrative = [
        ...(s.careerNarrative ?? []),
        { week: state.weeks, text: arcStartTexts[detectedArc], type: 'milestone' },
      ];
    }
  } else if (detectedArc === 'none' && currentArc.type !== 'none') {
    s.arc = { ...currentArc, resolved: true, type: 'none' };
  }

  return s;
}

// ─── RIVAL GENERATION ───
export function generateRival(state: GameState): Rival {
  const namePool = RIVAL_NAMES[state.region] ?? RIVAL_NAMES.EU;
  const teamPool = RIVAL_TEAMS[state.stage] ?? ['Unknown Org'];

  // Pick a name that's not already a teammate
  const teammates = state.team?.teammates.map(t => t.name) ?? [];
  const available = namePool.filter(n => !teammates.includes(n));
  const name = available[Math.floor(Math.random() * available.length)] ?? 'x_rival_x';

  return {
    name,
    team: teamPool[Math.floor(Math.random() * teamPool.length)],
    skill: Math.floor(55 + Math.random() * 30),
    stage: state.stage,
    wins: 0,
    losses: 0,
    beefLevel: 10 + Math.floor(Math.random() * 30),
  };
}

// ─── ADD NARRATIVE ENTRY ───
export function addNarrativeEntry(
  state: GameState,
  text: string,
  type: NarrativeType
): GameState {
  const entry: CareerNarrativeEntry = { week: state.weeks, text, type };
  return {
    ...state,
    careerNarrative: [...(state.careerNarrative ?? []), entry],
  };
}

// ─── HOT STREAK MESSAGES ───
export function getStreakMessage(streak: number): string | null {
  if (streak >= 7) return `🔥🔥🔥 ${streak}-game win streak! You are UNSTOPPABLE right now.`;
  if (streak >= 5) return `🔥🔥 ${streak} in a row! Confidence is through the roof.`;
  if (streak >= 3) return `🔥 ${streak}-game win streak going.`;
  if (streak <= -5) return `💀 ${Math.abs(streak)}-game losing streak. Everything is falling apart.`;
  if (streak <= -3) return `😰 ${Math.abs(streak)} losses in a row. The slump is real.`;
  return null;
}

// ─── DEFAULT STATE VALUES (for loading old saves) ───
export function ensureNewStateFields(state: GameState): GameState {
  const s = { ...state };

  if (!s.personality) {
    s.personality = {
      professionalism: 50,
      toxicity: 10,
      clutchReputation: 20,
      reliability: 60,
      dedication: 50,
    };
  }

  if (!s.streak) {
    s.streak = { current: 0, longestWin: 0, longestLoss: 0, confidence: 50 };
  }

  if (!s.arc) {
    s.arc = { type: 'none', startWeek: 0, intensity: 0, resolved: false, label: '' };
  }

  if (s.rival === undefined) s.rival = null;
  if (!s.careerNarrative) s.careerNarrative = [];
  if (!s.eventHistory) s.eventHistory = [];

  // Ensure team has morale
  if (s.team && s.team.morale === undefined) {
    s.team = { ...s.team, morale: 70 };
  }

  // Ensure teammates have personality + mood
  if (s.team?.teammates) {
    const personalities = ['aggressive', 'supportive', 'passive', 'toxic', 'leader'] as const;
    s.team = {
      ...s.team,
      teammates: s.team.teammates.map(t => ({
        ...t,
        personality: t.personality ?? personalities[Math.floor(Math.random() * personalities.length)],
        mood: t.mood ?? 70,
      })),
    };
  }

  return s;
}
