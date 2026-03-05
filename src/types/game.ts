export type Role = 'Entry Fragger' | 'AWPer' | 'IGL' | 'Support' | 'Lurker';
export type Region = 'EU' | 'CIS' | 'NA' | 'SA' | 'Asia';
export type CareerStage = 'FaceIt Grind' | 'FPL-C' | 'FPL' | 'Academy' | 'Tier 3' | 'Tier 2' | 'Tier 1' | 'Major Contender' | 'Retired';

export type TrainingFocus = 'aim' | 'positioning' | 'nades' | 'gameIQ' | 'communication';
export type WeekAction = 'train' | 'match' | 'rest' | 'stream' | 'shop' | 'team_practice' | 'tournament_match';

export type TournamentType = 'Open Qualifier' | 'Regional' | 'Pro League' | 'Major Qualifier' | 'Major';

// ─── STORY ARC SYSTEM ───
export type ArcType =
  | 'none'
  | 'burnout'           // grinding too hard, heading toward collapse
  | 'comeback'          // recovering from a slump or low point
  | 'prodigy'           // rapid early career rise
  | 'toxic_spiral'      // toxicity causing real consequences
  | 'clutch_king'       // known for performing under pressure
  | 'rival_war'         // intense ongoing rivalry
  | 'injury_recovery'   // recovering from physical issue
  | 'breakout';         // sudden breakthrough moment

export interface CareerArc {
  type: ArcType;
  startWeek: number;
  intensity: number;   // 0-100
  resolved: boolean;
  label: string;
}

// ─── PERSONALITY SYSTEM (hidden traits) ───
export interface PersonalityTraits {
  professionalism: number;   // 0-100: affects org trust & signing chances
  toxicity: number;          // 0-100: causes drama, hurts team relations
  clutchReputation: number;  // 0-100: known for clutching (bonus in big moments)
  reliability: number;       // 0-100: showing up consistently
  dedication: number;        // 0-100: training effectiveness multiplier
}

// ─── STREAK / CONFIDENCE ───
export interface StreakData {
  current: number;       // positive = win streak, negative = loss streak
  longestWin: number;
  longestLoss: number;
  confidence: number;    // 0-100, boosts/hurts performance
}

// ─── RIVAL SYSTEM ───
export interface Rival {
  name: string;
  team: string;
  skill: number;       // 0-99
  stage: CareerStage;
  wins: number;        // player's wins vs rival
  losses: number;
  beefLevel: number;   // 0-100, social drama intensity
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

// ─── TEAM ───
export type TeammatePersonality = 'aggressive' | 'supportive' | 'passive' | 'toxic' | 'leader';

export interface Teammate {
  name: string;
  role: Role;
  skill: number;        // 0-99
  chemistry: number;    // 0-100 chemistry with player
  personality: TeammatePersonality;
  mood: number;         // 0-100
}

export interface Team {
  name: string;
  tier: CareerStage;
  chemistry: number;
  salary: number;
  teammates: Teammate[];
  morale: number;       // 0-100 overall team morale
}

// ─── TOURNAMENT ───
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
  minStage: CareerStage;
}

export interface TournamentResult {
  name: string;
  type: TournamentType;
  placement: string;
  prize: number;
}

// ─── EVENTS ───
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  minStage?: CareerStage;
  category?: string;
}

export interface EventChoice {
  text: string;
  effects: Partial<EventEffects>;
  outcomeText?: string;   // shown after choice
}

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
  // Personality effects
  professionalism: number;
  toxicity: number;
  clutchReputation: number;
  reliability: number;
  dedication: number;
  confidence: number;
  nadeUsage: number;
  positioning: number;
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
  clutchMoment?: boolean;   // did they have a notable clutch?
  streakEffect?: string;    // 'hot' | 'cold' — narrative label
}

// ─── GAME STATE ───
export interface GameState {
  playerName: string;
  age: number;
  weeks: number;
  role: Role;
  region: Region;
  stage: CareerStage;
  stats: PlayerStats;
  attributes: Attributes;
  lifestyle: Lifestyle;
  equipment: Equipment;
  team: Team | null;
  money: number;
  reputation: number;
  matchesPlayed: number;
  matchesWon: number;
  faceitLevel: number;
  earnings: number;
  energy: number;
  activeTournament: Tournament | null;
  tournamentHistory: TournamentResult[];
  currentEvent: GameEvent | null;
  lastMatchResult: MatchResult | null;
  weekLog: string[];
  gameOver: boolean;
  gameOverReason?: string;
  achievements: string[];

  // ─── NEW SYSTEMS ───
  personality: PersonalityTraits;
  streak: StreakData;
  arc: CareerArc;
  rival: Rival | null;
  careerNarrative: CareerNarrativeEntry[];
  eventHistory: string[];          // last 10 event IDs for chain detection
}

// ─── CONSTANTS ───
export const EQUIPMENT_PRICES: Record<string, number> = {
  '144Hz': 250,
  '240Hz': 500,
  '360Hz': 800,
  'Mid-Range': 80,
  'Pro': 150,
  'Mechanical': 120,
  'Custom': 300,
  'Mid': 800,
  'High-End': 1500,
  'Beast': 3000,
};

export const EQUIPMENT_BONUSES: Record<string, Partial<Attributes>> = {
  '144Hz': { aim: 3, consistency: 2 },
  '240Hz': { aim: 5, consistency: 4 },
  '360Hz': { aim: 7, consistency: 5 },
  'Mid-Range': { aim: 2 },
  'Pro': { aim: 4, consistency: 2 },
  'Mechanical': { consistency: 2 },
  'Custom': { consistency: 4 },
  'Mid': { consistency: 3 },
  'High-End': { consistency: 5, aim: 2 },
  'Beast': { consistency: 7, aim: 3 },
};

export const ENERGY_COSTS = {
  train: 30,
  match: 15,
  tournament_match: 20,
  stream: 10,
  team_practice: 25,
};

export const AVAILABLE_TOURNAMENTS: Omit<Tournament, 'currentRound' | 'wins' | 'eliminated' | 'won'>[] = [
  {
    id: 'open_qualifier',
    name: 'Open Qualifier',
    type: 'Open Qualifier',
    prizePool: 1000,
    rounds: 3,
    minStage: 'FPL',
  },
  {
    id: 'regional_championship',
    name: 'Regional Championship',
    type: 'Regional',
    prizePool: 5000,
    rounds: 4,
    minStage: 'Academy',
  },
  {
    id: 'pro_league',
    name: 'Pro League',
    type: 'Pro League',
    prizePool: 25000,
    rounds: 5,
    minStage: 'Tier 3',
  },
  {
    id: 'major_qualifier',
    name: 'Major Qualifier',
    type: 'Major Qualifier',
    prizePool: 50000,
    rounds: 5,
    minStage: 'Tier 2',
  },
  {
    id: 'cs2_major',
    name: 'CS2 Major',
    type: 'Major',
    prizePool: 500000,
    rounds: 6,
    minStage: 'Tier 1',
  },
];

export const STAGE_ORDER: CareerStage[] = [
  'FaceIt Grind', 'FPL-C', 'FPL', 'Academy',
  'Tier 3', 'Tier 2', 'Tier 1', 'Major Contender',
];
