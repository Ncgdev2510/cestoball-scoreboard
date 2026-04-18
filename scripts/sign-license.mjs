/**
 * Firma el HWID con secrets/private.pem y escribe license.lic (JSON).
 * Uso: npm run license:sign -- "HWID_DEL_CLIENTE"
 * Opcional: npm run license:sign -- "HWID" ruta/salida.lic
 */
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const privPath = path.join(root, 'secrets', 'private.pem');

const hwid = process.argv[2];
const outArg = process.argv[3];
const outPath = outArg
  ? path.resolve(outArg)
  : path.join(root, 'license.lic');

if (!hwid) {
  console.error('Uso: npm run license:sign -- "<HWID>" [ruta/salida.lic]');
  process.exit(1);
}

if (!existsSync(privPath)) {
  console.error('No existe secrets/private.pem. Ejecutá: npm run license:gen-keys');
  process.exit(1);
}

const privateKey = createPrivateKey(readFileSync(privPath, 'utf8'));
const message = Buffer.from(hwid, 'utf8');
const signature = sign('sha256', message, privateKey);
const payload = { license: signature.toString('base64') };

writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('Licencia escrita:', outPath);
