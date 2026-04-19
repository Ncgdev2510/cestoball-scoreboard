import { useMatch } from '../../context/MatchContext';
import { Clock, Coffee, RefreshCw } from 'lucide-react';

export default function ExtrasControl() {
  const { state, triggerTimeout, toggleHalftime, newMatch } = useMatch();
  const isHalftime = state.period === 'halftime';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => triggerTimeout('home')}
          disabled={state.home.timeouts >= 3}
          className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#151515] text-gray-400 hover:text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock size={18} className="text-gray-500" /> Minuto L
        </button>
        <button
          onClick={() => triggerTimeout('away')}
          disabled={state.away.timeouts >= 3}
          className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#151515] text-gray-400 hover:text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock size={18} className="text-gray-500" /> Minuto V
        </button>
      </div>
      <button
        onClick={toggleHalftime}
        className={`flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border ${
          isHalftime
            ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-lg'
            : 'bg-[#1a1a1a] text-gray-400 hover:text-white border-white/5 hover:bg-[#252525]'
        }`}
      >
        <Coffee size={18} className={isHalftime ? 'text-white' : 'text-gray-500'} /> {isHalftime ? 'Fin Entretiempo' : 'Entretiempo'}
      </button>
      <button
        onClick={() => { if (confirm('¿Iniciar un nuevo partido? Se borrará el estado actual.')) newMatch(); }}
        className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-red-900/40 text-gray-500 hover:text-red-200 font-bold py-4 rounded-xl text-sm transition-all active:scale-95 border border-white/5"
      >
        <RefreshCw size={16} /> Nuevo Partido
      </button>
    </div>
  );
}

