import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, TrainingFocus, EventChoice } from '@/types/game';
import {
  createInitialState, applyTraining, simulateMatch, applyRest,
  applyStreaming, checkProgression, advanceWeek, buyEquipment,
  gambleSkins, rollForEvent, applyEventChoice,
  applyTeamPractice, enterTournament, playTournamentMatch,
  trackEvent, ensureNewStateFields,
} from '@/lib/gameEngine';
import { updateArc } from '@/lib/storyEngine';

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
  | { type: 'RESOLVE_EVENT'; choice: EventChoice; eventId?: string }
  | { type: 'DISMISS_EVENT'; eventId?: string }
  | { type: 'LOAD_GAME'; state: GameState };

// Actions that consume a week
const WEEK_ACTIONS = new Set(['TRAIN', 'PLAY_MATCH', 'REST', 'STREAM', 'TEAM_PRACTICE', 'PLAY_TOURNAMENT_MATCH']);

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'NEW_GAME') {
    return createInitialState(action.name, action.age, action.role, action.region);
  }
  if (action.type === 'LOAD_GAME') {
    // Ensure old saves get new fields
    return ensureNewStateFields(action.state);
  }
  if (!state) return null;

  let newState = { ...state, weekLog: [] as string[] };

  switch (action.type) {
    case 'TRAIN': {
      if (newState.energy < 10) {
        newState.weekLog = ['⚡ Too exhausted to train! Rest to recover energy.'];
        break;
      }
      newState = applyTraining(newState, action.focus);
      const attrLabel = action.focus === 'nades' ? 'nade usage' : action.focus;
      newState.weekLog = [
        ...newState.weekLog,
        `Trained ${attrLabel} — Energy: ${Math.round(newState.energy)}/100`,
      ];
      break;
    }
    case 'PLAY_MATCH': {
      const { state: ms, result } = simulateMatch(newState);
      newState = ms;
      const clutchNote = result.clutchMoment ? ' ⚡ Clutch moment!' : '';
      newState.weekLog = [
        ...newState.weekLog,
        `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}${clutchNote}`,
      ];
      break;
    }
    case 'REST':
      newState = applyRest(newState);
      newState.weekLog = [...newState.weekLog, `😴 Rested — Energy restored to ${Math.round(newState.energy)}/100`];
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
    case 'RESOLVE_EVENT': {
      const eventId = action.eventId ?? newState.currentEvent?.id;
      newState = applyEventChoice(newState, action.choice);
      if (eventId) newState = trackEvent(newState, eventId);
      break;
    }
    case 'DISMISS_EVENT': {
      const eventId = action.eventId ?? newState.currentEvent?.id;
      newState = { ...newState, currentEvent: null };
      if (eventId) newState = trackEvent(newState, eventId);
      break;
    }
    default:
      return state;
  }

  // Advance week for time-consuming actions
  if (WEEK_ACTIONS.has(action.type)) {
    newState = advanceWeek(newState);
    newState = checkProgression(newState);
    // Update story arc based on new state
    newState = updateArc(newState);
    // Roll for event (reduced frequency during tournament to cut noise)
    if (action.type !== 'PLAY_TOURNAMENT_MATCH' || Math.random() > 0.6) {
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
