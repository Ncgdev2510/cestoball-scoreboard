import { useMatch } from '../../context/MatchContext';

interface Props {
  team: 'home' | 'away';
}

const SCORE_BUTTONS = [
  { delta: 1, label: '+1', color: 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800' },
  { delta: 2, label: '+2', color: 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800' },
  { delta: 3, label: '+3', color: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700' },
  { delta: -1, label: '-1', color: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800' },
];

export default function ScoreControl({ team }: Props) {
  const { state, updateScore } = useMatch();
  const score = state[team].score;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-7xl font-black text-white tabular-nums leading-none select-none" style={{ textShadow: '0 0 30px rgba(255,255,255,0.15)' }}>
        {score}
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {SCORE_BUTTONS.map(btn => (
          <button
            key={btn.delta}
            onClick={() => updateScore(team, btn.delta)}
            className={`${btn.color} text-white font-bold py-3 rounded-xl text-lg transition-all duration-100 active:scale-95 shadow-lg`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
