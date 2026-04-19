import { useMatch } from '../../context/MatchContext';

interface Props {
  team: 'home' | 'away';
}

const SCORE_BUTTONS = [
  { delta: 2, label: '+2', color: 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800' },
  { delta: 3, label: '+3', color: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700' },
  { delta: 1, label: '+1', color: 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800' },
  { delta: -1, label: '-1', color: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800' },
];

export default function ScoreControl({ team }: Props) {
  const { state, updateScore, triggerTriple } = useMatch();
  const score = state[team].score;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="text-[12rem] font-black text-white tabular-nums leading-none select-none tracking-tighter" style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
        {score}
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {SCORE_BUTTONS.map(btn => (
          <button
            key={btn.delta}
            onClick={() => {
              updateScore(team, btn.delta);
              if (btn.label === '+3') triggerTriple(team);
            }}
            className={`${btn.color} text-white font-bold py-4 rounded-xl text-xl transition-all duration-100 active:scale-95 shadow-xl`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

