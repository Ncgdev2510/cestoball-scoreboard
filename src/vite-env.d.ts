/// <reference types="vite/client" />

import type { LicenseBootstrap } from './types/licenseBootstrap';

declare global {
  interface Window {
    scoreboardElectron?: {
      getLicenseBootstrap: () => Promise<LicenseBootstrap>;
      recheckLicense: () => Promise<LicenseBootstrap>;
      quitApp: () => Promise<void>;
    };
  }
}

export {};
