import { useMatch } from '../../context/MatchContext';

interface Props {
  team: 'home' | 'away';
}

export default function ScoreControl({ team }: Props) {
  const { state, updateScore, triggerTriple } = useMatch();
  const score = state[team].score;
  const isHome = team === 'home';

  const scoreButtons = isHome
    ? [
        { delta: 2, label: '+2', color: 'bg-brand-steel hover:bg-brand-steel/90 active:bg-brand-petrol text-white' },
        { delta: 3, label: '+3', color: 'bg-gradient-to-r from-brand-bronze to-brand-terracotta hover:opacity-95 text-brand-dark font-extrabold shadow-lg' },
        { delta: 1, label: '+1', color: 'bg-brand-petrol hover:bg-brand-steel active:bg-brand-petrol text-brand-rose border border-brand-steel/30' },
        { delta: -1, label: '-1', color: 'bg-brand-surface hover:bg-brand-card active:bg-brand-surface text-brand-rose border border-brand-steel/20' },
      ]
    : [
        { delta: 2, label: '+2', color: 'bg-brand-bronze hover:bg-brand-bronze/90 active:bg-brand-bronze/80 text-white' },
        { delta: 3, label: '+3', color: 'bg-gradient-to-r from-brand-bronze to-brand-terracotta hover:opacity-95 text-brand-dark font-extrabold shadow-lg' },
        { delta: 1, label: '+1', color: 'bg-brand-terracotta hover:bg-brand-terracotta/90 active:bg-brand-terracotta text-brand-dark font-extrabold' },
        { delta: -1, label: '-1', color: 'bg-brand-surface hover:bg-brand-card active:bg-brand-surface text-brand-rose border border-brand-bronze/30' },
      ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center">
        <div
          className="text-[12rem] font-black text-brand-rose tabular-nums leading-none select-none tracking-tighter"
          style={{ textShadow: isHome ? '0 0 40px rgba(63,127,158,0.25)' : '0 0 40px rgba(180,124,80,0.25)' }}
        >
          {score}
        </div>
        <div className={`text-xl font-bold uppercase tracking-widest mt-2 mb-2 ${isHome ? 'text-brand-steel' : 'text-brand-terracotta'}`}>
          Minutos: {state[team].timeouts}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {scoreButtons.map(btn => (
          <button
            key={btn.delta}
            onClick={() => {
              updateScore(team, btn.delta);
              if (btn.label === '+3') triggerTriple(team);
            }}
            className={`${btn.color} font-bold py-4 rounded-xl text-xl transition-all duration-100 active:scale-95 shadow-xl`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

