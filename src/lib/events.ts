import { GameEvent, GameState, CareerStage, ArcType, STAGE_ORDER } from '@/types/game';

// Extended event interface for the story engine
export interface RichEvent extends GameEvent {
  category: EventCategory;
  weight: number;                    // base probability weight (1-10)
  condition?: (s: GameState) => boolean;
  arcAffinity?: ArcType[];           // which arcs boost this event's weight
  arcTrigger?: ArcType;              // this event can start this arc
  chainFrom?: string[];              // event IDs that lead to this one
  narrativeSignificant?: boolean;    // adds to career narrative log
}

export type EventCategory =
  | 'team_drama'
  | 'breakout'
  | 'burnout'
  | 'meta'
  | 'social'
  | 'opportunity'
  | 'personal'
  | 'rivalry'
  | 'financial'
  | 'injury';

function stageIdx(s: CareerStage) { return STAGE_ORDER.indexOf(s); }
function minStage(s: GameState, stage: CareerStage) { return stageIdx(s.stage) >= stageIdx(stage); }
function maxStage(s: GameState, stage: CareerStage) { return stageIdx(s.stage) <= stageIdx(stage); }

export const RICH_EVENTS: RichEvent[] = [

  // ═══════════════════════════════════════════════════════
  // TEAM DRAMA
  // ═══════════════════════════════════════════════════════
  {
    id: 'toxic_teammate',
    title: 'Toxic Teammate',
    category: 'team_drama',
    weight: 6,
    description: 'Your teammate is flaming everyone in comms, throwing rounds on purpose. The whole team is suffering.',
    condition: s => !!s.team,
    arcAffinity: ['toxic_spiral'],
    choices: [
      {
        text: 'Call them out publicly',
        outcomeText: 'The confrontation is messy but clears the air. Reputation with the org takes a small hit.',
        effects: { teamChemistry: -5, communication: 3, reputation: -2, professionalism: -5, toxicity: 5 },
      },
      {
        text: 'Report to team manager',
        outcomeText: 'The org handles it quietly. You gain their trust.',
        effects: { teamChemistry: 5, professionalism: 8, reliability: 5 },
      },
      {
        text: 'Just adapt and ignore it',
        outcomeText: 'You keep your head down. The situation festers.',
        effects: { motivation: -10, tiltLevel: 10, mentalStrength: 3 },
      },
    ],
  },
  {
    id: 'igl_clash',
    title: 'Strategic Clash',
    category: 'team_drama',
    weight: 5,
    description: 'Your IGL is calling strategies you fundamentally disagree with. Your ideas are being ignored.',
    condition: s => !!s.team && s.role !== 'IGL',
    arcAffinity: ['rival_war'],
    choices: [
      {
        text: 'Challenge their calls in practice',
        outcomeText: 'Tension rises but your voice starts to matter.',
        effects: { teamChemistry: -8, communication: 5, gameIQ: 3, professionalism: -3 },
      },
      {
        text: 'Prove it in-game silently',
        outcomeText: 'Your results speak for themselves. Respect grows slowly.',
        effects: { dedication: 5, reliability: 5, mentalStrength: 4 },
      },
      {
        text: 'Demand a role change',
        outcomeText: 'The org is surprised but considers your request.',
        effects: { reputation: 3, professionalism: -5, teamChemistry: -10 },
      },
    ],
  },
  {
    id: 'star_player_kicked',
    title: 'Star Player Kicked',
    category: 'team_drama',
    weight: 4,
    description: 'The team\'s best player just got kicked out of nowhere. There\'s a power vacuum. This is your chance.',
    condition: s => !!s.team,
    arcAffinity: ['breakout', 'comeback'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Step up as the new star',
        outcomeText: 'Everyone is watching. The pressure is massive.',
        effects: { motivation: 15, dedication: 10, tiltLevel: 10, reputation: 5 },
      },
      {
        text: 'Quietly fill the void',
        outcomeText: 'You become more important without the spotlight.',
        effects: { teamChemistry: 8, reliability: 8, gameIQ: 3 },
      },
      {
        text: 'Use it to demand a pay raise',
        outcomeText: 'Bold move. The org is surprised.',
        effects: { money: 500, professionalism: -5, reputation: -3 },
      },
    ],
  },
  {
    id: 'team_falling_apart',
    title: 'Team Is Falling Apart',
    category: 'team_drama',
    weight: 3,
    description: 'Multiple players want to leave. The team atmosphere is toxic. Everyone is on edge.',
    condition: s => !!s.team && (s.team.chemistry < 50 || s.team.morale < 40),
    arcAffinity: ['toxic_spiral', 'burnout'],
    arcTrigger: 'toxic_spiral',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Become the glue — rally the team',
        outcomeText: 'Your leadership is tested but you hold things together.',
        effects: { teamChemistry: 15, communication: 6, motivation: 10, reliability: 8, professionalism: 5 },
      },
      {
        text: 'Start looking for a new team quietly',
        outcomeText: 'You begin reaching out to other orgs. Word travels fast in this scene.',
        effects: { reputation: -5, professionalism: -5, motivation: 5 },
      },
      {
        text: 'Let it burn and take the payout',
        outcomeText: 'The org releases everyone. You\'re free but homeless.',
        effects: { money: 1000, teamChemistry: -50, motivation: -15 },
      },
    ],
  },
  {
    id: 'ego_clash',
    title: 'Ego Clash',
    category: 'team_drama',
    weight: 5,
    description: 'A teammate insists on a rifle when you need the AWP, and keeps taking clutch duels that belong to you.',
    condition: s => !!s.team,
    choices: [
      {
        text: 'Force the confrontation',
        outcomeText: 'Hot take in the team chat. Things get messy.',
        effects: { teamChemistry: -12, toxicity: 5, communication: -2, professionalism: -3 },
      },
      {
        text: 'Adapt your playstyle',
        outcomeText: 'Flexible. Others notice your selflessness.',
        effects: { positioning: 3, teamChemistry: 5, professionalism: 5 },
      },
    ],
  },
  {
    id: 'bootcamp',
    title: 'Team Bootcamp',
    category: 'team_drama',
    weight: 5,
    description: 'The org is flying the team to a gaming house for a 2-week bootcamp. Living with teammates 24/7.',
    condition: s => !!s.team,
    choices: [
      {
        text: 'Embrace the grind, live it',
        outcomeText: 'Bonding over late-night sessions. Chemistry surges.',
        effects: { teamChemistry: 20, communication: 8, gameIQ: 5, physicalHealth: -5, dedication: 8 },
      },
      {
        text: 'Focus on fundamentals only',
        outcomeText: 'Solid practice. The hotel room is your temple.',
        effects: { aim: 3, consistency: 3, teamChemistry: 8 },
      },
      {
        text: 'Skip — play from home',
        outcomeText: 'The team notices. You\'re seen as less committed.',
        effects: { sleepQuality: 10, teamChemistry: -15, reliability: -10 },
      },
    ],
  },
  {
    id: 'roster_rumor',
    title: 'Roster Rumor',
    category: 'team_drama',
    weight: 4,
    description: 'HLTV is reporting your team is looking to replace one player. No names, but you\'ve seen the org acting weird.',
    condition: s => !!s.team,
    narrativeSignificant: true,
    choices: [
      {
        text: 'Ask the org directly',
        outcomeText: 'They dodge the question. That\'s not reassuring.',
        effects: { tiltLevel: 10, motivation: -5, professionalism: 5 },
      },
      {
        text: 'Ignore it and play your best',
        outcomeText: 'Head down. Numbers go up. The rumor fades.',
        effects: { dedication: 8, mentalStrength: 5, reliability: 5 },
      },
      {
        text: 'Post a cryptic tweet',
        outcomeText: 'The community goes wild. Org is not happy.',
        effects: { reputation: 5, professionalism: -12, toxicity: 5 },
      },
    ],
  },
  {
    id: 'salary_dispute',
    title: 'Salary Dispute',
    category: 'team_drama',
    weight: 3,
    description: 'You discovered your teammate earns twice your salary. They have identical stats. It\'s burning you up.',
    condition: s => !!s.team,
    choices: [
      {
        text: 'Negotiate assertively',
        outcomeText: 'Org respects the ask. You get a partial raise.',
        effects: { money: 300, professionalism: 3, reliability: 2 },
      },
      {
        text: 'Use it as motivation',
        outcomeText: 'Fuel to the fire. You outperform everyone that month.',
        effects: { motivation: 15, dedication: 10, aim: 2 },
      },
      {
        text: 'Start looking for buyout clauses',
        outcomeText: 'You research your contract. Knowledge is power.',
        effects: { gameIQ: 2, professionalism: 3 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // BREAKOUT MOMENTS
  // ═══════════════════════════════════════════════════════
  {
    id: 'viral_clip',
    title: 'Viral Clip',
    category: 'breakout',
    weight: 5,
    description: 'Your deagle ace went viral on Reddit and Twitter. 2 million views overnight. Pros are quoting it.',
    arcTrigger: 'breakout',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Ride the wave — go live immediately',
        outcomeText: 'Your Twitch numbers hit an all-time high.',
        effects: { reputation: 18, motivation: 15, money: 200, clutchReputation: 5 },
      },
      {
        text: 'Stay humble, thank the community',
        outcomeText: 'Respect across the board. You gain genuine fans.',
        effects: { reputation: 12, professionalism: 8, motivation: 10 },
      },
    ],
  },
  {
    id: 'analyst_highlight',
    title: 'Analyst Spotlight',
    category: 'breakout',
    weight: 4,
    description: 'A respected CS2 analyst just made a 20-minute breakdown of your playstyle. It\'s glowing.',
    condition: s => minStage(s, 'FPL'),
    arcAffinity: ['breakout', 'prodigy'],
    choices: [
      {
        text: 'Engage with the content, share it',
        outcomeText: 'Community engagement spikes. Org scouts take notice.',
        effects: { reputation: 12, professionalism: 5, motivation: 8 },
      },
      {
        text: 'Use it to request a team evaluation',
        outcomeText: 'The org watches. Numbers suddenly matter more.',
        effects: { reputation: 8, reliability: 5, dedication: 5 },
      },
    ],
  },
  {
    id: 'pro_compliment',
    title: 'Pro Player Shoutout',
    category: 'breakout',
    weight: 5,
    description: 'A top-10 HLTV ranked player just tweeted that you\'re the most underrated player in the scene.',
    arcAffinity: ['breakout', 'prodigy'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Reply and start a conversation',
        outcomeText: 'A connection is made. Could lead to something big.',
        effects: { reputation: 15, motivation: 12, professionalism: 3 },
      },
      {
        text: 'Screenshot and grind harder',
        outcomeText: 'Pure motivation. Best week of practice in months.',
        effects: { motivation: 20, dedication: 12, aim: 2 },
      },
    ],
  },
  {
    id: 'dream_performance',
    title: 'Career Performance',
    category: 'breakout',
    weight: 3,
    description: 'You just dropped 40 frags in an official match with a 1.95 rating. The scoreboard is a lie — it must be.',
    arcTrigger: 'clutch_king',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Let the demo speak for itself',
        outcomeText: 'Scouts are already downloading the POV.',
        effects: { reputation: 15, clutchReputation: 10, motivation: 12 },
      },
      {
        text: 'Post the highlights everywhere',
        outcomeText: 'Maximum exposure. You become a name.',
        effects: { reputation: 20, money: 100, toxicity: 3, professionalism: -2 },
      },
    ],
  },
  {
    id: 'clutch_moment',
    title: 'Legendary Clutch',
    category: 'breakout',
    weight: 6,
    description: 'A 1v4 clutch in overtime. Time froze. You did it. The crowd erupted. HLTV forum is on fire.',
    arcTrigger: 'clutch_king',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Ride the hype — interview ready',
        outcomeText: 'Multiple orgs reach out. Your DMs are exploding.',
        effects: { reputation: 15, motivation: 12, clutchReputation: 15 },
      },
      {
        text: 'Stay humble',
        outcomeText: 'The community respects the maturity.',
        effects: { professionalism: 10, reputation: 8, clutchReputation: 10, mentalStrength: 5 },
      },
    ],
  },
  {
    id: 'tournament_run',
    title: 'Unexpected Tournament Run',
    category: 'breakout',
    weight: 3,
    description: 'Against all odds, your team has made it to the semifinals. The scene is talking about it.',
    condition: s => !!s.activeTournament && s.activeTournament.currentRound >= 2,
    arcAffinity: ['breakout', 'comeback'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Embrace being the underdog',
        outcomeText: 'The internet is behind you. Pressure is lighter.',
        effects: { motivation: 18, mentalStrength: 8, clutchReputation: 8 },
      },
      {
        text: 'Study the opponents hard',
        outcomeText: 'Deep prep. You know every angle they play.',
        effects: { gameIQ: 8, dedication: 8, teamChemistry: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // BURNOUT ARC
  // ═══════════════════════════════════════════════════════
  {
    id: 'early_burnout_warning',
    title: 'Body Sending Signals',
    category: 'burnout',
    weight: 5,
    description: 'You\'re waking up dreading practice. The game feels like work. You can\'t remember the last time you had fun.',
    condition: s => s.lifestyle.motivation < 50 || s.energy < 30,
    arcAffinity: ['burnout'],
    arcTrigger: 'burnout',
    choices: [
      {
        text: 'Power through — the major isn\'t going to win itself',
        outcomeText: 'You push on. Something inside dims a little.',
        effects: { motivation: -10, dedication: -5, physicalHealth: -8, mentalStrength: -5, energy: -10 },
      },
      {
        text: 'Take a few days completely offline',
        outcomeText: 'You remember what life outside CS looks like. It\'s nice.',
        effects: { motivation: 20, sleepQuality: 15, physicalHealth: 10, energy: 30, tiltLevel: -20 },
      },
    ],
  },
  {
    id: 'full_burnout',
    title: 'Complete Burnout',
    category: 'burnout',
    weight: 3,
    description: 'You\'ve been staring at the login screen for 20 minutes. You can\'t do it. Not today. Maybe not ever.',
    condition: s => s.lifestyle.motivation < 30,
    arcAffinity: ['burnout'],
    arcTrigger: 'burnout',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Take a 2-week break from everything',
        outcomeText: 'The world keeps spinning without you. And that\'s okay.',
        effects: { motivation: 35, physicalHealth: 15, sleepQuality: 20, energy: 50, aim: -3, tiltLevel: -30 },
      },
      {
        text: 'Force yourself to play — the team needs you',
        outcomeText: 'You play like a ghost. Everyone notices.',
        effects: { tiltLevel: 20, aim: -5, motivation: -15, teamChemistry: -8, physicalHealth: -10 },
      },
    ],
  },
  {
    id: 'wrist_pain',
    title: 'Wrist Pain',
    category: 'injury',
    weight: 5,
    description: 'Sharp RSI pain every flick. The doctor says "reduce mouse time or risk permanent damage."',
    arcAffinity: ['burnout', 'injury_recovery'],
    arcTrigger: 'injury_recovery',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Rest properly — take 2 weeks off',
        outcomeText: 'The downtime is painful. But your wrist heals.',
        effects: { physicalHealth: 15, energy: 25, aim: -5, motivation: -5, reliability: 5 },
      },
      {
        text: 'Tape it up and play through the pain',
        outcomeText: 'You compete, but every session is agony.',
        effects: { physicalHealth: -20, aim: -8, mentalStrength: 5, reliability: 3 },
      },
      {
        text: 'See a specialist immediately',
        outcomeText: 'Expensive but effective. The right call.',
        effects: { money: -300, physicalHealth: 20, aim: -2, reliability: 8, professionalism: 5 },
      },
    ],
  },
  {
    id: 'eye_strain',
    title: 'Eye Strain Crisis',
    category: 'injury',
    weight: 4,
    description: '14-hour sessions have caught up with you. Blurry vision, headaches. Your crosshair placement is suffering.',
    condition: s => s.lifestyle.hoursPerDay > 10,
    arcAffinity: ['burnout', 'injury_recovery'],
    choices: [
      {
        text: 'Get blue light glasses and cut back',
        outcomeText: 'A sensible adjustment. Performance stabilizes.',
        effects: { money: -80, physicalHealth: 8, sleepQuality: 10, aim: 2 },
      },
      {
        text: 'Just push — it\'ll pass',
        outcomeText: 'It does not pass. Your rating drops.',
        effects: { physicalHealth: -12, aim: -5, consistency: -3 },
      },
    ],
  },
  {
    id: 'sleep_deprivation',
    title: 'Sleep Deprived',
    category: 'burnout',
    weight: 5,
    description: 'You\'ve slept 4 hours a night for the past week. Reaction time is noticeably off. You\'re slow.',
    condition: s => s.lifestyle.sleepQuality < 40,
    arcAffinity: ['burnout'],
    choices: [
      {
        text: 'Fix the sleep schedule aggressively',
        outcomeText: 'Two nights of 10 hours. A new person emerges.',
        effects: { sleepQuality: 25, physicalHealth: 10, motivation: 10, energy: 20 },
      },
      {
        text: 'Energy drinks to compensate',
        outcomeText: 'Works short term. Crashes hard later.',
        effects: { energy: 15, physicalHealth: -8, sleepQuality: -5, motivation: 5, tiltLevel: 10 },
      },
    ],
  },
  {
    id: 'comeback_arc',
    title: 'Rock Bottom',
    category: 'burnout',
    weight: 2,
    description: 'Your stats are tanking. People are calling for your benching. You haven\'t won a match in 2 weeks.',
    condition: s => s.streak.current <= -4,
    arcTrigger: 'comeback',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Isolate and grind the fundamentals',
        outcomeText: 'Back to basics. DM for 4 hours a day.',
        effects: { aim: 5, motivation: 15, dedication: 12, tiltLevel: -10 },
      },
      {
        text: 'Reach out to a mentor pro',
        outcomeText: 'An old pro agrees to review your demos. Perspective shifts.',
        effects: { gameIQ: 8, mentalStrength: 8, motivation: 12, reliability: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // META & GAME EVENTS
  // ═══════════════════════════════════════════════════════
  {
    id: 'major_patch',
    title: 'Major Update Drops',
    category: 'meta',
    weight: 5,
    description: 'Valve dropped a patch. AWP damage reduced, smokes now block radar, and your best map got reworked.',
    choices: [
      {
        text: 'Adapt quickly — study the changes all week',
        outcomeText: 'You understand the new meta faster than anyone.',
        effects: { gameIQ: 8, motivation: 5, dedication: 5 },
      },
      {
        text: 'Stick to your core style',
        outcomeText: 'Old habits die hard. Takes longer to adjust.',
        effects: { mentalStrength: 4, gameIQ: -3 },
      },
    ],
  },
  {
    id: 'map_pool_change',
    title: 'Map Pool Shakeup',
    category: 'meta',
    weight: 4,
    description: 'Your best map got removed. A map you\'ve never played competitively just replaced it.',
    choices: [
      {
        text: 'Grind the new map obsessively',
        outcomeText: 'You become one of the early experts on the new map.',
        effects: { gameIQ: 6, nadeUsage: 5, positioning: 5, dedication: 8 },
      },
      {
        text: 'Focus on your remaining good maps',
        outcomeText: 'Consistency on the other maps improves.',
        effects: { consistency: 5, mentalStrength: 3 },
      },
    ],
  },
  {
    id: 'new_mechanic',
    title: 'New Game Mechanic',
    category: 'meta',
    weight: 4,
    description: 'Valve added sub-tick movement physics. Everyone is re-learning how to strafe-shoot. Even the pros look lost.',
    choices: [
      {
        text: 'Embrace it, find the new edge',
        outcomeText: 'You break it before the meta does.',
        effects: { aim: 5, gameIQ: 5, motivation: 8, dedication: 5 },
      },
      {
        text: 'It\'s fine, just muscle memory',
        outcomeText: 'Denial stage. Costs you some accuracy.',
        effects: { aim: -3, consistency: -2 },
      },
    ],
  },
  {
    id: 'cheat_accusation',
    title: 'Cheat Accusation',
    category: 'meta',
    weight: 3,
    description: 'Someone posted a highlight reel of your best plays, calling them "inhuman." The accusation thread has 500 upvotes.',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Go live and address it with raw gameplay',
        outcomeText: 'The demonstration speaks. Most people believe you.',
        effects: { reputation: 8, professionalism: 8, motivation: 5 },
      },
      {
        text: 'Ignore it — haters gonna hate',
        outcomeText: 'Some people never let it go.',
        effects: { mentalStrength: 5, tiltLevel: 10, motivation: -5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // SOCIAL & STREAMING
  // ═══════════════════════════════════════════════════════
  {
    id: 'stream_offer',
    title: 'Major Streaming Opportunity',
    category: 'social',
    weight: 6,
    description: 'A platform with 50K subscribers wants you to stream exclusively for them. $500/month deal.',
    choices: [
      {
        text: 'Sign the exclusive deal',
        outcomeText: 'Monthly income secured. Streaming takes priority.',
        effects: { money: 500, reputation: 8, dedication: -5, reliability: 3 },
      },
      {
        text: 'Negotiate for non-exclusive',
        outcomeText: 'They agree to 60% of the offer. More freedom.',
        effects: { money: 300, reputation: 5, professionalism: 5 },
      },
      {
        text: 'Decline — focus on playing',
        outcomeText: 'Respect for the dedication.',
        effects: { dedication: 8, professionalism: 3 },
      },
    ],
  },
  {
    id: 'twitter_beef',
    title: 'Twitter Beef',
    category: 'social',
    weight: 5,
    description: 'A pro player subtweeted you after you beat them. The fans want drama. Your mentions are chaos.',
    arcAffinity: ['rival_war'],
    choices: [
      {
        text: 'Respond with receipts and stats',
        outcomeText: 'You win the exchange. The internet loves it.',
        effects: { reputation: 10, toxicity: 8, professionalism: -8, motivation: 8 },
      },
      {
        text: 'Take the high road publicly',
        outcomeText: 'More respect gained than from any clap back.',
        effects: { professionalism: 12, reputation: 6, mentalStrength: 5 },
      },
      {
        text: 'Block and mute everything',
        outcomeText: 'The beef dies without oxygen.',
        effects: { tiltLevel: -10, motivation: 5, reputation: -3 },
      },
    ],
  },
  {
    id: 'content_offer',
    title: 'Content Creator Offer',
    category: 'social',
    weight: 4,
    description: 'A big gaming YouTube channel wants to feature you in a video series about grinders trying to go pro.',
    choices: [
      {
        text: 'Join the series — build the brand',
        outcomeText: 'The series goes well. Your story resonates.',
        effects: { reputation: 12, money: 150, professionalism: 3, motivation: 8 },
      },
      {
        text: 'One episode only — protect your privacy',
        outcomeText: 'A good first impression, controlled exposure.',
        effects: { reputation: 6, professionalism: 5 },
      },
    ],
  },
  {
    id: 'toxic_clip_viral',
    title: 'Toxic Moment Goes Viral',
    category: 'social',
    weight: 4,
    description: 'A clip of you flaming in a pug got posted. 300K views. Orgs are seeing this.',
    condition: s => s.personality.toxicity > 40,
    arcAffinity: ['toxic_spiral'],
    arcTrigger: 'toxic_spiral',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Post a genuine apology',
        outcomeText: 'The community is skeptical but appreciates the accountability.',
        effects: { reputation: -5, professionalism: 10, toxicity: -10, reliability: 5 },
      },
      {
        text: 'Double down — "That\'s just comp"',
        outcomeText: 'Your existing fanbase loves it. Orgs do not.',
        effects: { reputation: -12, toxicity: 15, professionalism: -15 },
      },
    ],
  },
  {
    id: 'fan_interaction',
    title: 'Memorable Fan Moment',
    category: 'social',
    weight: 5,
    description: 'A 14-year-old says your gameplay inspired them to start competing. They\'re attending their first LAN next month.',
    choices: [
      {
        text: 'Mentor them — share your journey',
        outcomeText: 'The story spreads. People see a different side of you.',
        effects: { professionalism: 8, reputation: 6, motivation: 10, clutchReputation: 3 },
      },
      {
        text: 'Wish them luck, keep it professional',
        outcomeText: 'Brief but kind. They\'ll remember it.',
        effects: { professionalism: 5, reputation: 3 },
      },
    ],
  },
  {
    id: 'reddit_thread',
    title: 'HLTV Thread About You',
    category: 'social',
    weight: 5,
    description: 'Someone posted "Is [your name] the most overrated player in their tier?" It has 400+ comments. A mix.',
    choices: [
      {
        text: 'Read every comment and get fired up',
        outcomeText: 'Emotional fuel. Dangerous and effective.',
        effects: { motivation: 15, tiltLevel: 15, aim: 2 },
      },
      {
        text: 'Close the tab — stay in your lane',
        outcomeText: 'Mental clarity. Comments can\'t hurt what they can\'t reach.',
        effects: { mentalStrength: 8, tiltLevel: -5, dedication: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // OPPORTUNITY
  // ═══════════════════════════════════════════════════════
  {
    id: 'scout_watching',
    title: 'You\'ve Been Scouted',
    category: 'opportunity',
    weight: 4,
    description: 'A Tier 1 team manager reached out: "We\'ve been watching your demos. Interested in a trial?"',
    condition: s => minStage(s, 'Tier 2'),
    arcAffinity: ['prodigy', 'breakout'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Accept — this is the call',
        outcomeText: 'Trial scheduled. The pressure is on.',
        effects: { motivation: 20, tiltLevel: 10, reputation: 10, dedication: 10 },
      },
      {
        text: 'Negotiate terms first',
        outcomeText: 'Professionalism shows. They respect the ask.',
        effects: { professionalism: 10, reputation: 8, motivation: 12 },
      },
    ],
  },
  {
    id: 'trial_offer',
    title: 'Trial Period',
    category: 'opportunity',
    weight: 5,
    description: 'A team one tier above you invites you to a 3-week trial period. No guarantees.',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Accept — bet on yourself',
        outcomeText: 'High pressure, but you were made for this.',
        effects: { motivation: 18, reputation: 8, dedication: 10, tiltLevel: 8 },
      },
      {
        text: 'Decline — not ready yet',
        outcomeText: 'The org understands. They\'ll watch longer.',
        effects: { mentalStrength: 5, aim: 3, dedication: 5 },
      },
    ],
  },
  {
    id: 'coaching_offer',
    title: 'Coaching from a Legend',
    category: 'opportunity',
    weight: 3,
    description: 'A retired top-10 HLTV player offers to personally review your VODs every week. He sees potential.',
    arcAffinity: ['prodigy', 'comeback'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Accept and commit fully',
        outcomeText: 'The sessions are brutal but transformative.',
        effects: { gameIQ: 12, positioning: 8, mentalStrength: 8, dedication: 10 },
      },
      {
        text: 'Do it but on your own schedule',
        outcomeText: 'Some sessions missed. Still significant growth.',
        effects: { gameIQ: 6, positioning: 4, reliability: -5 },
      },
    ],
  },
  {
    id: 'lan_invite',
    title: 'LAN Invite',
    category: 'opportunity',
    weight: 5,
    description: 'A local LAN tournament wants you as a wildcard. Travel costs $200 but the exposure is real.',
    choices: [
      {
        text: 'Go — LAN experience is priceless',
        outcomeText: 'The energy is electric. You play differently in person.',
        effects: { money: -200, reputation: 10, motivation: 15, communication: 5, mentalStrength: 5 },
      },
      {
        text: 'Skip — can\'t afford the travel',
        outcomeText: 'Smart budget move, but you miss the experience.',
        effects: { motivation: -5 },
      },
    ],
  },
  {
    id: 'energy_drink_sponsor',
    title: 'Energy Drink Sponsorship',
    category: 'opportunity',
    weight: 5,
    description: 'A gaming energy drink company wants you as a brand ambassador. $200 one-time, monthly restocks.',
    choices: [
      {
        text: 'Sign it — free energy and money',
        outcomeText: 'The brand fits your grinder persona.',
        effects: { money: 200, reputation: 5, motivation: 5, professionalism: 3 },
      },
      {
        text: 'Ask for equity instead',
        outcomeText: 'Bold negotiation. They\'re surprised but consider it.',
        effects: { professionalism: 5, money: 50, reputation: 3 },
      },
      {
        text: 'Decline — stay authentic',
        outcomeText: 'Fans notice. The refusal earns quiet respect.',
        effects: { mentalStrength: 3, reputation: 3, professionalism: 5 },
      },
    ],
  },
  {
    id: 'contract',
    title: 'Lowball Contract',
    category: 'opportunity',
    weight: 4,
    description: 'An org offers you a contract. The salary is below market rate but it\'s a step up in tier.',
    choices: [
      {
        text: 'Accept — foot in the door',
        outcomeText: 'Career momentum over money.',
        effects: { money: 200, motivation: -5, reputation: 5, reliability: 3 },
      },
      {
        text: 'Counter-negotiate firmly',
        outcomeText: 'They respect your awareness of your own value.',
        effects: { professionalism: 8, money: 100, reputation: 3 },
      },
      {
        text: 'Walk away — you\'re worth more',
        outcomeText: 'Bold. But now you need to prove it.',
        effects: { mentalStrength: 8, motivation: 10, professionalism: 3 },
      },
    ],
  },
  {
    id: 'player_coach',
    title: 'Player-Coach Offer',
    category: 'opportunity',
    weight: 2,
    description: 'The team asks you to take on coaching responsibilities alongside competing. Extra salary, extra load.',
    condition: s => minStage(s, 'Tier 2') && s.attributes.gameIQ > 60,
    narrativeSignificant: true,
    choices: [
      {
        text: 'Accept the challenge',
        outcomeText: 'The dual role is intense. Your game IQ skyrockets.',
        effects: { money: 300, gameIQ: 10, communication: 8, dedication: -5, aim: -3 },
      },
      {
        text: 'Decline — I\'m a player, not a coach',
        outcomeText: 'Focus remains. The playing career has more chapters.',
        effects: { dedication: 5, aim: 3, professionalism: 3 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // PERSONAL
  // ═══════════════════════════════════════════════════════
  {
    id: 'family_pressure',
    title: 'Family Intervention',
    category: 'personal',
    weight: 5,
    description: 'Your parents sat you down. They\'re worried. "You\'re 19 and throwing your life away on video games."',
    condition: s => s.age < 22 && maxStage(s, 'FPL'),
    choices: [
      {
        text: 'Show them the earnings and career potential',
        outcomeText: 'The numbers help. Skeptical but backing off.',
        effects: { motivation: 10, mentalStrength: 5 },
      },
      {
        text: 'Promise to keep grades up',
        outcomeText: 'Balance is harder than you thought.',
        effects: { dedication: -5, aim: -2, physicalHealth: 5, motivation: 5 },
      },
      {
        text: 'Go full-time, full commitment',
        outcomeText: 'All-in. No safety net. Pure focus.',
        effects: { dedication: 15, motivation: 15, money: -100, physicalHealth: -5 },
      },
    ],
  },
  {
    id: 'school',
    title: 'Academic Warning',
    category: 'personal',
    weight: 4,
    description: 'Three missed assignments and failing a course. Your tutor says you\'re headed for trouble.',
    condition: s => s.age < 21,
    choices: [
      {
        text: 'Drop out and go full CS2',
        outcomeText: 'The die is cast. All chips in.',
        effects: { dedication: 15, motivation: 12, money: -200, physicalHealth: -3 },
      },
      {
        text: 'Take a temporary break from competing',
        outcomeText: 'Catch up on studies. Miss two weeks of play.',
        effects: { physicalHealth: 5, reliability: 5, aim: -2 },
      },
    ],
  },
  {
    id: 'health_scare',
    title: 'Health Scare',
    category: 'personal',
    weight: 2,
    description: 'Chest tightness and shortness of breath. The doctor says sedentary lifestyle at your age is alarming.',
    condition: s => s.lifestyle.physicalHealth < 40,
    arcAffinity: ['burnout', 'injury_recovery'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Take it seriously — gym and diet overhaul',
        outcomeText: 'The discipline carries into your game. Clarity returns.',
        effects: { physicalHealth: 20, sleepQuality: 10, motivation: 10, dedication: 8, money: -100 },
      },
      {
        text: 'Assume it\'ll pass',
        outcomeText: 'It doesn\'t fully pass. Something nags.',
        effects: { physicalHealth: -10, motivation: -8, tiltLevel: 10 },
      },
    ],
  },
  {
    id: 'mentor_meeting',
    title: 'Old Coach Reaches Out',
    category: 'personal',
    weight: 3,
    description: 'A coach who believed in you early in your career saw your struggles. He wants to talk.',
    arcAffinity: ['comeback', 'burnout'],
    choices: [
      {
        text: 'Meet up and open up',
        outcomeText: 'The conversation reframes everything. You remember why you started.',
        effects: { motivation: 25, mentalStrength: 10, gameIQ: 5, tiltLevel: -15 },
      },
      {
        text: 'Decline — don\'t need pity',
        outcomeText: 'Pride intact. But the fog stays.',
        effects: { mentalStrength: 5, motivation: -5 },
      },
    ],
  },
  {
    id: 'financial_stress',
    title: 'Financial Pressure',
    category: 'financial',
    weight: 4,
    description: 'Rent is due, equipment upgrade needed, and you haven\'t been earning much. Numbers are tight.',
    condition: s => s.money < 300,
    choices: [
      {
        text: 'Stream more aggressively this week',
        outcomeText: 'Hustle mode. Not ideal for performance.',
        effects: { money: 150, dedication: -5, motivation: -5 },
      },
      {
        text: 'Reach out to a smaller sponsor',
        outcomeText: 'A local gaming cafe pays for logo rights. Small but stable.',
        effects: { money: 200, professionalism: 3, reputation: 2 },
      },
      {
        text: 'Cut costs — budget gaming mode',
        outcomeText: 'Resourceful. Uncomfortable but manageable.',
        effects: { mentalStrength: 5, tiltLevel: 10 },
      },
    ],
  },
  {
    id: 'skin_drop',
    title: 'Rare Skin Drop',
    category: 'financial',
    weight: 5,
    description: 'You opened a case just for fun. Karambit Fade. Worth $800. Your hands are shaking.',
    choices: [
      {
        text: 'Sell it immediately',
        outcomeText: 'Cash in hand. Smart.',
        effects: { money: 800, motivation: 10 },
      },
      {
        text: 'Keep it — drip matters',
        outcomeText: 'The knife is beautiful. It means something.',
        effects: { motivation: 15, reputation: 3, clutchReputation: 3 },
      },
    ],
  },
  {
    id: 'gambling_debt',
    title: 'Gambling Spiral',
    category: 'financial',
    weight: 3,
    description: 'You\'re down $600 and keep chasing. The voice in your head says "one more spin".',
    condition: s => s.money < 200,
    arcAffinity: ['burnout'],
    choices: [
      {
        text: 'Close all gambling sites immediately',
        outcomeText: 'Damage control. You break the spiral.',
        effects: { mentalStrength: 8, tiltLevel: -10, physicalHealth: 5, money: 0 },
      },
      {
        text: 'One more spin to recoup',
        outcomeText: 'The house wins. Again.',
        effects: { money: -100, tiltLevel: 20, motivation: -15, physicalHealth: -5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // RIVALRY EVENTS
  // ═══════════════════════════════════════════════════════
  {
    id: 'rival_appears',
    title: 'A Worthy Rival',
    category: 'rivalry',
    weight: 4,
    description: 'A player your age is getting all the attention you deserve. Same role, same region. People compare you constantly.',
    condition: s => !s.rival,
    arcTrigger: 'rival_war',
    narrativeSignificant: true,
    choices: [
      {
        text: 'Accept the rivalry publicly',
        outcomeText: 'The community eats it up. Mutual hype.',
        effects: { motivation: 15, reputation: 5, toxicity: 5, clutchReputation: 3 },
      },
      {
        text: 'Focus on your own path',
        outcomeText: 'You don\'t acknowledge it. But you watch their every move.',
        effects: { mentalStrength: 8, dedication: 8 },
      },
    ],
  },
  {
    id: 'rival_trash_talk',
    title: 'Rival Calls You Out',
    category: 'rivalry',
    weight: 5,
    description: 'Your rival just said in an interview: "I\'m honestly not impressed by them. Overrated."',
    condition: s => !!s.rival,
    arcAffinity: ['rival_war'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Clap back in media',
        outcomeText: 'The beef escalates. Both fan bases go wild.',
        effects: { motivation: 20, toxicity: 8, professionalism: -8, tiltLevel: 5 },
      },
      {
        text: 'Respond with results, not words',
        outcomeText: 'Quiet focus. The next match will say everything.',
        effects: { mentalStrength: 10, dedication: 10, clutchReputation: 5 },
      },
    ],
  },
  {
    id: 'rival_encounter',
    title: 'Rival Matchup',
    category: 'rivalry',
    weight: 5,
    description: 'You\'re in the same bracket as your rival. The community is already making threads about the matchup.',
    condition: s => !!s.rival && !!s.activeTournament,
    arcAffinity: ['rival_war'],
    narrativeSignificant: true,
    choices: [
      {
        text: 'Study their recent demos specifically',
        outcomeText: 'You know their tendencies. Every angle.',
        effects: { gameIQ: 8, mentalStrength: 5, dedication: 10 },
      },
      {
        text: 'Play your natural game',
        outcomeText: 'Comfortable and authentic. Dangerous in its own way.',
        effects: { mentalStrength: 8, clutchReputation: 5, motivation: 10 },
      },
    ],
  },
  {
    id: 'rival_collab',
    title: 'Rival Reaches Out',
    category: 'rivalry',
    weight: 2,
    description: 'Your rival DMs you: "Hey, respect the grind. Want to hit DM servers together sometime?"',
    condition: s => !!s.rival && s.rival.beefLevel > 30,
    arcAffinity: ['rival_war'],
    choices: [
      {
        text: 'Agree — competition breeds excellence',
        outcomeText: 'The rivalry becomes a mutual sharpening stone.',
        effects: { aim: 5, gameIQ: 3, mentalStrength: 5, clutchReputation: 5 },
      },
      {
        text: 'Decline — they\'re still the enemy',
        outcomeText: 'The rivalry stays cold. Fuel for later.',
        effects: { motivation: 8, toxicity: 3 },
      },
    ],
  },
];

/**
 * Helper: get all events with their effective weights for current game state.
 * Arc affinity doubles the weight. Conditions gate the event entirely.
 */
export function getAvailableEvents(state: GameState): RichEvent[] {
  const currentArc = state.arc?.type ?? 'none';

  return RICH_EVENTS.filter(event => {
    // Check stage requirement
    if (event.minStage) {
      if (stageIdx(state.stage) < stageIdx(event.minStage)) return false;
    }
    // Check custom condition
    if (event.condition && !event.condition(state)) return false;
    // Don't repeat very recent events
    if (state.eventHistory?.includes(event.id)) return false;
    return true;
  }).map(event => {
    let weight = event.weight;
    // Arc affinity boosts weight
    if (currentArc !== 'none' && event.arcAffinity?.includes(currentArc)) {
      weight *= 2.5;
    }
    // Burnout events get heavily boosted when motivation/energy is low
    if (event.category === 'burnout' && (state.lifestyle.motivation < 40 || state.energy < 25)) {
      weight *= 2;
    }
    // Rivalry events boosted when rival exists
    if (event.category === 'rivalry' && state.rival) {
      weight *= 1.5;
    }
    // Team drama only relevant with team
    if (event.category === 'team_drama' && !state.team) {
      weight = 0;
    }
    return { ...event, weight };
  }).filter(e => e.weight > 0);
}
