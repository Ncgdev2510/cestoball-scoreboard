/**
 * Muestra el HWID que debe enviar el cliente (misma lógica que la app).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { machineIdSync } = require('node-machine-id');

function getMachineId() {
  try {
    return machineIdSync(true);
  } catch {
    return machineIdSync();
  }
}

console.log(getMachineId());
