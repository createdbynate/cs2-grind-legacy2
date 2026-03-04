export type Role = 'Entry Fragger' | 'AWPer' | 'IGL' | 'Support' | 'Lurker';
export type Region = 'EU' | 'CIS' | 'NA' | 'SA' | 'Asia';
export type CareerStage = 'FaceIt Grind' | 'FPL-C' | 'FPL' | 'Academy' | 'Tier 3' | 'Tier 2' | 'Tier 1' | 'Major Contender' | 'Retired';

export type TrainingFocus = 'aim' | 'positioning' | 'nades' | 'gameIQ' | 'communication';
export type WeekAction = 'train' | 'match' | 'rest' | 'stream' | 'shop';

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

export interface Team {
  name: string;
  tier: CareerStage;
  chemistry: number;
  salary: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  minStage?: CareerStage;
}

export interface EventChoice {
  text: string;
  effects: Partial<EventEffects>;
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
}

export interface MatchResult {
  won: boolean;
  kills: number;
  deaths: number;
  adr: number;
  rating: number;
  mvp: boolean;
  type: 'pug' | 'scrim' | 'official' | 'qualifier' | 'major';
}

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
  currentEvent: GameEvent | null;
  lastMatchResult: MatchResult | null;
  weekLog: string[];
  gameOver: boolean;
  gameOverReason?: string;
  achievements: string[];
}

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
