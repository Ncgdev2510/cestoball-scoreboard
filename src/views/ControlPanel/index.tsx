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
            <h1 className="text-sm font-bold text-white leading-none">Scoreboard Pro</h1>
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
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-0 overflow-hidden">
        {/* Left: Home team */}
        <div className="flex flex-col gap-4 p-5 border-r border-gray-800/60">
          <div className="grid grid-cols-2 gap-4">
            <TeamCard team="home" />
            <div className="flex flex-col justify-end">
              <ScoreControl team="home" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/60">
              <ExtrasControl />
            </div>
          </div>
        </div>

        {/* Center: Clock */}
        <div className="flex flex-col items-center justify-center p-6 w-72 border-r border-gray-800/60">
          <div className="w-full p-5 bg-gray-900/50 rounded-2xl border border-gray-800/60">
            <ClockControl />
          </div>
          <div className="mt-4 w-full p-4 bg-gray-900/50 rounded-xl border border-gray-800/60">
            <AlarmControl />
          </div>
        </div>

        {/* Right: Away team */}
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-end">
              <ScoreControl team="away" />
            </div>
            <TeamCard team="away" />
          </div>
          <div className="mt-auto">
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/60">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Estado</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">Local</div>
                    <div className="text-2xl font-black text-white">{state.home.score}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500">Reloj</div>
                    <div className="text-sm font-mono font-bold text-white mt-1">
                      {String(Math.floor(Math.ceil(state.remainingMs / 1000) / 60)).padStart(2, '0')}:{String(Math.ceil(state.remainingMs / 1000) % 60).padStart(2, '0')}
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-1 ${state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">Visit.</div>
                    <div className="text-2xl font-black text-white">{state.away.score}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
