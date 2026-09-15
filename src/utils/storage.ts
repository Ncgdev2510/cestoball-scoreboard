import { MatchState, DEFAULT_MATCH_STATE } from '../types/match';
import { sanitizeMatchStateLogos } from './image';

const STATE_KEY = 'scoreboard_match_state';
const EVENT_KEY = 'scoreboard_event';
const CHANNEL_NAME = 'scoreboard_sync_channel';

// Create BroadcastChannel for sub-millisecond local tab/window sync
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

// Track client ID to prevent echo feedback loops
export const CLIENT_ID = Math.random().toString(36).substring(2, 9);
let lastSentStateJson = '';
let lastAppliedUpdatedAt = 0;

// Queue management for remote sync to prevent connection pool exhaustion
let isSyncing = false;
let pendingStateToSync: MatchState | null = null;

async function doSyncPost(stateToPost: MatchState): Promise<void> {
  isSyncing = true;
  const payload = { state: stateToPost, clientId: CLIENT_ID };
  try {
    await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fail if standalone or offline
  } finally {
    isSyncing = false;
    if (pendingStateToSync) {
      const nextState = pendingStateToSync;
      pendingStateToSync = null;
      void doSyncPost(nextState);
    }
  }
}

export function saveState(state: MatchState): void {
  const timestamp = state.updatedAt || Date.now();
  const stateWithTime: MatchState = { ...state, updatedAt: timestamp };
  lastAppliedUpdatedAt = Math.max(lastAppliedUpdatedAt, timestamp);

  const json = JSON.stringify(stateWithTime);
  try {
    localStorage.setItem(STATE_KEY, json);
  } catch {
    // ignore
  }

  // 1. BroadcastChannel (local tabs / popups)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'state', payload: stateWithTime, clientId: CLIENT_ID });
    } catch {
      // ignore
    }
  }

  // 2. Remote Server Sync (LAN / Celulares / OBS across origins)
  if (json !== lastSentStateJson) {
    lastSentStateJson = json;
    if (isSyncing) {
      pendingStateToSync = stateWithTime;
    } else {
      void doSyncPost(stateWithTime);
    }
  }
}

export function loadState(): MatchState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchState;
    
    const loaded: MatchState = {
      ...DEFAULT_MATCH_STATE,
      ...parsed,
      home: { ...DEFAULT_MATCH_STATE.home, ...parsed.home },
      away: { ...DEFAULT_MATCH_STATE.away, ...parsed.away },
    };

    if (loaded.updatedAt) {
      lastAppliedUpdatedAt = Math.max(lastAppliedUpdatedAt, loaded.updatedAt);
    }

    // Sanitize oversized logos asynchronously in the background
    if ((loaded.home?.logo && loaded.home.logo.length > 40000) || (loaded.away?.logo && loaded.away.logo.length > 40000)) {
      void sanitizeMatchStateLogos(loaded).then(sanitized => {
        saveState(sanitized);
      });
    }

    return loaded;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}

export interface BoardEvent {
  type: 'triple' | 'alarm' | 'timeout';
  team?: 'home' | 'away';
  count?: number;
  timestamp: number;
}

export function emitBoardEvent(event: Omit<BoardEvent, 'timestamp'>): void {
  const full: BoardEvent = { ...event, timestamp: Date.now() };
  try {
    localStorage.setItem(EVENT_KEY, JSON.stringify(full));
  } catch {
    // ignore
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'event', payload: full, clientId: CLIENT_ID });
    } catch {
      // ignore
    }
  }

  void fetch('/api/sync/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: full, clientId: CLIENT_ID }),
  }).catch(() => {
    // ignore
  });
}

export function onStateChange(callback: (state: MatchState) => void): () => void {
  const handleIncomingState = (incoming: MatchState) => {
    if (!incoming) return;

    // Discard stale updates
    if (incoming.updatedAt && incoming.updatedAt < lastAppliedUpdatedAt) {
      return;
    }

    const newTimestamp = incoming.updatedAt || Date.now();
    lastAppliedUpdatedAt = Math.max(lastAppliedUpdatedAt, newTimestamp);

    // Keep localStorage and lastSentStateJson in sync with remote
    const json = JSON.stringify(incoming);
    lastSentStateJson = json;
    try {
      localStorage.setItem(STATE_KEY, json);
    } catch {
      // ignore
    }

    callback(incoming);

    // If incoming state had giant logos, sanitize in background
    if ((incoming.home?.logo && incoming.home.logo.length > 40000) || (incoming.away?.logo && incoming.away.logo.length > 40000)) {
      void sanitizeMatchStateLogos(incoming).then(sanitized => {
        saveState(sanitized);
      });
    }
  };

  // 1. LocalStorage StorageEvent
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as MatchState;
        callback(parsed);
        handleIncomingState(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  // 2. BroadcastChannel Message
  const bcHandler = (e: MessageEvent) => {
    if (e.data?.clientId === CLIENT_ID) return; // Skip own messages
    if (e.data?.type === 'state' && e.data?.payload) {
      callback(e.data.payload as MatchState);
      handleIncomingState(e.data.payload as MatchState);
    }
  };
  broadcastChannel?.addEventListener('message', bcHandler);

  // 3. Server-Sent Events (SSE) for remote clients / mobiles
  let eventSource: EventSource | null = null;
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource('/api/sync/events');
      eventSource.addEventListener('state', (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data);
          if (raw?.clientId === CLIENT_ID) return; // Skip own messages
          const stateData = raw?.state || raw;
          callback(stateData as MatchState);
          handleIncomingState(stateData as MatchState);
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // ignore
  }

  return () => {
    window.removeEventListener('storage', storageHandler);
    broadcastChannel?.removeEventListener('message', bcHandler);
    eventSource?.close();
  };
}

export function onBoardEvent(callback: (event: BoardEvent) => void): () => void {
  const storageHandler = (e: StorageEvent) => {
    if (e.key === EVENT_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as BoardEvent;
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  const bcHandler = (e: MessageEvent) => {
    if (e.data?.type === 'event' && e.data?.payload) {
      callback(e.data.payload as BoardEvent);
    }
  };
  broadcastChannel?.addEventListener('message', bcHandler);

  let eventSource: EventSource | null = null;
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource('/api/sync/events');
      eventSource.addEventListener('board-event', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data) as BoardEvent;
          callback(parsed);
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // ignore
  }

  return () => {
    window.removeEventListener('storage', storageHandler);
    broadcastChannel?.removeEventListener('message', bcHandler);
    eventSource?.close();
  };
}

export interface NetworkInfo {
  ips: string[];
  port: number;
}

export async function fetchNetworkInfo(): Promise<NetworkInfo | null> {
  try {
    const res = await fetch('/api/sync/info');
    if (!res.ok) return null;
    return (await res.json()) as NetworkInfo;
  } catch {
    return null;
  }
}

