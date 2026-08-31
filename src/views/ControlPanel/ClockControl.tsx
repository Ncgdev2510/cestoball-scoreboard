import { useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import { formatMs, parseTimeInput } from '../../utils/format';
import { useActionConfirm } from '../../hooks/useActionConfirm';

export default function ClockControl() {
  const { state, startClock, pauseClock, resetClock, setClockTime, setExtraTime } = useMatch();
  const [timeInput, setTimeInput] = useState('20:00');
  const [inputError, setInputError] = useState(false);
  const resetConfirm = useActionConfirm();
  const setTimeConfirm = useActionConfirm();
  const extraTimeConfirm = useActionConfirm();

  function handleSetTime() {
    const ms = parseTimeInput(timeInput);
    if (ms === null) { setInputError(true); return; }
    setInputError(false);
    setTimeConfirm.requestConfirmation(() => {
      setClockTime(ms);
    });
  }

  function handleResetClock() {
    if (resetConfirm.isConfirming) {
      resetClock();
      resetConfirm.cancelConfirmation();
      return;
    }

    resetConfirm.requestConfirmation(() => {
      resetClock();
    });
  }

  function handleExtraTime() {
    extraTimeConfirm.requestConfirmation(() => {
      setExtraTime();
    });
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
        <button
          onClick={handleResetClock}
          className={`px-6 rounded-2xl transition-all active:scale-95 shadow-lg border ${
            resetConfirm.isConfirming
              ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-500/60 animate-pulse'
              : 'bg-gray-800/80 hover:bg-gray-700 active:bg-gray-900 text-white border-gray-700/50'
          }`}
          title={resetConfirm.isConfirming ? `Confirmar reinicio (${resetConfirm.confirmSeconds})` : 'Reiniciar reloj'}
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={32} />
            {resetConfirm.isConfirming && (
              <span className="font-bold text-sm tracking-wide">
                Confirmar ({resetConfirm.confirmSeconds})
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="w-full flex gap-3 h-16">
        <input
          type="text"
          value={timeInput}
          onChange={(event) => {
            setTimeInput(event.target.value);
            if (inputError) setInputError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSetTime();
          }}
          className={`flex-1 bg-gray-900 border rounded-xl text-center font-mono text-xl tracking-widest leading-none outline-none transition-colors ${
            inputError
              ? 'border-red-500 text-red-300 placeholder-red-400'
              : 'border-gray-800 text-gray-400 focus:border-blue-500'
          }`}
          placeholder="20:00"
          aria-label="Tiempo del cronómetro"
        />
        <button
          onClick={handleSetTime}
          className={`flex items-center gap-2 text-white font-bold px-6 rounded-xl text-lg transition-all active:scale-95 shadow-lg ${
            setTimeConfirm.isConfirming
              ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
          }`}
          title={setTimeConfirm.isConfirming ? `Confirmar fijación (${setTimeConfirm.confirmSeconds})` : 'Fijar tiempo'}
        >
          <Timer size={20} />
          {setTimeConfirm.isConfirming ? `Confirmar (${setTimeConfirm.confirmSeconds})` : 'Fijar'}
        </button>
      </div>

      <button
        onClick={handleExtraTime}
        className={`w-full text-white font-bold py-5 rounded-2xl text-lg transition-all active:scale-95 border border-white/5 shadow-xl uppercase tracking-widest ${
          extraTimeConfirm.isConfirming
            ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 animate-pulse'
            : 'bg-[#a34419] hover:bg-[#c1501d] active:bg-[#8a3a15]'
        }`}
        title={extraTimeConfirm.isConfirming ? `Confirmar prórroga (${extraTimeConfirm.confirmSeconds})` : 'Activar tiempo suplementario'}
      >
        {extraTimeConfirm.isConfirming
          ? `Confirmar Tiempo Suplementario (${extraTimeConfirm.confirmSeconds})`
          : 'Tiempo Suplementario (3:00)'}
      </button>
    </div>
  );
}

