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
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-bronze to-brand-terracotta text-brand-dark font-black text-xs uppercase tracking-widest shadow-lg animate-bounce">
            ¡TRIPLE {triple.team === 'home' ? state.home.name : state.away.name}!
          </div>
        )}
        {timeoutMsg && !triple && (
          <div className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-petrol to-brand-steel text-brand-rose font-black text-xs uppercase tracking-widest shadow-lg animate-pulse">
            {timeoutMsg.text}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div
        className="w-72 rounded-2xl p-2.5 border-2 border-brand-steel/40 shadow-2xl backdrop-blur-md transition-opacity duration-300 relative overflow-hidden"
        style={{
          backgroundColor: `rgba(7, 21, 28, ${opacity})`,
          boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(63, 127, 158, 0.25)',
        }}
      >
        {/* Header: Clock + Match/Tournament Title */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          {/* Tournament / Match info */}
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-steel truncate">
              {state.matchName || 'CESTOBALL OFICIAL'}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-brand-terracotta">
              {getPeriodLabel(state.period)}
            </span>
          </div>

          {/* Clock Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-card border border-brand-steel/30 shadow-inner shrink-0">
            <span
              className={`font-black text-xs tabular-nums tracking-wider ${
                clockLow ? 'text-brand-terracotta animate-pulse' : 'text-brand-rose'
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
                ? 'border-brand-steel bg-brand-steel/30'
                : 'border-brand-steel/30 bg-gradient-to-r from-brand-petrol/60 via-brand-card to-brand-surface'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              {/* Logo */}
              <div className="w-8 h-8 rounded-lg bg-white/90 p-0.5 flex items-center justify-center shrink-0 border border-black/20">
                {state.home.logo ? (
                  <img src={state.home.logo} alt="home" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded bg-brand-petrol text-brand-rose flex items-center justify-center font-black text-[10px]">
                    {state.home.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-brand-rose font-black text-xs uppercase tracking-wide truncate">
                {state.home.name || 'LOCAL'}
              </span>
            </div>

            {/* Score Box */}
            <div className="w-11 h-8 rounded-lg bg-brand-dark border border-brand-steel/30 flex items-center justify-center shadow-inner shrink-0">
              <span
                className={`font-black text-base tabular-nums leading-none ${
                  triple?.team === 'home' ? 'text-brand-steel' : 'text-brand-rose'
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
                ? 'border-brand-bronze bg-brand-bronze/30'
                : 'border-brand-bronze/30 bg-gradient-to-r from-brand-bronze/40 via-brand-card to-brand-surface'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              {/* Logo */}
              <div className="w-8 h-8 rounded-lg bg-white/90 p-0.5 flex items-center justify-center shrink-0 border border-black/20">
                {state.away.logo ? (
                  <img src={state.away.logo} alt="away" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded bg-brand-bronze text-white flex items-center justify-center font-black text-[10px]">
                    {state.away.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-brand-rose font-black text-xs uppercase tracking-wide truncate">
                {state.away.name || 'VISITANTE'}
              </span>
            </div>

            {/* Score Box */}
            <div className="w-11 h-8 rounded-lg bg-brand-dark border border-brand-bronze/30 flex items-center justify-center shadow-inner shrink-0">
              <span
                className={`font-black text-base tabular-nums leading-none ${
                  triple?.team === 'away' ? 'text-brand-terracotta' : 'text-brand-rose'
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
