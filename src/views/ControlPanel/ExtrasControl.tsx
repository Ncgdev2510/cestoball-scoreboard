import { useMatch } from '../../context/MatchContext';
import { Zap, Coffee, RefreshCw } from 'lucide-react';

export default function ExtrasControl() {
  const { state, triggerTriple, toggleHalftime, newMatch } = useMatch();
  const isHalftime = state.period === 'halftime';

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Acciones</span>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => triggerTriple('home')}
          className="flex items-center justify-center gap-2 bg-amber-600/80 hover:bg-amber-500 active:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 border border-amber-500/30"
        >
          <Zap size={16} /> Triple L
        </button>
        <button
          onClick={() => triggerTriple('away')}
          className="flex items-center justify-center gap-2 bg-amber-600/80 hover:bg-amber-500 active:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 border border-amber-500/30"
        >
          <Zap size={16} /> Triple V
        </button>
      </div>
      <button
        onClick={toggleHalftime}
        className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all active:scale-95 border ${
          isHalftime
            ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
            : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-gray-700'
        }`}
      >
        <Coffee size={16} /> {isHalftime ? 'Fin Entretiempo' : 'Entretiempo'}
      </button>
      <button
        onClick={() => { if (confirm('¿Iniciar un nuevo partido? Se borrará el estado actual.')) newMatch(); }}
        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-semibold py-2.5 rounded-xl text-xs transition-all active:scale-95 border border-gray-700"
      >
        <RefreshCw size={14} /> Nuevo Partido
      </button>
    </div>
  );
}
