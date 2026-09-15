import { useEffect, useState, useRef } from 'react';
import { MatchState, DEFAULT_MATCH_STATE } from '../../types/match';
import { loadState, onStateChange, onBoardEvent, BoardEvent } from '../../utils/storage';
import { formatMs, calculateRemainingMs } from '../../utils/format';

interface TripleAnim {
  team: 'home' | 'away';
  id: number;
}

export default function Scoreboard() {
  const [state, setState] = useState<MatchState>(() => {
    const loaded = loadState() ?? DEFAULT_MATCH_STATE;
    return { ...loaded, remainingMs: calculateRemainingMs(loaded) };
  });
  const [triple, setTriple] = useState<TripleAnim | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState<{ text: string; id: number } | null>(null);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const tripleTimeoutRef = useRef<number | null>(null);
  const timeoutMsgTimeoutRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  const runningAnchorRef = useRef<{ baseRemaining: number; anchorTime: number } | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Local ticker for smooth clock display when isRunning is true (zero drift)
  useEffect(() => {
    if (!state.isRunning) {
      runningAnchorRef.current = null;
      return;
    }

    if (!runningAnchorRef.current) {
      runningAnchorRef.current = {
        baseRemaining: state.remainingMs,
        anchorTime: state.clockUpdatedAt || Date.now(),
      };
    }

    const interval = window.setInterval(() => {
      if (!runningAnchorRef.current) return;
      const now = Date.now();
      const elapsed = now - runningAnchorRef.current.anchorTime;
      const remaining = Math.max(0, runningAnchorRef.current.baseRemaining - elapsed);
      setState(prev => ({ ...prev, remainingMs: remaining }));
    }, 50);

    return () => clearInterval(interval);
  }, [state.isRunning, state.clockUpdatedAt]);

  useEffect(() => {
    const offState = onStateChange(s => {
      if (s.isRunning) {
        runningAnchorRef.current = {
          baseRemaining: s.remainingMs,
          anchorTime: s.clockUpdatedAt || Date.now(),
        };
      } else {
        runningAnchorRef.current = null;
      }
      setState({ ...s, remainingMs: calculateRemainingMs(s) });
    });
    const offEvent = onBoardEvent((event: BoardEvent) => {
      if (event.type === 'triple' && event.team) {
        if (tripleTimeoutRef.current) clearTimeout(tripleTimeoutRef.current);
        setTriple({ team: event.team, id: event.timestamp });
        tripleTimeoutRef.current = window.setTimeout(() => setTriple(null), 3000);
      }
      if (event.type === 'timeout' && event.team) {
        if (timeoutMsgTimeoutRef.current) clearTimeout(timeoutMsgTimeoutRef.current);

        // Prefer explicit timeout number from event to avoid race conditions.
        const storageState = loadState();
        const fallbackCount = storageState
          ? (storageState[event.team].timeouts || 0)
          : ((stateRef.current[event.team].timeouts || 0) + 1);
        const count = Math.min(3, event.count ?? fallbackCount);
        
        const teamLabel = event.team === 'home' ? 'Local' : 'Visitante';
        
        setTimeoutMsg({ text: `Minuto ${count} ${teamLabel}`, id: event.timestamp });
        timeoutMsgTimeoutRef.current = window.setTimeout(() => setTimeoutMsg(null), 3000);
      }
      if (event.type === 'alarm') {
        if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
        setAlarmFlash(true);
        alarmTimeoutRef.current = window.setTimeout(() => setAlarmFlash(false), 2000);
      }
    });
    return () => { offState(); offEvent(); };
  }, []);

  const isHalftime = state.period === 'halftime';
  const clockLow = state.remainingMs < 30000 && state.remainingMs > 0;

  const periodLabel: Record<string, string> = {
    '1st': '',
    normal: '',
    '2nd': '2DO TIEMPO',
    extra1: 'PRÓRROGA 1',
    extra2: 'PRÓRROGA 2',
    halftime: 'ENTRETIEMPO',
    finished: 'FINALIZADO',
  };

  return (
    <div className={`w-screen h-screen bg-brand-dark flex flex-col overflow-hidden relative ${alarmFlash ? 'alarm-flash' : ''}`}>
      {/* Teams Header */}
      <div className="flex items-center justify-between px-12 pt-10 pb-6">
        <TeamBadge team="home" state={state} side="left" />
        <div className="flex flex-col items-center gap-1">
          {state.matchName && (
            <span className="text-brand-rose font-bold text-2xl uppercase tracking-widest">{state.matchName}</span>
          )}
          {state.period !== 'normal' && state.period !== '1st' && (
            <span className="text-brand-terracotta text-xs font-bold uppercase tracking-widest px-3 py-1 border border-brand-bronze/40 bg-brand-card/80 rounded-full">
              {periodLabel[state.period] || state.period.toUpperCase()}
            </span>
          )}
        </div>
        <TeamBadge team="away" state={state} side="right" />
      </div>

      {/* Score */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8">
          <ScoreNum
            score={state.home.score}
            flashing={triple?.team === 'home'}
          />
          <div className="flex flex-col items-center gap-3">
            <span className="text-brand-steel/40 text-5xl font-thin select-none">—</span>
          </div>
          <ScoreNum
            score={state.away.score}
            flashing={triple?.team === 'away'}
          />
        </div>
      </div>

      {/* Clock */}
      <div className="flex justify-center pb-10">
        <div className={`font-black tabular-nums transition-colors duration-300 ${
          clockLow ? 'text-brand-terracotta clock-urgent' : 'text-brand-rose'
        }`}
          style={{ fontSize: 'clamp(4rem, 12vw, 16rem)', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 4px 40px rgba(11,78,101,0.35)' }}>
          {formatMs(state.remainingMs)}
        </div>
      </div>

      {/* Labels: Triple & Timeout */}
      <div className="absolute inset-x-0 top-1/4 flex flex-col items-center gap-4 pointer-events-none"
        style={{ transform: 'translateY(-50%)' }}>
        {triple && (
          <div className="triple-banner text-5xl font-black uppercase tracking-widest text-brand-bronze drop-shadow-lg">
            ¡TRIPLE!
          </div>
        )}
        {timeoutMsg && (
          <div className="timeout-banner text-5xl font-black uppercase tracking-widest text-brand-steel drop-shadow-lg">
            {timeoutMsg.text}
          </div>
        )}
      </div>

      {/* Halftime overlay */}
      {isHalftime && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/95 halftime-overlay">
          <div className="text-center">
            <div className="text-7xl font-black uppercase tracking-[0.15em] text-brand-rose halftime-text mb-4">
              ENTRETIEMPO
            </div>
            <div className="flex items-center justify-center gap-8 text-3xl font-bold">
              <span className="text-brand-steel">{state.home.name}</span>
              <span className="text-brand-rose font-black text-5xl">
                {state.home.score} – {state.away.score}
              </span>
              <span className="text-brand-terracotta">{state.away.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Running indicator */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-colors ${state.isRunning ? 'bg-brand-steel animate-pulse' : 'bg-gray-800'}`} />
    </div>
  );
}

function TeamBadge({ team, state, side }: { team: 'home' | 'away'; state: MatchState; side: 'left' | 'right' }) {
  const teamData = state[team];
  return (
    <div className={`flex items-center gap-4 ${side === 'right' ? 'flex-row-reverse' : ''}`} style={{ minWidth: '28%' }}>
      <div className="w-24 h-24 shrink-0 flex items-center justify-center">
        {teamData.logo ? (
          <img src={teamData.logo} alt="logo" className="w-full h-full object-contain" />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-brand-surface border border-brand-steel/30" />
        )}
      </div>
      <span className={`font-black uppercase tracking-wide leading-tight ${side === 'right' ? 'text-right text-brand-terracotta' : 'text-left text-brand-steel'}`}
        style={{ fontSize: 'clamp(1rem, 2.5vw, 3rem)' }}>
        {teamData.name}
      </span>
    </div>
  );
}

function ScoreNum({ score, flashing }: { score: number; flashing: boolean }) {
  return (
    <div className={`font-black tabular-nums leading-none select-none ${flashing ? 'triple-score-flash' : 'text-brand-rose'}`}
      style={{ fontSize: 'clamp(4rem, 20vw, 32rem)', lineHeight: 1 }}>
      {String(score).padStart(2, '0')}
    </div>
  );
}
