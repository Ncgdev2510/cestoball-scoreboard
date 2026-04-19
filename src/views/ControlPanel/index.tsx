import { ExternalLink, CheckCircle, Monitor } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import TeamCard from './TeamCard';
import ScoreControl from './ScoreControl';
import ClockControl from './ClockControl';
import AlarmControl from './AlarmControl';
import ExtrasControl from './ExtrasControl';

function openScoreboard() {
  const url = `${window.location.origin}${window.location.pathname}?view=scoreboard`;
  window.open(url, 'scoreboard', 'width=1920,height=1080');
}

export default function ControlPanel() {
  const { state, setMatchName } = useMatch();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60 bg-[#111111]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Monitor size={16} />
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
          className="bg-transparent border-b border-gray-700 text-center text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors px-2 py-1 w-48"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle size={14} />
            <span className="text-xs font-medium">Licencia OK</span>
          </div>
          <button
            onClick={openScoreboard}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            <ExternalLink size={13} /> Abrir Tablero
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-[1fr_1.4fr_1fr] gap-0 overflow-hidden">
        {/* Left: Home team */}
        <div className="flex flex-col gap-8 p-8 border-r border-white/5 bg-[#0d0d0d]">
          <ScoreControl team="home" />
          <div className="max-w-[200px] mx-auto w-full">
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
        <div className="flex flex-col gap-8 p-8 border-r border-white/5 bg-[#080808]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <ClockControl />
          </div>
          
          <div className="mt-auto border-t border-white/5 pt-8">
            <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Alarma</span>
              <AlarmControl />
            </div>
          </div>
        </div>

        {/* Right: Away team */}
        <div className="flex flex-col gap-8 p-8 bg-[#0d0d0d]">
          <ScoreControl team="away" />
          <div className="max-w-[200px] mx-auto w-full">
            <TeamCard team="away" />
          </div>
          

        </div>
      </div>

    </div>
  );
}
