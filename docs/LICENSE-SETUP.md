# Licencias permanentes (HWID + RSA) y empaquetado seguro

**Guías paso a paso:** [Usuario final](GUIA-USUARIO.md) · [Administrador / proveedor](GUIA-ADMINISTRADOR.md) · [Resumen 1 página cliente](RESUMEN-CLIENTE.md) ([HTML para PDF](RESUMEN-CLIENTE.html))

Este proyecto valida al arranque un archivo `license.lic` firmado con tu **clave privada**. La app solo incluye la **clave pública** y verifica la firma con el ID de hardware de la máquina (`node-machine-id`, modo `original` cuando el SO lo permite).

## Dónde busca la licencia la app

1. **Junto al ejecutable** (tras instalar con **NSIS**, suele ser la carpeta de `Scoreboard Cestoball.exe`, p. ej. bajo `Program Files`).
2. **Carpeta de datos de la app** (fallback si no podés escribir junto al `.exe`):  
   `%APPDATA%\scoreboard-cestoball\license.lic` (sigue el `name` de `package.json`).

Si la licencia no es válida, la app muestra una **pantalla de activación** con el ID de hardware y estas rutas; no hace falta usar solo el cuadro de diálogo del sistema.

En **desarrollo** (`npm run dev:electron`), solo se busca `license.lic` en la **raíz del repo** (`project/`).

## Flujo para vos (proveedor)

### 1) Generar el par de claves (una vez por producto / línea)

```bash
npm run license:gen-keys
```

- Crea `secrets/private.pem` (PKCS#8, **no versionar**, backup en lugar seguro).
- Crea/actualiza `electron/publicKey.pem` (SPKI, **sí puede versionarse**; es la que empaqueta la app).

Si ya existe `secrets/private.pem`, el script se niega a sobrescribir: borrálo solo si querés **rotar** claves (todas las licencias viejas dejarán de valer).

### 2) Recompilar Electron tras cambiar la pública

```bash
npm run build:electron
```

La clave pública se copia a `dist-electron/publicKey.pem` junto al bundle del proceso principal.

### 3) El cliente te envía su HWID

En la PC del cliente (con Node instalado, o usando tu build que muestre el HWID en el diálogo de error):

```bash
npm run license:hwid
```

O leé el ID del cuadro de error si arrancan sin licencia.

### 4) Firmar y entregar `license.lic`

```bash
npm run license:sign -- "HWID_QUE_TE_ENVIARON"
```

Por defecto escribe `license.lic` en la raíz del proyecto. Para otra ruta:

```bash
npm run license:sign -- "HWID" "C:\ruta\license.lic"
```

El archivo es JSON, por ejemplo:

```json
{
  "license": "<firma RSA-SHA256 en Base64>"
}
```

El cliente copia ese archivo a la carpeta del `.exe` o a `%APPDATA%\scoreboard-cestoball\`.

## Formato criptográfico

- **Firma:** `crypto.sign('sha256', Buffer.from(hwid, 'utf8'), privateKey)` (Node.js).
- **Verificación:** `crypto.verify` con la misma clave pública SPKI.
- **RSA 4096** al generar el par con `license:gen-keys`.

El mensaje firmado es **exactamente** el string del HWID en UTF-8. Cualquier diferencia (espacios, mayúsculas) invalida la licencia.

## Desarrollo sin licencia

Solo en modo **no empaquetado** podés omitir la validación:

```powershell
$env:SKIP_LICENSE_CHECK="1"; npm run dev:electron
```

En producción empaquetada esta variable **no** se recomienda documentar al cliente; la comprobación siempre aplica.

## Empaquetar el instalable (solo NSIS)

```bash
npm run pack
```

Salida típica en `release/`: instalador **NSIS** (`.exe` setup) para Windows x64. Tras instalar, el cliente puede colocar `license.lic` junto a `Scoreboard Cestoball.exe` o en `%APPDATA%\scoreboard-cestoball\` si no tiene permisos en la carpeta del programa.

## Seguridad y limitaciones (importante)

| Medida | Qué aporta |
|--------|------------|
| Firma RSA + HWID | Evita que un cliente copie carpeta + licencia a **otra** PC sin que vos firmes de nuevo. |
| Clave privada solo en tu máquina | Nadie puede generar licencias válidas sin ella. |
| `contextIsolation`, sin `nodeIntegration` en el renderer | Reduce superficie de ataque en la ventana web. |
| `asar` (por defecto) | Ofusca un poco el empaquetado; no es cifrado fuerte. |

| Límite | Realidad |
|--------|----------|
| Clave pública dentro del cliente | Un atacante avanzado puede parchear el binario para saltarse la verificación. Protegé el **valor** del producto también con legal (EULA) y canales de venta. |
| HWID puede cambiar | Cambios de hardware/OS extremos o ciertas VMs; ofrecé reemisión de licencia. |
| Sin firma de código Microsoft | Windows SmartScreen puede avisar al ejecutar el `.exe`. Para distribución seria, obtené **certificado Authenticode** y firmá el instalable (`electron-builder` + variable de entorno `CSC_LINK` / `CSC_KEY_PASSWORD` o configuración equivalente). |

### Endurecimiento opcional

- **Firma de código** (Windows / macOS) para el ejecutable e instalador.
- **Actualizaciones firmadas** (`electron-updater` con claves propias).
- Minimizar APIs en `preload` y no exponer secretos al renderer.
- Para máxima resistencia a parches, parte de la lógica crítica podría vivir en un **addon nativo** o validación remota (ya no sería 100 % offline).

## Archivos sensibles (no subir a git)

- `secrets/private.pem`
- Cualquier copia de claves de firma de código
- `license.lic` de clientes (opcional según tu política)

La clave pública `electron/publicKey.pem` **no** es secreta; debe coincidir con la privada con la que firmás las licencias.
