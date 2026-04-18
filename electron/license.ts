import { createPublicKey, verify } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { machineIdSync } from 'node-machine-id';

export type LicenseResult =
  | { ok: true }
  | { ok: false; reason: string; machineId: string; licensePath: string };

function getPublicKeyPem(keyDir: string): string {
  const pemPath = path.join(keyDir, 'publicKey.pem');
  if (!existsSync(pemPath)) {
    throw new Error(`Falta publicKey.pem en ${keyDir}`);
  }
  return readFileSync(pemPath, 'utf8');
}

/** Debe coincidir exactamente con el HWID que firmás al generar la licencia. */
export function getMachineId(): string {
  try {
    return machineIdSync(true);
  } catch {
    return machineIdSync();
  }
}

export function resolveLicenseFile(appRootOrExeDir: string): string {
  return path.join(appRootOrExeDir, 'license.lic');
}

/** Orden: junto al .exe, luego AppData (útil si Program Files es de solo lectura). */
export function licenseSearchPaths(
  isPackaged: boolean,
  exeDir: string,
  userDataDir: string,
  cwd: string
): string[] {
  if (isPackaged) {
    return [
      path.join(exeDir, 'license.lic'),
      path.join(userDataDir, 'license.lic'),
    ];
  }
  return [path.join(cwd, 'license.lic')];
}

/** Prueba cada ruta en orden; si hay varios .lic, acepta el primero que valide. */
export function validateFirstExistingLicense(
  candidatePaths: string[],
  publicKeyDir: string
): LicenseResult {
  const machineId = getMachineId();
  const tried: string[] = [];
  let lastFailure: LicenseResult | null = null;

  for (const p of candidatePaths) {
    if (!existsSync(p)) continue;
    tried.push(p);
    const r = validateLicenseFile(p, publicKeyDir);
    if (r.ok) return r;
    lastFailure = r;
  }

  if (tried.length === 0) {
    return {
      ok: false,
      reason: `No se encontró license.lic. Buscado en:\n${candidatePaths.join('\n')}`,
      machineId,
      licensePath: candidatePaths[0] ?? '',
    };
  }

  return lastFailure!;
}

export function validateLicenseFile(
  licensePath: string,
  publicKeyDir: string
): LicenseResult {
  const machineId = getMachineId();

  if (!existsSync(licensePath)) {
    return {
      ok: false,
      reason:
        'No se encontró license.lic. Colócalo en la misma carpeta que el ejecutable (o en la raíz del proyecto en modo desarrollo).',
      machineId,
      licensePath,
    };
  }

  let raw: string;
  try {
    raw = readFileSync(licensePath, 'utf8');
  } catch {
    return {
      ok: false,
      reason: 'No se pudo leer license.lic.',
      machineId,
      licensePath,
    };
  }

  let parsed: { license?: string; signature?: string };
  try {
    parsed = JSON.parse(raw) as { license?: string; signature?: string };
  } catch {
    return {
      ok: false,
      reason: 'license.lic no es JSON válido.',
      machineId,
      licensePath,
    };
  }

  const b64 = parsed.license ?? parsed.signature;
  if (!b64 || typeof b64 !== 'string') {
    return {
      ok: false,
      reason: 'license.lic debe contener "license" o "signature" en Base64.',
      machineId,
      licensePath,
    };
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(b64, 'base64');
  } catch {
    return {
      ok: false,
      reason: 'La firma en license.lic no es Base64 válido.',
      machineId,
      licensePath,
    };
  }

  const message = Buffer.from(machineId, 'utf8');
  let publicKey;
  try {
    publicKey = createPublicKey(getPublicKeyPem(publicKeyDir));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      reason: `Clave pública inválida: ${msg}`,
      machineId,
      licensePath,
    };
  }

  let valid: boolean;
  try {
    valid = verify('sha256', message, publicKey, signature);
  } catch {
    valid = false;
  }

  if (!valid) {
    return {
      ok: false,
      reason:
        'La licencia no corresponde a este equipo (firma inválida o HWID distinto). Envía el ID de hardware al proveedor para obtener una licencia.',
      machineId,
      licensePath,
    };
  }

  return { ok: true };
}
