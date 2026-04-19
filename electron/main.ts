import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateFirstExistingLicense,
  licenseSearchPaths,
  getMachineId,
} from './license';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface LicenseBootstrap {
  licensed: boolean;
  machineId: string;
  reason: string | null;
  searchedPaths: string[];
}

function publicKeyDir(): string {
  return __dirname;
}

function computeBootstrap(): LicenseBootstrap {
  const skip =
    !app.isPackaged && process.env.SKIP_LICENSE_CHECK === '1';

  const candidates = licenseSearchPaths(
    app.isPackaged,
    path.dirname(process.execPath),
    app.getPath('userData'),
    process.cwd()
  );

  if (skip) {
    return {
      licensed: true,
      machineId: getMachineId(),
      reason: null,
      searchedPaths: candidates,
    };
  }

  const result = validateFirstExistingLicense(candidates, publicKeyDir());

  if (result.ok) {
    return {
      licensed: true,
      machineId: getMachineId(),
      reason: null,
      searchedPaths: candidates,
    };
  }

  return {
    licensed: false,
    machineId: result.machineId,
    reason: result.reason,
    searchedPaths: candidates,
  };
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    icon: path.join(__dirname, '..', app.isPackaged ? 'dist' : 'public', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  if (!app.isPackaged) {
    await win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  let cachedBootstrap = computeBootstrap();

  ipcMain.handle('license:getBootstrap', () => cachedBootstrap);
  ipcMain.handle('license:recheck', () => {
    cachedBootstrap = computeBootstrap();
    return cachedBootstrap;
  });
  ipcMain.handle('license:quitApp', () => {
    app.quit();
  });

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
