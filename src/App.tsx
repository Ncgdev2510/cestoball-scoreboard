import { useEffect, useState, useCallback } from 'react';
import { MatchProvider } from './context/MatchContext';
import ControlPanel from './views/ControlPanel';
import Scoreboard from './views/Scoreboard';
import LicenseGate from './views/LicenseGate';
import type { LicenseBootstrap } from './types/licenseBootstrap';

function getViewMode(): 'control' | 'scoreboard' {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'scoreboard' ? 'scoreboard' : 'control';
}

async function fetchBootstrap(): Promise<LicenseBootstrap> {
  const api = window.scoreboardElectron;
  if (api?.getLicenseBootstrap) {
    return api.getLicenseBootstrap();
  }
  return {
    licensed: true,
    machineId: '',
    reason: null,
    searchedPaths: [],
  };
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<LicenseBootstrap | null>(null);

  const loadBootstrap = useCallback(async () => {
    setBootstrap(await fetchBootstrap());
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const handleRecheck = useCallback(async () => {
    const api = window.scoreboardElectron;
    if (api?.recheckLicense) {
      const next = await api.recheckLicense();
      setBootstrap(next);
      return next;
    }
    await loadBootstrap();
    return (await fetchBootstrap()) as LicenseBootstrap;
  }, [loadBootstrap]);

  const handleQuit = useCallback(() => {
    void window.scoreboardElectron?.quitApp?.();
  }, []);

  if (!bootstrap) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Cargando…
      </div>
    );
  }

  if (!bootstrap.licensed) {
    return (
      <LicenseGate
        bootstrap={bootstrap}
        onRecheck={handleRecheck}
        onQuit={handleQuit}
      />
    );
  }

  const view = getViewMode();

  if (view === 'scoreboard') {
    return <Scoreboard />;
  }

  return (
    <MatchProvider>
      <ControlPanel />
    </MatchProvider>
  );
}
