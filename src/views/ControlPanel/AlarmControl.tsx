import { Volume2 } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';
import { AlarmType } from '../../utils/audio';

const ALARM_OPTIONS: { value: AlarmType; label: string }[] = [
  { value: 'buzzer', label: 'Bocina' },
  { value: 'whistle', label: 'Silbato' },
  { value: 'horn', label: 'Corneta' },
];

export default function AlarmControl() {
  const { alarmType, setAlarmType, alarmVolume, setAlarmVolume, triggerAlarm } = useMatch();

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Alarma</span>
      <div className="flex gap-2">
        {ALARM_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAlarmType(opt.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              alarmType === opt.value
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Volume2 size={16} className="text-gray-500 shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={alarmVolume}
          onChange={e => setAlarmVolume(Number(e.target.value))}
          className="flex-1 accent-blue-500 h-2"
        />
        <span className="text-xs text-gray-400 w-8 text-right">{alarmVolume}%</span>
      </div>

      <button
        onClick={triggerAlarm}
        className="w-full bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm shadow-lg border border-red-600/40"
      >
        Probar Bocina
      </button>
    </div>
  );
}
