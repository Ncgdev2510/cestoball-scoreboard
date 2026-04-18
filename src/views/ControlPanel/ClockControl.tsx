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
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-full text-amber-400 bg-amber-400/10 border border-amber-400/20">
          {periodLabel[state.period]}
        </span>
      </div>

      <div className={`text-6xl font-black tabular-nums leading-none select-none transition-colors ${state.remainingMs < 30000 && state.remainingMs > 0 ? 'text-red-400' : 'text-white'}`}
        style={{ textShadow: '0 2px 20px rgba(255,255,255,0.1)', fontVariantNumeric: 'tabular-nums' }}>
        {formatMs(state.remainingMs)}
      </div>

      <div className="flex gap-3 w-full">
        {state.isRunning ? (
          <button onClick={pauseClock}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg text-sm">
            <Pause size={18} /> Pausar
          </button>
        ) : (
          <button onClick={startClock}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg text-sm">
            <Play size={18} /> Iniciar
          </button>
        )}
        <button onClick={resetClock}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 shadow-lg">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="w-full flex gap-2">
        <input
          type="text"
          value={timeInput}
          onChange={e => { setTimeInput(e.target.value); setInputError(false); }}
          placeholder="MM:SS"
          className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none transition-colors ${inputError ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'}`}
        />
        <button onClick={handleSetTime}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all active:scale-95">
          <Timer size={15} /> Fijar
        </button>
      </div>

      <button onClick={setExtraTime}
        className="w-full bg-orange-700/80 hover:bg-orange-600 active:bg-orange-800 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 border border-orange-600/40">
        Tiempo Suplementario (3:00)
      </button>
    </div>
  );
}
