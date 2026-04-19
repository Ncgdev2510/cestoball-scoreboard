import { useEffect, useState, useRef } from 'react';
import { MatchState, DEFAULT_MATCH_STATE } from '../../types/match';
import { loadState, onStateChange, onBoardEvent, BoardEvent } from '../../utils/storage';
import { formatMs } from '../../utils/format';

interface TripleAnim {
  team: 'home' | 'away';
  id: number;
}

export default function Scoreboard() {
  const [state, setState] = useState<MatchState>(() => loadState() ?? DEFAULT_MATCH_STATE);
  const [triple, setTriple] = useState<TripleAnim | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState<{ text: string; id: number } | null>(null);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const tripleTimeoutRef = useRef<number | null>(null);
  const timeoutMsgTimeoutRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const offState = onStateChange(s => setState(s));
    const offEvent = onBoardEvent((event: BoardEvent) => {
      if (event.type === 'triple' && event.team) {
        if (tripleTimeoutRef.current) clearTimeout(tripleTimeoutRef.current);
        setTriple({ team: event.team, id: event.timestamp });
        tripleTimeoutRef.current = window.setTimeout(() => setTriple(null), 3000);
      }
      if (event.type === 'timeout' && event.team) {
        if (timeoutMsgTimeoutRef.current) clearTimeout(timeoutMsgTimeoutRef.current);
        
        // Use loadState for immediate fresh value after storage event
        const storageState = loadState();
        // If storageState has the data, use it. Otherwise, look at our current state and assume it will be incremented.
        const currentCount = storageState ? (storageState[event.team].timeouts || 0) : ((stateRef.current[event.team].timeouts || 0) + 1);
        const count = Math.min(3, currentCount); // Ensure it's between 1 and 3
        
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
    normal: '',
    extra1: 'PRÓRROGA 1',
    extra2: 'PRÓRROGA 2',
    halftime: 'ENTRETIEMPO',
  };

  return (
    <div className={`w-screen h-screen bg-black flex flex-col overflow-hidden relative ${alarmFlash ? 'alarm-flash' : ''}`}>
      {/* Teams Header */}
      <div className="flex items-center justify-between px-12 pt-10 pb-6">
        <TeamBadge team="home" state={state} side="left" />
        <div className="flex flex-col items-center gap-1">
          {state.matchName && (
            <span className="text-white font-bold text-2xl uppercase tracking-widest">{state.matchName}</span>
          )}
          {state.period !== 'normal' && (
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1 border border-amber-400/30 rounded-full">
              {periodLabel[state.period]}
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
            <span className="text-gray-700 text-5xl font-thin select-none">—</span>
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
          clockLow ? 'text-red-500 clock-urgent' : 'text-white'
        }`}
          style={{ fontSize: 'clamp(4rem, 12vw, 16rem)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {formatMs(state.remainingMs)}
        </div>
      </div>

      {/* Labels: Triple & Timeout */}
      <div className="absolute inset-x-0 top-1/4 flex flex-col items-center gap-4 pointer-events-none"
        style={{ transform: 'translateY(-50%)' }}>
        {triple && (
          <div className="triple-banner text-5xl font-black uppercase tracking-widest text-amber-400">
            ¡TRIPLE!
          </div>
        )}
        {timeoutMsg && (
          <div className="timeout-banner text-5xl font-black uppercase tracking-widest text-blue-400">
            {timeoutMsg.text}
          </div>
        )}
      </div>

      {/* Halftime overlay */}
      {isHalftime && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 halftime-overlay">
          <div className="text-center">
            <div className="text-7xl font-black uppercase tracking-[0.15em] text-white halftime-text mb-4">
              ENTRETIEMPO
            </div>
            <div className="flex items-center justify-center gap-8 text-3xl font-bold text-gray-400">
              <span>{state.home.name}</span>
              <span className="text-white font-black text-5xl">
                {state.home.score} – {state.away.score}
              </span>
              <span>{state.away.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Running indicator */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-colors ${state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-800'}`} />
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
          <div className="w-24 h-24 rounded-xl bg-gray-900 border border-gray-800" />
        )}
      </div>
      <span className={`text-white font-black uppercase tracking-wide leading-tight ${side === 'right' ? 'text-right' : 'text-left'}`}
        style={{ fontSize: 'clamp(1rem, 2.5vw, 3rem)' }}>
        {teamData.name}
      </span>
    </div>
  );
}

function ScoreNum({ score, flashing }: { score: number; flashing: boolean }) {
  return (
    <div className={`font-black tabular-nums leading-none select-none ${flashing ? 'triple-score-flash' : 'text-white'}`}
      style={{ fontSize: 'clamp(4rem, 20vw, 32rem)', lineHeight: 1 }}>
      {String(score).padStart(2, '0')}
    </div>
  );
}
