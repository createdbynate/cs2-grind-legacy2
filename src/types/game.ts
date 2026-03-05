export type Role = 'Entry Fragger' | 'AWPer' | 'IGL' | 'Support' | 'Lurker';
export type Region = 'EU' | 'CIS' | 'NA' | 'SA' | 'Asia';
export type CareerStage = 'FaceIt Grind' | 'FPL-C' | 'FPL' | 'Academy' | 'Tier 3' | 'Tier 2' | 'Tier 1' | 'Major Contender' | 'Retired';

export type TrainingFocus = 'aim' | 'positioning' | 'nades' | 'gameIQ' | 'communication';
export type WeekAction = 'train' | 'match' | 'rest' | 'stream' | 'shop' | 'team_practice' | 'tournament_match';

export type TournamentType =
  | 'ESEA Open'
  | 'ESEA Main'
  | 'ESEA Advanced'
  | 'ESEA Premier'
  | 'ESL Challenger'
  | 'ESL Pro League'
  | 'IEM'
  | 'BLAST Premier'
  | 'PGL Major Qualifier'
  | 'Valve Major';

// ─── STORY ARC SYSTEM ───
export type ArcType =
  | 'none'
  | 'burnout'
  | 'comeback'
  | 'prodigy'
  | 'toxic_spiral'
  | 'clutch_king'
  | 'rival_war'
  | 'injury_recovery'
  | 'breakout';

export interface CareerArc {
  type: ArcType;
  startWeek: number;
  intensity: number;
  resolved: boolean;
  label: string;
}

// ─── PERSONALITY SYSTEM ───
export interface PersonalityTraits {
  professionalism: number;
  toxicity: number;
  clutchReputation: number;
  reliability: number;
  dedication: number;
}

// ─── STREAK / CONFIDENCE ───
export interface StreakData {
  current: number;
  longestWin: number;
  longestLoss: number;
  confidence: number;
}

// ─── RIVAL SYSTEM ───
export interface Rival {
  name: string;
  team: string;
  skill: number;
  stage: CareerStage;
  wins: number;
  losses: number;
  beefLevel: number;
}

// ─── CAREER NARRATIVE LOG ───
export type NarrativeType = 'achievement' | 'drama' | 'milestone' | 'breakout' | 'struggle' | 'rivalry';
export interface CareerNarrativeEntry {
  week: number;
  text: string;
  type: NarrativeType;
}

// ─── CORE STATS ───
export interface PlayerStats {
  adr: number;
  kd: number;
  hsPercent: number;
  kast: number;
  rating: number;
  clutchPercent: number;
}

export interface Attributes {
  aim: number;
  positioning: number;
  gameIQ: number;
  nadeUsage: number;
  communication: number;
  mentalStrength: number;
  consistency: number;
}

export interface Lifestyle {
  hoursPerDay: number;
  sleepQuality: number;
  physicalHealth: number;
  motivation: number;
  tiltLevel: number;
}

export interface Equipment {
  monitor: MonitorTier;
  mouse: MouseTier;
  keyboard: KeyboardTier;
  pc: PCTier;
}

export type MonitorTier = '60Hz' | '144Hz' | '240Hz' | '360Hz';
export type MouseTier = 'Budget' | 'Mid-Range' | 'Pro';
export type KeyboardTier = 'Membrane' | 'Mechanical' | 'Custom';
export type PCTier = 'Potato' | 'Mid' | 'High-End' | 'Beast';

export const EQUIPMENT_PRICES: Record<string, number> = {
  '144Hz': 250, '240Hz': 500, '360Hz': 800,
  'Mid-Range': 80, 'Pro': 150,
  'Mechanical': 120, 'Custom': 300,
  'Mid': 800, 'High-End': 1500, 'Beast': 3000,
};

// ─── ENERGY COSTS ───
export const ENERGY_COSTS: Record<WeekAction, number> = {
  train: 30,
  match: 15,
  rest: -50,
  stream: 10,
  shop: 0,
  team_practice: 25,
  tournament_match: 20,
};

// ─── FACEIT ELO THRESHOLDS (accurate to real FACEIT CS2 levels) ───
export const FACEIT_LEVEL_ELO: Record<number, [number, number]> = {
  1: [100,  500],
  2: [501,  750],
  3: [751,  900],
  4: [901,  1050],
  5: [1051, 1200],
  6: [1201, 1450],
  7: [1451, 1700],
  8: [1701, 2000],
  9: [1851, 2100], // overlapping zone — elite territory
  10: [2001, 9999], // 2001+ = Level 10; FPL candidates
};

// ─── CONTRACT SYSTEM ───
export interface ContractOffer {
  id: string;
  teamName: string;
  tier: CareerStage;
  monthlyUSD: number;
  durationWeeks: 26 | 52 | 78;
  signingBonus: number;
  performanceClause: number; // min rating or released
  expiresWeek: number;
}

export interface ActiveContract {
  teamName: string;
  tier: CareerStage;
  monthlyUSD: number;
  durationWeeks: number;
  startWeek: number;
  endWeek: number;
  performanceClause: number;
  poorFormStreak: number; // consecutive weeks below clause
}

// ─── TOURNAMENT INVITE ───
export interface TournamentInvite {
  id: string;
  name: string;
  type: TournamentType;
  prizePool: number;
  rounds: number;
  expiresWeek: number;
  prestige: number; // 1-10
}

// ─── ACTIVE TOURNAMENT ───
export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  prizePool: number;
  rounds: number;
  currentRound: number;
  wins: number;
  eliminated: boolean;
  won: boolean;
  prestige: number;
}

export interface TournamentResult {
  name: string;
  type: TournamentType;
  placement: string;
  prize: number;
}

// ─── TEAMMATE ───
export type TeammatePersonality = 'aggressive' | 'supportive' | 'passive' | 'toxic' | 'leader';

export interface Teammate {
  name: string;
  role: Role;
  skill: number;
  chemistry: number;
  personality: TeammatePersonality;
  mood: number;
}

// ─── TEAM ───
export interface Team {
  name: string;
  tier: CareerStage;
  chemistry: number;
  salary: number;
  morale: number;
  teammates: Teammate[];
}

// ─── MATCH ───
export interface MatchResult {
  won: boolean;
  kills: number;
  deaths: number;
  adr: number;
  rating: number;
  mvp: boolean;
  type: 'pug' | 'scrim' | 'official' | 'qualifier' | 'major';
  tournamentRound?: string;
  clutchMoment?: boolean;
  streakEffect?: string;
}

// ─── EVENT SYSTEM ───
export type EventCategory =
  | 'team_drama' | 'breakout' | 'burnout' | 'meta'
  | 'social' | 'opportunity' | 'personal' | 'rivalry'
  | 'financial' | 'injury';

export interface EventEffects {
  money: number;
  motivation: number;
  tiltLevel: number;
  reputation: number;
  mentalStrength: number;
  aim: number;
  gameIQ: number;
  communication: number;
  physicalHealth: number;
  sleepQuality: number;
  teamChemistry: number;
  energy: number;
  professionalism: number;
  toxicity: number;
  clutchReputation: number;
  reliability: number;
  dedication: number;
  confidence: number;
  nadeUsage: number;
  positioning: number;
}

export interface EventChoice {
  text: string;
  label?: string; // alias for text, for backwards compat
  effects: Partial<EventEffects>;
  outcomeText?: string;
}

export interface GameEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  choices: EventChoice[];
  condition?: (state: GameState) => boolean;
  weight?: number;
  arcAffinity?: ArcType[];
  minStage?: CareerStage;
  maxStage?: CareerStage;
  cooldownWeeks?: number;
}

// ─── STAGE ORDER UTILITY ───
export const STAGE_ORDER: CareerStage[] = [
  'FaceIt Grind', 'FPL-C', 'FPL', 'Academy', 'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender', 'Retired',
];

// ─── GAME STATE ───
export interface GameState {
  // Identity
  playerName: string;
  age: number;
  weeks: number;
  role: Role;
  region: Region;

  // Career
  stage: CareerStage;
  stats: PlayerStats;
  attributes: Attributes;

  // Resources
  money: number;
  reputation: number;
  energy: number;
  earnings: number;

  // Lifestyle
  lifestyle: Lifestyle;
  equipment: Equipment;

  // FACEIT
  faceitLevel: number;
  faceitElo: number;

  // Team & Contract
  team: Team | null;
  activeContract: ActiveContract | null;
  pendingOffers: ContractOffer[];

  // Match tracking
  matchesPlayed: number;
  matchesWon: number;
  lastMatchResult: MatchResult | null;
  recentRatings: number[];

  // Tournaments
  activeTournament: Tournament | null;
  pendingTournamentInvites: TournamentInvite[];
  tournamentHistory: TournamentResult[];

  // Story systems
  personality: PersonalityTraits;
  streak: StreakData;
  arc: CareerArc;
  rival: Rival | null;
  careerNarrative: CareerNarrativeEntry[];

  // Events
  currentEvent: GameEvent | null;
  weekLog: string[];
  eventHistory: { id: string; week: number }[];

  // Meta
  achievements: string[];
  gameOver: boolean;
  gameOverReason?: string;
}
