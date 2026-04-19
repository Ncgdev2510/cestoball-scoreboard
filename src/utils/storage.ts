import { MatchState, DEFAULT_MATCH_STATE } from '../types/match';

const STATE_KEY = 'scoreboard_match_state';
const EVENT_KEY = 'scoreboard_event';

export function saveState(state: MatchState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadState(): MatchState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchState;
    
    // Ensure nested objects have default values for new properties
    return {
      ...DEFAULT_MATCH_STATE,
      ...parsed,
      home: { ...DEFAULT_MATCH_STATE.home, ...parsed.home },
      away: { ...DEFAULT_MATCH_STATE.away, ...parsed.away },
    };
  } catch {
    return null;
  }
}

export function clearState(): void {
  localStorage.removeItem(STATE_KEY);
}

export interface BoardEvent {
  type: 'triple' | 'alarm' | 'timeout';
  team?: 'home' | 'away';
  timestamp: number;
}

export function emitBoardEvent(event: Omit<BoardEvent, 'timestamp'>): void {
  const full: BoardEvent = { ...event, timestamp: Date.now() };
  localStorage.setItem(EVENT_KEY, JSON.stringify(full));
}

export function onStateChange(callback: (state: MatchState) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as MatchState;
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function onBoardEvent(callback: (event: BoardEvent) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === EVENT_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as BoardEvent;
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
