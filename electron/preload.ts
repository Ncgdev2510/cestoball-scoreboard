import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('scoreboardElectron', {
  getLicenseBootstrap: () =>
    ipcRenderer.invoke('license:getBootstrap') as Promise<{
      licensed: boolean;
      machineId: string;
      reason: string | null;
      searchedPaths: string[];
    }>,
  recheckLicense: () =>
    ipcRenderer.invoke('license:recheck') as Promise<{
      licensed: boolean;
      machineId: string;
      reason: string | null;
      searchedPaths: string[];
    }>,
  quitApp: () => ipcRenderer.invoke('license:quitApp'),
});
