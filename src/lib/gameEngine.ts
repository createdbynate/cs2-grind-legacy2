import {
  GameState, TrainingFocus, MatchResult, GameEvent, EventChoice,
  Role, Region, CareerStage, Attributes, Equipment,
  EQUIPMENT_PRICES, MonitorTier, MouseTier, KeyboardTier, PCTier,
  Tournament, TournamentType, TournamentResult, Teammate, AVAILABLE_TOURNAMENTS,
  ENERGY_COSTS, TeammatePersonality,
} from '@/types/game';
import {
  rollForStoryEvent, updateStreak, updateArc,
  generateRival, addNarrativeEntry, getStreakMessage,
  confidenceMultiplier, ensureNewStateFields,
} from '@/lib/storyEngine';

// ─── PLAYER NAME POOL (for teammates) ───
const TEAMMATE_NAMES: Record<Region, string[]> = {
  EU: ['k0nfig', 'dupreeh', 'Xyp9x', 'magisk', 'es3tag', 'hallzerk', 'stavn', 'TeSeS', 'nicoodoz',
       'hampus', 'REZ', 'Plopski', 'twist', 'Golden', 'valde', 'AcoR', 'gade', 'Snappi', 'farlig',
       'Blamef', 'CadiaN', 'jks', 'tabseN', 'syrsoN', 'Bymas', 'neityu', 'flameZ'],
  CIS: ['Buster', 'Perfecto', 'YEKINDAR', 'Qikert', 'Ax1Le', 'nafany', 'sdy', 'Forester',
        'iDISBALANCE', 'Jame', 'FL1T', 'n0rb3r7', 'KaiR0N', 'electroNic', 'b1t', 'fame'],
  NA:  ['Twistzz', 'NAF', 'Stewie2K', 'tarik', 'RUSH', 'FugLy', 'daps', 'stanislaw',
        'autimatic', 'nitr0', 'Ethan', 'cerq', 'oSee', 'wiz', 'junior', 'Grim', 'floppy'],
  SA:  ['KSCERATO', 'yuurih', 'chelo', 'HEN1', 'VINI', 'FalleN', 'fer', 'coldzera', 'taco',
        'boltz', 'LUCAS1', 'exit', 'peacemaker', 'arT', 'saffee', 'dumau'],
  Asia:['EliGE', 'oskar', 'xccurate', 'Stark', 'Brehze', 'SANJI', 'Techno4K', 'shalfari',
        'BnTeT', 'Skyfire', 'mzinho', 'Thomas', 'Woro2k', 'niqua', 'dycha'],
};

const ROLES: Role[] = ['Entry Fragger', 'AWPer', 'IGL', 'Support', 'Lurker'];
const PERSONALITIES: TeammatePersonality[] = ['aggressive', 'supportive', 'passive', 'toxic', 'leader'];

function generateTeammates(region: Region, tier: CareerStage): Teammate[] {
  const pool = [...TEAMMATE_NAMES[region]];
  const teammates: Teammate[] = [];
  const tierSkillBase: Record<string, number> = {
    'Academy': 35, 'Tier 3': 50, 'Tier 2': 65, 'Tier 1': 78, 'Major Contender': 88,
  };
  const base = tierSkillBase[tier] ?? 40;

  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const name = pool.splice(idx, 1)[0];
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    teammates.push({
      name,
      role,
      skill: Math.floor(base + Math.random() * 15 - 5),
      chemistry: 40 + Math.floor(Math.random() * 20),
      personality,
      mood: 60 + Math.floor(Math.random() * 30),
    });
  }
  return teammates;
}

// ─── INITIALIZATION ───
export function createInitialState(name: string, age: number, role: Role, region: Region): GameState {
  return {
    playerName: name,
    age,
    weeks: 0,
    role,
    region,
    stage: 'FaceIt Grind',
    stats: {
      adr: 55 + Math.random() * 15,
      kd: 0.8 + Math.random() * 0.3,
      hsPercent: 30 + Math.random() * 20,
      kast: 55 + Math.random() * 10,
      rating: 0.85 + Math.random() * 0.2,
      clutchPercent: 5 + Math.random() * 10,
    },
    attributes: {
      aim: 20 + Math.floor(Math.random() * 15),
      positioning: 15 + Math.floor(Math.random() * 10),
      gameIQ: 15 + Math.floor(Math.random() * 10),
      nadeUsage: 10 + Math.floor(Math.random() * 10),
      communication: 15 + Math.floor(Math.random() * 10),
      mentalStrength: 20 + Math.floor(Math.random() * 15),
      consistency: 20 + Math.floor(Math.random() * 10),
    },
    lifestyle: { hoursPerDay: 6, sleepQuality: 70, physicalHealth: 80, motivation: 85, tiltLevel: 10 },
    equipment: { monitor: '60Hz', mouse: 'Budget', keyboard: 'Membrane', pc: 'Potato' },
    team: null,
    money: 50,
    reputation: 10,
    matchesPlayed: 0,
    matchesWon: 0,
    faceitLevel: 1,
    earnings: 0,
    energy: 100,
    activeTournament: null,
    tournamentHistory: [],
    currentEvent: null,
    lastMatchResult: null,
    weekLog: ['Your CS2 journey begins. Time to grind.'],
    gameOver: false,
    achievements: [],
    // New systems
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
  };
}

// ─── AGE MODIFIER ───
function ageMod(age: number): number {
  if (age >= 17 && age <= 24) return 1.0;
  if (age < 17) return 0.85;
  if (age <= 27) return 0.9;
  if (age <= 30) return 0.7;
  return 0.4;
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

// ─── TRAINING ───
export function applyTraining(state: GameState, focus: TrainingFocus): GameState {
  const s = { ...state, attributes: { ...state.attributes }, lifestyle: { ...state.lifestyle } };

  const energyMod = energyMultiplier(s.energy);
  const dedicationMod = 1 + (s.personality.dedication / 200); // up to 1.5x
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

  // Dedication naturally grows from training
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

  const kills = Math.floor(12 + performance * 18 + Math.random() * 6);
  const deaths = Math.floor(8 + (1 - performance) * 14 + Math.random() * 5);
  const adr = Math.floor(50 + performance * 50 + Math.random() * 15);
  const rating = Math.round((0.6 + performance * 0.9 + Math.random() * 0.2) * 100) / 100;
  const won = performance + Math.random() * 0.3 > 0.5;
  const mvp = performance > 0.65 && Math.random() > 0.5;

  // Clutch moment: high mental strength + high stakes
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

  let newState = { ...state, stats: { ...state.stats }, lifestyle: { ...state.lifestyle } };

  // Update rolling averages
  const m = newState.matchesPlayed;
  newState.stats.adr = Math.round((newState.stats.adr * m + adr) / (m + 1));
  newState.stats.kd = Math.round(((newState.stats.kd * m + kills / Math.max(1, deaths)) / (m + 1)) * 100) / 100;
  newState.stats.rating = Math.round(((newState.stats.rating * m + rating) / (m + 1)) * 100) / 100;
  newState.stats.hsPercent = Math.round((newState.stats.hsPercent * m + 30 + attr.aim * 0.4 + Math.random() * 10) / (m + 1));
  newState.stats.kast = Math.round((newState.stats.kast * m + 50 + performance * 30 + Math.random() * 10) / (m + 1));
  newState.stats.clutchPercent = Math.round(
    (newState.stats.clutchPercent * m + (performance > 0.6 ? 10 + Math.random() * 15 : Math.random() * 8)) / (m + 1)
  );

  newState.matchesPlayed++;
  if (won) newState.matchesWon++;
  newState.lastMatchResult = result;
  newState.energy = Math.max(0, newState.energy - ENERGY_COSTS.match);

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

  // Streak update
  newState = updateStreak(newState, won);

  // Money from match
  if (matchType === 'pug' && won) newState.money += Math.floor(2 + Math.random() * 5);
  if (matchType === 'official' && won) newState.money += Math.floor(50 + Math.random() * 200);
  if (matchType === 'official' && mvp) newState.money += Math.floor(100 + Math.random() * 200);

  // Streak milestone log
  const streakMsgNew = getStreakMessage(newState.streak.current);
  if (streakMsgNew) {
    newState.weekLog = [...(newState.weekLog ?? []), streakMsgNew];
  }

  return { state: newState, result };
}

// ─── REST ───
export function applyRest(state: GameState): GameState {
  const s = { ...state, lifestyle: { ...state.lifestyle } };
  s.lifestyle.sleepQuality = Math.min(100, s.lifestyle.sleepQuality + 10);
  s.lifestyle.physicalHealth = Math.min(100, s.lifestyle.physicalHealth + 5);
  s.lifestyle.motivation = Math.min(100, s.lifestyle.motivation + 8);
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 15);
  s.energy = Math.min(100, s.energy + 50);
  return s;
}

// ─── STREAMING ───
export function applyStreaming(state: GameState): GameState {
  const s = { ...state, lifestyle: { ...state.lifestyle } };
  const viewers = Math.floor(s.reputation * 2 + Math.random() * 50);
  const income = Math.floor(viewers * 0.1 + Math.random() * 10);
  s.money += income;
  s.reputation = Math.min(100, s.reputation + (Math.random() > 0.7 ? 2 : 0.5));
  s.lifestyle.motivation = Math.max(0, s.lifestyle.motivation - 3);
  s.energy = Math.max(0, s.energy - ENERGY_COSTS.stream);
  s.weekLog = [...s.weekLog, `📺 Streamed to ${viewers} viewers, earned $${income}`];
  return s;
}

// ─── TOURNAMENT HELPERS ───
function getTournamentOpponentStrength(tournament: Tournament): number {
  const baseStrengths: Record<TournamentType, number> = {
    'Open Qualifier': 0.38,
    'Regional': 0.48,
    'Pro League': 0.57,
    'Major Qualifier': 0.67,
    'Major': 0.77,
  };
  const base = baseStrengths[tournament.type];
  const roundScaling = (tournament.currentRound / Math.max(1, tournament.rounds - 1)) * 0.12;
  return Math.min(0.93, base + roundScaling);
}

function getTournamentPlacement(tournament: Tournament): string {
  const roundsLeft = tournament.rounds - tournament.currentRound;
  if (tournament.won) return '1st Place 🏆';
  if (roundsLeft === 1) return '2nd Place';
  if (roundsLeft === 2) return 'Top 4';
  if (roundsLeft === 3) return 'Top 8';
  return 'Group Stage';
}

function getTournamentPrizePct(tournament: Tournament): number {
  const roundsLeft = tournament.rounds - tournament.currentRound;
  if (tournament.won) return 1.0;
  if (roundsLeft === 1) return 0.4;
  if (roundsLeft === 2) return 0.15;
  if (roundsLeft === 3) return 0.05;
  return 0.02;
}

export function getEligibleTournaments(state: GameState): typeof AVAILABLE_TOURNAMENTS {
  const stageOrder: CareerStage[] = ['FaceIt Grind', 'FPL-C', 'FPL', 'Academy', 'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender'];
  const playerIdx = stageOrder.indexOf(state.stage);
  return AVAILABLE_TOURNAMENTS.filter(t => stageOrder.indexOf(t.minStage) <= playerIdx);
}

export function enterTournament(state: GameState, tournamentId: string): GameState {
  const template = AVAILABLE_TOURNAMENTS.find(t => t.id === tournamentId);
  if (!template || state.activeTournament) return state;

  const tournament: Tournament = { ...template, currentRound: 0, wins: 0, eliminated: false, won: false };
  const s = { ...state, activeTournament: tournament };
  s.weekLog = [...s.weekLog, `🏟️ Entered ${tournament.name}! Round 1 starts next week.`];
  return s;
}

export function playTournamentMatch(state: GameState): { state: GameState; result: MatchResult } {
  if (!state.activeTournament) return simulateMatch(state);

  const tournament = { ...state.activeTournament };
  const roundNames = ['Group Stage', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Grand Final', 'Grand Final'];
  const roundName = roundNames[Math.min(tournament.currentRound, roundNames.length - 1)];

  const performance = calculatePerformance(state);
  const attr = state.attributes;

  const kills = Math.floor(12 + performance * 18 + Math.random() * 6);
  const deaths = Math.floor(8 + (1 - performance) * 14 + Math.random() * 5);
  const adr = Math.floor(50 + performance * 50 + Math.random() * 15);
  const rating = Math.round((0.6 + performance * 0.9 + Math.random() * 0.2) * 100) / 100;

  const opponentStrength = getTournamentOpponentStrength(tournament);
  // Clutch reputation gives edge in big matches
  const clutchBonus = (state.personality.clutchReputation / 1000);
  const won = performance + clutchBonus > opponentStrength * (0.85 + Math.random() * 0.3);
  const mvp = won && performance > 0.65 && Math.random() > 0.5;
  const clutchMoment = attr.mentalStrength > 55 && Math.random() < 0.15;

  const matchType: MatchResult['type'] = tournament.type === 'Major' ? 'major' : 'qualifier';
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

  // Tournament result
  if (won) {
    tournament.wins++;
    tournament.currentRound++;
    if (tournament.currentRound >= tournament.rounds) {
      tournament.won = true;
      const prize = tournament.prizePool;
      const placement = getTournamentPlacement(tournament);
      const tResult: TournamentResult = { name: tournament.name, type: tournament.type, placement, prize };
      newState.money += prize;
      newState.earnings += prize;
      newState.reputation = Math.min(100, newState.reputation + 20);
      newState.activeTournament = null;
      newState.tournamentHistory = [...newState.tournamentHistory, tResult];
      newState.weekLog = [...newState.weekLog,
        `🏆 WON ${tournament.name}! ${placement} — Prize: $${prize.toLocaleString()}! Rep +20`];

      newState = addNarrativeEntry(
        newState,
        `Won ${tournament.name} — ${placement} — $${prize.toLocaleString()}`,
        'milestone'
      );

      if (tournament.type === 'Major') {
        newState.achievements = [...newState.achievements, 'Major Champion'];
        newState.gameOver = true;
        newState.gameOverReason = `You won the CS2 Major! The world bows to ${newState.playerName}.`;
        newState = addNarrativeEntry(newState, 'CS2 MAJOR CHAMPION. The dream is real.', 'achievement');
      }
    } else {
      newState.activeTournament = tournament;
      newState.weekLog = [...newState.weekLog,
        `✅ [${tournament.name}] ${roundName} — ${kills}/${deaths} | ${rating} Rating | Advancing to Round ${tournament.currentRound + 1}`];
    }
  } else {
    tournament.eliminated = true;
    const placement = getTournamentPlacement(tournament);
    const prize = Math.floor(tournament.prizePool * getTournamentPrizePct(tournament));
    const repGain = Math.floor(tournament.currentRound * 2);
    const tResult: TournamentResult = { name: tournament.name, type: tournament.type, placement, prize };
    newState.money += prize;
    newState.earnings += prize;
    newState.reputation = Math.min(100, newState.reputation + repGain);
    newState.activeTournament = null;
    newState.tournamentHistory = [...newState.tournamentHistory, tResult];
    newState.weekLog = [...newState.weekLog,
      `❌ Eliminated from ${tournament.name}. ${placement} — $${prize.toLocaleString()} prize money.`];

    if (tournament.currentRound >= 3) {
      newState = addNarrativeEntry(
        newState,
        `${placement} at ${tournament.name} — $${prize.toLocaleString()}`,
        'milestone'
      );
    }
  }

  return { state: newState, result };
}

// ─── PROGRESSION CHECK ───
export function checkProgression(state: GameState): GameState {
  let s = { ...state };

  // Toxic spiral consequence: orgs blacklist you above a threshold
  const toxicPenalty = s.personality.toxicity > 70 && s.personality.professionalism < 30;

  if (s.stage === 'FaceIt Grind' && s.matchesPlayed > 0) {
    const winRate = s.matchesWon / s.matchesPlayed;
    if (winRate > 0.55 && s.stats.rating > 1.0 && s.matchesPlayed > 10) {
      s.faceitLevel = Math.min(10, s.faceitLevel + 1);
    }
    if (s.faceitLevel >= 8 && s.stats.rating > 1.1) {
      s.stage = 'FPL-C';
      s.weekLog = [...s.weekLog, '🎉 Qualified for FPL-C! The grind pays off.'];
      s.achievements = [...s.achievements, 'FPL-C Qualified'];
      s = addNarrativeEntry(s, 'Qualified for FPL-C. The first real step.', 'milestone');
    }
  }

  if (s.stage === 'FPL-C' && s.stats.rating > 1.2 && s.reputation > 25) {
    s.stage = 'FPL';
    s.weekLog = [...s.weekLog, '🔥 Promoted to FPL! Pros are watching.'];
    s.achievements = [...s.achievements, 'FPL Player'];
    s = addNarrativeEntry(s, 'Made it to FPL. Pros are starting to talk.', 'milestone');
  }

  if (s.stage === 'FPL' && s.stats.rating > 1.25 && s.reputation > 35 && !s.team && !toxicPenalty) {
    s.stage = 'Academy';
    const teams = ['Vitality Academy', 'NAVI Junior', 'G2 Academy', 'FaZe Rising', 'Cloud9 Academy'];
    const teamName = teams[Math.floor(Math.random() * teams.length)];
    s.team = {
      name: teamName,
      tier: 'Academy',
      chemistry: 50,
      salary: 500,
      morale: 70,
      teammates: generateTeammates(s.region, 'Academy'),
    };
    s.weekLog = [...s.weekLog, `📋 Signed with ${s.team.name}! Weekly salary: $${Math.floor(s.team.salary / 4)}`];
    s.achievements = [...s.achievements, 'Academy Player'];
    s = addNarrativeEntry(s, `Signed with ${s.team.name}. First org contract.`, 'milestone');
    // Rival may appear now
    if (!s.rival && Math.random() > 0.5) {
      s.rival = generateRival(s);
      s.weekLog = [...s.weekLog, `👀 ${s.rival.name} is making waves at the same level. People are already comparing you two.`];
      s = addNarrativeEntry(s, `${s.rival.name} appears as a rival. The competition gets personal.`, 'rivalry');
    }
  } else if (s.stage === 'FPL' && toxicPenalty && s.stats.rating > 1.25 && s.reputation > 35) {
    s.weekLog = [...s.weekLog, `⚠️ Your toxic reputation is stopping orgs from signing you. Clean it up.`];
  }

  if (s.stage === 'Academy' && s.stats.rating > 1.3 && s.reputation > 50 && !toxicPenalty) {
    s.stage = 'Tier 3';
    const teams = ['ENCE', 'Into The Breach', 'Apeks', 'SAW', 'Monte'];
    const teamName = teams[Math.floor(Math.random() * teams.length)];
    s.team = {
      name: teamName,
      tier: 'Tier 3',
      chemistry: 60,
      salary: 2000,
      morale: 70,
      teammates: generateTeammates(s.region, 'Tier 3'),
    };
    s.weekLog = [...s.weekLog, `⬆️ Moved up to ${s.team.name}! Tier 3 pro.`];
    s.achievements = [...s.achievements, 'Tier 3 Pro'];
    s = addNarrativeEntry(s, `Joined ${s.team.name}. Officially a Tier 3 pro.`, 'milestone');
  }

  if (s.stage === 'Tier 3' && s.stats.rating > 1.35 && s.reputation > 65 && !toxicPenalty) {
    s.stage = 'Tier 2';
    const teams = ['MOUZ', 'Complexity', 'Imperial', 'paiN', 'OG'];
    const teamName = teams[Math.floor(Math.random() * teams.length)];
    s.team = {
      name: teamName,
      tier: 'Tier 2',
      chemistry: 55,
      salary: 5000,
      morale: 65,
      teammates: generateTeammates(s.region, 'Tier 2'),
    };
    s.weekLog = [...s.weekLog, `🚀 Signed with ${s.team.name}! Tier 2 professional.`];
    s.achievements = [...s.achievements, 'Tier 2 Pro'];
    s = addNarrativeEntry(s, `${s.team.name} signs you. Tier 2 — the scene is real now.`, 'milestone');
    // Upgrade rival if they're still at same level
    if (s.rival) {
      s.rival = { ...s.rival, stage: 'Tier 2', skill: Math.min(99, s.rival.skill + 8), beefLevel: Math.min(100, s.rival.beefLevel + 10) };
    }
  }

  if (s.stage === 'Tier 2' && s.stats.rating > 1.4 && s.reputation > 80 && !toxicPenalty) {
    s.stage = 'Tier 1';
    const teams = ['NAVI', 'Vitality', 'FaZe', 'G2', 'Cloud9', 'Heroic', 'Astralis'];
    const teamName = teams[Math.floor(Math.random() * teams.length)];
    s.team = {
      name: teamName,
      tier: 'Tier 1',
      chemistry: 50,
      salary: 15000,
      morale: 60,
      teammates: generateTeammates(s.region, 'Tier 1'),
    };
    s.weekLog = [...s.weekLog, `🏆 ${s.team.name} signed you! TIER 1 PLAYER!`];
    s.achievements = [...s.achievements, 'Tier 1 Pro'];
    s = addNarrativeEntry(s, `${s.team.name} — Tier 1. The absolute top.`, 'milestone');
    if (s.rival) {
      s.rival = { ...s.rival, stage: 'Tier 1', skill: Math.min(99, s.rival.skill + 8), beefLevel: Math.min(100, s.rival.beefLevel + 15) };
    }
  }

  if (s.stage === 'Tier 1' && s.stats.rating > 1.5 && s.reputation > 90) {
    s.stage = 'Major Contender';
    s.weekLog = [...s.weekLog, `👑 Major contender. The world is watching.`];
    s.achievements = [...s.achievements, 'Major Contender'];
    s = addNarrativeEntry(s, 'Major Contender. This is what it was all for.', 'milestone');
  }

  // Salary payment
  if (s.team) {
    const weeklySalary = Math.floor(s.team.salary / 4);
    s.money += weeklySalary;
    s.earnings += weeklySalary;
  }

  // Age check
  if (s.age > 33) {
    s.gameOver = true;
    s.gameOverReason = 'Father Time catches up to everyone. Your reflexes have declined too much to compete.';
    s = addNarrativeEntry(s, 'Retired at age ' + s.age + '. An entire career lived.', 'milestone');
  }

  // Team morale degradation
  if (s.team) {
    s.team = {
      ...s.team,
      morale: Math.max(0, (s.team.morale ?? 70) - 1),
      chemistry: Math.max(20, s.team.chemistry - 0.3),
    };
    // Low morale warning
    if ((s.team.morale ?? 70) < 30 && Math.random() > 0.7) {
      s.weekLog = [...s.weekLog, `⚠️ Team morale is critically low (${Math.round(s.team.morale)}/100). Drama incoming.`];
    }
  }

  return s;
}

// ─── ADVANCE WEEK ───
export function advanceWeek(state: GameState): GameState {
  let s = { ...state };
  s.weeks++;
  if (s.weeks % 52 === 0) {
    s.age++;
    s.weekLog = [...s.weekLog, `🎂 Happy birthday! You're now ${s.age}.`];
    // Age-related narrative
    if (s.age === 25) {
      s = addNarrativeEntry(s, 'Turned 25. The "young prodigy" window is closing. Must prove longevity.', 'milestone');
    } else if (s.age === 30) {
      s = addNarrativeEntry(s, 'Turned 30. Most pros this age are retired. You\'re still here.', 'milestone');
    }
  }
  // Natural recovery
  s.energy = Math.min(100, s.energy + 10);
  s.reputation = Math.max(0, s.reputation - 0.2);
  // Health degrades
  s.lifestyle = {
    ...s.lifestyle,
    physicalHealth: Math.max(0, s.lifestyle.physicalHealth - 0.5),
    sleepQuality: Math.max(0, s.lifestyle.sleepQuality - 0.3),
  };
  // Confidence slowly normalizes towards 50
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
  s.weekLog = [...s.weekLog, `🛒 Bought ${item} for $${price}`];
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
    s.weekLog = [...s.weekLog, `🎰 JACKPOT! Won $${winnings.toLocaleString()} from gambling!`];
  } else if (roll < 0.35) {
    const winnings = Math.floor(amount * 1.5);
    s.money += winnings - amount;
    s.weekLog = [...s.weekLog, `🎰 Small win: +$${winnings - amount} profit`];
  } else {
    s.money -= amount;
    s.weekLog = [...s.weekLog, `🎰 Lost $${amount}. The house always wins.`];
    s.lifestyle = { ...s.lifestyle, tiltLevel: Math.min(100, s.lifestyle.tiltLevel + 10) };
    // Gambling loss hurts if broke
    if (s.money < 50) {
      s = addNarrativeEntry(s, 'Gambling debt is becoming a problem.', 'struggle');
    }
  }
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

  // Stats
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

  // Personality effects
  if (e.professionalism !== undefined) {
    s.personality.professionalism = Math.max(0, Math.min(100, s.personality.professionalism + e.professionalism));
  }
  if (e.toxicity !== undefined) {
    s.personality.toxicity = Math.max(0, Math.min(100, s.personality.toxicity + e.toxicity));
  }
  if (e.clutchReputation !== undefined) {
    s.personality.clutchReputation = Math.max(0, Math.min(100, s.personality.clutchReputation + e.clutchReputation));
  }
  if (e.reliability !== undefined) {
    s.personality.reliability = Math.max(0, Math.min(100, s.personality.reliability + e.reliability));
  }
  if (e.dedication !== undefined) {
    s.personality.dedication = Math.max(0, Math.min(100, s.personality.dedication + e.dedication));
  }
  if (e.confidence !== undefined && s.streak) {
    s.streak = { ...s.streak, confidence: Math.max(0, Math.min(100, s.streak.confidence + e.confidence)) };
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
  const history = [...(state.eventHistory ?? []), eventId].slice(-10);
  return { ...state, eventHistory: history };
}

// ─── ENSURE BACKWARD COMPAT ───
export { ensureNewStateFields };
