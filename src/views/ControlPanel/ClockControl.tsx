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

  const isLowTime = state.remainingMs < 30000 && state.remainingMs > 0;

  return (
    <div className="flex flex-col items-center justify-center gap-5 sm:gap-6 w-full max-w-xl mx-auto">
      {/* 1. DÍGITOS DEL CRONÓMETRO GIGANTES Y CENTRADOS (SIN ANIMACIÓN ARRIBA) */}
      <div
        className={`font-black tabular-nums leading-none select-none transition-colors text-center tracking-tight ${
          isLowTime ? 'text-brand-terracotta animate-pulse' : 'text-brand-rose'
        }`}
        style={{
          fontSize: 'clamp(5.5rem, 11vw, 10.5rem)',
          textShadow: '0 4px 40px rgba(11,78,101,0.35)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.03em',
        }}
      >
        {formatMs(state.remainingMs)}
      </div>

      {/* 2. BOTONES PRINCIPALES (INICIAR / PAUSAR + REINICIAR) */}
      <div className="flex gap-3 sm:gap-4 w-full items-stretch">
        {state.isRunning ? (
          <button
            onClick={pauseClock}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-brand-bronze via-brand-terracotta to-brand-bronze hover:opacity-95 text-brand-dark font-black py-6 sm:py-7 rounded-2xl transition-all active:scale-[0.98] shadow-2xl text-2xl sm:text-3xl uppercase tracking-wider"
          >
            <Pause size={34} strokeWidth={3} fill="currentColor" />
            <span>Pausar</span>
          </button>
        ) : (
          <button
            onClick={startClock}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-brand-petrol via-brand-steel to-brand-steel hover:opacity-95 text-white font-black py-6 sm:py-7 rounded-2xl transition-all active:scale-[0.98] shadow-2xl text-2xl sm:text-3xl uppercase tracking-wider"
          >
            <Play size={34} fill="currentColor" />
            <span>Iniciar</span>
          </button>
        )}

        <button
          onClick={handleResetClock}
          className={`px-5 sm:px-6 rounded-2xl transition-all active:scale-[0.98] shadow-lg border flex items-center justify-center ${
            resetConfirm.isConfirming
              ? 'bg-brand-bronze hover:bg-brand-bronze/90 active:bg-brand-bronze/80 text-white border-brand-terracotta/60 animate-pulse'
              : 'bg-brand-surface hover:bg-brand-petrol active:bg-brand-surface text-brand-rose border-brand-steel/30'
          }`}
          title={resetConfirm.isConfirming ? `Confirmar reinicio (${resetConfirm.confirmSeconds})` : 'Reiniciar reloj'}
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={28} />
            {resetConfirm.isConfirming && (
              <span className="font-bold text-xs sm:text-sm tracking-wide">
                Confirmar ({resetConfirm.confirmSeconds})
              </span>
            )}
          </div>
        </button>
      </div>

      {/* 3. FILA DE FIJAR TIEMPO MANUAL (INPUT + BOTÓN FIJAR) */}
      <div className="w-full flex gap-3 h-14 sm:h-16">
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
          className={`flex-1 bg-brand-card border rounded-xl text-center font-mono text-xl sm:text-2xl font-bold tracking-widest leading-none outline-none transition-colors ${
            inputError
              ? 'border-brand-terracotta text-brand-terracotta placeholder-brand-terracotta/60'
              : 'border-brand-steel/30 text-brand-rose focus:border-brand-steel'
          }`}
          placeholder="20:00"
          aria-label="Tiempo del cronómetro"
        />
        <button
          onClick={handleSetTime}
          className={`flex items-center gap-2 text-white font-bold px-6 rounded-xl text-base sm:text-lg transition-all active:scale-[0.98] shadow-lg ${
            setTimeConfirm.isConfirming
              ? 'bg-brand-bronze hover:bg-brand-bronze/90 active:bg-brand-bronze/80 animate-pulse'
              : 'bg-brand-steel hover:bg-brand-steel/90 active:bg-brand-petrol'
          }`}
          title={setTimeConfirm.isConfirming ? `Confirmar fijación (${setTimeConfirm.confirmSeconds})` : 'Fijar tiempo'}
        >
          <Timer size={20} />
          <span>{setTimeConfirm.isConfirming ? `Confirmar (${setTimeConfirm.confirmSeconds})` : 'Fijar'}</span>
        </button>
      </div>

      {/* 4. TIEMPO SUPLEMENTARIO (PRÓRROGA 3:00) */}
      <button
        onClick={handleExtraTime}
        className={`w-full font-bold py-4 sm:py-4.5 rounded-2xl text-sm sm:text-base transition-all active:scale-[0.98] border border-brand-steel/30 shadow-xl uppercase tracking-widest ${
          extraTimeConfirm.isConfirming
            ? 'bg-brand-bronze hover:bg-brand-bronze/90 active:bg-brand-bronze/80 text-white animate-pulse'
            : 'bg-brand-surface hover:bg-brand-petrol/60 active:bg-brand-surface text-brand-rose'
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

