import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, TrainingFocus, EventChoice } from '@/types/game';
import {
  createInitialState, applyTraining, simulateMatch, applyRest,
  applyStreaming, checkProgression, advanceWeek, buyEquipment,
  gambleSkins, rollForEvent, applyEventChoice,
  applyTeamPractice, playTournamentMatch,
  trackEvent, ensureNewStateFields,
  signContract, rejectOffer,
  acceptTournamentInvite, declineTournamentInvite,
  leaveTeam, retirePlayer,
  applyMentalCoaching, hireAnalyst, postContent,
} from '@/lib/gameEngine';
import { updateArc } from '@/lib/storyEngine';
import { rollMatchMoment } from '@/lib/matchMoments';

type GameAction =
  | { type: 'NEW_GAME'; name: string; age: number; role: any; region: any }
  | { type: 'TRAIN'; focus: TrainingFocus }
  | { type: 'PLAY_MATCH' }
  | { type: 'REST' }
  | { type: 'STREAM' }
  | { type: 'TEAM_PRACTICE' }
  | { type: 'PLAY_TOURNAMENT_MATCH' }
  | { type: 'ACCEPT_TOURNAMENT_INVITE'; inviteId: string }
  | { type: 'DECLINE_TOURNAMENT_INVITE'; inviteId: string }
  | { type: 'BUY_EQUIPMENT'; item: string; category: 'monitor' | 'mouse' | 'keyboard' | 'pc' }
  | { type: 'GAMBLE'; amount: number }
  | { type: 'RESOLVE_EVENT'; choice: EventChoice; eventId?: string }
  | { type: 'DISMISS_EVENT'; eventId?: string }
  | { type: 'SIGN_CONTRACT'; offerId: string }
  | { type: 'REJECT_OFFER'; offerId: string }
  | { type: 'LEAVE_TEAM' }
  | { type: 'RETIRE' }
  | { type: 'MENTAL_COACHING' }
  | { type: 'HIRE_ANALYST' }
  | { type: 'POST_CONTENT' }
  | { type: 'LOAD_GAME'; state: GameState };

const WEEK_ACTIONS = new Set(['TRAIN', 'PLAY_MATCH', 'REST', 'STREAM', 'TEAM_PRACTICE', 'PLAY_TOURNAMENT_MATCH']);

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'NEW_GAME') {
    return createInitialState(action.name, action.age, action.role, action.region);
  }
  if (action.type === 'LOAD_GAME') {
    return ensureNewStateFields(action.state);
  }
  if (!state) return null;

  let newState = { ...state, weekLog: [] as string[] };

  switch (action.type) {
    case 'TRAIN': {
      if (newState.energy < 10) {
        newState.weekLog = ['⚡ Too exhausted to train. Rest first.'];
        break;
      }
      newState = applyTraining(newState, action.focus);
      const attrLabel = action.focus === 'nades' ? 'nade usage' : action.focus;
      newState.weekLog = [...newState.weekLog, `Trained ${attrLabel} — Energy: ${Math.round(newState.energy)}/100`];
      break;
    }

    case 'PLAY_MATCH': {
      // If a match moment is already pending (boost staged), just play the match
      if (newState.pendingMatch) {
        const { state: ms, result } = simulateMatch(newState);
        newState = ms;
        if (newState.stage !== 'FaceIt Grind') {
          const clutchNote = result.clutchMoment ? ' ⚡ Clutch!' : '';
          newState.weekLog = [
            ...newState.weekLog,
            `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}${clutchNote}`,
          ];
        }
        break;
      }
      // Roll for a pre-match moment (45% chance)
      if (Math.random() < 0.45) {
        const moment = rollMatchMoment(newState);
        if (moment) {
          // Stage the pending match — show the moment modal, don't play match yet
          newState = { ...newState, currentEvent: moment, pendingMatch: true };
          // Don't advance week or run progression — wait for event resolution
          try { localStorage.setItem('cs2-career-save', JSON.stringify(newState)); } catch {}
          return newState;
        }
      }
      const { state: ms, result } = simulateMatch(newState);
      newState = ms;
      if (newState.stage !== 'FaceIt Grind') {
        const clutchNote = result.clutchMoment ? ' ⚡ Clutch!' : '';
        newState.weekLog = [
          ...newState.weekLog,
          `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}${clutchNote}`,
        ];
      }
      break;
    }

    case 'REST':
      newState = applyRest(newState);
      newState.weekLog = [...newState.weekLog, `😴 Rested — Energy: ${Math.round(newState.energy)}/100`];
      break;

    case 'STREAM':
      newState = applyStreaming(newState);
      break;

    case 'TEAM_PRACTICE': {
      if (!newState.team) { newState.weekLog = ['You need a team first!']; break; }
      if (newState.energy < 10) { newState.weekLog = ['⚡ Too exhausted. Rest first.']; break; }
      newState = applyTeamPractice(newState);
      break;
    }

    case 'PLAY_TOURNAMENT_MATCH': {
      if (!newState.activeTournament) { newState.weekLog = ['Not in a tournament.']; break; }
      if (newState.energy < 10) { newState.weekLog = ['⚡ Rest before competing!']; break; }
      const { state: ts } = playTournamentMatch(newState);
      newState = ts;
      break;
    }

    case 'ACCEPT_TOURNAMENT_INVITE': {
      if (newState.activeTournament) { newState.weekLog = ['Already in a tournament!']; break; }
      newState = acceptTournamentInvite(newState, action.inviteId);
      break;
    }

    case 'DECLINE_TOURNAMENT_INVITE':
      newState = declineTournamentInvite(newState, action.inviteId);
      newState.weekLog = [...newState.weekLog, '📩 Tournament invite declined.'];
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

    case 'RESOLVE_EVENT': {
      const eventId = action.eventId ?? newState.currentEvent?.id;
      const wasPendingMatch = newState.pendingMatch;
      newState = applyEventChoice(newState, action.choice);
      if (eventId) newState = trackEvent(newState, eventId);
      // If this was a pre-match moment, now run the actual match
      if (wasPendingMatch) {
        const { state: ms, result } = simulateMatch(newState);
        newState = ms;
        if (newState.stage !== 'FaceIt Grind') {
          const clutchNote = result.clutchMoment ? ' ⚡ Clutch!' : '';
          newState.weekLog = [
            ...newState.weekLog,
            `${result.won ? '✅ WIN' : '❌ LOSS'} — ${result.kills}/${result.deaths} | ${result.adr} ADR | ${result.rating} Rating${result.mvp ? ' ⭐ MVP' : ''}${clutchNote}`,
          ];
        }
        // Run progression for the match week
        newState = advanceWeek(newState);
        newState = checkProgression(newState);
        newState = updateArc(newState);
        if (Math.random() > 0.5) {
          const event = rollForEvent(newState);
          if (event) newState.currentEvent = event;
        }
        try { localStorage.setItem('cs2-career-save', JSON.stringify(newState)); } catch {}
        return newState;
      }
      break;
    }

    case 'DISMISS_EVENT': {
      const eventId = action.eventId ?? newState.currentEvent?.id;
      newState = { ...newState, currentEvent: null };
      if (eventId) newState = trackEvent(newState, eventId);
      break;
    }

    case 'SIGN_CONTRACT':
      newState = signContract(newState, action.offerId);
      break;

    case 'REJECT_OFFER':
      newState = rejectOffer(newState, action.offerId);
      newState.weekLog = [...newState.weekLog, '📋 Contract offer rejected.'];
      break;

    case 'LEAVE_TEAM':
      newState = leaveTeam(newState);
      break;

    case 'RETIRE':
      newState = retirePlayer(newState);
      break;

    case 'MENTAL_COACHING':
      newState = applyMentalCoaching(newState);
      break;

    case 'HIRE_ANALYST':
      newState = hireAnalyst(newState);
      break;

    case 'POST_CONTENT':
      newState = postContent(newState);
      break;

    default:
      return state;
  }

  // Advance week for time-consuming actions
  if (WEEK_ACTIONS.has(action.type)) {
    newState = advanceWeek(newState);
    newState = checkProgression(newState);
    newState = updateArc(newState);
    // Events less frequent during tourney
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
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    // Try to restore save on mount
    try {
      const saved = localStorage.getItem('cs2-career-save');
      if (saved) {
        const parsed = JSON.parse(saved);
        return ensureNewStateFields(parsed);
      }
    } catch {}
    return null;
  });
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
