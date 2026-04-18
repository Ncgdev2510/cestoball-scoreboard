import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useMatch } from '../../context/MatchContext';

interface Props {
  team: 'home' | 'away';
}

export default function TeamCard({ team }: Props) {
  const { state, setTeamName, setTeamLogo } = useMatch();
  const teamData = state[team];
  const fileRef = useRef<HTMLInputElement>(null);
  const label = team === 'home' ? 'Local' : 'Visitante';

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setTeamLogo(team, ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
      <div className="relative flex items-center justify-center w-full aspect-square max-h-24 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group cursor-pointer"
        onClick={() => fileRef.current?.click()}>
        {teamData.logo ? (
          <>
            <img src={teamData.logo} alt="logo" className="w-full h-full object-contain p-2" />
            <button
              onClick={e => { e.stopPropagation(); setTeamLogo(team, ''); }}
              className="absolute top-1 right-1 bg-gray-900/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} className="text-gray-400" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-600">
            <Upload size={20} />
            <span className="text-xs">Logo</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <input
        type="text"
        value={teamData.name}
        onChange={e => setTeamName(team, e.target.value)}
        placeholder={label}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors text-center"
      />
    </div>
  );
}
