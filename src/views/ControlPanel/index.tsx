import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Keyboard, Lock, Unlock, Smartphone, Tv } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import TeamCard from './TeamCard';
import ScoreControl from './ScoreControl';
import ClockControl from './ClockControl';
import AlarmControl from './AlarmControl';
import ExtrasControl from './ExtrasControl';
import { ConnectModal } from '../../components/ConnectModal';

type ToastType = 'info' | 'success' | 'error';

export default function ControlPanel() {
  const { state, setMatchName, startClock, pauseClock, updateScore, triggerTriple } = useMatch();
  const [keyboardLocked, setKeyboardLocked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const lastKeyboardBlockedToastAtRef = useRef(0);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastLeaving(false);
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    setToastLeaving(false);
    const leaveTimeoutId = window.setTimeout(() => {
      setToastLeaving(true);
    }, 1800);
    const hideTimeoutId = window.setTimeout(() => {
      setToast(null);
      setToastLeaving(false);
    }, 2200);

    return () => {
      window.clearTimeout(leaveTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [toast]);

  function toggleKeyboardLock(showStatusToast = false) {
    setKeyboardLocked((prev) => {
      const next = !prev;
      if (showStatusToast) {
        showToast(
          next
            ? 'Atajos de teclado bloqueados.'
            : 'Atajos de teclado desbloqueados.',
          next ? 'info' : 'success'
        );
      }
      return next;
    });
  }

  function openScoreboard() {
    const url = `${window.location.origin}${window.location.pathname}?view=scoreboard`;
    const popup = window.open(url, 'scoreboard', 'width=1920,height=1080');
    if (!popup) {
      showToast('No se pudo abrir el tablero. Verifica si el navegador bloquea popups.', 'error');
      return;
    }
    showToast('Tablero abierto en una nueva ventana.', 'success');
  }

  function openOverlayPreview() {
    const url = `${window.location.origin}${window.location.pathname}?view=overlay`;
    const popup = window.open(url, 'overlay', 'width=1280,height=720');
    if (!popup) {
      showToast('No se pudo abrir la vista previa. Verifica si el navegador bloquea popups.', 'error');
      return;
    }
    showToast('Overlay abierto en una nueva ventana.', 'success');
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const key = event.key.toLowerCase();
      const isShortcutKey = key === ' ' || ['q', 'w', 'a', 's', 'z', 'm', 'x', 'h'].includes(key);

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'k') {
        event.preventDefault();
        toggleKeyboardLock(true);
        return;
      }

      if (isEditableTarget) return;

      if (keyboardLocked) {
        if (isShortcutKey) {
          event.preventDefault();
          const now = Date.now();
          if (now - lastKeyboardBlockedToastAtRef.current > 1200) {
            lastKeyboardBlockedToastAtRef.current = now;
            showToast('Atajos bloqueados. Desbloquea el teclado con Ctrl+Shift+K.', 'info');
          }
        }
        return;
      }

      if (key === ' ') {
        event.preventDefault();
        if (state.isRunning) pauseClock();
        else startClock();
        return;
      }

      switch (key) {
        case 'q':
          updateScore('home', 3);
          triggerTriple('home');
          break;
        case 'w':
          updateScore('away', 3);
          triggerTriple('away');
          break;
        case 'a':
          updateScore('home', 2);
          break;
        case 's':
          updateScore('away', 2);
          break;
        case 'z':
          window.dispatchEvent(new CustomEvent('shortcut-minute-timeout', { detail: { team: 'home' } }));
          break;
        case 'm':
          window.dispatchEvent(new CustomEvent('shortcut-minute-timeout', { detail: { team: 'away' } }));
          break;
        case 'x':
          window.dispatchEvent(new CustomEvent('shortcut-cancel-minute-timeout'));
          break;
        case 'h':
          window.dispatchEvent(new CustomEvent('shortcut-toggle-period'));
          break;
        default:
          return;
      }

      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboardLocked, pauseClock, startClock, state.isRunning, triggerTriple, updateScore]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-x-hidden">
      {/* Remote connection / QR modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm shadow-2xl transition-all duration-300 ${
            toastLeaving ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'
          } ${
            toast.type === 'success'
              ? 'border border-emerald-400/40 bg-emerald-950/90 text-emerald-100'
              : toast.type === 'error'
                ? 'border border-red-400/40 bg-red-950/90 text-red-100'
                : 'border border-amber-400/40 bg-[#1a1406] text-amber-100'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-800/60 bg-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="logo.png" alt="logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Scoreboard Cestoball</h1>
            <span className="text-xs text-gray-500">Panel de Control</span>
          </div>
        </div>

        <input
          type="text"
          value={state.matchName}
          onChange={e => setMatchName(e.target.value)}
          placeholder="Nombre del Partido"
          className="bg-transparent border-b border-gray-700 text-center text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors px-2 py-1 w-44 md:w-56"
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Connect Mobile / OBS QR button */}
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            title="Conectar Celular o copiar links de OBS"
          >
            <Smartphone size={13} />
            <span>Celular / OBS</span>
          </button>

          {/* Quick Overlay Preview */}
          <button
            onClick={openOverlayPreview}
            className="flex items-center gap-1.5 bg-[#1d1d1d] hover:bg-[#2a2a2a] text-gray-300 border border-gray-700 text-xs font-semibold px-2.5 py-2 rounded-lg transition-all active:scale-95"
            title="Ver Overlay para OBS"
          >
            <Tv size={13} />
            <span className="hidden sm:inline">Overlay</span>
          </button>

          {/* Keyboard Lock */}
          <button
            onClick={() => toggleKeyboardLock(true)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-lg transition-all active:scale-95 ${
              keyboardLocked
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-[#1d1d1d] hover:bg-[#2a2a2a] text-gray-300 border border-gray-700'
            }`}
            title={keyboardLocked ? 'Desbloquear atajos (Ctrl+Shift+K)' : 'Bloquear atajos (Ctrl+Shift+K)'}
          >
            {keyboardLocked ? <Lock size={13} /> : <Unlock size={13} />}
            <span className="hidden md:inline">{keyboardLocked ? 'Bloqueado' : 'Teclado'}</span>
          </button>

          {/* Open Full Scoreboard */}
          <button
            onClick={openScoreboard}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Tablero</span>
          </button>
        </div>
      </header>

      {/* Main grid (responsive: 1 column on mobile, 3 columns on desktop) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] gap-0 overflow-y-auto lg:overflow-hidden">
        {/* Left: Home team */}
        <div className="flex flex-col gap-6 p-5 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0d0d0d]">
          <ScoreControl team="home" />
          <div className="max-w-[220px] mx-auto w-full">
            <TeamCard team="home" />
          </div>
          
          <div className="mt-auto">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Acciones</span>
              <ExtrasControl />
            </div>
          </div>
        </div>

        {/* Center: Clock & Alarms */}
        <div className="flex flex-col gap-6 p-5 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#080808]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <ClockControl />
          </div>
          
          <div className="mt-auto border-t border-white/5 pt-6">
            <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Alarma</span>
              <AlarmControl />
            </div>
          </div>
        </div>

        {/* Right: Away team */}
        <div className="flex flex-col gap-6 p-5 lg:p-8 bg-[#0d0d0d]">
          <ScoreControl team="away" />
          <div className="max-w-[220px] mx-auto w-full">
            <TeamCard team="away" />
          </div>
          <div className="mt-auto">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Atajos</span>
              <div className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-xs text-gray-400">
                <div className="flex items-center gap-2 text-gray-300 font-semibold mb-2">
                  <Keyboard size={14} /> Atajos Teclado
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1">
                  <div><strong>Espacio:</strong> Iniciar/Pausar</div>
                  <div><strong>Q:</strong> Local +3 | <strong>W:</strong> Vis +3</div>
                  <div><strong>A:</strong> Local +2 | <strong>S:</strong> Vis +2</div>
                  <div><strong>Z:</strong> Minuto Local | <strong>M:</strong> Minuto Vis</div>
                  <div><strong>X:</strong> Cancelar minuto</div>
                  <div><strong>H:</strong> Entretiempo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

