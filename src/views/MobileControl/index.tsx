import { useState, useRef } from 'react';
import { useMatch } from '../../context/MatchContext';
import { Period } from '../../types/match';
import { formatMs } from '../../utils/format';
import { Play, Pause, RotateCcw, Plus, Minus, Zap, Clock, Check, Edit2, ImagePlus, RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react';

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
    triggerTimeout,
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

  const handleTimeout = (team: 'home' | 'away') => {
    const current = state[team].timeouts || 0;
    if (current >= 3) return;
    triggerHaptic(80);
    triggerTimeout(team);
  };

  const handleToggleClock = () => {
    triggerHaptic(40);
    if (state.isRunning) {
      pauseClock();
    } else {
      startClock();
    }
  };

  const handleLogoUpload = (team: 'home' | 'away', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTeamLogo(team, reader.result);
      }
    };
    reader.readAsDataURL(file);
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
    <div className="h-[100dvh] max-h-[100dvh] w-screen bg-[#080b12] text-white flex flex-col overflow-hidden select-none touch-manipulation font-sans">
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

      {/* 1. TOP HEADER: RELOJ Y CRONÓMETRO (Compacto, Todo a la vista) */}
      <div className="bg-[#111726] border-b border-slate-800/80 px-2.5 py-1.5 shrink-0 shadow-md">
        {/* Match Name Bar & Period Selector */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => startEdit('match')}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-wider truncate max-w-[62%]"
          >
            <span className="truncate">{state.matchName || 'Partido Cestoball'}</span>
            <Edit2 size={10} className="text-slate-500 shrink-0" />
          </button>

          {/* Period Selector Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic();
                setShowPeriodMenu(!showPeriodMenu);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
                state.period === 'halftime'
                  ? 'bg-amber-500 text-black animate-pulse'
                  : state.period === '2nd'
                  ? 'bg-indigo-600 text-white'
                  : state.period.startsWith('extra')
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              {currentPeriodConfig.short} ▾
            </button>

            {/* Period Dropdown Menu */}
            {showPeriodMenu && (
              <div className="absolute right-0 top-8 z-50 bg-[#161f33] border border-slate-700 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[170px]">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                  Seleccionar Período
                </div>
                {PERIOD_LIST.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPeriod(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-colors ${
                      state.period === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] opacity-75">{item.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clock Center & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Time Presets Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowClockMenu(!showClockMenu)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center border border-slate-700"
              title="Ajustes de tiempo"
            >
              <Clock size={18} />
            </button>

            {/* Dropdown for Clock Presets */}
            {showClockMenu && (
              <div className="absolute top-12 left-0 z-50 bg-[#161f33] border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 min-w-[160px]">
                <button
                  onClick={() => {
                    setClockTime(20 * 60 * 1000);
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-left"
                >
                  ⏱️ 20 Minutos
                </button>
                <button
                  onClick={() => {
                    setClockTime(10 * 60 * 1000);
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-left"
                >
                  ⏱️ 10 Minutos
                </button>
                <button
                  onClick={() => {
                    setExtraTime();
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-left text-amber-300"
                >
                  ⚡ Prórroga (3 min)
                </button>
                <button
                  onClick={() => {
                    resetClock();
                    setShowClockMenu(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-xs font-bold text-left text-red-300 flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Reiniciar Tiempo
                </button>
              </div>
            )}
          </div>

          {/* Main Time Display (CLICKABLE TO EDIT TIME DIRECTLY) */}
          <button
            onClick={openTimeEditor}
            className={`flex-1 flex items-center justify-center py-1 px-2 rounded-xl border active:scale-95 transition-all group relative overflow-hidden ${
              isLowTime
                ? 'border-red-500/50 bg-red-950/30'
                : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
            }`}
            title="Toca para editar minutos y segundos"
          >
            <span
              className={`font-black tabular-nums tracking-tight leading-none text-3xl sm:text-4xl ${
                isLowTime
                  ? 'text-red-400 animate-pulse'
                  : state.isRunning
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {formatMs(state.remainingMs)}
            </span>
            <div className="absolute bottom-0.5 right-1 text-[8px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-300">
              ✎
            </div>
          </button>

          {/* BIG PLAY / PAUSE BUTTON */}
          <button
            onClick={handleToggleClock}
            className={`h-11 px-4 sm:px-5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              state.isRunning
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-amber-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-600/30'
            }`}
          >
            {state.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>{state.isRunning ? 'PAUSA' : 'INICIAR'}</span>
          </button>
        </div>
      </div>

      {/* 2. BODY: DIVIDIDO EN 2 COLUMNAS (LOCAL vs VISITANTE) */}
      <div className="flex-1 grid grid-cols-2 gap-1.5 p-1.5 overflow-hidden">
        {/* === LOCAL (IZQUIERDA) === */}
        <TeamColumn
          team="home"
          name={state.home.name}
          logo={state.home.logo}
          score={state.home.score}
          timeouts={state.home.timeouts}
          onScore={(delta) => handleScore('home', delta)}
          onResetScore={() => handleResetScore('home')}
          onTimeout={() => handleTimeout('home')}
          onEditName={() => startEdit('home')}
          onTriggerLogoUpload={() => fileInputHomeRef.current?.click()}
        />

        {/* === VISITANTE (DERECHA) === */}
        <TeamColumn
          team="away"
          name={state.away.name}
          logo={state.away.logo}
          score={state.away.score}
          timeouts={state.away.timeouts}
          onScore={(delta) => handleScore('away', delta)}
          onResetScore={() => handleResetScore('away')}
          onTimeout={() => handleTimeout('away')}
          onEditName={() => startEdit('away')}
          onTriggerLogoUpload={() => fileInputAwayRef.current?.click()}
        />
      </div>

      {/* 3. MODAL DE EDICIÓN MANUAL DEL CRONÓMETRO (MINUTOS Y SEGUNDOS) */}
      {isEditingTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111726] border border-slate-700 rounded-3xl p-5 w-full max-w-xs shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Clock size={16} className="text-blue-400" /> Ajustar Cronómetro
              </h3>
              <button
                onClick={() => setIsEditingTime(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Pickers for Minutes and Seconds */}
            <div className="flex items-center justify-center gap-3 my-3">
              {/* Minutes Column */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Minutos</span>
                <button
                  onClick={() => adjustMinutes(1)}
                  className="w-16 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-16 h-14 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono font-black text-3xl text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => adjustMinutes(-1)}
                  className="w-16 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <span className="font-black text-3xl text-slate-500 pt-4">:</span>

              {/* Seconds Column */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Segundos</span>
                <button
                  onClick={() => adjustSeconds(1)}
                  className="w-16 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center"
                >
                  <ChevronUp size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-16 h-14 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono font-black text-3xl text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => adjustSeconds(-1)}
                  className="w-16 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="grid grid-cols-4 gap-1.5 my-3">
              <button
                onClick={() => adjustMinutes(1)}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                +1 min
              </button>
              <button
                onClick={() => adjustMinutes(-1)}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                -1 min
              </button>
              <button
                onClick={() => adjustSeconds(10)}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                +10s
              </button>
              <button
                onClick={() => adjustSeconds(-10)}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                -10s
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => applyCustomTime(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Aplicar Tiempo
              </button>
              <button
                onClick={() => applyCustomTime(true)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5"
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">
              Editar {editingTeam === 'match' ? 'Nombre del Partido' : editingTeam === 'home' ? 'Equipo Local' : 'Equipo Visitante'}
            </h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTeam(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white flex items-center gap-1"
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
  timeouts: number;
  onScore: (delta: number) => void;
  onResetScore: () => void;
  onTimeout: () => void;
  onEditName: () => void;
  onTriggerLogoUpload: () => void;
}

function TeamColumn({
  team,
  name,
  logo,
  score,
  timeouts,
  onScore,
  onResetScore,
  onTimeout,
  onEditName,
  onTriggerLogoUpload,
}: TeamColumnProps) {
  const isHome = team === 'home';
  const isMaxTimeouts = (timeouts || 0) >= 3;

  return (
    <div
      className={`h-full flex flex-col justify-between rounded-2xl p-2 border transition-all ${
        isHome
          ? 'bg-gradient-to-b from-[#0d162a] to-[#070d19] border-blue-950/80 shadow-inner'
          : 'bg-gradient-to-b from-[#240f13] to-[#12070a] border-red-950/80 shadow-inner'
      }`}
    >
      {/* Team Header: Logo + Name + Edit */}
      <div className="flex items-center gap-2 shrink-0 px-1 py-0.5">
        {/* Team Logo (Clickable to change) */}
        <button
          onClick={onTriggerLogoUpload}
          className="w-8 h-8 rounded-lg bg-white/95 border border-black/20 p-0.5 flex items-center justify-center shrink-0 shadow-sm active:scale-95 relative group overflow-hidden"
          title="Cambiar escudo / logo"
        >
          {logo ? (
            <img src={logo} alt="logo" className="w-full h-full object-contain" />
          ) : (
            <div className={`w-full h-full rounded flex items-center justify-center text-white ${isHome ? 'bg-blue-600' : 'bg-red-600'}`}>
              <ImagePlus size={14} />
            </div>
          )}
        </button>

        {/* Team Name */}
        <button
          onClick={onEditName}
          className="flex items-center gap-1 overflow-hidden flex-1 text-left group"
        >
          <span
            className={`font-black text-xs uppercase tracking-wider truncate ${
              isHome ? 'text-blue-300' : 'text-rose-300'
            }`}
          >
            {name || (isHome ? 'LOCAL' : 'VISITANTE')}
          </span>
          <Edit2 size={10} className="text-slate-600 group-hover:text-slate-300 shrink-0" />
        </button>
      </div>

      {/* Big Score Number */}
      <div className="flex items-center justify-center my-0.5">
        <span className="font-black text-5xl sm:text-6xl tabular-nums leading-none tracking-tight text-white drop-shadow-lg">
          {score}
        </span>
      </div>

      {/* Touch Buttons Grid */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5">
        {/* +2 PUNTOS (Botón Principal Grande) */}
        <button
          onClick={() => onScore(2)}
          className={`w-full flex-1 min-h-[48px] rounded-xl font-black text-lg sm:text-xl flex items-center justify-center gap-1 active:scale-95 shadow-md transition-all ${
            isHome
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30'
              : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-600/30'
          }`}
        >
          <Plus size={20} strokeWidth={3} />
          <span>2 PTS</span>
        </button>

        {/* +3 TRIPLE (Botón Destacado Dorado) */}
        <button
          onClick={() => onScore(3)}
          className="w-full flex-1 min-h-[46px] rounded-xl font-black text-lg sm:text-xl flex items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-black shadow-md shadow-amber-500/25 transition-all"
        >
          <Zap size={18} fill="currentColor" />
          <span>+3 TRIPLE</span>
        </button>

        {/* FILA DE CORRECCIÓN: -1 Y RESET A CERO */}
        <div className="flex items-center gap-1.5 h-8">
          {/* -1 Punto */}
          <button
            onClick={() => onScore(-1)}
            className="flex-1 h-full rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-0.5"
            title="Restar 1 punto"
          >
            <Minus size={13} />
            <span>1 PT</span>
          </button>

          {/* Resetear a Cero */}
          <button
            onClick={onResetScore}
            className="flex-1 h-full rounded-lg bg-slate-900 hover:bg-red-950/60 active:scale-95 border border-slate-700/80 hover:border-red-800 text-slate-400 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1"
            title="Volver tanteador a cero"
          >
            <RefreshCw size={11} />
            <span>0</span>
          </button>
        </div>
      </div>

      {/* MINUTO / TIMEOUT (Botón inferior con 3 indicadores) */}
      <button
        onClick={onTimeout}
        disabled={isMaxTimeouts}
        className={`w-full py-1.5 px-2 rounded-xl flex items-center justify-between border active:scale-95 transition-all shrink-0 ${
          isMaxTimeouts
            ? 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
            : isHome
            ? 'bg-blue-950/60 hover:bg-blue-900/80 border-blue-800 text-blue-200 shadow-sm'
            : 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-800 text-rose-200 shadow-sm'
        }`}
      >
        <span className="text-[11px] font-extrabold uppercase tracking-wide">
          {isMaxTimeouts ? 'Sin minutos' : 'Pedir Minuto'}
        </span>

        {/* 3 Timeouts Dots Indicator */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                num <= (timeouts || 0)
                  ? isHome
                    ? 'bg-blue-400 border-blue-300 shadow-sm shadow-blue-400'
                    : 'bg-rose-400 border-rose-300 shadow-sm shadow-rose-400'
                  : 'bg-black/50 border-slate-700'
              }`}
            />
          ))}
        </div>
      </button>
    </div>
  );
}
