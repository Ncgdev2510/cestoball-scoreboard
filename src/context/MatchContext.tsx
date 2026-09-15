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
import { calculateRemainingMs } from '../utils/format';
import { compressImageBase64 } from '../utils/image';

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

  const stateRef = useRef<MatchState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const alarmFiredRef = useRef(false);
  const startAlarmPendingRef = useRef(true);
  const runningAnchorRef = useRef<{ baseRemaining: number; anchorTime: number } | null>(null);

  // Helper to update state locally AND broadcast to other devices
  const setState = useCallback((updater: MatchState | ((prev: MatchState) => MatchState)) => {
    setStateRaw(prev => {
      const computed = typeof updater === 'function' ? updater(prev) : updater;
      const next: MatchState = {
        ...computed,
        updatedAt: Date.now(),
      };
      stateRef.current = next;
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
    if (heartbeatIntervalRef.current !== null) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const pauseClock = useCallback(() => {
    stopInterval();
    const now = Date.now();
    const currentRemaining = runningAnchorRef.current
      ? Math.max(0, runningAnchorRef.current.baseRemaining - (now - runningAnchorRef.current.anchorTime))
      : stateRef.current.remainingMs;
    runningAnchorRef.current = null;

    setState(prev => ({
      ...prev,
      remainingMs: currentRemaining,
      clockUpdatedAt: now,
      isRunning: false,
    }));
  }, [stopInterval, setState]);

  const startClock = useCallback(() => {
    stopInterval();
    const now = Date.now();
    alarmFiredRef.current = false;

    setState(prev => {
      const currentRemaining = prev.remainingMs;
      if (currentRemaining <= 0) {
        return prev;
      }

      runningAnchorRef.current = {
        baseRemaining: currentRemaining,
        anchorTime: now,
      };

      const isOfficialStartTime =
        currentRemaining === 20 * 60 * 1000 || currentRemaining === 3 * 60 * 1000;

      if (
        startAlarmPendingRef.current &&
        currentRemaining === prev.clockInitialMs &&
        isOfficialStartTime
      ) {
        playAlarm('buzzer', alarmVolume);
      }

      startAlarmPendingRef.current = false;

      return {
        ...prev,
        remainingMs: currentRemaining,
        clockUpdatedAt: now,
        isRunning: true,
      };
    });
  }, [stopInterval, setState, alarmVolume]);

  const resetClock = useCallback(() => {
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = true;
    runningAnchorRef.current = null;
    setState(prev => {
      const initial = prev.clockInitialMs > 0 ? prev.clockInitialMs : (20 * 60 * 1000);
      return {
        ...prev,
        remainingMs: initial,
        clockInitialMs: initial,
        clockUpdatedAt: Date.now(),
        isRunning: false,
      };
    });
  }, [stopInterval, setState]);

  const setClockTime = useCallback((ms: number) => {
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = false;
    runningAnchorRef.current = null;
    setState(prev => ({
      ...prev,
      remainingMs: ms,
      clockInitialMs: ms,
      clockUpdatedAt: Date.now(),
      isRunning: false,
    }));
  }, [stopInterval, setState]);

  const setExtraTime = useCallback(() => {
    const extraMs = 3 * 60 * 1000;
    stopInterval();
    alarmFiredRef.current = false;
    startAlarmPendingRef.current = true;
    runningAnchorRef.current = null;
    setState(prev => ({
      ...prev,
      remainingMs: extraMs,
      clockInitialMs: extraMs,
      clockUpdatedAt: Date.now(),
      isRunning: false,
      period: (prev.period === 'normal' || prev.period === '1st' || prev.period === '2nd') ? 'extra1' : 'extra2' as Period,
    }));
  }, [stopInterval, setState]);

  const updateScore = useCallback((team: 'home' | 'away', delta: number) => {
    const now = Date.now();
    const currentRemaining = runningAnchorRef.current
      ? Math.max(0, runningAnchorRef.current.baseRemaining - (now - runningAnchorRef.current.anchorTime))
      : stateRef.current.remainingMs;

    if (runningAnchorRef.current) {
      runningAnchorRef.current = {
        baseRemaining: currentRemaining,
        anchorTime: now,
      };
    }

    setState(prev => ({
      ...prev,
      remainingMs: currentRemaining,
      clockUpdatedAt: prev.isRunning ? now : prev.clockUpdatedAt,
      [team]: { ...prev[team], score: Math.max(0, prev[team].score + delta) },
    }));
  }, [setState]);

  const setScore = useCallback((team: 'home' | 'away', score: number) => {
    const now = Date.now();
    const currentRemaining = runningAnchorRef.current
      ? Math.max(0, runningAnchorRef.current.baseRemaining - (now - runningAnchorRef.current.anchorTime))
      : stateRef.current.remainingMs;

    if (runningAnchorRef.current) {
      runningAnchorRef.current = {
        baseRemaining: currentRemaining,
        anchorTime: now,
      };
    }

    setState(prev => ({
      ...prev,
      remainingMs: currentRemaining,
      clockUpdatedAt: prev.isRunning ? now : prev.clockUpdatedAt,
      [team]: { ...prev[team], score: Math.max(0, score) },
    }));
  }, [setState]);

  const setTeamName = useCallback((team: 'home' | 'away', name: string) => {
    setState(prev => ({ ...prev, [team]: { ...prev[team], name } }));
  }, [setState]);

  const setTeamLogo = useCallback((team: 'home' | 'away', logo: string) => {
    setState(prev => ({ ...prev, [team]: { ...prev[team], logo } }));
    void compressImageBase64(logo, 240, 0.8).then(compressed => {
      setState(prev => ({ ...prev, [team]: { ...prev[team], logo: compressed } }));
    });
  }, [setState]);

  const setMatchName = useCallback((name: string) => {
    setState(prev => ({ ...prev, matchName: name }));
  }, [setState]);

  const setPeriod = useCallback((period: Period, clockMs?: number) => {
    stopInterval();
    alarmFiredRef.current = false;
    runningAnchorRef.current = null;
    setState(prev => {
      const remainingMs = clockMs !== undefined ? clockMs : (prev.remainingMs > 0 ? prev.remainingMs : (prev.clockInitialMs || 20 * 60 * 1000));
      const clockInitialMs = clockMs !== undefined ? clockMs : prev.clockInitialMs;
      return {
        ...prev,
        period,
        remainingMs,
        clockInitialMs,
        clockUpdatedAt: Date.now(),
        isRunning: false,
      };
    });
  }, [stopInterval, setState]);

  const toggleHalftime = useCallback(() => {
    stopInterval();
    runningAnchorRef.current = null;
    setState(prev => ({
      ...prev,
      isRunning: false,
      clockUpdatedAt: Date.now(),
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
    runningAnchorRef.current = null;
    startAlarmPendingRef.current = true;
    setState(DEFAULT_MATCH_STATE);
  }, [stopInterval, setState]);

  // Handle local countdown rendering whenever state.isRunning is active
  // Uses fixed anchor time to guarantee exact 1-second-per-second decrement
  useEffect(() => {
    if (!state.isRunning) {
      stopInterval();
      runningAnchorRef.current = null;
      return;
    }

    if (!runningAnchorRef.current) {
      runningAnchorRef.current = {
        baseRemaining: state.remainingMs,
        anchorTime: state.clockUpdatedAt || Date.now(),
      };
    }

    // Local UI update interval (50ms)
    intervalRef.current = window.setInterval(() => {
      if (!runningAnchorRef.current) return;

      const now = Date.now();
      const elapsed = now - runningAnchorRef.current.anchorTime;
      const remaining = Math.max(0, runningAnchorRef.current.baseRemaining - elapsed);

      if (remaining <= 0) {
        if (!alarmFiredRef.current) {
          alarmFiredRef.current = true;
          playAlarm('buzzer', alarmVolume);
          emitBoardEvent({ type: 'alarm' });
          stopInterval();
          runningAnchorRef.current = null;
          setState(prev => ({
            ...prev,
            remainingMs: 0,
            isRunning: false,
            clockUpdatedAt: Date.now(),
          }));
        }
        return;
      }

      // Update local state ONLY for smooth display (no HTTP saveState on every frame!)
      setStateRaw(prev => ({
        ...prev,
        remainingMs: remaining,
      }));
    }, 50);

    // Passive Heartbeat (every 5 seconds) to ensure synchronization consistency
    heartbeatIntervalRef.current = window.setInterval(() => {
      const current = stateRef.current;
      if (current.isRunning && runningAnchorRef.current) {
        const now = Date.now();
        const currentRemaining = Math.max(0, runningAnchorRef.current.baseRemaining - (now - runningAnchorRef.current.anchorTime));
        saveState({
          ...current,
          remainingMs: currentRemaining,
          clockUpdatedAt: now,
        });
      }
    }, 5000);

    return () => stopInterval();
  }, [state.isRunning, state.clockUpdatedAt, stopInterval, alarmVolume, setState]);

  // Sync listener: handle incoming updates from other devices/windows
  useEffect(() => {
    const unsub = onStateChange(incoming => {
      if (!incoming) return;

      if (!incoming.isRunning) {
        stopInterval();
        runningAnchorRef.current = null;
        setStateRaw(incoming);
        stateRef.current = incoming;
        return;
      }

      // Remote is running
      const effectiveRemaining = calculateRemainingMs(incoming);
      runningAnchorRef.current = {
        baseRemaining: incoming.remainingMs,
        anchorTime: incoming.clockUpdatedAt || Date.now(),
      };

      const synchronizedState = {
        ...incoming,
        remainingMs: effectiveRemaining,
      };

      stateRef.current = synchronizedState;
      setStateRaw(synchronizedState);
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
