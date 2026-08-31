import { useEffect, useState, useCallback } from 'react';
import { MatchProvider } from './context/MatchContext';
import ControlPanel from './views/ControlPanel';
import Scoreboard from './views/Scoreboard';
import Overlay from './views/Overlay';
import MobileControl from './views/MobileControl';
import LicenseGate from './views/LicenseGate';
import type { LicenseBootstrap } from './types/licenseBootstrap';

function getViewMode(): 'control' | 'scoreboard' | 'overlay' | 'mobile' {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'scoreboard') return 'scoreboard';
  if (view === 'overlay') return 'overlay';
  if (view === 'mobile') return 'mobile';
  
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 'mobile';
  }
  
  return 'control';
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

  const view = getViewMode();

  // Direct render for Overlay, Scoreboard, and Mobile control
  if (view === 'overlay') {
    return <Overlay />;
  }

  if (view === 'scoreboard') {
    return <Scoreboard />;
  }

  if (view === 'mobile') {
    return (
      <MatchProvider>
        <MobileControl />
      </MatchProvider>
    );
  }

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

  return (
    <MatchProvider>
      <ControlPanel />
    </MatchProvider>
  );
}
