import { GameEvent, GameState } from '@/types/game';

// ─── PRE-MATCH DECISION MOMENTS ───
// These fire before a match and let the player make a tactical/mental decision
// that directly affects the match outcome via matchMomentBoost.

export const MATCH_MOMENTS: GameEvent[] = [
  {
    id: 'moment_pistol_call',
    category: 'match_moment',
    title: 'Pistol Round Call',
    description: "Your IGL calls an aggressive eco pistol round rush before the match even starts warming up — save money for rifles or yolo the stack?",
    weight: 8,
    choices: [
      {
        text: "Follow the call. Team play wins games.",
        outcomeText: "You sync up with the team. Coordination adds up.",
        effects: { teamChemistry: 5, confidence: 8, matchMomentBoost: 0.1 },
      },
      {
        text: "Save your money. Play your own plan.",
        outcomeText: "You keep your economy. Individual performance carries.",
        effects: { motivation: 5, matchMomentBoost: -0.05 },
      },
    ],
  },
  {
    id: 'moment_1v2_clutch',
    category: 'match_moment',
    title: '1v2 Clutch Situation',
    description: "Round 26. Tied match. You're last alive, bomb planted, 2 enemies alive. 18 seconds on the clock. How do you play it?",
    weight: 7,
    choices: [
      {
        text: "Aggressive — wide peek both, force the duels.",
        outcomeText: "High risk, high reward. Your hands better not shake.",
        effects: { clutchReputation: 12, matchMomentBoost: 0.22, tiltLevel: -5 },
      },
      {
        text: "Passive — use crossfire angles, bait time.",
        outcomeText: "Smart, patient play. Make them come to you.",
        effects: { clutchReputation: 5, gameIQ: 1, matchMomentBoost: 0.08 },
      },
      {
        text: "Drop to knife and sneak the defuse.",
        outcomeText: "A Hail Mary. Nobody expects this.",
        effects: { clutchReputation: 20, matchMomentBoost: 0.3, tiltLevel: 10 },
      },
    ],
  },
  {
    id: 'moment_toxic_flame',
    category: 'match_moment',
    title: 'Teammate Going Nuclear',
    description: "Your teammate is on a 7-death streak and blaming you for every one of them in voice chat. The whole lobby can hear it.",
    weight: 9,
    choices: [
      {
        text: "Mute him. Focus on your crosshair placement.",
        outcomeText: "Silence is golden. You lock in.",
        effects: { tiltLevel: -12, motivation: 5, matchMomentBoost: 0.12 },
      },
      {
        text: "Clap back. You're not taking that.",
        outcomeText: "Now both of you are tilted. The team falls apart.",
        effects: { toxicity: 8, tiltLevel: 15, teamChemistry: -10, matchMomentBoost: -0.18 },
      },
      {
        text: "Try to calm him down — rally the team.",
        outcomeText: "Leadership under pressure. Risky but could flip everything.",
        effects: { communication: 2, professionalism: 5, teamChemistry: 8, matchMomentBoost: 0.05 },
      },
    ],
  },
  {
    id: 'moment_force_vs_eco',
    category: 'match_moment',
    title: 'Force or Save?',
    description: "Your team is 3-9 down at half. Economy is broken. The squad wants to force buy rifles. Your gut says eco and reset.",
    weight: 8,
    choices: [
      {
        text: "Force with the team. Go down swinging.",
        outcomeText: "All-in energy. Sometimes the yolo clutches rounds.",
        effects: { money: -400, teamChemistry: 8, matchMomentBoost: 0.15 },
      },
      {
        text: "Eco and play for information.",
        outcomeText: "You reset. Smart — but you're playing alone this round.",
        effects: { money: 200, gameIQ: 1, matchMomentBoost: -0.05 },
      },
    ],
  },
  {
    id: 'moment_half_time_speech',
    category: 'match_moment',
    title: 'Down at Half',
    description: "You're 4-11 at halftime. Your IGL is silent. The team's morale is cracking. Someone needs to say something.",
    weight: 7,
    choices: [
      {
        text: "Step up. Give a real speech — 'We've come back from worse.'",
        outcomeText: "Leadership. The team finds a second wind.",
        effects: { communication: 2, teamChemistry: 12, motivation: 15, matchMomentBoost: 0.2 },
      },
      {
        text: "Stay quiet. Let them figure it out.",
        outcomeText: "Nobody steps up. The void stays quiet.",
        effects: { matchMomentBoost: -0.05 },
      },
      {
        text: "Blame the strategy. Call out the IGL.",
        outcomeText: "Drama mid-match. This either galvanizes or destroys.",
        effects: { toxicity: 5, professionalism: -8, teamChemistry: -5, matchMomentBoost: 0.05 },
      },
    ],
  },
  {
    id: 'moment_warmup_slump',
    category: 'match_moment',
    title: 'Pre-Match Warmup Slump',
    description: "You can't hit a single shot in warmup. Every peek, every angle — you're off. The match is in 5 minutes.",
    weight: 9,
    choices: [
      {
        text: "Put the mouse down. Breathe. Reset your headspace.",
        outcomeText: "Mental clarity over mechanical panic.",
        effects: { tiltLevel: -10, mentalStrength: 1, matchMomentBoost: 0.1 },
      },
      {
        text: "Keep warming up — grind through it.",
        outcomeText: "You power through the rough warmup.",
        effects: { dedication: 2, matchMomentBoost: 0.0 },
      },
      {
        text: "Accept the slump and play slow this map.",
        outcomeText: "Playing to your current level instead of forcing it.",
        effects: { tiltLevel: -5, matchMomentBoost: -0.08 },
      },
    ],
  },
  {
    id: 'moment_overtime',
    category: 'match_moment',
    title: '12-12 Overtime',
    description: "Overtime. Score tied 12-12. Your team is broke — pistols only. Enemy has full rifles. What do you call?",
    weight: 6,
    choices: [
      {
        text: "Deagle rush mid — surprise them.",
        outcomeText: "Pure aggression. Could go either way wildly.",
        effects: { clutchReputation: 8, matchMomentBoost: 0.25, tiltLevel: 5 },
      },
      {
        text: "Stack a site and hold tight angles.",
        outcomeText: "Discipline wins overtime rounds.",
        effects: { positioning: 1, matchMomentBoost: 0.1 },
      },
    ],
  },
  {
    id: 'moment_info_play',
    category: 'match_moment',
    title: 'Solo Information Play',
    description: "You have perfect info — you know where all 3 enemies are. You can solo push and frag, or wait for your team.",
    weight: 8,
    condition: (s: GameState) => s.attributes.mentalStrength > 40,
    choices: [
      {
        text: "Solo entry. You have the info, use it now.",
        outcomeText: "High tempo play. Your individual skill gets tested.",
        effects: { clutchReputation: 10, matchMomentBoost: 0.18, tiltLevel: -5 },
      },
      {
        text: "Call it out and wait for backup.",
        outcomeText: "Smart team play. You share the info, team executes.",
        effects: { communication: 2, teamChemistry: 5, matchMomentBoost: 0.08 },
      },
    ],
  },
  {
    id: 'moment_smoke_lineup',
    category: 'match_moment',
    title: 'Critical Smoke Lineup',
    description: "Critical T-side round. Your execute only works if you land the one-way smoke perfectly. You've practiced it but never in a live high-stakes round.",
    weight: 7,
    choices: [
      {
        text: "Attempt the perfect lineup. Full commit.",
        outcomeText: "The practice either pays off or it doesn't.",
        effects: { nadeUsage: 2, matchMomentBoost: 0.15 },
      },
      {
        text: "Default smoke — safe but obvious.",
        outcomeText: "Enemy read your setup. But you don't throw it.",
        effects: { matchMomentBoost: 0.0 },
      },
    ],
  },
  {
    id: 'moment_mental_reset',
    category: 'match_moment',
    title: 'Mid-Match Tilt',
    description: "You just got one-tapped through a smoke for the fourth time. The tilt is real. You can feel your aim getting shaky.",
    weight: 9,
    choices: [
      {
        text: "Deep breath. Count to five. Reset.",
        outcomeText: "Mental discipline kicks in.",
        effects: { tiltLevel: -15, mentalStrength: 2, matchMomentBoost: 0.12 },
      },
      {
        text: "Revenge peek. You're going to get that guy.",
        outcomeText: "You're playing emotional. Tunnel vision.",
        effects: { tiltLevel: 12, motivation: -8, matchMomentBoost: -0.15 },
      },
    ],
  },
  {
    id: 'moment_coach_timeout',
    category: 'match_moment',
    title: 'Coach Calls Timeout',
    description: "Your coach calls a tactical timeout. You're losing rounds you should win. The team huddles — there's tension in the air.",
    weight: 6,
    condition: (s: GameState) => !!s.team,
    choices: [
      {
        text: "Listen fully. Take the notes, reset.",
        outcomeText: "Coachable. That's how pros improve.",
        effects: { motivation: 10, gameIQ: 1, matchMomentBoost: 0.12 },
      },
      {
        text: "Nod but tune out. You know what to do.",
        outcomeText: "Confidence in your own reads. Could backfire.",
        effects: { matchMomentBoost: 0.03 },
      },
      {
        text: "Use it to vent about teammates.",
        outcomeText: "Drama timeout. Coach is not impressed.",
        effects: { professionalism: -8, teamChemistry: -8, matchMomentBoost: -0.12 },
      },
    ],
  },
  {
    id: 'moment_map_veto',
    category: 'match_moment',
    title: 'Worst Map Drawn',
    description: "Map veto result: you're playing the enemy's best map — your absolute worst. Every player hates this one. Mindset going in?",
    weight: 7,
    choices: [
      {
        text: "Treat it as a challenge. Pros adapt.",
        outcomeText: "Growth mindset. You focus on the process.",
        effects: { gameIQ: 2, dedication: 3, matchMomentBoost: 0.1 },
      },
      {
        text: "Play super conservative. Don't gift rounds.",
        outcomeText: "Safe mentality. You won't throw — but won't pop off.",
        effects: { tiltLevel: -5, matchMomentBoost: -0.02 },
      },
      {
        text: "Go full chaos. Nothing to lose on this map.",
        outcomeText: "Unpredictable aggression throws them off.",
        effects: { clutchReputation: 5, matchMomentBoost: 0.18, tiltLevel: 8 },
      },
    ],
  },
  {
    id: 'moment_weapon_drop',
    category: 'match_moment',
    title: 'Gun Round Decision',
    description: "Round 15 buy phase. You can drop a rifle to your top-performing teammate or keep it and frag out yourself. One rifle between you.",
    weight: 7,
    choices: [
      {
        text: "Drop the rifle. Let the hot hand cook.",
        outcomeText: "Selfless play. The team's top fragger goes off.",
        effects: { teamChemistry: 8, reliability: 5, matchMomentBoost: 0.12 },
      },
      {
        text: "Keep it. You're the carry today.",
        outcomeText: "Your ego on the line. Better deliver.",
        effects: { clutchReputation: 5, matchMomentBoost: 0.05 },
      },
    ],
  },
  {
    id: 'moment_rival_encounter',
    category: 'match_moment',
    title: 'Rival in the Server',
    description: "You check the enemy lineup — your rival is in the server. Last 3 encounters went their way. You can feel the tension already.",
    weight: 6,
    condition: (s: GameState) => !!s.rival,
    choices: [
      {
        text: "Target them specifically. Make it personal.",
        outcomeText: "Revenge motivation. Dangerous but powerful.",
        effects: { motivation: 15, clutchReputation: 5, tiltLevel: 5, matchMomentBoost: 0.2 },
      },
      {
        text: "Ignore the rivalry. Play your own game.",
        outcomeText: "Professional detachment. Smart and controlled.",
        effects: { tiltLevel: -8, professionalism: 5, matchMomentBoost: 0.08 },
      },
    ],
  },
  {
    id: 'moment_late_round_bomb',
    category: 'match_moment',
    title: 'Bomb Plant, Last Alive',
    description: "You're last alive. Bomb planted with 22 seconds. Two enemies alive. They're splitting to both bomb exits. Hold or rotate?",
    weight: 7,
    choices: [
      {
        text: "Hold one angle. Force the one-at-a-time peek.",
        outcomeText: "Discipline. Make them come to you.",
        effects: { positioning: 1, mentalStrength: 1, matchMomentBoost: 0.15 },
      },
      {
        text: "Rotate to gather info — catch them off guard.",
        outcomeText: "Active player. You hunt instead of wait.",
        effects: { clutchReputation: 8, matchMomentBoost: 0.1 },
      },
      {
        text: "Knife rush the closer enemy immediately.",
        outcomeText: "Pure instinct. Completely unexpected.",
        effects: { clutchReputation: 18, tiltLevel: 5, matchMomentBoost: 0.25 },
      },
    ],
  },
];

// Weighted random selection from eligible moments
export function rollMatchMoment(state: GameState): GameEvent | null {
  const eligible = MATCH_MOMENTS.filter(m => {
    if (m.condition && !m.condition(state)) return false;
    return true;
  });

  const totalWeight = eligible.reduce((sum, m) => sum + (m.weight ?? 5), 0);
  let roll = Math.random() * totalWeight;
  for (const moment of eligible) {
    roll -= (moment.weight ?? 5);
    if (roll <= 0) return moment;
  }
  return eligible[0] ?? null;
}
