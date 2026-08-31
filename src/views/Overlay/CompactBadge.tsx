import React from 'react';
import { MatchState } from '../../types/match';
import { formatMs } from '../../utils/format';

interface CompactBadgeProps {
  state: MatchState;
  triple: { team: 'home' | 'away'; id: number } | null;
  timeoutMsg: { text: string; id: number } | null;
  opacity: number;
}

export const CompactBadge: React.FC<CompactBadgeProps> = ({
  state,
  triple,
  timeoutMsg,
  opacity,
}) => {
  const clockLow = state.remainingMs < 30000 && state.remainingMs > 0;

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'halftime':
        return 'ENTRETIEMPO';
      case 'extra1':
        return 'PRÓRROGA 1';
      case 'extra2':
        return 'PRÓRROGA 2';
      default:
        return 'TIEMPO REGULAR';
    }
  };

  return (
    <div className="relative flex flex-col items-start select-none">
      {/* Top Floating Alerts (Triple / Timeout) */}
      <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none z-20">
        {triple && (
          <div className="px-4 py-1 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-widest shadow-lg animate-bounce">
            ¡TRIPLE {triple.team === 'home' ? state.home.name : state.away.name}!
          </div>
        )}
        {timeoutMsg && !triple && (
          <div className="px-4 py-1 rounded-full bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg animate-pulse">
            {timeoutMsg.text}
          </div>
        )}
      </div>

      {/* Main Container (Inspired by Image 2) */}
      <div
        className="w-72 rounded-2xl p-2.5 border-2 border-white/25 shadow-2xl backdrop-blur-md transition-opacity duration-300 relative overflow-hidden"
        style={{
          backgroundColor: `rgba(15, 23, 42, ${opacity})`,
          boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Header: Clock + Match/Tournament Title */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          {/* Tournament / Match info */}
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 truncate">
              {state.matchName || 'CESTOBALL OFICIAL'}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
              {getPeriodLabel(state.period)}
            </span>
          </div>

          {/* Clock Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 shadow-inner shrink-0">

            <span
              className={`font-black text-xs tabular-nums tracking-wider ${
                clockLow ? 'text-red-400 animate-pulse' : 'text-green-500'
              }`}
            >
              {formatMs(state.remainingMs)}
            </span>
          </div>
        </div>

        {/* Rows for Teams */}
        <div className="flex flex-col gap-1.5">
          {/* Home Team Row */}
          <div
            className={`flex items-center justify-between rounded-xl p-1.5 border transition-all duration-200 ${
              triple?.team === 'home'
                ? 'border-amber-400 bg-amber-950/60'
                : 'border-white/10 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-950/90'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              {/* Logo */}
              <div className="w-8 h-8 rounded-lg bg-white/90 p-0.5 flex items-center justify-center shrink-0 border border-black/20">
                {state.home.logo ? (
                  <img src={state.home.logo} alt="home" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded bg-emerald-700 text-white flex items-center justify-center font-black text-[10px]">
                    {state.home.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-white font-black text-xs uppercase tracking-wide truncate">
                {state.home.name || 'LOCAL'}
              </span>
            </div>

            {/* Score Box */}
            <div className="w-11 h-8 rounded-lg bg-black/80 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <span
                className={`font-black text-base tabular-nums leading-none ${
                  triple?.team === 'home' ? 'text-amber-300' : 'text-white'
                }`}
              >
                {state.home.score}
              </span>
            </div>
          </div>

          {/* Away Team Row */}
          <div
            className={`flex items-center justify-between rounded-xl p-1.5 border transition-all duration-200 ${
              triple?.team === 'away'
                ? 'border-amber-400 bg-amber-950/60'
                : 'border-white/10 bg-gradient-to-r from-red-950/80 via-slate-900/90 to-slate-950/90'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              {/* Logo */}
              <div className="w-8 h-8 rounded-lg bg-white/90 p-0.5 flex items-center justify-center shrink-0 border border-black/20">
                {state.away.logo ? (
                  <img src={state.away.logo} alt="away" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded bg-red-700 text-white flex items-center justify-center font-black text-[10px]">
                    {state.away.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-white font-black text-xs uppercase tracking-wide truncate">
                {state.away.name || 'VISITANTE'}
              </span>
            </div>

            {/* Score Box */}
            <div className="w-11 h-8 rounded-lg bg-black/80 border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <span
                className={`font-black text-base tabular-nums leading-none ${
                  triple?.team === 'away' ? 'text-amber-300' : 'text-white'
                }`}
              >
                {state.away.score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
