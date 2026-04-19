import { Volume2 } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import { AlarmType } from '../../utils/audio';

const ALARM_OPTIONS: { value: AlarmType; label: string }[] = [
  { value: 'buzzer', label: 'Bocina' },
  { value: 'whistle-short', label: 'Silbato Corto' },
  { value: 'whistle-long', label: 'Silbato Largo' },
];

export default function AlarmControl() {
  const { alarmType, setAlarmType, alarmVolume, setAlarmVolume, triggerAlarm } = useMatch();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
        {ALARM_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAlarmType(opt.value)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              alarmType === opt.value
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 group">
        <Volume2 size={20} className="text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={alarmVolume}
          onChange={e => setAlarmVolume(Number(e.target.value))}
          className="flex-1 accent-blue-500 h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-sm font-bold text-gray-400 w-10 text-right">{alarmVolume}%</span>
      </div>

      <button
        onClick={triggerAlarm}
        className="w-full bg-[#bd1e1e] hover:bg-[#d42222] active:bg-[#a61a1a] text-white font-black py-5 rounded-2xl transition-all active:scale-95 text-lg shadow-xl uppercase tracking-widest border border-white/5"
      >
        Chicharra
      </button>
    </div>
  );
}

