import { useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import { formatMs, parseTimeInput } from '../../utils/format';

export default function ClockControl() {
  const { state, startClock, pauseClock, resetClock, setClockTime, setExtraTime } = useMatch();
  const [timeInput, setTimeInput] = useState('20:00');
  const [inputError, setInputError] = useState(false);

  function handleSetTime() {
    const ms = parseTimeInput(timeInput);
    if (ms === null) { setInputError(true); return; }
    setInputError(false);
    setClockTime(ms);
  }

  const periodLabel: Record<string, string> = {
    normal: 'Tiempo Normal',
    extra1: 'Prórroga 1',
    extra2: 'Prórroga 2',
    halftime: 'Entretiempo',
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-amber-400 bg-amber-400/10 border border-amber-400/20 flex items-center gap-2">
          {periodLabel[state.period]}
          <div className={`w-2 h-2 rounded-full ${state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
        </span>
      </div>

      <div className={`text-[12rem] font-black tabular-nums leading-none select-none transition-colors ${state.remainingMs < 30000 && state.remainingMs > 0 ? 'text-red-400' : 'text-white'}`}
        style={{ textShadow: '0 4px 40px rgba(255,255,255,0.1)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
        {formatMs(state.remainingMs)}
      </div>

      <div className="flex gap-4 w-full items-stretch">
        {state.isRunning ? (
          <button onClick={pauseClock}
            className="flex-1 flex items-center justify-center gap-3 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white font-black py-8 rounded-2xl transition-all active:scale-95 shadow-2xl text-4xl">
            <Pause size={40} strokeWidth={3} /> Pausar
          </button>
        ) : (
          <button onClick={startClock}
            className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black py-8 rounded-2xl transition-all active:scale-95 shadow-2xl text-4xl uppercase tracking-wider">
            <Play size={40} fill="currentColor" /> Iniciar
          </button>
        )}
        <button onClick={resetClock}
          className="bg-gray-800/80 hover:bg-gray-700 active:bg-gray-900 text-white px-6 rounded-2xl transition-all active:scale-95 shadow-lg border border-gray-700/50">
          <RotateCcw size={32} />
        </button>
      </div>

      <div className="w-full flex gap-3 h-16">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 font-mono text-xl tracking-widest leading-none">
          {timeInput}
        </div>
        <button onClick={handleSetTime}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-6 rounded-xl text-lg transition-all active:scale-95 shadow-lg">
          <Timer size={20} /> Fijar
        </button>
      </div>

      <button onClick={setExtraTime}
        className="w-full bg-[#a34419] hover:bg-[#c1501d] active:bg-[#8a3a15] text-white font-bold py-5 rounded-2xl text-lg transition-all active:scale-95 border border-white/5 shadow-xl uppercase tracking-widest">
        Tiempo Suplementario (3:00)
      </button>
    </div>
  );
}

