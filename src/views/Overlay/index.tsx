import { useEffect, useState, useRef } from 'react';
import { MatchState, DEFAULT_MATCH_STATE } from '../../types/match';
import { loadState, onStateChange, onBoardEvent, BoardEvent } from '../../utils/storage';
import { HorizontalBar } from './HorizontalBar';
import { CompactBadge } from './CompactBadge';
import { Sliders, Eye, EyeOff } from 'lucide-react';

type OverlayStyle = 'bar' | 'badge';
type OverlayPosition = 'bottom-center' | 'bottom-left' | 'bottom-right';

interface TripleAnim {
  team: 'home' | 'away';
  id: number;
}

export default function Overlay() {
  const [state, setState] = useState<MatchState>(() => loadState() ?? DEFAULT_MATCH_STATE);
  const [triple, setTriple] = useState<TripleAnim | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState<{ text: string; id: number } | null>(null);
  const tripleTimeoutRef = useRef<number | null>(null);
  const timeoutMsgTimeoutRef = useRef<number | null>(null);

  // Configuration state with URL query defaults
  const params = new URLSearchParams(window.location.search);
  const initialStyle = (params.get('style') as OverlayStyle) || 'bar';
  const initialOpacity = params.get('opacity') ? parseFloat(params.get('opacity')!) : 0.92;
  const initialPos = (params.get('pos') as OverlayPosition) || (initialStyle === 'badge' ? 'bottom-left' : 'bottom-center');

  const [overlayStyle, setOverlayStyle] = useState<OverlayStyle>(initialStyle);
  const [opacity, setOpacity] = useState<number>(initialOpacity);
  const [position, setPosition] = useState<OverlayPosition>(initialPos);
  const [showToolbar, setShowToolbar] = useState(params.get('toolbar') === 'true');

  useEffect(() => {
    const offState = onStateChange(s => setState(s));
    const offEvent = onBoardEvent((event: BoardEvent) => {
      if (event.type === 'triple' && event.team) {
        if (tripleTimeoutRef.current) clearTimeout(tripleTimeoutRef.current);
        setTriple({ team: event.team, id: event.timestamp });
        tripleTimeoutRef.current = window.setTimeout(() => setTriple(null), 3500);
      }
      if (event.type === 'timeout' && event.team) {
        if (timeoutMsgTimeoutRef.current) clearTimeout(timeoutMsgTimeoutRef.current);
        const teamLabel = event.team === 'home' ? (state.home.name || 'Local') : (state.away.name || 'Visitante');
        const count = event.count ? `(${event.count}/3)` : '';
        setTimeoutMsg({ text: `Minuto ${teamLabel} ${count}`, id: event.timestamp });
        timeoutMsgTimeoutRef.current = window.setTimeout(() => setTimeoutMsg(null), 3500);
      }
    });

    return () => {
      offState();
      offEvent();
    };
  }, [state.home.name, state.away.name]);

  // Positioning class
  const getPositionClass = () => {
    switch (position) {
      case 'bottom-center':
        return 'items-center justify-end pb-8';
      case 'bottom-left':
        return 'items-start justify-end pb-8 pl-8';
      case 'bottom-right':
        return 'items-end justify-end pb-8 pr-8';
      default:
        return 'items-center justify-end pb-8';
    }
  };

  return (
    <div className={`w-screen h-screen bg-transparent flex flex-col ${getPositionClass()} overflow-hidden select-none relative font-sans`}>
      {/* Floating Mini Toolbar (For testing & customization, invisible on OBS unless toggled) */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-200 ${
          showToolbar ? 'opacity-100' : 'opacity-0 hover:opacity-100 pointer-events-auto'
        }`}
      >
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl p-2.5 shadow-2xl text-xs text-white flex items-center gap-3">
          {/* Style Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
            <button
              onClick={() => setOverlayStyle('bar')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                overlayStyle === 'bar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barra Inferior
            </button>
            <button
              onClick={() => setOverlayStyle('badge')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                overlayStyle === 'badge' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tarjeta Lateral
            </button>
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
            <button
              onClick={() => setPosition('bottom-left')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${position === 'bottom-left' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              title="Inferior Izquierda"
            >
              Izq
            </button>
            <button
              onClick={() => setPosition('bottom-center')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${position === 'bottom-center' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              title="Inferior Centro"
            >
              Centro
            </button>
            <button
              onClick={() => setPosition('bottom-right')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${position === 'bottom-right' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              title="Inferior Derecha"
            >
              Der
            </button>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 px-1">
            <Sliders size={13} className="text-slate-400" />
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title={`Opacidad: ${Math.round(opacity * 100)}%`}
            />
            <span className="text-[10px] font-mono text-slate-300 w-7">{Math.round(opacity * 100)}%</span>
          </div>

          {/* Hide/Show Toggle */}
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={showToolbar ? 'Ocultar barra de ajustes' : 'Fijar barra de ajustes'}
          >
            {showToolbar ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Render selected Overlay Style */}
      {overlayStyle === 'bar' ? (
        <HorizontalBar
          state={state}
          triple={triple}
          timeoutMsg={timeoutMsg}
          opacity={opacity}
        />
      ) : (
        <CompactBadge
          state={state}
          triple={triple}
          timeoutMsg={timeoutMsg}
          opacity={opacity}
        />
      )}
    </div>
  );
}
