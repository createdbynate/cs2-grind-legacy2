import {
  GameState, TrainingFocus, MatchResult, GameEvent, EventChoice,
  Role, Region, CareerStage, Attributes, PlayerStats, Equipment,
  EQUIPMENT_PRICES, MonitorTier, MouseTier, KeyboardTier, PCTier
} from '@/types/game';

// ─── INITIALIZATION ───
export function createInitialState(name: string, age: number, role: Role, region: Region): GameState {
  return {
    playerName: name,
    age,
    weeks: 0,
    role,
    region,
    stage: 'FaceIt Grind',
    stats: { adr: 55 + Math.random() * 15, kd: 0.8 + Math.random() * 0.3, hsPercent: 30 + Math.random() * 20, kast: 55 + Math.random() * 10, rating: 0.85 + Math.random() * 0.2, clutchPercent: 5 + Math.random() * 10 },
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
    currentEvent: null,
    lastMatchResult: null,
    weekLog: ['Your CS2 journey begins. Time to grind.'],
    gameOver: false,
    achievements: [],
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

// ─── TRAINING ───
export function applyTraining(state: GameState, focus: TrainingFocus): GameState {
  const s = { ...state, attributes: { ...state.attributes }, lifestyle: { ...state.lifestyle } };
  const gain = (1 + Math.random()) * ageMod(s.age) * (s.lifestyle.motivation / 100);
  const attrKey = focus === 'nades' ? 'nadeUsage' : focus;
  s.attributes[attrKey] = Math.min(99, s.attributes[attrKey] + gain);
  // Minor gains in other areas
  s.attributes.consistency = Math.min(99, s.attributes.consistency + gain * 0.2);
  // Lifestyle effects
  s.lifestyle.motivation = Math.max(0, s.lifestyle.motivation - 2 + Math.random() * 3);
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 1);
  s.lifestyle.hoursPerDay = Math.min(16, s.lifestyle.hoursPerDay + 0.2);
  return s;
}

// ─── MATCH SIMULATION ───
export function simulateMatch(state: GameState): { state: GameState; result: MatchResult } {
  const attr = state.attributes;
  const eq = equipmentBonus(state.equipment);
  const base = (attr.aim * 0.3 + attr.positioning * 0.2 + attr.gameIQ * 0.2 + attr.consistency * 0.15 + attr.communication * 0.1 + attr.nadeUsage * 0.05 + eq) / 100;
  const mentality = (state.lifestyle.motivation - state.lifestyle.tiltLevel) / 100;
  const performance = base * (0.7 + Math.random() * 0.6) * (1 + mentality * 0.3) * ageMod(state.age);

  const kills = Math.floor(12 + performance * 18 + Math.random() * 6);
  const deaths = Math.floor(8 + (1 - performance) * 14 + Math.random() * 5);
  const adr = Math.floor(50 + performance * 50 + Math.random() * 15);
  const rating = Math.round((0.6 + performance * 0.9 + Math.random() * 0.2) * 100) / 100;
  const won = performance + Math.random() * 0.3 > 0.5;
  const mvp = performance > 0.65 && Math.random() > 0.5;

  const matchType: MatchResult['type'] = state.stage === 'FaceIt Grind' ? 'pug' : state.stage === 'FPL-C' || state.stage === 'FPL' ? 'scrim' : state.team ? 'official' : 'pug';

  const result: MatchResult = { won, kills, deaths, adr, rating, mvp, type: matchType as MatchResult['type'] };

  const newState = { ...state, stats: { ...state.stats }, lifestyle: { ...state.lifestyle } };
  // Update rolling stats
  const m = newState.matchesPlayed;
  newState.stats.adr = Math.round((newState.stats.adr * m + adr) / (m + 1));
  newState.stats.kd = Math.round(((newState.stats.kd * m + kills / Math.max(1, deaths)) / (m + 1)) * 100) / 100;
  newState.stats.rating = Math.round(((newState.stats.rating * m + rating) / (m + 1)) * 100) / 100;
  newState.stats.hsPercent = Math.round((newState.stats.hsPercent * m + 30 + attr.aim * 0.4 + Math.random() * 10) / (m + 1));
  newState.stats.kast = Math.round((newState.stats.kast * m + 50 + performance * 30 + Math.random() * 10) / (m + 1));
  newState.stats.clutchPercent = Math.round((newState.stats.clutchPercent * m + (performance > 0.6 ? 10 + Math.random() * 15 : Math.random() * 8)) / (m + 1));

  newState.matchesPlayed++;
  if (won) newState.matchesWon++;
  newState.lastMatchResult = result;

  // Tilt / motivation
  if (!won) {
    newState.lifestyle.tiltLevel = Math.min(100, newState.lifestyle.tiltLevel + 5 + Math.random() * 5);
    newState.lifestyle.motivation = Math.max(0, newState.lifestyle.motivation - 2);
  } else {
    newState.lifestyle.tiltLevel = Math.max(0, newState.lifestyle.tiltLevel - 3);
    newState.lifestyle.motivation = Math.min(100, newState.lifestyle.motivation + 3);
  }

  // Money from matches
  if (matchType === 'pug' && won) newState.money += Math.floor(2 + Math.random() * 5);
  if (matchType === 'official' && won) newState.money += Math.floor(50 + Math.random() * 200);
  if (matchType === 'official' && mvp) newState.money += Math.floor(100 + Math.random() * 200);

  return { state: newState, result };
}

// ─── REST ───
export function applyRest(state: GameState): GameState {
  const s = { ...state, lifestyle: { ...state.lifestyle } };
  s.lifestyle.sleepQuality = Math.min(100, s.lifestyle.sleepQuality + 10);
  s.lifestyle.physicalHealth = Math.min(100, s.lifestyle.physicalHealth + 5);
  s.lifestyle.motivation = Math.min(100, s.lifestyle.motivation + 8);
  s.lifestyle.tiltLevel = Math.max(0, s.lifestyle.tiltLevel - 15);
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
  s.weekLog = [...s.weekLog, `Streamed to ${viewers} viewers, earned $${income}`];
  return s;
}

// ─── PROGRESSION CHECK ───
export function checkProgression(state: GameState): GameState {
  const s = { ...state };
  const stages: CareerStage[] = ['FaceIt Grind', 'FPL-C', 'FPL', 'Academy', 'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender'];
  const idx = stages.indexOf(s.stage);

  // FaceIt level progression
  if (s.stage === 'FaceIt Grind' && s.matchesPlayed > 0) {
    const winRate = s.matchesWon / s.matchesPlayed;
    if (winRate > 0.55 && s.stats.rating > 1.0 && s.matchesPlayed > 10) {
      s.faceitLevel = Math.min(10, s.faceitLevel + 1);
    }
    if (s.faceitLevel >= 8 && s.stats.rating > 1.1) {
      s.stage = 'FPL-C';
      s.weekLog = [...s.weekLog, '🎉 Qualified for FPL-C! The grind pays off.'];
      s.achievements = [...s.achievements, 'FPL-C Qualified'];
    }
  }

  if (s.stage === 'FPL-C' && s.stats.rating > 1.2 && s.reputation > 25) {
    s.stage = 'FPL';
    s.weekLog = [...s.weekLog, '🔥 Promoted to FPL! Pros are watching.'];
    s.achievements = [...s.achievements, 'FPL Player'];
  }

  if (s.stage === 'FPL' && s.stats.rating > 1.25 && s.reputation > 35 && !s.team) {
    s.stage = 'Academy';
    const teams = ['Vitality Academy', 'NAVI Junior', 'G2 Academy', 'FaZe Rising', 'Cloud9 Academy'];
    s.team = { name: teams[Math.floor(Math.random() * teams.length)], tier: 'Academy', chemistry: 50, salary: 500 };
    s.weekLog = [...s.weekLog, `📋 Signed with ${s.team.name}! Monthly salary: $${s.team.salary}`];
    s.achievements = [...s.achievements, 'Academy Player'];
  }

  if (s.stage === 'Academy' && s.stats.rating > 1.3 && s.reputation > 50) {
    s.stage = 'Tier 3';
    const teams = ['ENCE', 'Into The Breach', 'Apeks', 'SAW', 'Monte'];
    s.team = { name: teams[Math.floor(Math.random() * teams.length)], tier: 'Tier 3', chemistry: 60, salary: 2000 };
    s.weekLog = [...s.weekLog, `⬆️ Moved to ${s.team.name}! Tier 3 pro.`];
  }

  if (s.stage === 'Tier 3' && s.stats.rating > 1.35 && s.reputation > 65) {
    s.stage = 'Tier 2';
    const teams = ['MOUZ', 'Complexity', 'Imperial', 'paiN', 'OG'];
    s.team = { name: teams[Math.floor(Math.random() * teams.length)], tier: 'Tier 2', chemistry: 55, salary: 5000 };
    s.weekLog = [...s.weekLog, `🚀 Signed with ${s.team.name}! Tier 2 professional.`];
  }

  if (s.stage === 'Tier 2' && s.stats.rating > 1.4 && s.reputation > 80) {
    s.stage = 'Tier 1';
    const teams = ['NAVI', 'Vitality', 'FaZe', 'G2', 'Cloud9', 'Heroic', 'Astralis'];
    s.team = { name: teams[Math.floor(Math.random() * teams.length)], tier: 'Tier 1', chemistry: 50, salary: 15000 };
    s.weekLog = [...s.weekLog, `🏆 ${s.team.name} signed you! TIER 1 PLAYER!`];
    s.achievements = [...s.achievements, 'Tier 1 Pro'];
  }

  if (s.stage === 'Tier 1' && s.stats.rating > 1.5 && s.reputation > 90) {
    s.stage = 'Major Contender';
    s.weekLog = [...s.weekLog, `👑 Major contender. The world is watching.`];
    s.achievements = [...s.achievements, 'Major Contender'];
  }

  // Salary
  if (s.team) {
    s.money += Math.floor(s.team.salary / 4); // Weekly salary
    s.earnings += Math.floor(s.team.salary / 4);
  }

  // Age check
  if (s.age > 33) {
    s.gameOver = true;
    s.gameOverReason = 'Father Time catches up to everyone. Your reflexes have declined too much to compete.';
  }

  return s;
}

// ─── ADVANCE WEEK ───
export function advanceWeek(state: GameState): GameState {
  const s = { ...state };
  s.weeks++;
  if (s.weeks % 52 === 0) {
    s.age++;
    s.weekLog = [...s.weekLog, `🎂 Happy birthday! You're now ${s.age}.`];
  }
  // Reputation slowly decays
  s.reputation = Math.max(0, s.reputation - 0.2);
  // Health degrades slightly
  s.lifestyle.physicalHealth = Math.max(0, s.lifestyle.physicalHealth - 0.5);
  s.lifestyle.sleepQuality = Math.max(0, s.lifestyle.sleepQuality - 0.3);
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
  const s = { ...state };
  const roll = Math.random();
  if (roll < 0.05) {
    // Jackpot
    const winnings = amount * 10;
    s.money += winnings;
    s.weekLog = [...s.weekLog, `🎰 JACKPOT! Won $${winnings} from skin gambling!`];
  } else if (roll < 0.35) {
    // Small win
    const winnings = Math.floor(amount * 1.5);
    s.money += winnings - amount;
    s.weekLog = [...s.weekLog, `🎰 Small win: $${winnings - amount} profit`];
  } else {
    // Lost
    s.money -= amount;
    s.weekLog = [...s.weekLog, `🎰 Lost $${amount} gambling skins. Pain.`];
    s.lifestyle.tiltLevel = Math.min(100, s.lifestyle.tiltLevel + 10);
  }
  return s;
}

// ─── EVENTS ───
const EVENTS: GameEvent[] = [
  {
    id: 'toxic_teammate', title: 'Toxic Teammate', description: 'Your teammate is flaming everyone in comms and throwing rounds.',
    choices: [
      { text: 'Kick them', effects: { teamChemistry: -10, communication: 2, reputation: 3 } },
      { text: 'Let it slide', effects: { motivation: -10, tiltLevel: 15, mentalStrength: 2 } },
    ]
  },
  {
    id: 'trial_offer', title: 'Team Trial Offer', description: 'A team one tier above your level wants you to try out.',
    choices: [
      { text: 'Accept the trial', effects: { motivation: 15, reputation: 5 } },
      { text: 'Keep grinding solo', effects: { aim: 3, mentalStrength: 3 } },
    ]
  },
  {
    id: 'burnout', title: 'Burnout Warning', description: 'You\'ve been grinding 14+ hours a day. Your body is screaming for rest.',
    choices: [
      { text: 'Take a break', effects: { physicalHealth: 15, sleepQuality: 20, motivation: 10, aim: -2 } },
      { text: 'Push through', effects: { aim: 3, physicalHealth: -15, sleepQuality: -15, mentalStrength: 3 } },
    ]
  },
  {
    id: 'stream_offer', title: 'Streaming Opportunity', description: 'A popular streamer wants to duo queue with you live.',
    choices: [
      { text: 'Join the stream', effects: { reputation: 10, motivation: 5, money: 100 } },
      { text: 'Focus on practice', effects: { aim: 2, gameIQ: 2 } },
    ]
  },
  {
    id: 'contract', title: 'Contract Offer', description: 'An org offers you a contract but the salary is below market rate.',
    choices: [
      { text: 'Accept the lowball', effects: { money: 200, motivation: -5, reputation: 5 } },
      { text: 'Hold out for better', effects: { mentalStrength: 5, reputation: -3 } },
    ]
  },
  {
    id: 'lan_invite', title: 'LAN Tournament Invite', description: 'You got invited to a small local LAN. Travel costs $200.',
    choices: [
      { text: 'Go to LAN ($200)', effects: { money: -200, reputation: 8, motivation: 15, communication: 3 } },
      { text: 'Skip it, too expensive', effects: { money: 0, motivation: -5 } },
    ]
  },
  {
    id: 'meta_shift', title: 'Meta Shift', description: 'Valve just dropped a massive update. AWP movement nerfed, smokes reworked.',
    choices: [
      { text: 'Adapt quickly', effects: { gameIQ: 5, aim: -2 } },
      { text: 'Stick to your style', effects: { mentalStrength: 3, gameIQ: -3 } },
    ]
  },
  {
    id: 'school', title: 'School Pressure', description: 'Your parents are pressuring you to focus on school instead of gaming.',
    choices: [
      { text: 'Go full-time CS2', effects: { motivation: 10, mentalStrength: 5, money: -50 } },
      { text: 'Balance both', effects: { aim: -2, physicalHealth: 5, mentalStrength: 3 } },
    ]
  },
  {
    id: 'clutch_moment', title: 'Clutch Moment', description: 'Everyone on HLTV is talking about your insane 1v4 clutch from last match.',
    choices: [
      { text: 'Ride the hype', effects: { reputation: 12, motivation: 10 } },
      { text: 'Stay humble', effects: { mentalStrength: 5, reputation: 5 } },
    ]
  },
  {
    id: 'wrist_pain', title: 'Wrist Pain', description: 'Sharp pain in your mouse hand. Could be RSI.',
    choices: [
      { text: 'Rest and stretch', effects: { physicalHealth: 10, aim: -3 } },
      { text: 'Ignore it', effects: { aim: -1, physicalHealth: -10 } },
    ]
  },
  {
    id: 'bootcamp', title: 'Bootcamp Invitation', description: 'Your team wants to do a 2-week bootcamp in a gaming house.',
    choices: [
      { text: 'Move in', effects: { communication: 8, gameIQ: 5, teamChemistry: 15, physicalHealth: -5 } },
      { text: 'Play from home', effects: { sleepQuality: 5, teamChemistry: -5 } },
    ]
  },
  {
    id: 'skin_drop', title: 'Rare Skin Drop!', description: 'You unboxed a rare knife skin worth $500!',
    choices: [
      { text: 'Sell it', effects: { money: 500 } },
      { text: 'Keep it (drip matters)', effects: { motivation: 10, reputation: 2 } },
    ]
  },
];

export function rollForEvent(state: GameState): GameEvent | null {
  if (Math.random() > 0.3) return null; // 30% chance per week
  const available = EVENTS.filter(e => {
    if (e.minStage) {
      const stages: CareerStage[] = ['FaceIt Grind', 'FPL-C', 'FPL', 'Academy', 'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender'];
      return stages.indexOf(state.stage) >= stages.indexOf(e.minStage);
    }
    return true;
  });
  return available[Math.floor(Math.random() * available.length)];
}

export function applyEventChoice(state: GameState, choice: EventChoice): GameState {
  const s = { ...state, attributes: { ...state.attributes }, lifestyle: { ...state.lifestyle } };
  const e = choice.effects;
  if (e.money) s.money = Math.max(0, s.money + e.money);
  if (e.motivation) s.lifestyle.motivation = Math.max(0, Math.min(100, s.lifestyle.motivation + e.motivation));
  if (e.tiltLevel) s.lifestyle.tiltLevel = Math.max(0, Math.min(100, s.lifestyle.tiltLevel + e.tiltLevel));
  if (e.reputation) s.reputation = Math.max(0, Math.min(100, s.reputation + e.reputation));
  if (e.mentalStrength) s.attributes.mentalStrength = Math.max(0, Math.min(99, s.attributes.mentalStrength + e.mentalStrength));
  if (e.aim) s.attributes.aim = Math.max(0, Math.min(99, s.attributes.aim + e.aim));
  if (e.gameIQ) s.attributes.gameIQ = Math.max(0, Math.min(99, s.attributes.gameIQ + e.gameIQ));
  if (e.communication) s.attributes.communication = Math.max(0, Math.min(99, s.attributes.communication + e.communication));
  if (e.physicalHealth) s.lifestyle.physicalHealth = Math.max(0, Math.min(100, s.lifestyle.physicalHealth + e.physicalHealth));
  if (e.sleepQuality) s.lifestyle.sleepQuality = Math.max(0, Math.min(100, s.lifestyle.sleepQuality + e.sleepQuality));
  if (e.teamChemistry && s.team) {
    s.team = { ...s.team, chemistry: Math.max(0, Math.min(100, s.team.chemistry + e.teamChemistry)) };
  }
  s.currentEvent = null;
  return s;
}
