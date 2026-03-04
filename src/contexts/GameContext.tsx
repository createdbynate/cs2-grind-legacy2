import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, TrainingFocus, EventChoice } from '@/types/game';
import {
  createInitialState, applyTraining, simulateMatch, applyRest,
  applyStreaming, checkProgression, advanceWeek, buyEquipment,
  gambleSkins, rollForEvent, applyEventChoice
} from '@/lib/gameEngine';

type GameAction =
  | { type: 'NEW_GAME'; name: string; age: number; role: any; region: any }
  | { type: 'TRAIN'; focus: TrainingFocus }
  | { type: 'PLAY_MATCH' }
  | { type: 'REST' }
  | { type: 'STREAM' }
  | { type: 'BUY_EQUIPMENT'; item: string; category: 'monitor' | 'mouse' | 'keyboard' | 'pc' }
  | { type: 'GAMBLE'; amount: number }
  | { type: 'RESOLVE_EVENT'; choice: EventChoice }
  | { type: 'DISMISS_EVENT' }
  | { type: 'LOAD_GAME'; state: GameState };

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'NEW_GAME') {
    return createInitialState(action.name, action.age, action.role, action.region);
  }
  if (action.type === 'LOAD_GAME') return action.state;
  if (!state) return null;

  let newState = { ...state, weekLog: [] as string[] };

  switch (action.type) {
    case 'TRAIN':
      newState = applyTraining(newState, action.focus);
      newState.weekLog = [...newState.weekLog, `Trained ${action.focus} this week.`];
      break;
    case 'PLAY_MATCH': {
      const { state: ms, result } = simulateMatch(newState);
      newState = ms;
      newState.weekLog = [...newState.weekLog,
        `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}`
      ];
      // Rep gain from matches
      if (result.rating > 1.2) newState.reputation = Math.min(100, newState.reputation + 1);
      if (result.mvp) newState.reputation = Math.min(100, newState.reputation + 2);
      break;
    }
    case 'REST':
      newState = applyRest(newState);
      newState.weekLog = [...newState.weekLog, 'Took the week off to rest and recover.'];
      break;
    case 'STREAM':
      newState = applyStreaming(newState);
      break;
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

  // Don't advance week for equipment/gamble/events
  if (['TRAIN', 'PLAY_MATCH', 'REST', 'STREAM'].includes(action.type)) {
    newState = advanceWeek(newState);
    newState = checkProgression(newState);
    // Roll for event
    const event = rollForEvent(newState);
    if (event) {
      newState.currentEvent = event;
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
