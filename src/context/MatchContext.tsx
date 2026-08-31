import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { MatchState, DEFAULT_MATCH_STATE, Period } from '../types/match';
import { AlarmType, playAlarm } from '../utils/audio';
import { saveState, loadState, emitBoardEvent, onStateChange } from '../utils/storage';

interface MatchContextValue {
  state: MatchState;
  alarmType: AlarmType;
  alarmVolume: number;
  setAlarmType: (t: AlarmType) => void;
  setAlarmVolume: (v: number) => void;
  startClock: () => void;
  pauseClock: () => void;
  resetClock: () => void;
  setClockTime: (ms: number) => void;
  setExtraTime: () => void;
  updateScore: (team: 'home' | 'away', delta: number) => void;
  setScore: (team: 'home' | 'away', score: number) => void;
  setTeamName: (team: 'home' | 'away', name: string) => void;
  setTeamLogo: (team: 'home' | 'away', logo: string) => void;
  setMatchName: (name: string) => void;
  setPeriod: (period: Period, clockMs?: number) => void;
  toggleHalftime: () => void;
  triggerTriple: (team: 'home' | 'away') => void;
  announceTimeout: (team: 'home' | 'away', count: number) => void;
  commitTimeout: (team: 'home' | 'away') => void;
  triggerTimeout: (team: 'home' | 'away') => void;
  triggerAlarm: () => void;
  newMatch: () => void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<MatchState>(() => {
    const saved = loadState();
    return saved ?? DEFAULT_MATCH_STATE;
  });
  const [alarmType, setAlarmType] = useState<AlarmType>('buzzer');
  const [alarmVolume, setAlarmVolume] = useState(80);

  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const alarmFiredRef = useRef(false);
  const startAlarmPendingRef = useRef(true);

  const setState = useCallback((updater: MatchState | ((prev: MatchState) => MatchState)) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  const startClock = useCallback(() => {
    stopInterval();
    lastTickRef.current = Date.now();
    alarmFiredRef.current = false;
    setState(prev => {
      const isOfficialStartTime =
        prev.remainingMs === 20 * 60 * 1000 || prev.remainingMs === 3 * 60 * 1000;

      if (
        startAlarmPendingRef.current &&
        prev.remainingMs === prev.clockInitialMs &&
        isOfficialStartTime
      ) {
        playAlarm('buzzer', alarmVolume);
      }

      startAlarmPendingRef.current = false;
      return { ...prev, isRunning: true };
    });
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - (lastTickRef.current ?? now);
      lastTickRef.current = now;
      setStateRaw(prev => {
        const next = Math.max(0, prev.remainingMs - elapsed);
        if (next === 0 && !alarmFiredRef.current) {
          alarmFiredRef.current = true;
          playAlarm('buzzer', alarmVolume); // Siempre bocina al final
          emitBoardEvent({ type: 'alarm' });
          stopInterval();
          const updated = { ...prev, remainingMs: 0, isRunning: false };
          saveState(updated);
          return updated;
        }
        const updated = { ...prev, remainingMs: next, isRunning: next > 0 };
        saveState(updated);
        return updated;
      });
    }, 50);
  }, [stopInterval, setState, alarmType, alarmVolume]);

  const pauseClock = useCallback(() => {
    stopInterval();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [stopInterval, setState]);

  const resetClock = useCallback(() => {
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = true;
    setState(prev => ({
      ...prev,
      remainingMs: prev.clockInitialMs,
      isRunning: false,
    }));
  }, [stopInterval, setState]);

  const setClockTime = useCallback((ms: number) => {
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = false;
    setState(prev => ({ ...prev, remainingMs: ms, clockInitialMs: ms, isRunning: false }));
  }, [stopInterval, setState]);

  const setExtraTime = useCallback(() => {
    const extraMs = 3 * 60 * 1000;
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = true;
    setState(prev => ({
      ...prev,
      remainingMs: extraMs,
      clockInitialMs: extraMs,
      isRunning: false,
      period: prev.period === 'normal' ? 'extra1' : 'extra2' as Period,
    }));
  }, [stopInterval, setState]);

  const updateScore = useCallback((team: 'home' | 'away', delta: number) => {
    setState(prev => ({
      ...prev,
      [team]: { ...prev[team], score: Math.max(0, prev[team].score + delta) },
    }));
  }, [setState]);

  const setScore = useCallback((team: 'home' | 'away', score: number) => {
    setState(prev => ({
      ...prev,
      [team]: { ...prev[team], score: Math.max(0, score) },
    }));
  }, [setState]);

  const setTeamName = useCallback((team: 'home' | 'away', name: string) => {
    setState(prev => ({ ...prev, [team]: { ...prev[team], name } }));
  }, [setState]);

  const setTeamLogo = useCallback((team: 'home' | 'away', logo: string) => {
    setState(prev => ({ ...prev, [team]: { ...prev[team], logo } }));
  }, [setState]);

  const setMatchName = useCallback((name: string) => {
    setState(prev => ({ ...prev, matchName: name }));
  }, [setState]);

  const setPeriod = useCallback((period: Period, clockMs?: number) => {
    stopInterval();
    alarmFiredRef.current = false;
    setState(prev => {
      const remainingMs = clockMs !== undefined ? clockMs : prev.remainingMs;
      const clockInitialMs = clockMs !== undefined ? clockMs : prev.clockInitialMs;
      return {
        ...prev,
        period,
        remainingMs,
        clockInitialMs,
        isRunning: false,
      };
    });
  }, [stopInterval, setState]);

  const toggleHalftime = useCallback(() => {
    stopInterval();
    setState(prev => ({
      ...prev,
      isRunning: false,
      period: prev.period === 'halftime' ? '2nd' : 'halftime',
    }));
  }, [stopInterval, setState]);

  const triggerTriple = useCallback((team: 'home' | 'away') => {
    emitBoardEvent({ type: 'triple', team });
  }, []);

  const announceTimeout = useCallback((team: 'home' | 'away', count: number) => {
    playAlarm('whistle-short', alarmVolume);
    emitBoardEvent({ type: 'timeout', team, count });
  }, [alarmVolume]);

  const commitTimeout = useCallback((team: 'home' | 'away') => {
    setState(prev => {
      const currentTimeout = prev[team].timeouts || 0;
      if (currentTimeout >= 3) return prev;

      return {
        ...prev,
        [team]: { ...prev[team], timeouts: currentTimeout + 1 },
      };
    });
  }, [setState]);

  const triggerTimeout = useCallback((team: 'home' | 'away') => {
    setState(prev => {
      const currentTimeout = prev[team].timeouts || 0;
      if (currentTimeout >= 3) return prev;

      const nextTimeout = currentTimeout + 1;
      const nextState = {
        ...prev,
        [team]: { ...prev[team], timeouts: nextTimeout },
      };

      playAlarm('whistle-short', alarmVolume);
      emitBoardEvent({ type: 'timeout', team, count: nextTimeout });
      return nextState;
    });
  }, [setState, alarmVolume]);

  const triggerAlarm = useCallback(() => {
    playAlarm(alarmType, alarmVolume);
    emitBoardEvent({ type: 'alarm' });
  }, [alarmType, alarmVolume]);

  const newMatch = useCallback(() => {
    stopInterval();
    startAlarmPendingRef.current = true;
    setState(DEFAULT_MATCH_STATE);
  }, [stopInterval, setState]);

  useEffect(() => {
    if (state.isRunning) {
      startClock();
    }
    return () => stopInterval();
  // Only run on mount to restore running state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = onStateChange(incoming => {
      if (!incoming.isRunning) {
        stopInterval();
      }
      setStateRaw(incoming);
    });
    return () => unsub();
  }, [stopInterval]);

  return (
    <MatchContext.Provider value={{
      state,
      alarmType, setAlarmType,
      alarmVolume, setAlarmVolume,
      startClock, pauseClock, resetClock,
      setClockTime, setExtraTime,
      updateScore, setScore, setTeamName, setTeamLogo,
      setMatchName, setPeriod, toggleHalftime,
      triggerTriple, announceTimeout, commitTimeout, triggerTimeout, triggerAlarm, newMatch,
    }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside MatchProvider');
  return ctx;
}
