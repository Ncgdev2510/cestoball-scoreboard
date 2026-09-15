import { useState, useRef } from 'react';
import { useMatch } from '../../context/MatchContext';
import { Period } from '../../types/match';
import { formatMs } from '../../utils/format';
import { compressImageBase64 } from '../../utils/image';
import { Play, Pause, RotateCcw, Zap, Clock, Check, Edit2, ImagePlus, RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react';

const PERIOD_LIST: { id: Period; label: string; short: string; defaultMs: number }[] = [
  { id: '1st', label: '1er Tiempo (20m)', short: '1T', defaultMs: 20 * 60 * 1000 },
  { id: 'halftime', label: 'Entretiempo', short: 'ET', defaultMs: 0 },
  { id: '2nd', label: '2do Tiempo (20m)', short: '2T', defaultMs: 20 * 60 * 1000 },
  { id: 'extra1', label: 'Prórroga 1 (3m)', short: 'PR1', defaultMs: 3 * 60 * 1000 },
  { id: 'extra2', label: 'Prórroga 2 (3m)', short: 'PR2', defaultMs: 3 * 60 * 1000 },
  { id: 'finished', label: 'Finalizado', short: 'FIN', defaultMs: 0 },
];

export default function MobileControl() {
  const {
    state,
    startClock,
    pauseClock,
    resetClock,
    setClockTime,
    setExtraTime,
    updateScore,
    setScore,
    triggerTriple,
    setTeamName,
    setTeamLogo,
    setMatchName,
    setPeriod,
  } = useMatch();

  const [showClockMenu, setShowClockMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'home' | 'away' | 'match' | null>(null);
  const [tempName, setTempName] = useState('');

  // Time Direct Edit Modal State
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState(20);
  const [editSeconds, setEditSeconds] = useState(0);

  const fileInputHomeRef = useRef<HTMLInputElement | null>(null);
  const fileInputAwayRef = useRef<HTMLInputElement | null>(null);

  // Haptic feedback helper
  const triggerHaptic = (ms = 40) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const handleScore = (team: 'home' | 'away', delta: number) => {
    triggerHaptic(50);
    if (delta === 3) {
      updateScore(team, 3);
      triggerTriple(team);
    } else {
      updateScore(team, delta);
    }
  };

  const handleResetScore = (team: 'home' | 'away') => {
    triggerHaptic(60);
    setScore(team, 0);
  };

  const handleToggleClock = () => {
    triggerHaptic(40);
    if (state.isRunning) {
      pauseClock();
    } else {
      startClock();
    }
  };

  const handleLogoUpload = async (team: 'home' | 'away', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTeamLogo(team, reader.result);
      }
    };
    reader.readAsDataURL(file);
    try {
      const compressed = await compressImageBase64(file, 240, 0.8);
      setTeamLogo(team, compressed);
    } catch {
      // ignore
    }
  };

  const handleSelectPeriod = (targetPeriod: Period) => {
    triggerHaptic(50);
    setShowPeriodMenu(false);
    const config = PERIOD_LIST.find(p => p.id === targetPeriod);
    const defaultMs = config && config.defaultMs > 0 ? config.defaultMs : undefined;
    setPeriod(targetPeriod, defaultMs);
  };

  const openTimeEditor = () => {
    triggerHaptic(40);
    pauseClock();
    const totalSecs = Math.floor(state.remainingMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    setEditMinutes(m);
    setEditSeconds(s);
    setIsEditingTime(true);
  };

  const adjustMinutes = (delta: number) => {
    triggerHaptic(30);
    setEditMinutes(prev => Math.max(0, Math.min(99, prev + delta)));
  };

  const adjustSeconds = (delta: number) => {
    triggerHaptic(30);
    setEditSeconds(prev => {
      let next = prev + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 59;
      return next;
    });
  };

  const applyCustomTime = (startImmediately = false) => {
    triggerHaptic(50);
    const totalMs = (editMinutes * 60 + editSeconds) * 1000;
    setClockTime(totalMs);
    setIsEditingTime(false);
    if (startImmediately) {
      setTimeout(() => startClock(), 100);
    }
  };

  const startEdit = (target: 'home' | 'away' | 'match') => {
    setEditingTeam(target);
    if (target === 'home') setTempName(state.home.name);
    else if (target === 'away') setTempName(state.away.name);
    else setTempName(state.matchName);
  };

  const saveEdit = () => {
    if (editingTeam === 'home') setTeamName('home', tempName || 'Local');
    else if (editingTeam === 'away') setTeamName('away', tempName || 'Visitante');
    else if (editingTeam === 'match') setMatchName(tempName || 'Partido');
    setEditingTeam(null);
  };

  const isLowTime = state.remainingMs < 30000 && state.remainingMs > 0;

  const currentPeriodConfig = PERIOD_LIST.find(p => p.id === state.period) || {
    id: '1st',
    label: '1er Tiempo',
    short: '1T',
    defaultMs: 20 * 60 * 1000,
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen bg-brand-dark text-white flex flex-col overflow-hidden select-none touch-manipulation font-sans p-2 gap-2">
      {/* Hidden File Inputs for Team Logos */}
      <input
        ref={fileInputHomeRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleLogoUpload('home', e)}
      />
      <input
        ref={fileInputAwayRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleLogoUpload('away', e)}
      />

      {/* 1. TOP BAR: MATCH NAME (CENTERED) & PERIOD SELECTOR (RIGHT) */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="w-12"></div> {/* Spacer to keep match title centered */}
        
        <button
          onClick={() => startEdit('match')}
          className="flex items-center gap-1.5 text-xs font-black text-brand-rose hover:text-white uppercase tracking-widest truncate max-w-[60%]"
        >
          <span className="truncate">{state.matchName || 'PARTIDO'}</span>
          <Edit2 size={11} className="text-brand-steel shrink-0" />
        </button>

        {/* Period Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              triggerHaptic();
              setShowPeriodMenu(!showPeriodMenu);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
              state.period === 'halftime'
                ? 'bg-brand-terracotta text-brand-dark animate-pulse'
                : state.period === '2nd'
                ? 'bg-brand-steel text-white'
                : state.period.startsWith('extra')
                ? 'bg-brand-bronze text-white'
                : 'bg-brand-surface text-brand-rose border border-brand-steel/40'
            }`}
          >
            {currentPeriodConfig.short} ▾
          </button>

          {showPeriodMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPeriodMenu(false)} />
              <div className="absolute right-0 top-9 z-50 bg-brand-card border border-brand-steel/40 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[170px]">
                <div className="text-[10px] font-bold text-brand-rose px-2 py-1 uppercase tracking-wider border-b border-brand-steel/20">
                  Seleccionar Período
                </div>
                {PERIOD_LIST.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPeriod(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-colors ${
                      state.period === item.id
                        ? 'bg-brand-steel text-white'
                        : 'text-brand-rose hover:bg-brand-surface'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] opacity-75">{item.short}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. BIG CLOCK CARD */}
      <button
        onClick={openTimeEditor}
        className={`relative w-full rounded-2xl border py-2.5 sm:py-3.5 flex items-center justify-center shadow-lg active:scale-[0.99] transition-all shrink-0 group ${
          isLowTime
            ? 'border-brand-terracotta/70 bg-gradient-to-r from-brand-bronze/30 via-brand-terracotta/20 to-brand-bronze/30'
            : 'border-brand-steel/30 bg-gradient-to-b from-brand-card via-brand-card/95 to-brand-surface hover:border-brand-steel/60'
        }`}
        title="Toca para editar minutos y segundos"
      >
        <span
          className={`font-black tabular-nums tracking-tight leading-none text-5xl sm:text-6xl ${
            isLowTime
              ? 'text-brand-terracotta animate-pulse'
              : state.isRunning
              ? 'text-brand-steel'
              : 'text-brand-rose'
          }`}
        >
          {formatMs(state.remainingMs)}
        </span>
        <div className="absolute bottom-1.5 right-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-steel/70 group-hover:text-brand-rose flex items-center gap-0.5">
          <Edit2 size={10} />
        </div>
      </button>

      {/* 3. CLOCK ACTIONS ROW (PRESETS BUTTON + BIG START/PAUSE BUTTON) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Presets dropdown toggle */}
        <div className="relative">
          <button
            onClick={() => setShowClockMenu(!showClockMenu)}
            className="w-14 h-12 rounded-xl bg-brand-card hover:bg-brand-surface active:scale-95 text-brand-steel hover:text-brand-rose flex items-center justify-center border border-brand-steel/30 shadow-md transition-all"
            title="Ajustes de tiempo predeterminados"
          >
            <Clock size={22} />
          </button>

          {showClockMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowClockMenu(false)} />
              <div className="absolute top-14 left-0 z-50 bg-brand-card border border-brand-steel/40 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 min-w-[170px]">
                <button
                  onClick={() => {
                    setClockTime(20 * 60 * 1000);
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-brand-surface hover:bg-brand-petrol text-xs font-bold text-left text-brand-rose"
                >
                  ⏱️ 20 Minutos
                </button>
                <button
                  onClick={() => {
                    setClockTime(10 * 60 * 1000);
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-brand-surface hover:bg-brand-petrol text-xs font-bold text-left text-brand-rose"
                >
                  ⏱️ 10 Minutos
                </button>
                <button
                  onClick={() => {
                    setExtraTime();
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-brand-surface hover:bg-brand-petrol text-xs font-bold text-left text-brand-terracotta"
                >
                  ⚡ Prórroga (3 min)
                </button>
                <button
                  onClick={() => {
                    resetClock();
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-brand-bronze/20 hover:bg-brand-bronze/40 border border-brand-bronze/50 text-xs font-bold text-left text-brand-terracotta flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Reiniciar Tiempo
                </button>
              </div>
            </>
          )}
        </div>

        {/* Big Start / Pause Button */}
        <button
          onClick={handleToggleClock}
          className={`flex-1 h-12 rounded-xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
            state.isRunning
              ? 'bg-gradient-to-r from-brand-bronze via-brand-terracotta to-brand-bronze text-brand-dark shadow-brand-bronze/40'
              : 'bg-gradient-to-r from-brand-petrol via-brand-steel to-brand-steel text-white shadow-brand-steel/40'
          }`}
        >
          {state.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          <span>{state.isRunning ? 'PAUSAR' : 'INICIAR'}</span>
        </button>
      </div>

      {/* 4. TEAMS GRID (2 COLUMNS: LOCAL vs VISITANTE) */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0 overflow-hidden">
        {/* LOCAL */}
        <TeamColumn
          team="home"
          name={state.home.name}
          logo={state.home.logo}
          score={state.home.score}
          onScore={(delta) => handleScore('home', delta)}
          onResetScore={() => handleResetScore('home')}
          onEditName={() => startEdit('home')}
          onTriggerLogoUpload={() => fileInputHomeRef.current?.click()}
        />

        {/* VISITANTE */}
        <TeamColumn
          team="away"
          name={state.away.name}
          logo={state.away.logo}
          score={state.away.score}
          onScore={(delta) => handleScore('away', delta)}
          onResetScore={() => handleResetScore('away')}
          onEditName={() => startEdit('away')}
          onTriggerLogoUpload={() => fileInputAwayRef.current?.click()}
        />
      </div>

      {/* 5. MODAL DE EDICIÓN MANUAL DEL CRONÓMETRO */}
      {isEditingTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-card border border-brand-steel/40 rounded-3xl p-5 w-full max-w-xs shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4 border-b border-brand-steel/20 pb-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Clock size={16} className="text-brand-steel" /> Ajustar Cronómetro
              </h3>
              <button
                onClick={() => setIsEditingTime(false)}
                className="p-1 rounded-lg text-brand-rose hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Pickers for Minutes and Seconds */}
            <div className="flex items-center justify-center gap-3 my-3">
              {/* Minutes Column */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-rose">Minutos</span>
                <button
                  onClick={() => adjustMinutes(1)}
                  className="w-16 h-8 rounded-lg bg-brand-surface hover:bg-brand-petrol active:scale-95 text-brand-rose flex items-center justify-center border border-brand-steel/30"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 h-14 bg-brand-dark border border-brand-steel/40 rounded-xl text-center font-mono font-black text-3xl text-brand-rose focus:outline-none focus:border-brand-steel"
                />
                <button
                  onClick={() => adjustMinutes(-1)}
                  className="w-16 h-8 rounded-lg bg-brand-surface hover:bg-brand-petrol active:scale-95 text-brand-rose flex items-center justify-center border border-brand-steel/30"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <span className="font-black text-3xl text-brand-steel pt-4">:</span>

              {/* Seconds Column */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-rose">Segundos</span>
                <button
                  onClick={() => adjustSeconds(1)}
                  className="w-16 h-8 rounded-lg bg-brand-surface hover:bg-brand-petrol active:scale-95 text-brand-rose flex items-center justify-center border border-brand-steel/30"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-16 h-14 bg-brand-dark border border-brand-steel/40 rounded-xl text-center font-mono font-black text-3xl text-brand-rose focus:outline-none focus:border-brand-steel"
                />
                <button
                  onClick={() => adjustSeconds(-1)}
                  className="w-16 h-8 rounded-lg bg-brand-surface hover:bg-brand-petrol active:scale-95 text-brand-rose flex items-center justify-center border border-brand-steel/30"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="grid grid-cols-4 gap-1.5 my-3">
              <button
                onClick={() => adjustMinutes(1)}
                className="py-1 rounded-lg bg-brand-surface hover:bg-brand-petrol text-brand-rose font-bold text-xs border border-brand-steel/20"
              >
                +1 min
              </button>
              <button
                onClick={() => adjustMinutes(-1)}
                className="py-1 rounded-lg bg-brand-surface hover:bg-brand-petrol text-brand-rose font-bold text-xs border border-brand-steel/20"
              >
                -1 min
              </button>
              <button
                onClick={() => adjustSeconds(10)}
                className="py-1 rounded-lg bg-brand-surface hover:bg-brand-petrol text-brand-rose font-bold text-xs border border-brand-steel/20"
              >
                +10s
              </button>
              <button
                onClick={() => adjustSeconds(-10)}
                className="py-1 rounded-lg bg-brand-surface hover:bg-brand-petrol text-brand-rose font-bold text-xs border border-brand-steel/20"
              >
                -10s
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => applyCustomTime(false)}
                className="w-full py-2.5 rounded-xl bg-brand-steel hover:bg-brand-steel/90 active:scale-95 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Aplicar Tiempo
              </button>
              <button
                onClick={() => applyCustomTime(true)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-petrol to-brand-steel hover:from-brand-steel hover:to-brand-petrol active:scale-95 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Play size={14} fill="currentColor" /> Aplicar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-card border border-brand-steel/40 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">
              Editar {editingTeam === 'match' ? 'Nombre del Partido' : editingTeam === 'home' ? 'Equipo Local' : 'Equipo Visitante'}
            </h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-brand-dark border border-brand-steel/40 rounded-xl px-3 py-2 text-brand-rose text-sm focus:outline-none focus:border-brand-steel mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTeam(null)}
                className="px-3 py-1.5 rounded-lg bg-brand-surface text-xs font-semibold text-brand-rose"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 rounded-lg bg-brand-steel text-xs font-bold text-white flex items-center gap-1"
              >
                <Check size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Columna para cada Equipo
interface TeamColumnProps {
  team: 'home' | 'away';
  name: string;
  logo?: string;
  score: number;
  onScore: (delta: number) => void;
  onResetScore: () => void;
  onEditName: () => void;
  onTriggerLogoUpload: () => void;
}

function TeamColumn({
  team,
  name,
  logo,
  score,
  onScore,
  onResetScore,
  onEditName,
  onTriggerLogoUpload,
}: TeamColumnProps) {
  const isHome = team === 'home';

  return (
    <div
      className={`h-full flex flex-col justify-between rounded-2xl p-2 sm:p-2.5 border transition-all ${
        isHome
          ? 'bg-gradient-to-b from-brand-petrol/30 via-brand-card/90 to-brand-dark border-brand-steel/30 shadow-inner'
          : 'bg-gradient-to-b from-brand-bronze/25 via-brand-card/90 to-brand-dark border-brand-bronze/30 shadow-inner'
      }`}
    >
      {/* Team Header: Logo + Name */}
      <div className="flex items-center gap-2 shrink-0 px-1 py-0.5">
        {/* Team Logo Button */}
        <button
          onClick={onTriggerLogoUpload}
          className="w-8 h-8 rounded-xl bg-white/95 border border-black/20 p-0.5 flex items-center justify-center shrink-0 shadow-sm active:scale-95 relative overflow-hidden"
          title="Cambiar escudo / logo"
        >
          {logo ? (
            <img src={logo} alt="logo" className="w-full h-full object-contain" />
          ) : (
            <div className={`w-full h-full rounded-lg flex items-center justify-center text-white ${isHome ? 'bg-brand-petrol' : 'bg-brand-bronze'}`}>
              <ImagePlus size={15} />
            </div>
          )}
        </button>

        {/* Team Name Button */}
        <button
          onClick={onEditName}
          className="flex items-center gap-1 overflow-hidden flex-1 text-left group"
        >
          <span
            className={`font-black text-xs sm:text-sm uppercase tracking-wider truncate ${
              isHome ? 'text-brand-steel' : 'text-brand-terracotta'
            }`}
          >
            {name || (isHome ? 'LOCAL' : 'VISITANTE')}
          </span>
          <Edit2 size={10} className="text-brand-rose/60 group-hover:text-white shrink-0" />
        </button>
      </div>

      {/* Big Score Display */}
      <div className="flex items-center justify-center py-1 shrink-0">
        <span className="font-black text-5xl sm:text-6xl tabular-nums leading-none tracking-tight text-white drop-shadow-lg">
          {String(score).padStart(2, '0')}
        </span>
      </div>

      {/* Main Touch Buttons (+2 and +3) */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 my-1">
        {/* + 2 BUTTON */}
        <button
          onClick={() => onScore(2)}
          className={`w-full flex-1 min-h-0 rounded-2xl font-black text-3xl sm:text-4xl flex items-center justify-center active:scale-95 shadow-lg transition-all ${
            isHome
              ? 'bg-gradient-to-br from-brand-steel via-brand-steel/90 to-brand-petrol text-white shadow-brand-steel/30'
              : 'bg-gradient-to-br from-brand-bronze via-brand-bronze/90 to-brand-terracotta text-white shadow-brand-bronze/30'
          }`}
        >
          <span>+ 2</span>
        </button>

        {/* + 3 BUTTON */}
        <button
          onClick={() => onScore(3)}
          className={`w-full flex-1 min-h-0 rounded-2xl font-black text-3xl sm:text-4xl flex items-center justify-center gap-1 active:scale-95 shadow-lg transition-all ${
            isHome
              ? 'bg-gradient-to-br from-brand-petrol via-brand-steel/70 to-brand-card text-brand-rose border border-brand-steel/40 shadow-brand-petrol/30'
              : 'bg-gradient-to-br from-brand-terracotta via-brand-bronze to-brand-card text-brand-dark border border-brand-bronze/40 shadow-brand-bronze/30'
          }`}
        >
          <Zap size={24} fill="currentColor" />
          <span>+ 3</span>
        </button>
      </div>

      {/* Correction Row: [- 1] and [0] */}
      <div className="flex items-center gap-1.5 h-9 shrink-0">
        {/* -1 Punto */}
        <button
          onClick={() => onScore(-1)}
          className={`flex-1 h-full rounded-xl bg-brand-surface hover:bg-brand-surface/80 active:scale-95 border ${
            isHome ? 'border-brand-steel/30' : 'border-brand-bronze/30'
          } text-brand-rose font-black text-xs sm:text-sm flex items-center justify-center`}
          title="Restar 1 punto"
        >
          - 1
        </button>

        {/* Resetear a Cero */}
        <button
          onClick={onResetScore}
          className={`flex-1 h-full rounded-xl bg-brand-dark hover:bg-brand-bronze/30 active:scale-95 border ${
            isHome ? 'border-brand-steel/20' : 'border-brand-bronze/20'
          } text-brand-terracotta font-black text-xs sm:text-sm flex items-center justify-center gap-1`}
          title="Volver tanteador a cero"
        >
          <RefreshCw size={12} />
          <span>0</span>
        </button>
      </div>
    </div>
  );
}
