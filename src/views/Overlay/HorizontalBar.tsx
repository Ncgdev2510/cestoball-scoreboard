import React from 'react';
import { MatchState } from '../../types/match';
import { formatMs } from '../../utils/format';

interface HorizontalBarProps {
  state: MatchState;
  triple: { team: 'home' | 'away'; id: number } | null;
  timeoutMsg: { text: string; id: number } | null;
  opacity: number;
}

export const HorizontalBar: React.FC<HorizontalBarProps> = ({
  state,
  triple,
  timeoutMsg,
  opacity,
}) => {
  const clockLow = state.remainingMs < 30000 && state.remainingMs > 0;

  const getPeriodShort = (period: string) => {
    switch (period) {
      case '1st':
      case 'normal':
        return '1T';
      case 'halftime':
        return 'ET';
      case '2nd':
        return '2T';
      case 'extra1':
        return 'PR1';
      case 'extra2':
        return 'PR2';
      case 'finished':
        return 'FIN';
      default:
        return '1T';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Dynamic Popups (Triple / Timeout Banner) */}
      <div className="absolute -top-11 flex items-center justify-center transition-all duration-300 pointer-events-none z-20">
        {triple && (
          <div className="px-5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/40 animate-bounce">
            ⚡ ¡TRIPLE {triple.team === 'home' ? state.home.name : state.away.name}!
          </div>
        )}
        {timeoutMsg && !triple && (
          <div className="px-5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/40 animate-pulse">
            ⏱️ {timeoutMsg.text}
          </div>
        )}
      </div>

      {/* Match / Tournament Header placed directly ON TOP of the scoreboard bar */}
      {state.matchName && (
        <div
          className="px-5 py-0.5 rounded-t-lg text-[10px] font-black tracking-widest uppercase text-slate-200 border-t border-x border-white/25 shadow-md self-center z-10"
          style={{
            backgroundColor: `rgba(18, 22, 34, ${Math.min(1, opacity * 0.96)})`,
            marginBottom: '-1px',
          }}
        >
          {state.matchName}
        </div>
      )}

      {/* Main Bar Structure (Inspired by Image 1) */}
      <div
        className="flex items-stretch rounded-lg overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(15, 15, 20, ${opacity})`,
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15) inset',
        }}
      >
        {/* Home Team */}
        <div className="flex items-center">
          {/* Logo container */}
          <div className="w-12 h-11 bg-white/95 flex items-center justify-center p-1 border-r border-black/30">
            {state.home.logo ? (
              <img
                src={state.home.logo}
                alt={state.home.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-blue-700 text-white flex items-center justify-center font-black text-xs">
                {state.home.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          {/* Team Name */}
          <div
            className={`px-4 py-1.5 flex items-center justify-center min-w-[130px] max-w-[180px] transition-colors ${
              triple?.team === 'home' ? 'bg-amber-500/30' : 'bg-gradient-to-b from-gray-800/80 to-gray-950/90'
            }`}
          >
            <span className="text-white font-extrabold text-sm uppercase tracking-wide truncate drop-shadow-md">
              {state.home.name || 'LOCAL'}
            </span>
          </div>
        </div>

        {/* Center Score Badge */}
        <div className="flex items-center justify-center px-4 bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 border-x border-purple-400/30 min-w-[100px] shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 z-10">
            <span
              className={`font-black text-2xl tabular-nums leading-none transition-transform duration-200 ${
                triple?.team === 'home' ? 'text-amber-300 scale-125' : 'text-white'
              }`}
            >
              {state.home.score}
            </span>
            <span className="text-purple-300/60 font-black text-lg select-none">-</span>
            <span
              className={`font-black text-2xl tabular-nums leading-none transition-transform duration-200 ${
                triple?.team === 'away' ? 'text-amber-300 scale-125' : 'text-white'
              }`}
            >
              {state.away.score}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center">
          {/* Team Name */}
          <div
            className={`px-4 py-1.5 flex items-center justify-center min-w-[130px] max-w-[180px] transition-colors ${
              triple?.team === 'away' ? 'bg-amber-500/30' : 'bg-gradient-to-b from-gray-800/80 to-gray-950/90'
            }`}
          >
            <span className="text-white font-extrabold text-sm uppercase tracking-wide truncate drop-shadow-md">
              {state.away.name || 'VISITANTE'}
            </span>
          </div>
          {/* Logo container */}
          <div className="w-12 h-11 bg-white/95 flex items-center justify-center p-1 border-l border-black/30">
            {state.away.logo ? (
              <img
                src={state.away.logo}
                alt={state.away.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-red-700 text-white flex items-center justify-center font-black text-xs">
                {state.away.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Clock & Period Section */}
        <div className="flex items-center bg-gradient-to-r from-slate-900 to-black px-3.5 py-1 border-l border-white/20 min-w-[130px] justify-between gap-3">
          {/* Clock */}
          <div className="flex items-center gap-1.5">           
            <span
              className={`font-black text-base tabular-nums tracking-wider ${
                clockLow ? 'text-red-400 animate-pulse' : 'text-green-500'
              }`}
            >
              {formatMs(state.remainingMs)}
            </span>
          </div>

          {/* Period Badge */}
          <div className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-black tracking-wider text-white uppercase">
            {getPeriodShort(state.period)}
          </div>
        </div>
      </div>
    </div>
  );
};
