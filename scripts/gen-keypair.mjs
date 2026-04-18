/**
 * Genera un par RSA 4096 (PKCS#8 privada, SPKI pública).
 * La privada va a secrets/private.pem (no versionar).
 * La pública a electron/publicKey.pem (sí versionar la pública).
 */
import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const secretsDir = path.join(root, 'secrets');
const privPath = path.join(secretsDir, 'private.pem');
const pubPath = path.join(root, 'electron', 'publicKey.pem');

if (existsSync(privPath)) {
  console.error(
    'Ya existe secrets/private.pem. Borralo primero si querés rotar claves (implica reemitir todas las licencias).'
  );
  process.exit(1);
}

mkdirSync(secretsDir, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

writeFileSync(privPath, privateKey, { mode: 0o600 });
writeFileSync(pubPath, publicKey);

console.log('Claves generadas:');
console.log('  Privada (NUNCA compartir):', privPath);
console.log('  Pública (embebida en la app):', pubPath);
console.log('Ejecutá: npm run build:electron && npm run license:sign -- "<HWID>"');
