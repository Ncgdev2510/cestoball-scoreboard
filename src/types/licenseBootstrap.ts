export interface LicenseBootstrap {
  licensed: boolean;
  machineId: string;
  reason: string | null;
  /** Rutas donde se buscó license.lic (en orden). */
  searchedPaths: string[];
}
