import { useEffect, useMemo, useState } from 'react';
import { useMatch } from '../../context/MatchContext';
import { Clock, Coffee, RefreshCw } from 'lucide-react';
import { playAlarm } from '../../utils/audio';
import { useActionConfirm } from '../../hooks/useActionConfirm';

export default function ExtrasControl() {
  const { state, alarmVolume, announceTimeout, commitTimeout, toggleHalftime, newMatch } = useMatch();
  const isHalftime = state.period === 'halftime';
  const [minuteTimerTeam, setMinuteTimerTeam] = useState<'home' | 'away' | null>(null);
  const [minuteTimerSeconds, setMinuteTimerSeconds] = useState(0);
  const [minuteTimerPaused, setMinuteTimerPaused] = useState(false);
  const periodConfirm = useActionConfirm();
  const newMatchConfirm = useActionConfirm();
  const minuteHomeStartConfirm = useActionConfirm();
  const minuteAwayStartConfirm = useActionConfirm();
  const minuteCancelConfirm = useActionConfirm();

  useEffect(() => {
    if (!minuteTimerTeam || minuteTimerSeconds <= 0 || minuteTimerPaused) return;

    const timeoutId = window.setTimeout(() => {
      setMinuteTimerSeconds(prev => {
        if (prev <= 1) {
          if (minuteTimerTeam) {
            commitTimeout(minuteTimerTeam);
          }
          playAlarm('whistle-short', alarmVolume);
          setMinuteTimerTeam(null);
          setMinuteTimerPaused(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [minuteTimerTeam, minuteTimerSeconds, minuteTimerPaused, alarmVolume, commitTimeout]);

  const minuteTimerLabel = useMemo(() => {
    const minutes = Math.floor(minuteTimerSeconds / 60);
    const seconds = minuteTimerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [minuteTimerSeconds]);

  const startMinuteTimeout = (team: 'home' | 'away') => {
    const nextCount = (state[team].timeouts || 0) + 1;
    if (nextCount > 3) return;
    announceTimeout(team, nextCount);
    setMinuteTimerTeam(team);
    setMinuteTimerSeconds(60);
    setMinuteTimerPaused(false);
    minuteHomeStartConfirm.cancelConfirmation();
    minuteAwayStartConfirm.cancelConfirmation();
    minuteCancelConfirm.cancelConfirmation();
  };

  const cancelMinuteTimeout = () => {
    if (!minuteTimerTeam) return;
    minuteCancelConfirm.requestConfirmation(() => {
      setMinuteTimerTeam(null);
      setMinuteTimerSeconds(0);
      setMinuteTimerPaused(false);
      minuteCancelConfirm.cancelConfirmation();
      minuteHomeStartConfirm.cancelConfirmation();
      minuteAwayStartConfirm.cancelConfirmation();
    });
  };

  const handleMinuteTimeout = (team: 'home' | 'away') => {
    if (!minuteTimerTeam || minuteTimerSeconds <= 0) {
      if (team === 'home') {
        minuteHomeStartConfirm.requestConfirmation(() => {
          startMinuteTimeout('home');
        });
      } else {
        minuteAwayStartConfirm.requestConfirmation(() => {
          startMinuteTimeout('away');
        });
      }
      return;
    }

    if (minuteTimerTeam === team) {
      setMinuteTimerPaused(prev => !prev);
      minuteCancelConfirm.cancelConfirmation();
      minuteHomeStartConfirm.cancelConfirmation();
      minuteAwayStartConfirm.cancelConfirmation();
      return;
    }

    minuteCancelConfirm.requestConfirmation(() => {
      startMinuteTimeout(team);
    });
  };

  useEffect(() => {
    const onShortcutMinuteTimeout = (event: Event) => {
      const customEvent = event as CustomEvent<{ team?: 'home' | 'away' }>;
      const team = customEvent.detail?.team;
      if (!team) return;
      handleMinuteTimeout(team);
    };

    const onShortcutTogglePeriod = () => {
      handleTogglePeriod();
    };

    const onShortcutCancelMinute = () => {
      cancelMinuteTimeout();
    };

    window.addEventListener('shortcut-minute-timeout', onShortcutMinuteTimeout as EventListener);
    window.addEventListener('shortcut-toggle-period', onShortcutTogglePeriod);
    window.addEventListener('shortcut-cancel-minute-timeout', onShortcutCancelMinute);
    return () => {
      window.removeEventListener('shortcut-minute-timeout', onShortcutMinuteTimeout as EventListener);
      window.removeEventListener('shortcut-toggle-period', onShortcutTogglePeriod);
      window.removeEventListener('shortcut-cancel-minute-timeout', onShortcutCancelMinute);
    };
  }, [
    state,
    minuteTimerTeam,
    minuteTimerSeconds,
    minuteTimerPaused,
    periodConfirm.isConfirming,
    periodConfirm.confirmSeconds,
    minuteHomeStartConfirm.isConfirming,
    minuteHomeStartConfirm.confirmSeconds,
    minuteAwayStartConfirm.isConfirming,
    minuteAwayStartConfirm.confirmSeconds,
    minuteCancelConfirm.isConfirming,
    minuteCancelConfirm.confirmSeconds,
  ]);

  const handleTogglePeriod = () => {
    periodConfirm.requestConfirmation(() => {
      toggleHalftime();
    });
  };

  const handleNewMatch = () => {
    newMatchConfirm.requestConfirmation(() => {
      newMatch();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleMinuteTimeout('home')}
          disabled={state.home.timeouts >= 3 && minuteTimerTeam !== 'home'}
          className={`flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border border-[#d58e30] disabled:opacity-50 disabled:cursor-not-allowed ${
            minuteTimerTeam === 'home'
              ? 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800'
              : minuteHomeStartConfirm.isConfirming && !minuteTimerTeam
                ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 animate-pulse'
                : 'bg-[#b96d0f] hover:bg-[#c97a17] active:bg-[#9f5c0b]'
          }`}
        >
          <Clock size={18} className="text-amber-100" />
          {minuteTimerTeam === 'home'
            ? minuteTimerPaused ? 'Reanudar L' : 'Pausar L'
            : minuteHomeStartConfirm.isConfirming && !minuteTimerTeam
              ? `Confirmar (${minuteHomeStartConfirm.confirmSeconds})`
              : 'Minuto L'}
        </button>
        <button
          onClick={() => handleMinuteTimeout('away')}
          disabled={state.away.timeouts >= 3 && minuteTimerTeam !== 'away'}
          className={`flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border border-[#d58e30] disabled:opacity-50 disabled:cursor-not-allowed ${
            minuteTimerTeam === 'away'
              ? 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800'
              : minuteAwayStartConfirm.isConfirming && !minuteTimerTeam
                ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 animate-pulse'
                : 'bg-[#b96d0f] hover:bg-[#c97a17] active:bg-[#9f5c0b]'
          }`}
        >
          <Clock size={18} className="text-amber-100" />
          {minuteTimerTeam === 'away'
            ? minuteTimerPaused ? 'Reanudar V' : 'Pausar V'
            : minuteAwayStartConfirm.isConfirming && !minuteTimerTeam
              ? `Confirmar (${minuteAwayStartConfirm.confirmSeconds})`
              : 'Minuto V'}
        </button>
      </div>
      {minuteTimerTeam && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 py-2 text-center text-sm font-semibold text-amber-200">
          {minuteTimerTeam === 'home' ? 'Minuto L' : 'Minuto V'}: {minuteTimerLabel} {minuteTimerPaused ? '(Pausado)' : ''}
        </div>
      )}
      {minuteTimerTeam && (
        <button
          onClick={cancelMinuteTimeout}
          className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-xs transition-all active:scale-95 border ${
            minuteCancelConfirm.isConfirming
              ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-500/60 animate-pulse'
              : 'bg-[#1a1a1a] hover:bg-red-900/40 text-gray-400 hover:text-red-200 border-white/5'
          }`}
          title={minuteCancelConfirm.isConfirming ? `Confirmar cancelación (${minuteCancelConfirm.confirmSeconds})` : 'Cancelar minuto en curso'}
        >
          {minuteCancelConfirm.isConfirming
            ? `Confirmar Cancelar Minuto (${minuteCancelConfirm.confirmSeconds})`
            : 'Cancelar Minuto en Curso'}
        </button>
      )}
      {minuteTimerTeam && minuteCancelConfirm.isConfirming && (
        <div className="rounded-xl border border-red-700/50 bg-red-900/20 py-2 text-center text-xs font-semibold text-red-200">
          Confirmar cancelar/cambiar minuto ({minuteCancelConfirm.confirmSeconds})
        </div>
      )}
      <button
        onClick={handleTogglePeriod}
        className={`flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border ${
          periodConfirm.isConfirming
            ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-500/60 shadow-lg animate-pulse'
            : isHalftime
              ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-lg'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white border-white/5 hover:bg-[#252525]'
        }`}
        title={periodConfirm.isConfirming ? `Confirmar cambio de período (${periodConfirm.confirmSeconds})` : isHalftime ? 'Finalizar entretiempo' : 'Iniciar entretiempo'}
      >
        <Coffee size={18} className={periodConfirm.isConfirming || isHalftime ? 'text-white' : 'text-gray-500'} />
        {periodConfirm.isConfirming
          ? `Confirmar (${periodConfirm.confirmSeconds})`
          : isHalftime
            ? 'Fin Entretiempo'
            : 'Entretiempo'}
      </button>
      <button
        onClick={handleNewMatch}
        className={`flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border ${
          newMatchConfirm.isConfirming
            ? 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-500/60 animate-pulse'
            : 'bg-[#1a1a1a] hover:bg-red-900/40 text-gray-500 hover:text-red-200 border border-white/5'
        }`}
        title={newMatchConfirm.isConfirming ? `Confirmar nuevo partido (${newMatchConfirm.confirmSeconds})` : 'Iniciar nuevo partido'}
      >
        <RefreshCw size={16} />
        {newMatchConfirm.isConfirming
          ? `Confirmar Nuevo Partido (${newMatchConfirm.confirmSeconds})`
          : 'Nuevo Partido'}
      </button>
    </div>
  );
}

