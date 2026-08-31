import { MatchState, DEFAULT_MATCH_STATE } from '../types/match';

const STATE_KEY = 'scoreboard_match_state';
const EVENT_KEY = 'scoreboard_event';
const CHANNEL_NAME = 'scoreboard_sync_channel';

// Create BroadcastChannel for sub-millisecond local tab/window sync
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

// Track latest saved JSON to prevent echo feedback loops
const CLIENT_ID = Math.random().toString(36).substring(2, 9);
let lastSentStateJson = '';

export function saveState(state: MatchState): void {
  const payload = { state, clientId: CLIENT_ID };
  const json = JSON.stringify(state);
  try {
    localStorage.setItem(STATE_KEY, json);
  } catch {
    // ignore
  }

  // 1. BroadcastChannel (local tabs / popups)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'state', payload: state, clientId: CLIENT_ID });
    } catch {
      // ignore
    }
  }

  // 2. Remote Server Sync (LAN / Celulares / OBS across origins)
  if (json !== lastSentStateJson) {
    lastSentStateJson = json;
    void fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silent fail if standalone or offline
    });
  }
}

export function loadState(): MatchState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchState;
    
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
  // 1. LocalStorage StorageEvent
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as MatchState;
        callback(parsed);
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

