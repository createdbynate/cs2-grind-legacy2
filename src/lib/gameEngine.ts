import {
  GameState, TrainingFocus, MatchResult, GameEvent, EventChoice,
  Role, Region, CareerStage, Attributes, Equipment,
  EQUIPMENT_PRICES, MonitorTier, MouseTier, KeyboardTier, PCTier,
  Tournament, TournamentType, TournamentResult, Teammate,
  ENERGY_COSTS, TeammatePersonality,
  ContractOffer, ActiveContract, TournamentInvite,
  FACEIT_LEVEL_ELO, CareerChallenge, LifetimeStats,
} from '@/types/game';
import {
  rollForStoryEvent, updateStreak, updateArc,
  generateRival, addNarrativeEntry, getStreakMessage,
  confidenceMultiplier, ensureNewStateFields,
} from '@/lib/storyEngine';

// ─── TEAMMATE NAME POOLS ───
const TEAMMATE_NAMES: Record<Region, string[]> = {
  EU: ['k0nfig', 'dupreeh', 'Xyp9x', 'magisk', 'es3tag', 'hallzerk', 'stavn', 'TeSeS', 'nicoodoz',
       'hampus', 'REZ', 'Plopski', 'twist', 'Golden', 'valde', 'AcoR', 'gade', 'Snappi', 'farlig',
       'Blamef', 'CadiaN', 'jks', 'tabseN', 'syrsoN', 'Bymas', 'neityu', 'flameZ', 'torzsi', 'siuhy'],
  CIS: ['Buster', 'Perfecto', 'YEKINDAR', 'Qikert', 'Ax1Le', 'nafany', 'sdy', 'Forester',
        'iDISBALANCE', 'Jame', 'FL1T', 'n0rb3r7', 'KaiR0N', 'electroNic', 'b1t', 'fame',
        'donk', 'magixx', 'w0nderful', 'chopper'],
  NA:  ['Twistzz', 'NAF', 'Stewie2K', 'tarik', 'RUSH', 'FugLy', 'daps', 'stanislaw',
        'autimatic', 'nitr0', 'Ethan', 'cerq', 'oSee', 'wiz', 'junior', 'Grim', 'floppy', 'malbsMd'],
  SA:  ['KSCERATO', 'yuurih', 'chelo', 'HEN1', 'VINI', 'FalleN', 'fer', 'coldzera', 'taco',
        'boltz', 'LUCAS1', 'exit', 'arT', 'saffee', 'dumau', 'drop', 'skullz'],
  Asia: ['EliGE', 'xccurate', 'Stark', 'BnTeT', 'Skyfire', 'mzinho', 'Thomas', 'Woro2k',
         'niqua', 'dycha', 'Techno4K', 'shalfari', 'oskar', 'sense', 'sh1ro'],
};

const ROLES: Role[] = ['Entry Fragger', 'AWPer', 'IGL', 'Support', 'Lurker'];
const PERSONALITIES: TeammatePersonality[] = ['aggressive', 'supportive', 'passive', 'toxic', 'leader'];

// ─── TEAM NAME POOLS ───
const TEAM_NAMES: Record<string, string[]> = {
  Academy: ['Vitality Academy', 'NAVI Junior', 'G2 Academy', 'FaZe Rising', 'Cloud9 Academy', 'Astralis Talent', 'Heroic Academy'],
  'Tier 3': ['ENCE', 'Into The Breach', 'Apeks', 'SAW', 'Monte', 'Sangal', 'Passion UA', 'Sprout', '500', 'Lynn Vision'],
  'Tier 2': ['MOUZ', 'Complexity', 'Imperial', 'paiN', 'OG', 'Eternal Fire', 'BIG', 'Ninjas in Pyjamas', 'FURIA', 'Falcons'],
  'Tier 1': ['NAVI', 'Vitality', 'FaZe', 'G2', 'Cloud9', 'Heroic', 'Astralis', 'Spirit', 'MOUZ', 'Liquid'],
  'Major Contender': ['NAVI', 'Vitality', 'FaZe', 'G2', 'Spirit', 'MOUZ'],
};

function generateTeammates(region: Region, tier: CareerStage): Teammate[] {
  const pool = [...TEAMMATE_NAMES[region]];
  const teammates: Teammate[] = [];
  const tierSkillBase: Record<string, number> = {
    'Academy': 38, 'Tier 3': 52, 'Tier 2': 66, 'Tier 1': 80, 'Major Contender': 88,
  };
  const base = tierSkillBase[tier] ?? 40;

  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const name = pool.splice(idx, 1)[0] ?? `Player${i}`;
    teammates.push({
      name,
      role: ROLES[Math.floor(Math.random() * ROLES.length)],
      skill: Math.floor(base + Math.random() * 15 - 5),
      chemistry: 40 + Math.floor(Math.random() * 20),
      personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
      mood: 60 + Math.floor(Math.random() * 30),
    });
  }
  return teammates;
}

// ─── CHALLENGE POOL ───
const CHALLENGE_POOL: Omit<CareerChallenge, 'completed'>[] = [
  { id: 'win_streak_7', title: 'Hot Streak', description: 'Win 7 matches in a row at any point.', type: 'win_streak', target: 7, bonusDesc: 'Confidence legend', legacyBonus: 60 },
  { id: 'matches_100', title: 'The Grinder', description: 'Play 100 total matches.', type: 'matches_played', target: 100, bonusDesc: 'Iron will', legacyBonus: 40 },
  { id: 'earn_250k', title: 'Money Maker', description: 'Earn $250,000 over your career.', type: 'earn_money', target: 250000, bonusDesc: 'Financially set', legacyBonus: 50 },
  { id: 'win_3_tournaments', title: 'Tournament King', description: 'Win 3 tournaments.', type: 'win_tournament', target: 3, bonusDesc: 'Trophy cabinet', legacyBonus: 75 },
  { id: 'major_champ', title: 'Major Champion', description: 'Win a Valve Major.', type: 'major_champion', target: 1, bonusDesc: 'All-time great', legacyBonus: 200 },
  { id: 'level10', title: 'FACEIT Legend', description: 'Reach FACEIT Level 10.', type: 'level10_faceit', target: 10, bonusDesc: 'Scene noticed you', legacyBonus: 35 },
  { id: 'clutch_15pct', title: 'Clutch God', description: 'Achieve 15%+ clutch rate.', type: 'clutch_percent', target: 15, bonusDesc: 'Nerves of steel', legacyBonus: 55 },
  { id: 'no_big_loss', title: 'Unbreakable', description: 'Never go on a losing streak of 5 or more.', type: 'no_big_loss_streak', target: 5, bonusDesc: 'Mental fortress', legacyBonus: 45 },
  { id: 'professionalism_80', title: 'The Professional', description: 'Reach 80+ Professionalism.', type: 'professionalism', target: 80, bonusDesc: 'Respected in the scene', legacyBonus: 40 },
  { id: 'earn_50k', title: 'First Paycheck', description: 'Earn $50,000 total.', type: 'earn_money', target: 50000, bonusDesc: 'Broke through', legacyBonus: 25 },
];

function generateChallenges(): CareerChallenge[] {
  const pool = [...CHALLENGE_POOL];
  const selected: CareerChallenge[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push({ ...pool.splice(idx, 1)[0], completed: false });
  }
  return selected;
}

// ─── LEGACY SCORE ───
export function calculateLegacyScore(state: GameState): number {
  const stageScores: Record<string, number> = {
    'FaceIt Grind': 10, 'FPL-C': 20, 'FPL': 30, 'Academy': 50,
    'Tier 3': 75, 'Tier 2': 100, 'Tier 1': 150, 'Major Contender': 200, 'Retired': 50,
  };
  let score = stageScores[state.stage] ?? 10;
  const tournyWins = state.tournamentHistory.filter(t => t.placement.includes('1st')).length;
  score += tournyWins * 25;
  score += Math.floor(state.matchesPlayed / 20) * 5;
  score += Math.floor(state.earnings / 100000) * 10;
  score += (state.streak?.longestWin ?? 0) * 3;
  const challenges = state.careerChallenges ?? [];
  score += challenges.filter(c => c.completed).reduce((sum, c) => sum + c.legacyBonus, 0);
  if (state.achievements.includes('Valve Major Champion')) score += 300;
  return score;
}

// ─── LIFETIME STATS ───
export function loadLifetimeStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem('cs2-lifetime');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalCareers: 0, bestGrade: 'D', majorsWon: 0, totalEarnings: 0, bestWinStreak: 0, totalMatchesPlayed: 0, totalTournamentsWon: 0, totalLegacyScore: 0 };
}

export function saveLifetimeStats(state: GameState, grade: string): void {
  try {
    const existing = loadLifetimeStats();
    const tournyWins = state.tournamentHistory.filter(t => t.placement.includes('1st')).length;
    const gradeOrder = ['D', 'C', 'C+', 'B', 'A', 'A+', 'S', 'S+'];
    const bestGrade = gradeOrder.indexOf(grade) > gradeOrder.indexOf(existing.bestGrade) ? grade : existing.bestGrade;
    const updated: LifetimeStats = {
      totalCareers: existing.totalCareers + 1,
      bestGrade,
      majorsWon: existing.majorsWon + (state.achievements.includes('Valve Major Champion') ? 1 : 0),
      totalEarnings: existing.totalEarnings + state.earnings,
      bestWinStreak: Math.max(existing.bestWinStreak, state.streak?.longestWin ?? 0),
      totalMatchesPlayed: existing.totalMatchesPlayed + state.matchesPlayed,
      totalTournamentsWon: existing.totalTournamentsWon + tournyWins,
      totalLegacyScore: existing.totalLegacyScore + calculateLegacyScore(state),
    };
    localStorage.setItem('cs2-lifetime', JSON.stringify(updated));
  } catch {}
}

// ─── CHALLENGE PROGRESS CHECK ───
export function updateChallenges(state: GameState): GameState {
  if (!state.careerChallenges?.length) return state;
  const challenges = state.careerChallenges.map(c => {
    if (c.completed) return c;
    let completed = false;
    const tournyWins = state.tournamentHistory.filter(t => t.placement.includes('1st')).length;
    switch (c.type) {
      case 'win_streak': completed = (state.streak?.longestWin ?? 0) >= c.target; break;
      case 'matches_played': completed = state.matchesPlayed >= c.target; break;
      case 'earn_money': completed = state.earnings >= c.target; break;
      case 'win_tournament': completed = tournyWins >= c.target; break;
      case 'major_champion': completed = state.achievements.includes('Valve Major Champion'); break;
      case 'level10_faceit': completed = state.faceitLevel >= c.target; break;
      case 'clutch_percent': completed = state.stats.clutchPercent >= c.target; break;
      case 'no_big_loss_streak': completed = (state.streak?.longestLoss ?? 0) < c.target; break;
      case 'professionalism': completed = state.personality.professionalism >= c.target; break;
    }
    if (completed && !c.completed) return { ...c, completed: true };
    return c;
  });

  const newlyCompleted = challenges.filter((c, i) => c.completed && !state.careerChallenges[i].completed);
  let s = { ...state, careerChallenges: challenges };
  for (const c of newlyCompleted) {
    s.weekLog = [...(s.weekLog ?? []), `🎯 Challenge Complete: "${c.title}" — ${c.bonusDesc}! (+${c.legacyBonus} Legacy)`];
    s.legacyScore = (s.legacyScore ?? 0) + c.legacyBonus;
  }
  return s;
}

// ─── INITIALIZATION ───
export function createInitialState(name: string, age: number, role: Role, region: Region): GameState {
  const startElo = 1051 + Math.floor(Math.random() * 100); // start bottom of level 5 (1051-1150)
  return {
    playerName: name,
    age,
    weeks: 0,
    role,
    region,
    stage: 'FaceIt Grind',
    stats: {
      adr: 55 + Math.random() * 15,
      kd: 0.85 + Math.random() * 0.25,
      hsPercent: 32 + Math.random() * 18,
      kast: 56 + Math.random() * 10,
      rating: 0.9 + Math.random() * 0.2,
      clutchPercent: 5 + Math.random() * 10,
    },
    attributes: {
      aim: 22 + Math.floor(Math.random() * 14),
      positioning: 16 + Math.floor(Math.random() * 12),
      gameIQ: 16 + Math.floor(Math.random() * 12),
      nadeUsage: 10 + Math.floor(Math.random() * 10),
      communication: 15 + Math.floor(Math.random() * 12),
      mentalStrength: 20 + Math.floor(Math.random() * 15),
      consistency: 20 + Math.floor(Math.random() * 12),
    },
    lifestyle: { hoursPerDay: 6, sleepQuality: 70, physicalHealth: 82, motivation: 88, tiltLevel: 10 },
    equipment: { monitor: '60Hz', mouse: 'Budget', keyboard: 'Membrane', pc: 'Potato' },
    team: null,
    activeContract: null,
    pendingOffers: [],
    money: 150,
    reputation: 5,
    matchesPlayed: 0,
    matchesWon: 0,
    lastMatchResult: null,
    recentRatings: [],
    faceitLevel: 5,
    faceitElo: startElo,
    earnings: 0,
    energy: 100,
    activeTournament: null,
    pendingTournamentInvites: [],
    tournamentHistory: [],
    currentEvent: null,
    weekLog: [`Your CS2 journey begins. You're FACEIT Level 5 (${startElo} ELO). Time to grind.`],
    gameOver: false,
    achievements: [],
    personality: {
      professionalism: 50,
      toxicity: 10,
      clutchReputation: 20,
      reliability: 60,
      dedication: 50,
    },
    streak: { current: 0, longestWin: 0, longestLoss: 0, confidence: 50 },
    arc: { type: 'none', startWeek: 0, intensity: 0, resolved: false, label: '' },
    rival: null,
    careerNarrative: [],
    eventHistory: [],
    matchMomentBoost: 0,
    pendingMatch: false,
    careerChallenges: generateChallenges(),
    legacyScore: 0,
  };
}

// ─── AGE MODIFIER ───
function ageMod(age: number): number {
  if (age <= 17) return 1.05; // young players learn faster
  if (age <= 24) return 1.0;
  if (age <= 27) return 0.92;
  if (age <= 30) return 0.75;
  if (age <= 33) return 0.55;
  return 0.35;
}

// ─── SKILL DECAY (for 27+) ───
function applySkillDecay(state: GameState): GameState {
  if (state.age < 27) return state;

  const decayRate = state.age >= 30 ? 0.3 : state.age >= 28 ? 0.15 : 0.05;
  // Aim and positioning decay most, IQ and comms decay least
  return {
    ...state,
    attributes: {
      ...state.attributes,
      aim: Math.max(10, state.attributes.aim - decayRate * (1 + Math.random() * 0.5)),
      positioning: Math.max(10, state.attributes.positioning - decayRate * 0.6),
      consistency: Math.max(10, state.attributes.consistency - decayRate * 0.4),
    },
  };
}

function equipmentBonus(eq: Equipment): number {
  let b = 0;
  if (eq.monitor === '144Hz') b += 3; else if (eq.monitor === '240Hz') b += 6; else if (eq.monitor === '360Hz') b += 9;
  if (eq.mouse === 'Mid-Range') b += 2; else if (eq.mouse === 'Pro') b += 5;
  if (eq.keyboard === 'Mechanical') b += 1; else if (eq.keyboard === 'Custom') b += 3;
  if (eq.pc === 'Mid') b += 2; else if (eq.pc === 'High-End') b += 5; else if (eq.pc === 'Beast') b += 8;
  return b;
}

function energyMultiplier(energy: number): number {
  if (energy >= 50) return 1.0;
  if (energy >= 20) return 0.65;
  return 0.35;
}

// ─── CORE PERFORMANCE CALCULATION ───
function calculatePerformance(state: GameState): number {
  const attr = state.attributes;
  const eq = equipmentBonus(state.equipment);
  const chemBonus = state.team ? (state.team.chemistry / 100) * 5 : 0;

  const baseSkill = (
    attr.aim * 0.3 +
    attr.positioning * 0.2 +
    attr.gameIQ * 0.2 +
    attr.consistency * 0.15 +
    attr.communication * 0.1 +
    attr.nadeUsage * 0.05 +
    eq + chemBonus
  ) / 100;

  const mentality = (state.lifestyle.motivation - state.lifestyle.tiltLevel) / 100;
  const ageM = ageMod(state.age);
  const confM = confidenceMultiplier(state.streak?.confidence ?? 50);

  return baseSkill * (0.7 + Math.random() * 0.6) * (1 + mentality * 0.3) * ageM * confM;
}

// ─── OVERALL SKILL SCORE ───
export function getOverallSkill(state: GameState): number {
  const a = state.attributes;
  return (a.aim * 0.3 + a.positioning * 0.2 + a.gameIQ * 0.2 + a.consistency * 0.15 + a.communication * 0.1 + a.nadeUsage * 0.05);
}

// ─── TRAINING ───
export function applyTraining(state: GameState, focus: TrainingFocus): GameState {
  const s = { ...state, attributes: { ...state.attributes }, lifestyle: { ...state.lifestyle } };

  const energyMod = energyMultiplier(s.energy);
  const dedicationMod = 1 + (s.personality.dedication / 200);
  const gain = (1 + Math.random()) * ageMod(s.age) * (s.lifestyle.motivation / 100) * energyMod * dedicationMod;
  const attrKey = focus === 'nades' ? 'nadeUsage' : focus;
  s.attributes[attrKey] = Math.min(99, s.attributes[attrKey] + gain);
  s.attributes.consistency = Math.min(99, s.attributes.consistency + gain * 0.2);

  s.energy = Math.max(0, s.energy - ENERGY_COSTS.train);
  s.lifestyle.motivation = Math.max(0, s.lifestyle.motivation - 2 + Math.random() * 3);
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 1);
  s.lifestyle.hoursPerDay = Math.min(16, s.lifestyle.hoursPerDay + 0.2);

  if (s.energy < 20) {
    s.weekLog = [...(s.weekLog ?? []), `⚠️ Exhausted — training at ${Math.round(energyMod * 100)}% efficiency.`];
  }

  if (s.personality && Math.random() > 0.7) {
    s.personality = { ...s.personality, dedication: Math.min(100, s.personality.dedication + 1) };
  }

  return s;
}

// ─── TEAM PRACTICE ───
export function applyTeamPractice(state: GameState): GameState {
  if (!state.team) return state;
  const s = {
    ...state,
    attributes: { ...state.attributes },
    lifestyle: { ...state.lifestyle },
    team: { ...state.team, teammates: [...state.team.teammates] },
  };

  const energyMod = energyMultiplier(s.energy);
  const gain = (0.5 + Math.random() * 0.8) * ageMod(s.age) * (s.lifestyle.motivation / 100) * energyMod;

  s.attributes.communication = Math.min(99, s.attributes.communication + gain);
  s.attributes.gameIQ = Math.min(99, s.attributes.gameIQ + gain * 0.6);

  const chemGain = 3 + Math.random() * 5;
  s.team.chemistry = Math.min(100, s.team.chemistry + chemGain);
  s.team.morale = Math.min(100, (s.team.morale ?? 70) + 3);

  s.team.teammates = s.team.teammates.map(t => ({
    ...t,
    chemistry: Math.min(100, t.chemistry + 2 + Math.random() * 3),
    mood: Math.min(100, (t.mood ?? 70) + 3),
  }));

  s.energy = Math.max(0, s.energy - ENERGY_COSTS.team_practice);
  s.lifestyle.motivation = Math.max(0, s.lifestyle.motivation - 3 + Math.random() * 2);

  s.weekLog = [...(s.weekLog ?? []), `🤝 Team practice with ${s.team.name}. Chemistry: ${Math.round(s.team.chemistry)}/100`];

  return s;
}

// ─── MATCH SIMULATION ───
export function simulateMatch(state: GameState): { state: GameState; result: MatchResult } {
  const performance = calculatePerformance(state);
  const attr = state.attributes;

  const momentBoost = state.matchMomentBoost ?? 0;
  const kills = Math.floor(12 + performance * 18 + Math.random() * 6);
  const deaths = Math.floor(8 + (1 - performance) * 14 + Math.random() * 5);
  const adr = Math.floor(50 + performance * 50 + Math.random() * 15);
  const rating = Math.round((0.6 + performance * 0.9 + Math.random() * 0.2) * 100) / 100;
  const won = performance + momentBoost + Math.random() * 0.3 > 0.5;
  const mvp = performance > 0.65 && Math.random() > 0.5;
  const clutchMoment = attr.mentalStrength > 60 && Math.random() < 0.12 + (state.personality.clutchReputation / 500);

  const matchType: MatchResult['type'] =
    state.stage === 'FaceIt Grind' ? 'pug' :
    state.stage === 'FPL-C' || state.stage === 'FPL' ? 'scrim' :
    state.team ? 'official' : 'pug';

  const streakMsg = getStreakMessage(state.streak?.current ?? 0);

  const result: MatchResult = {
    won, kills, deaths, adr, rating, mvp,
    type: matchType as MatchResult['type'],
    clutchMoment,
    streakEffect: streakMsg ? (state.streak.current > 0 ? 'hot' : 'cold') : undefined,
  };

  let newState = { ...state, stats: { ...state.stats }, lifestyle: { ...state.lifestyle }, matchMomentBoost: 0, pendingMatch: false };

  // Rolling averages
  const m = newState.matchesPlayed;
  newState.stats.adr = Math.round((newState.stats.adr * m + adr) / (m + 1));
  newState.stats.kd = Math.round(((newState.stats.kd * m + kills / Math.max(1, deaths)) / (m + 1)) * 100) / 100;
  newState.stats.rating = Math.round(((newState.stats.rating * m + rating) / (m + 1)) * 100) / 100;
  newState.stats.hsPercent = Math.round((newState.stats.hsPercent * m + 30 + attr.aim * 0.4 + Math.random() * 10) / (m + 1));
  newState.stats.kast = Math.round((newState.stats.kast * m + 50 + performance * 30 + Math.random() * 10) / (m + 1));
  newState.stats.clutchPercent = Math.round(
    (newState.stats.clutchPercent * m + (performance > 0.6 ? 10 + Math.random() * 15 : Math.random() * 8)) / (m + 1)
  );

  // Track recent ratings for performance clause
  newState.recentRatings = [...(newState.recentRatings ?? []), rating].slice(-8);

  newState.matchesPlayed++;
  if (won) newState.matchesWon++;
  newState.lastMatchResult = result;
  newState.energy = Math.max(0, newState.energy - ENERGY_COSTS.match);

  // FACEIT ELO update (during FaceIt Grind)
  if (newState.stage === 'FaceIt Grind') {
    // Real FACEIT: average ±20-25 ELO per match, K-factor ~50
    const eloChange = won
      ? Math.floor(18 + Math.random() * 10 + (performance > 0.7 ? 5 : 0))
      : -Math.floor(15 + Math.random() * 12);
    newState.faceitElo = Math.max(0, newState.faceitElo + eloChange);
    // Update faceit level based on ELO
    for (const [lvl, [min, max]] of Object.entries(FACEIT_LEVEL_ELO)) {
      if (newState.faceitElo >= min && newState.faceitElo <= max) {
        newState.faceitLevel = Number(lvl);
        break;
      }
    }
    if (newState.faceitElo >= 2001) newState.faceitLevel = 10;
    const eloSign = eloChange >= 0 ? '+' : '';
    newState.weekLog = [...(newState.weekLog ?? []),
      `${won ? '✅' : '❌'} FACEIT ${won ? 'W' : 'L'} — ${kills}/${deaths} | ${rating} Rating | ELO: ${newState.faceitElo} (${eloSign}${eloChange})`];
  }

  if (!won) {
    newState.lifestyle.tiltLevel = Math.min(100, newState.lifestyle.tiltLevel + 5 + Math.random() * 5);
    newState.lifestyle.motivation = Math.max(0, newState.lifestyle.motivation - 2);
  } else {
    newState.lifestyle.tiltLevel = Math.max(0, newState.lifestyle.tiltLevel - 3);
    newState.lifestyle.motivation = Math.min(100, newState.lifestyle.motivation + 3);
    if (rating > 1.2) newState.reputation = Math.min(100, newState.reputation + 1);
    if (mvp) newState.reputation = Math.min(100, newState.reputation + 2);
  }

  if (clutchMoment) {
    newState.personality = {
      ...newState.personality,
      clutchReputation: Math.min(100, newState.personality.clutchReputation + 3),
    };
  }

  newState = updateStreak(newState, won);

  // Money from matches (team salary handled in checkProgression)
  if (matchType === 'pug' && won) newState.money += Math.floor(2 + Math.random() * 5);
  if (matchType === 'scrim' && won) newState.money += Math.floor(10 + Math.random() * 30);

  const streakMsgNew = getStreakMessage(newState.streak.current);
  if (streakMsgNew) {
    newState.weekLog = [...(newState.weekLog ?? []), streakMsgNew];
  }

  return { state: newState, result };
}

// ─── REST ───
export function applyRest(state: GameState): GameState {
  const s = { ...state, lifestyle: { ...state.lifestyle } };
  s.lifestyle.sleepQuality = Math.min(100, s.lifestyle.sleepQuality + 12);
  s.lifestyle.physicalHealth = Math.min(100, s.lifestyle.physicalHealth + 6);
  s.lifestyle.motivation = Math.min(100, s.lifestyle.motivation + 10);
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 18);
  s.energy = Math.min(100, s.energy + 50);
  return s;
}

// ─── STREAMING ───
export function applyStreaming(state: GameState): GameState {
  const s = { ...state, lifestyle: { ...state.lifestyle } };
  const stageMultiplier = { 'FaceIt Grind': 0.5, 'FPL-C': 0.8, 'FPL': 1.2, 'Academy': 1.5, 'Tier 3': 2.0, 'Tier 2': 4.0, 'Tier 1': 10.0, 'Major Contender': 20.0, 'Retired': 5.0 };
  const mult = stageMultiplier[state.stage] ?? 1;
  const viewers = Math.floor(s.reputation * 3 * mult + Math.random() * 50 * mult);
  const income = Math.floor(viewers * 0.12 + Math.random() * 20 * mult);
  s.money += income;
  s.reputation = Math.min(100, s.reputation + (Math.random() > 0.7 ? 2 : 0.5));
  s.lifestyle.motivation = Math.max(0, s.lifestyle.motivation - 3);
  s.energy = Math.max(0, s.energy - ENERGY_COSTS.stream);
  s.weekLog = [...s.weekLog, `📺 Streamed to ${viewers.toLocaleString()} viewers, earned $${income.toLocaleString()}`];
  return s;
}

// ─── TOURNAMENT HELPERS ───
function getTournamentOpponentStrength(tournament: Tournament): number {
  const baseStrengths: Record<TournamentType, number> = {
    'ESEA Open': 0.32,
    'ESEA Main': 0.40,
    'ESEA Advanced': 0.48,
    'ESEA Premier': 0.55,
    'ESL Challenger': 0.60,
    'ESL Pro League': 0.68,
    'IEM': 0.72,
    'BLAST Premier': 0.74,
    'PGL Major Qualifier': 0.72,
    'Valve Major': 0.80,
  };
  const base = baseStrengths[tournament.type] ?? 0.5;
  const roundScaling = (tournament.currentRound / Math.max(1, tournament.rounds - 1)) * 0.15;
  return Math.min(0.93, base + roundScaling);
}

function getTournamentPlacement(tournament: Tournament): string {
  const roundsLeft = tournament.rounds - tournament.currentRound;
  if (tournament.won) return '1st Place 🏆';
  if (roundsLeft === 1) return '2nd Place';
  if (roundsLeft === 2) return 'Top 4';
  if (roundsLeft === 3) return 'Top 8';
  return 'Group Stage Exit';
}

function getTournamentPrizePct(tournament: Tournament): number {
  const roundsLeft = tournament.rounds - tournament.currentRound;
  if (tournament.won) return 1.0;
  if (roundsLeft === 1) return 0.4;
  if (roundsLeft === 2) return 0.15;
  if (roundsLeft === 3) return 0.05;
  return 0.02;
}

export function playTournamentMatch(state: GameState): { state: GameState; result: MatchResult } {
  if (!state.activeTournament) return simulateMatch(state);

  const tournament = { ...state.activeTournament };
  const roundNames = ['Group Stage', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Grand Final'];
  const roundName = roundNames[Math.min(tournament.currentRound, roundNames.length - 1)];

  const performance = calculatePerformance(state);
  const attr = state.attributes;

  const kills = Math.floor(12 + performance * 18 + Math.random() * 6);
  const deaths = Math.floor(8 + (1 - performance) * 14 + Math.random() * 5);
  const adr = Math.floor(50 + performance * 50 + Math.random() * 15);
  const rating = Math.round((0.6 + performance * 0.9 + Math.random() * 0.2) * 100) / 100;

  const opponentStrength = getTournamentOpponentStrength(tournament);
  const clutchBonus = (state.personality.clutchReputation / 1000);
  const won = performance + clutchBonus > opponentStrength * (0.85 + Math.random() * 0.3);
  const mvp = won && performance > 0.65 && Math.random() > 0.5;
  const clutchMoment = attr.mentalStrength > 55 && Math.random() < 0.15;

  const isValveMajor = tournament.type === 'Valve Major';
  const matchType: MatchResult['type'] = isValveMajor ? 'major' : 'qualifier';
  const result: MatchResult = { won, kills, deaths, adr, rating, mvp, type: matchType, tournamentRound: roundName, clutchMoment };

  let newState = { ...state, stats: { ...state.stats }, lifestyle: { ...state.lifestyle } };

  const m = newState.matchesPlayed;
  newState.stats.adr = Math.round((newState.stats.adr * m + adr) / (m + 1));
  newState.stats.kd = Math.round(((newState.stats.kd * m + kills / Math.max(1, deaths)) / (m + 1)) * 100) / 100;
  newState.stats.rating = Math.round(((newState.stats.rating * m + rating) / (m + 1)) * 100) / 100;
  newState.stats.hsPercent = Math.round((newState.stats.hsPercent * m + 30 + attr.aim * 0.4 + Math.random() * 10) / (m + 1));
  newState.stats.kast = Math.round((newState.stats.kast * m + 50 + performance * 30 + Math.random() * 10) / (m + 1));
  newState.stats.clutchPercent = Math.round(
    (newState.stats.clutchPercent * m + (performance > 0.6 ? 10 + Math.random() * 15 : Math.random() * 8)) / (m + 1)
  );

  newState.recentRatings = [...(newState.recentRatings ?? []), rating].slice(-8);
  newState.matchesPlayed++;
  if (won) newState.matchesWon++;
  newState.lastMatchResult = result;
  newState.energy = Math.max(0, newState.energy - ENERGY_COSTS.tournament_match);

  if (!won) {
    newState.lifestyle.tiltLevel = Math.min(100, newState.lifestyle.tiltLevel + 8 + Math.random() * 5);
    newState.lifestyle.motivation = Math.max(0, newState.lifestyle.motivation - 5);
  } else {
    newState.lifestyle.tiltLevel = Math.max(0, newState.lifestyle.tiltLevel - 5);
    newState.lifestyle.motivation = Math.min(100, newState.lifestyle.motivation + 6);
  }

  if (clutchMoment) {
    newState.personality = {
      ...newState.personality,
      clutchReputation: Math.min(100, newState.personality.clutchReputation + 5),
    };
  }

  newState = updateStreak(newState, won);

  if (won) {
    tournament.wins++;
    tournament.currentRound++;
    if (tournament.currentRound >= tournament.rounds) {
      tournament.won = true;
      const prize = tournament.prizePool;
      const placement = '1st Place 🏆';
      const tResult: TournamentResult = { name: tournament.name, type: tournament.type, placement, prize };
      newState.money += prize;
      newState.earnings += prize;
      const repGain = 10 + tournament.prestige * 4;
      newState.reputation = Math.min(100, newState.reputation + repGain);
      newState.activeTournament = null;
      newState.tournamentHistory = [...newState.tournamentHistory, tResult];
      newState.weekLog = [...newState.weekLog,
        `🏆 WON ${tournament.name}! ${placement} — $${prize.toLocaleString()} · Rep +${repGain}`];
      newState = addNarrativeEntry(newState, `Won ${tournament.name} — Champion — $${prize.toLocaleString()}`, 'achievement');

      if (isValveMajor) {
        newState.achievements = [...newState.achievements, 'Valve Major Champion'];
        newState = addNarrativeEntry(newState, 'VALVE MAJOR CHAMPION. The greatest achievement in CS2.', 'achievement');
        // NOT game over anymore — just the biggest milestone
        newState.weekLog = [...newState.weekLog,
          `🌟 MAJOR CHAMPION. Your name is etched in CS2 history. The journey continues.`];
      }
    } else {
      newState.activeTournament = tournament;
      newState.weekLog = [...newState.weekLog,
        `✅ [${tournament.name}] ${roundName} — ${kills}/${deaths} | ${rating} Rating | Advancing!`];
    }
  } else {
    tournament.eliminated = true;
    const placement = getTournamentPlacement(tournament);
    const prize = Math.floor(tournament.prizePool * getTournamentPrizePct(tournament));
    const repGain = Math.max(1, tournament.currentRound * tournament.prestige);
    const tResult: TournamentResult = { name: tournament.name, type: tournament.type, placement, prize };
    newState.money += prize;
    newState.earnings += prize;
    newState.reputation = Math.min(100, newState.reputation + repGain);
    newState.activeTournament = null;
    newState.tournamentHistory = [...newState.tournamentHistory, tResult];
    newState.weekLog = [...newState.weekLog,
      `❌ Eliminated from ${tournament.name}. ${placement} — $${prize.toLocaleString()}`];

    if (tournament.currentRound >= 2) {
      newState = addNarrativeEntry(
        newState, `${placement} at ${tournament.name} — $${prize.toLocaleString()}`, 'milestone'
      );
    }
  }

  return { state: newState, result };
}

// ─── LEAVE TEAM ───
export function leaveTeam(state: GameState): GameState {
  if (!state.team) return state;
  let s = { ...state };
  const teamName = s.team!.name;
  s.team = null;
  s.activeContract = null;
  // Leaving hurts professionalism unless contract expired
  s.personality = {
    ...s.personality,
    professionalism: Math.max(0, s.personality.professionalism - 15),
    reliability: Math.max(0, s.personality.reliability - 10),
  };
  s.weekLog = [...s.weekLog, `🚪 Left ${teamName}. Free agent. Professionalism hit.`];
  s = addNarrativeEntry(s, `Requested release from ${teamName}. Burning bridges.`, 'drama');
  return s;
}

// ─── CONTRACT OFFER GENERATION ───
function generateContractOffer(state: GameState, tier: CareerStage): ContractOffer {
  // Salary ranges based on real CS2 pro scene data (monthly USD)
  // Academy: ~$1.5-3.5k, Tier 3: ~$2-5k, Tier 2: up to ~$8k, Tier 1: $5k-$80k
  const salaries: Record<string, [number, number]> = {
    'Academy':          [1500,  3500],
    'Tier 3':           [2000,  5000],
    'Tier 2':           [4000,  8000],
    'Tier 1':          [10000, 55000],
    'Major Contender': [30000, 80000],
  };
  const [minSal, maxSal] = salaries[tier] ?? [1000, 3000];
  const monthlyUSD = Math.floor(minSal + Math.random() * (maxSal - minSal));

  const teamPool = TEAM_NAMES[tier] ?? TEAM_NAMES['Tier 3'];
  const teamName = teamPool[Math.floor(Math.random() * teamPool.length)];

  const durations: (26 | 52 | 78)[] = [26, 52, 78];
  const durationWeeks = durations[Math.floor(Math.random() * durations.length)];

  const signingBonus = Math.floor(monthlyUSD * (0.5 + Math.random() * 1.5));

  // Performance clause scales with tier
  const clauseMap: Record<string, number> = {
    'Academy': 0.85, 'Tier 3': 0.95, 'Tier 2': 1.05, 'Tier 1': 1.15, 'Major Contender': 1.20,
  };
  const performanceClause = clauseMap[tier] ?? 0.9;

  return {
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    teamName,
    tier,
    monthlyUSD,
    durationWeeks,
    signingBonus,
    performanceClause,
    expiresWeek: state.weeks + 8,
  };
}

// ─── SIGN CONTRACT ───
export function signContract(state: GameState, offerId: string): GameState {
  const offer = (state.pendingOffers ?? []).find(o => o.id === offerId);
  if (!offer) return state;

  let s = { ...state };
  const teammates = generateTeammates(s.region, offer.tier);
  const tierSalary: Record<string, number> = {
    'Academy': offer.monthlyUSD * 4,
    'Tier 3': offer.monthlyUSD * 4,
    'Tier 2': offer.monthlyUSD * 4,
    'Tier 1': offer.monthlyUSD * 4,
    'Major Contender': offer.monthlyUSD * 4,
  };

  s.team = {
    name: offer.teamName,
    tier: offer.tier,
    chemistry: 45 + Math.floor(Math.random() * 20),
    salary: tierSalary[offer.tier] ?? offer.monthlyUSD * 4,
    morale: 65 + Math.floor(Math.random() * 20),
    teammates,
  };

  s.activeContract = {
    teamName: offer.teamName,
    tier: offer.tier,
    monthlyUSD: offer.monthlyUSD,
    durationWeeks: offer.durationWeeks,
    startWeek: s.weeks,
    endWeek: s.weeks + offer.durationWeeks,
    performanceClause: offer.performanceClause,
    poorFormStreak: 0,
  };

  // Signing bonus
  s.money += offer.signingBonus;
  s.earnings += offer.signingBonus;

  // Update stage if this is a promotion
  const stageOrder: CareerStage[] = ['FaceIt Grind', 'FPL-C', 'FPL', 'Academy', 'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender'];
  const currentIdx = stageOrder.indexOf(s.stage);
  const offerIdx = stageOrder.indexOf(offer.tier);
  if (offerIdx > currentIdx) {
    s.stage = offer.tier;
    s.achievements = [...s.achievements, `${offer.tier} Pro`];
    s = addNarrativeEntry(s, `Signed with ${offer.teamName} (${offer.tier}). $${offer.monthlyUSD.toLocaleString()}/month.`, 'milestone');
  } else {
    s = addNarrativeEntry(s, `Re-signed / transferred to ${offer.teamName}. $${offer.monthlyUSD.toLocaleString()}/month.`, 'milestone');
  }

  // Clear offers
  s.pendingOffers = [];
  s.weekLog = [...s.weekLog,
    `✍️ Signed with ${offer.teamName}! $${offer.monthlyUSD.toLocaleString()}/mo · $${offer.signingBonus.toLocaleString()} signing bonus · ${offer.durationWeeks}wk contract`];

  // Rival may appear
  if (!s.rival && s.stage !== 'FaceIt Grind' && s.stage !== 'FPL-C' && Math.random() > 0.5) {
    s.rival = generateRival(s);
    s.weekLog = [...s.weekLog, `👀 ${s.rival.name} is emerging as your rival. The scene is watching.`];
  }

  return s;
}

// ─── REJECT CONTRACT OFFER ───
export function rejectOffer(state: GameState, offerId: string): GameState {
  return {
    ...state,
    pendingOffers: (state.pendingOffers ?? []).filter(o => o.id !== offerId),
  };
}

// ─── ACCEPT TOURNAMENT INVITE ───
export function acceptTournamentInvite(state: GameState, inviteId: string): GameState {
  const invite = (state.pendingTournamentInvites ?? []).find(i => i.id === inviteId);
  if (!invite || state.activeTournament) return state;

  const tournament: Tournament = {
    ...invite,
    currentRound: 0,
    wins: 0,
    eliminated: false,
    won: false,
  };

  let s = {
    ...state,
    activeTournament: tournament,
    pendingTournamentInvites: (state.pendingTournamentInvites ?? []).filter(i => i.id !== inviteId),
  };
  s.weekLog = [...s.weekLog, `🏟️ Accepted invite to ${invite.name}! Competition starts next week.`];
  return s;
}

// ─── DECLINE TOURNAMENT INVITE ───
export function declineTournamentInvite(state: GameState, inviteId: string): GameState {
  return {
    ...state,
    pendingTournamentInvites: (state.pendingTournamentInvites ?? []).filter(i => i.id !== inviteId),
  };
}

// ─── TOURNAMENT INVITE GENERATION ───
// Tournament templates based on real CS2 circuit (2025 season)
const TOURNAMENT_TEMPLATES: Record<string, { name: string; type: TournamentType; prizePool: number; rounds: number; prestige: number }[]> = {
  'FaceIt Grind': [
    { name: 'ESEA Open Division', type: 'ESEA Open', prizePool: 300, rounds: 4, prestige: 1 },
    { name: 'ESEA Open Intermediate Qualifier', type: 'ESEA Open', prizePool: 500, rounds: 3, prestige: 1 },
  ],
  'FPL-C': [
    { name: 'ESEA Intermediate', type: 'ESEA Main', prizePool: 1000, rounds: 4, prestige: 2 },
    { name: 'ESEA Main Qualifier', type: 'ESEA Main', prizePool: 2000, rounds: 4, prestige: 2 },
  ],
  'FPL': [
    { name: 'ESEA Main Division', type: 'ESEA Main', prizePool: 3000, rounds: 5, prestige: 3 },
    { name: 'ESEA Advanced Qualifier', type: 'ESEA Advanced', prizePool: 5000, rounds: 4, prestige: 3 },
  ],
  'Academy': [
    { name: 'ESEA Advanced', type: 'ESEA Advanced', prizePool: 8000, rounds: 5, prestige: 4 },
    { name: 'ESEA Advanced Open Qualifier', type: 'ESEA Advanced', prizePool: 4000, rounds: 4, prestige: 4 },
  ],
  'Tier 3': [
    { name: 'ESEA Premier', type: 'ESEA Premier', prizePool: 25000, rounds: 5, prestige: 5 },
    { name: 'ESL Challenger League', type: 'ESL Challenger', prizePool: 50000, rounds: 5, prestige: 5 },
    { name: 'VRS Regional Qualifier', type: 'PGL Major Qualifier', prizePool: 10000, rounds: 4, prestige: 5 },
  ],
  'Tier 2': [
    { name: 'ESL Pro League Season', type: 'ESL Pro League', prizePool: 400000, rounds: 5, prestige: 7 },
    { name: 'IEM Dallas', type: 'IEM', prizePool: 300000, rounds: 5, prestige: 6 },
    { name: 'IEM Melbourne', type: 'IEM', prizePool: 300000, rounds: 5, prestige: 6 },
    { name: 'BLAST Bounty', type: 'BLAST Premier', prizePool: 500000, rounds: 4, prestige: 6 },
    { name: 'BLAST.tv Open', type: 'BLAST Premier', prizePool: 400000, rounds: 4, prestige: 6 },
    { name: 'PGL Astana', type: 'PGL Major Qualifier', prizePool: 625000, rounds: 5, prestige: 7 },
    { name: 'FISSURE Summer', type: 'PGL Major Qualifier', prizePool: 1000000, rounds: 5, prestige: 7 },
  ],
  'Tier 1': [
    { name: 'IEM Katowice', type: 'IEM', prizePool: 1250000, rounds: 5, prestige: 9 },
    { name: 'IEM Cologne', type: 'IEM', prizePool: 1000000, rounds: 5, prestige: 9 },
    { name: 'BLAST.tv World Final', type: 'BLAST Premier', prizePool: 500000, rounds: 5, prestige: 8 },
    { name: 'ESL Pro League', type: 'ESL Pro League', prizePool: 400000, rounds: 5, prestige: 7 },
    { name: 'Esports World Cup', type: 'BLAST Premier', prizePool: 1250000, rounds: 5, prestige: 8 },
    { name: 'StarLadder StarSeries', type: 'BLAST Premier', prizePool: 500000, rounds: 5, prestige: 7 },
    { name: 'BLAST.tv Austin Major', type: 'Valve Major', prizePool: 1250000, rounds: 6, prestige: 10 },
    { name: 'StarLadder Budapest Major', type: 'Valve Major', prizePool: 1250000, rounds: 6, prestige: 10 },
    { name: 'PGL Major Copenhagen', type: 'Valve Major', prizePool: 1250000, rounds: 6, prestige: 10 },
  ],
  'Major Contender': [
    { name: 'BLAST.tv CS2 Major', type: 'Valve Major', prizePool: 1250000, rounds: 6, prestige: 10 },
    { name: 'StarLadder Major', type: 'Valve Major', prizePool: 1250000, rounds: 6, prestige: 10 },
    { name: 'IEM Katowice', type: 'IEM', prizePool: 1250000, rounds: 5, prestige: 9 },
    { name: 'IEM Cologne', type: 'IEM', prizePool: 1000000, rounds: 5, prestige: 9 },
    { name: 'BLAST.tv World Final', type: 'BLAST Premier', prizePool: 500000, rounds: 5, prestige: 8 },
  ],
};

function generateTournamentInvite(state: GameState): TournamentInvite | null {
  const templates = TOURNAMENT_TEMPLATES[state.stage];
  if (!templates || templates.length === 0) return null;

  // Filter out templates whose tournaments are already in history recently
  const recentTourneyNames = state.tournamentHistory.slice(-6).map(t => t.name);
  const validTemplates = templates.filter(t => !recentTourneyNames.includes(t.name));
  if (validTemplates.length === 0) return templates[Math.floor(Math.random() * templates.length)];

  const template = validTemplates[Math.floor(Math.random() * validTemplates.length)];

  // Higher reputation = better invites
  const qualified = template.prestige <= Math.ceil(state.reputation / 12) + 1;
  if (!qualified && Math.random() > 0.3) return null;

  return {
    id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: template.name,
    type: template.type,
    prizePool: template.prizePool,
    rounds: template.rounds,
    expiresWeek: state.weeks + 6,
    prestige: template.prestige,
  };
}

// ─── PROGRESSION CHECK ───
export function checkProgression(state: GameState): GameState {
  let s = { ...state };

  const toxicPenalty = s.personality.toxicity > 70 && s.personality.professionalism < 30;

  // ── FACEIT GRIND → FPL-C ──
  if (s.stage === 'FaceIt Grind') {
    if (s.faceitLevel >= 10 && s.faceitElo >= 2100 && s.matchesPlayed >= 15) {
      s.stage = 'FPL-C';
      s.weekLog = [...s.weekLog, `🔥 FPL-C invite! Top of Level 10 — the scene noticed you.`];
      s.achievements = [...s.achievements, 'FPL-C Qualified'];
      s = addNarrativeEntry(s, 'FPL-C qualification. The first real step into the scene.', 'milestone');
    } else if (s.faceitLevel === 10 && s.matchesPlayed >= 10) {
      // Level 10 — may get noticed
      if (Math.random() > 0.96) {
        s.weekLog = [...s.weekLog, `👀 Your Level 10 performances are attracting attention from scouts.`];
      }
    }
  }

  // ── FPL-C → FPL ──
  if (s.stage === 'FPL-C' && s.stats.rating > 1.2 && s.reputation > 25 && s.matchesPlayed >= 10) {
    s.stage = 'FPL';
    s.weekLog = [...s.weekLog, `⚡ Invited to FPL! The top amateurs play here.`];
    s.achievements = [...s.achievements, 'FPL Player'];
    s = addNarrativeEntry(s, 'FPL invite. Playing against the pros now.', 'milestone');
  }

  // ── GENERATE OFFERS when performing well ──
  const recentRatings = s.recentRatings ?? [];
  const avgRecentRating = recentRatings.length > 0
    ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length
    : s.stats.rating;

  // Only generate offers if not currently under contract or contract expiring soon
  const offerWindow = !s.activeContract || (s.activeContract && s.activeContract.endWeek - s.weeks <= 10);
  const pendingCount = (s.pendingOffers ?? []).length;

  if (offerWindow && pendingCount < 2 && !toxicPenalty) {
    // FPL → Academy offer
    if (s.stage === 'FPL' && avgRecentRating > 1.2 && s.reputation > 30 && Math.random() > 0.75) {
      const offer = generateContractOffer(s, 'Academy');
      s.pendingOffers = [...(s.pendingOffers ?? []), offer];
      s.weekLog = [...s.weekLog, `📬 Contract offer from ${offer.teamName} (Academy)! $${offer.monthlyUSD.toLocaleString()}/mo — ${offer.durationWeeks}wk`];
      s = addNarrativeEntry(s, `First org offer: ${offer.teamName} Academy squad.`, 'milestone');
    }

    // Academy → Tier 3 offer
    if (s.stage === 'Academy' && avgRecentRating > 1.25 && s.reputation > 45 && Math.random() > 0.78) {
      const offer = generateContractOffer(s, 'Tier 3');
      s.pendingOffers = [...(s.pendingOffers ?? []), offer];
      s.weekLog = [...s.weekLog, `📬 Tier 3 offer: ${offer.teamName}! $${offer.monthlyUSD.toLocaleString()}/mo`];
    }

    // Tier 3 → Tier 2 offer
    if (s.stage === 'Tier 3' && avgRecentRating > 1.3 && s.reputation > 60 && Math.random() > 0.80) {
      const offer = generateContractOffer(s, 'Tier 2');
      s.pendingOffers = [...(s.pendingOffers ?? []), offer];
      s.weekLog = [...s.weekLog, `📬 Tier 2 offer: ${offer.teamName}! $${offer.monthlyUSD.toLocaleString()}/mo`];
      s = addNarrativeEntry(s, `Tier 2 scouts are calling. ${offer.teamName} wants you.`, 'milestone');
    }

    // Tier 2 → Tier 1 offer
    if (s.stage === 'Tier 2' && avgRecentRating > 1.4 && s.reputation > 75 && Math.random() > 0.82) {
      const offer = generateContractOffer(s, 'Tier 1');
      s.pendingOffers = [...(s.pendingOffers ?? []), offer];
      s.weekLog = [...s.weekLog, `🔥 TIER 1 OFFER: ${offer.teamName}! $${offer.monthlyUSD.toLocaleString()}/mo`];
      s = addNarrativeEntry(s, `TIER 1 OFFER from ${offer.teamName}. The dream is real.`, 'breakout');
    }

    // Tier 1 → Major Contender
    if (s.stage === 'Tier 1' && avgRecentRating > 1.5 && s.reputation > 88 && Math.random() > 0.85) {
      const offer = generateContractOffer(s, 'Major Contender');
      s.pendingOffers = [...(s.pendingOffers ?? []), offer];
      s.weekLog = [...s.weekLog, `👑 ELITE OFFER: ${offer.teamName}! $${offer.monthlyUSD.toLocaleString()}/mo — Top org`];
      s = addNarrativeEntry(s, `${offer.teamName} — Major Contender org. The summit.`, 'achievement');
      if (!s.achievements.includes('Major Contender')) {
        s.achievements = [...s.achievements, 'Major Contender'];
        s.stage = 'Major Contender';
      }
    }
  }

  // ── EXPIRE OLD OFFERS ──
  s.pendingOffers = (s.pendingOffers ?? []).filter(o => o.expiresWeek > s.weeks);

  // ── CONTRACT: SALARY + PERFORMANCE CLAUSE ──
  if (s.activeContract && s.team) {
    // Weekly salary (~monthly / 4)
    const weeklySalary = Math.floor(s.activeContract.monthlyUSD / 4);
    s.money += weeklySalary;
    s.earnings += weeklySalary;

    // Contract expiry
    if (s.weeks >= s.activeContract.endWeek) {
      s.weekLog = [...s.weekLog, `📋 Contract with ${s.activeContract.teamName} has expired. You're a free agent.`];
      s.activeContract = null;
      s = addNarrativeEntry(s, `Contract with ${s.team.name} expired. Free agent hunting.`, 'milestone');
    }

    // Performance clause check (only if enough recent matches)
    if (s.activeContract && recentRatings.length >= 4) {
      const avg = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
      if (avg < s.activeContract.performanceClause) {
        const newPoor = (s.activeContract.poorFormStreak ?? 0) + 1;
        s.activeContract = { ...s.activeContract, poorFormStreak: newPoor };
        if (newPoor === 3) {
          s.weekLog = [...s.weekLog, `⚠️ Poor form warning from ${s.team.name}. Avg rating: ${avg.toFixed(2)}. Clause: ${s.activeContract.performanceClause}`];
        } else if (newPoor >= 5) {
          // Kicked
          const teamName = s.team.name;
          s.weekLog = [...s.weekLog, `❌ RELEASED by ${teamName}. Consistently below contract clause (${avg.toFixed(2)} < ${s.activeContract.performanceClause})`];
          s.team = null;
          s.activeContract = null;
          s.personality = { ...s.personality, reliability: Math.max(0, s.personality.reliability - 10) };
          s = addNarrativeEntry(s, `Released from ${teamName} for poor performance. Rock bottom.`, 'struggle');
        }
      } else if (s.activeContract && (s.activeContract.poorFormStreak ?? 0) > 0) {
        s.activeContract = { ...s.activeContract, poorFormStreak: 0 };
      }
    }
  } else if (s.team && !s.activeContract) {
    // On team without formal contract (shouldn't normally happen)
    const weeklySalary = Math.floor((s.team.salary ?? 2000) / 4);
    s.money += weeklySalary;
    s.earnings += weeklySalary;
  }

  // ── TOXIC PENALTY ──
  if (toxicPenalty && Math.random() > 0.8) {
    s.weekLog = [...s.weekLog, `⚠️ Your toxic reputation is blacklisting you from top orgs.`];
  }

  // ── TOURNAMENT INVITE GENERATION ──
  const existingInvites = s.pendingTournamentInvites ?? [];
  if (!s.activeTournament && existingInvites.length < 2 && Math.random() > 0.65) {
    const invite = generateTournamentInvite(s);
    if (invite) {
      s.pendingTournamentInvites = [...existingInvites, invite];
      s.weekLog = [...s.weekLog, `📩 Tournament invite: ${invite.name} (${invite.type}) — $${invite.prizePool.toLocaleString()} prize pool`];
    }
  }

  // Expire old invites
  s.pendingTournamentInvites = (s.pendingTournamentInvites ?? []).filter(i => i.expiresWeek > s.weeks);

  // ── SKILL DECAY ──
  s = applySkillDecay(s);

  // ── RETIREMENT CHECK ──
  const overallSkill = getOverallSkill(s);
  if (s.age >= 35) {
    s.gameOver = true;
    s.gameOverReason = `Father Time wins. At ${s.age}, the reflexes are gone. Time to retire.`;
    s.stage = 'Retired';
    s = addNarrativeEntry(s, `Retired at ${s.age}. A career to remember.`, 'milestone');
  } else if (s.age >= 30 && overallSkill < 25) {
    s.gameOver = true;
    s.gameOverReason = `Skills have declined too far to compete at any level. Time to hang it up.`;
    s.stage = 'Retired';
    s = addNarrativeEntry(s, `Career ended — skill erosion. Not every story ends in glory.`, 'struggle');
  }

  // ── TEAM MORALE DEGRADATION ──
  if (s.team) {
    s.team = {
      ...s.team,
      morale: Math.max(0, (s.team.morale ?? 70) - 1),
      chemistry: Math.max(20, s.team.chemistry - 0.3),
    };
    if ((s.team.morale ?? 70) < 25 && Math.random() > 0.7) {
      s.weekLog = [...s.weekLog, `⚠️ Team morale critically low (${Math.round(s.team.morale)}/100). Drama possible.`];
    }
  }

  // ── RIVAL UPGRADE ──
  if (s.rival && Math.random() > 0.95) {
    s.rival = { ...s.rival, skill: Math.min(99, s.rival.skill + 1) };
  }

  // ── CHALLENGE PROGRESS ──
  s = updateChallenges(s);

  return s;
}

// ─── ADVANCE WEEK ───
export function advanceWeek(state: GameState): GameState {
  let s = { ...state };
  s.weeks++;
  if (s.weeks % 52 === 0) {
    s.age++;
    s.weekLog = [...s.weekLog, `🎂 Birthday — Age ${s.age}.`];
    if (s.age === 18) s = addNarrativeEntry(s, 'Turned 18. Adults take you seriously now.', 'milestone');
    if (s.age === 25) s = addNarrativeEntry(s, 'Turned 25. The "young prodigy" window is closing. Prove longevity.', 'milestone');
    if (s.age === 27) s = addNarrativeEntry(s, 'Turned 27. Reflexes starting to slow. Lean on IQ.', 'milestone');
    if (s.age === 30) s = addNarrativeEntry(s, 'Turned 30. Most pros retired. You\'re still here — for now.', 'milestone');
  }

  // Natural energy recovery
  s.energy = Math.min(100, s.energy + 10);
  s.reputation = Math.max(0, s.reputation - 0.15);

  // Health degrades naturally
  s.lifestyle = {
    ...s.lifestyle,
    physicalHealth: Math.max(0, s.lifestyle.physicalHealth - 0.4),
    sleepQuality: Math.max(0, s.lifestyle.sleepQuality - 0.25),
  };

  // Confidence normalizes
  if (s.streak) {
    const delta = (50 - s.streak.confidence) * 0.05;
    s.streak = { ...s.streak, confidence: s.streak.confidence + delta };
  }

  return s;
}

// ─── EQUIPMENT ───
export function buyEquipment(state: GameState, item: string, category: 'monitor' | 'mouse' | 'keyboard' | 'pc'): GameState | null {
  const price = EQUIPMENT_PRICES[item];
  if (!price || state.money < price) return null;
  const s = { ...state, equipment: { ...state.equipment } };
  s.money -= price;
  (s.equipment as any)[category] = item;
  s.weekLog = [...s.weekLog, `🛒 Bought ${item} for $${price.toLocaleString()}`];
  return s;
}

// ─── SKIN GAMBLING ───
export function gambleSkins(state: GameState, amount: number): GameState {
  if (amount > state.money) return state;
  let s = { ...state };
  const roll = Math.random();
  if (roll < 0.05) {
    const winnings = amount * 10;
    s.money += winnings;
    s.weekLog = [...s.weekLog, `🎰 JACKPOT! Won $${winnings.toLocaleString()}!`];
  } else if (roll < 0.35) {
    const winnings = Math.floor(amount * 1.5);
    s.money += winnings - amount;
    s.weekLog = [...s.weekLog, `🎰 Small win: +$${(winnings - amount).toLocaleString()}`];
  } else {
    s.money -= amount;
    s.weekLog = [...s.weekLog, `🎰 Lost $${amount.toLocaleString()}. The house always wins.`];
    s.lifestyle = { ...s.lifestyle, tiltLevel: Math.min(100, s.lifestyle.tiltLevel + 10) };
    if (s.money < 50) {
      s = addNarrativeEntry(s, 'Gambling is becoming a real problem.', 'struggle');
    }
  }
  return s;
}

// ─── MENTAL COACHING ───
export function applyMentalCoaching(state: GameState): GameState {
  const cost = 500;
  if (state.money < cost) return { ...state, weekLog: [...state.weekLog, '💸 Not enough money for a session. ($500 required)'] };
  let s = { ...state, lifestyle: { ...state.lifestyle }, attributes: { ...state.attributes } };
  s.money -= cost;
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 28);
  s.lifestyle.motivation = Math.min(100, s.lifestyle.motivation + 12);
  s.attributes.mentalStrength = Math.min(99, s.attributes.mentalStrength + 3);
  s.personality = { ...s.personality, professionalism: Math.min(100, s.personality.professionalism + 3) };
  s.weekLog = [...s.weekLog, `🧠 Mental coaching session — Tilt cleared, mindset reset. (-$${cost})`];
  return s;
}

// ─── HIRE ANALYST ───
export function hireAnalyst(state: GameState): GameState {
  const cost = 300;
  if (state.money < cost) return { ...state, weekLog: [...state.weekLog, '💸 Can\'t afford an analyst. ($300 required)'] };
  let s = { ...state, attributes: { ...state.attributes } };
  s.money -= cost;
  s.attributes.gameIQ = Math.min(99, s.attributes.gameIQ + 5);
  s.attributes.positioning = Math.min(99, s.attributes.positioning + 3);
  s.weekLog = [...s.weekLog, `📊 Analyst session — VOD breakdowns, opponent tendencies studied. (-$${cost}) +5 GameIQ +3 Positioning`];
  return s;
}

// ─── POST CONTENT ───
export function postContent(state: GameState): GameState {
  let s = { ...state };
  const roll = Math.random();
  if (roll < 0.12) {
    // Viral moment
    const bonus = Math.floor(300 + Math.random() * 700);
    s.money += bonus;
    s.earnings += bonus;
    s.reputation = Math.min(100, s.reputation + 8);
    s.weekLog = [...s.weekLog, `📱 POST WENT VIRAL! Clip blew up — +$${bonus} donations, +8 Rep`];
    s = addNarrativeEntry(s, 'Viral clip. The internet knows your name now.', 'breakout');
  } else if (roll < 0.25) {
    // Controversy
    s.personality = { ...s.personality, toxicity: Math.min(100, s.personality.toxicity + 6), professionalism: Math.max(0, s.personality.professionalism - 5) };
    s.weekLog = [...s.weekLog, `📱 Post got ratio'd. Drama online. Toxic rep up.`];
  } else {
    // Normal
    const repGain = 1 + Math.floor(Math.random() * 3);
    const income = Math.floor(20 + Math.random() * 60);
    s.reputation = Math.min(100, s.reputation + repGain);
    s.money += income;
    s.earnings += income;
    s.weekLog = [...s.weekLog, `📱 Posted content — steady growth. +${repGain} Rep +$${income}`];
  }
  return s;
}

// ─── RETIRE VOLUNTARILY ───
export function retirePlayer(state: GameState): GameState {
  let s = { ...state };
  s.stage = 'Retired';
  s.gameOver = true;
  s.gameOverReason = `You chose to retire at age ${s.age}. ${
    s.achievements.includes('Valve Major Champion') ? 'A Major Champion going out on top.' :
    s.stage === 'Tier 1' || s.stage === 'Major Contender' ? 'A career at the highest level.' :
    'Every journey has an end.'
  }`;
  s = addNarrativeEntry(s, `Retired at ${s.age}. Career complete.`, 'milestone');
  return s;
}

// ─── EVENT RESOLUTION ───
export function applyEventChoice(state: GameState, choice: EventChoice): GameState {
  let s = {
    ...state,
    attributes: { ...state.attributes },
    lifestyle: { ...state.lifestyle },
    personality: { ...state.personality },
  };
  const e = choice.effects;

  if (e.money) s.money = Math.max(0, s.money + e.money);
  if (e.motivation !== undefined) s.lifestyle.motivation = Math.max(0, Math.min(100, s.lifestyle.motivation + e.motivation));
  if (e.tiltLevel !== undefined) s.lifestyle.tiltLevel = Math.max(0, Math.min(100, s.lifestyle.tiltLevel + e.tiltLevel));
  if (e.reputation !== undefined) s.reputation = Math.max(0, Math.min(100, s.reputation + e.reputation));
  if (e.mentalStrength !== undefined) s.attributes.mentalStrength = Math.max(0, Math.min(99, s.attributes.mentalStrength + e.mentalStrength));
  if (e.aim !== undefined) s.attributes.aim = Math.max(0, Math.min(99, s.attributes.aim + e.aim));
  if (e.gameIQ !== undefined) s.attributes.gameIQ = Math.max(0, Math.min(99, s.attributes.gameIQ + e.gameIQ));
  if (e.communication !== undefined) s.attributes.communication = Math.max(0, Math.min(99, s.attributes.communication + e.communication));
  if (e.nadeUsage !== undefined) s.attributes.nadeUsage = Math.max(0, Math.min(99, s.attributes.nadeUsage + e.nadeUsage));
  if (e.positioning !== undefined) s.attributes.positioning = Math.max(0, Math.min(99, s.attributes.positioning + e.positioning));
  if (e.physicalHealth !== undefined) s.lifestyle.physicalHealth = Math.max(0, Math.min(100, s.lifestyle.physicalHealth + e.physicalHealth));
  if (e.sleepQuality !== undefined) s.lifestyle.sleepQuality = Math.max(0, Math.min(100, s.lifestyle.sleepQuality + e.sleepQuality));
  if (e.energy !== undefined) s.energy = Math.max(0, Math.min(100, s.energy + e.energy));
  if (e.teamChemistry && s.team) {
    s.team = { ...s.team, chemistry: Math.max(0, Math.min(100, s.team.chemistry + e.teamChemistry)) };
  }

  if (e.professionalism !== undefined) s.personality.professionalism = Math.max(0, Math.min(100, s.personality.professionalism + e.professionalism));
  if (e.toxicity !== undefined) s.personality.toxicity = Math.max(0, Math.min(100, s.personality.toxicity + e.toxicity));
  if (e.clutchReputation !== undefined) s.personality.clutchReputation = Math.max(0, Math.min(100, s.personality.clutchReputation + e.clutchReputation));
  if (e.reliability !== undefined) s.personality.reliability = Math.max(0, Math.min(100, s.personality.reliability + e.reliability));
  if (e.dedication !== undefined) s.personality.dedication = Math.max(0, Math.min(100, s.personality.dedication + e.dedication));
  if (e.confidence !== undefined && s.streak) {
    s.streak = { ...s.streak, confidence: Math.max(0, Math.min(100, s.streak.confidence + e.confidence)) };
  }
  if (e.matchMomentBoost !== undefined) {
    s.matchMomentBoost = (s.matchMomentBoost ?? 0) + e.matchMomentBoost;
  }

  s.currentEvent = null;
  return s;
}

// ─── EVENT ROLLING (via story engine) ───
export function rollForEvent(state: GameState): GameEvent | null {
  return rollForStoryEvent(state);
}

// ─── TRACK EVENT HISTORY ───
export function trackEvent(state: GameState, eventId: string): GameState {
  const history = [...(state.eventHistory ?? []), { id: eventId, week: state.weeks }].slice(-20);
  return { ...state, eventHistory: history };
}

// ─── BACKWARD COMPAT ───
export { ensureNewStateFields };
