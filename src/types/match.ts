export type Period = '1st' | '2nd' | 'halftime' | 'extra1' | 'extra2' | 'finished' | 'normal';

export interface Team {
  name: string;
  logo?: string;
  score: number;
  timeouts: number;
}

export interface MatchState {
  matchName: string;
  home: Team;
  away: Team;
  remainingMs: number;
  isRunning: boolean;
  period: Period;
  clockInitialMs: number;
}

export type TripleAnimation = { team: 'home' | 'away'; triggeredAt: number } | null;

export const DEFAULT_MATCH_STATE: MatchState = {
  matchName: 'Partido',
  home: { name: 'Local', score: 0, timeouts: 0 },
  away: { name: 'Visitante', score: 0, timeouts: 0 },
  remainingMs: 20 * 60 * 1000,
  isRunning: false,
  period: 'normal',
  clockInitialMs: 20 * 60 * 1000,
};

