import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, TrainingFocus, EventChoice } from '@/types/game';
import {
  createInitialState, applyTraining, simulateMatch, applyRest,
  applyStreaming, checkProgression, advanceWeek, buyEquipment,
  gambleSkins, rollForEvent, applyEventChoice,
  applyTeamPractice, enterTournament, playTournamentMatch,
} from '@/lib/gameEngine';

type GameAction =
  | { type: 'NEW_GAME'; name: string; age: number; role: any; region: any }
  | { type: 'TRAIN'; focus: TrainingFocus }
  | { type: 'PLAY_MATCH' }
  | { type: 'REST' }
  | { type: 'STREAM' }
  | { type: 'TEAM_PRACTICE' }
  | { type: 'ENTER_TOURNAMENT'; tournamentId: string }
  | { type: 'PLAY_TOURNAMENT_MATCH' }
  | { type: 'BUY_EQUIPMENT'; item: string; category: 'monitor' | 'mouse' | 'keyboard' | 'pc' }
  | { type: 'GAMBLE'; amount: number }
  | { type: 'RESOLVE_EVENT'; choice: EventChoice }
  | { type: 'DISMISS_EVENT' }
  | { type: 'LOAD_GAME'; state: GameState };

// Actions that consume a week
const WEEK_ACTIONS = new Set(['TRAIN', 'PLAY_MATCH', 'REST', 'STREAM', 'TEAM_PRACTICE', 'PLAY_TOURNAMENT_MATCH']);

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'NEW_GAME') {
    return createInitialState(action.name, action.age, action.role, action.region);
  }
  if (action.type === 'LOAD_GAME') return action.state;
  if (!state) return null;

  let newState = { ...state, weekLog: [] as string[] };

  switch (action.type) {
    case 'TRAIN': {
      if (newState.energy < 10) {
        newState.weekLog = ['⚡ Too exhausted to train! Rest to recover energy.'];
        break;
      }
      newState = applyTraining(newState, action.focus);
      newState.weekLog = [...newState.weekLog, `Trained ${action.focus} this week. Energy: ${Math.round(newState.energy)}/100`];
      break;
    }
    case 'PLAY_MATCH': {
      const { state: ms, result } = simulateMatch(newState);
      newState = ms;
      newState.weekLog = [...newState.weekLog,
        `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}`
      ];
      if (result.rating > 1.2) newState.reputation = Math.min(100, newState.reputation + 1);
      if (result.mvp) newState.reputation = Math.min(100, newState.reputation + 2);
      break;
    }
    case 'REST':
      newState = applyRest(newState);
      newState.weekLog = [...newState.weekLog, `Rested this week. Energy restored to ${Math.round(newState.energy)}/100`];
      break;
    case 'STREAM':
      newState = applyStreaming(newState);
      break;
    case 'TEAM_PRACTICE': {
      if (!newState.team) {
        newState.weekLog = ['You need to be on a team first!'];
        break;
      }
      if (newState.energy < 10) {
        newState.weekLog = ['⚡ Too exhausted for team practice! Rest first.'];
        break;
      }
      newState = applyTeamPractice(newState);
      break;
    }
    case 'ENTER_TOURNAMENT': {
      if (newState.activeTournament) {
        newState.weekLog = ['Already in a tournament!'];
        break;
      }
      newState = enterTournament(newState, action.tournamentId);
      break;
    }
    case 'PLAY_TOURNAMENT_MATCH': {
      if (!newState.activeTournament) {
        newState.weekLog = ['Not currently in a tournament.'];
        break;
      }
      if (newState.energy < 10) {
        newState.weekLog = ['⚡ Too exhausted for a tournament match! Rest first.'];
        break;
      }
      const { state: ts } = playTournamentMatch(newState);
      newState = ts;
      break;
    }
    case 'BUY_EQUIPMENT': {
      const result = buyEquipment(newState, action.item, action.category);
      if (result) newState = result;
      else newState.weekLog = [...newState.weekLog, "Can't afford that!"];
      break;
    }
    case 'GAMBLE':
      newState = gambleSkins(newState, action.amount);
      break;
    case 'RESOLVE_EVENT':
      newState = applyEventChoice(newState, action.choice);
      break;
    case 'DISMISS_EVENT':
      newState = { ...newState, currentEvent: null };
      break;
    default:
      return state;
  }

  // Advance week for time-consuming actions
  if (WEEK_ACTIONS.has(action.type)) {
    newState = advanceWeek(newState);
    newState = checkProgression(newState);
    // Roll for event (not during tournament matches to reduce noise)
    if (action.type !== 'PLAY_TOURNAMENT_MATCH') {
      const event = rollForEvent(newState);
      if (event) newState.currentEvent = event;
    }
  }

  // Auto-save
  try { localStorage.setItem('cs2-career-save', JSON.stringify(newState)); } catch {}

  return newState;
}

interface GameContextValue {
  state: GameState | null;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
