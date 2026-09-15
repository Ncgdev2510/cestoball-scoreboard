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
      <div className="flex gap-2 p-1 bg-brand-surface rounded-xl border border-brand-steel/20">
        {ALARM_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAlarmType(opt.value)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
              alarmType === opt.value
                ? 'bg-brand-steel text-white shadow-lg'
                : 'bg-transparent text-brand-rose/60 hover:text-brand-rose'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 group">
        <Volume2 size={20} className="text-brand-steel group-hover:text-brand-rose transition-colors shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={alarmVolume}
          onChange={e => setAlarmVolume(Number(e.target.value))}
          className="flex-1 accent-brand-steel h-1.5 bg-brand-surface rounded-full appearance-none cursor-pointer"
        />
        <span className="text-sm font-bold text-brand-rose w-10 text-right">{alarmVolume}%</span>
      </div>

      <button
        onClick={triggerAlarm}
        className="w-full bg-brand-bronze hover:bg-brand-bronze/90 active:bg-brand-bronze/80 text-white font-black py-5 rounded-2xl transition-all active:scale-95 text-lg shadow-xl uppercase tracking-widest border border-brand-terracotta/30"
      >
        Chicharra
      </button>
    </div>
  );
}

