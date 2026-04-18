# Guía para el administrador / proveedor — Scoreboard Pro

Esta guía describe el **ciclo completo** para preparar el producto, generar licencias, empaquetar el instalador Windows (NSIS) y acompañar al usuario final. Está alineada con el código del repositorio (Electron + `electron-builder` + licencia por HWID y firma RSA).

**Audiencia:** quien desarrolla, construye el instalador y emite licencias (no el usuario final).

---

## 1. Panorama del flujo

```text
[Una vez] Generar par de claves RSA → guardar privada en secreto → publicar app con publicKey.pem
     ��
[Por cada cliente] Cliente envía HWID → vos firmás HWID → entregás license.lic
     ��
Cliente instala NSIS → coloca license.lic → abre app → Reintentar si hace falta
```

---

## 2. Requisitos en tu máquina de trabajo

- **Node.js** (recomendado LTS 20 o 22; 64 bits).
- **npm** (incluido con Node).
- Código del proyecto en la carpeta `project/` (raíz donde está `package.json`).
- Para generar el instalador: espacio en disco y permisos para ejecutar `electron-builder` (descarga herramientas de empaquetado la primera vez).

Comandos siempre desde la carpeta del proyecto:

```bash
cd project
npm install
```

---

## 3. Pasos previos (solo la primera vez por línea de producto)

### 3.1 Generar el par de claves RSA

Una sola vez por producto (o al rotar claves, lo que **invalida** todas las licencias anteriores):

```bash
npm run license:gen-keys
```

**Resultado:**

- `secrets/private.pem` — **clave privada**. No versionar, no enviar a clientes. Backup en lugar seguro (cifrado, gestor de secretos, etc.).
- `electron/publicKey.pem` — **clave pública**. Se copia al build de Electron y va **dentro** del instalador; puede versionarse en un repo privado.

Si el script avisa que ya existe `secrets/private.pem`, no sobrescribe. Para rotar claves, borrá ese archivo **solo** si entendés que todas las licencias viejas dejarán de servir.

### 3.2 Recompilar el proceso principal de Electron

Cada vez que cambies `electron/publicKey.pem`:

```bash
npm run build:electron
```

### 3.3 Comprobar en desarrollo

- Con licencia de prueba en la raíz del repo: `license.lic` (ver sección 5).
- Sin licencia: debería mostrarse la pantalla de activación con HWID.
- Para saltar la verificación **solo en desarrollo** (nunca documentar al cliente):

 ```powershell
  $env:SKIP_LICENSE_CHECK="1"; npm run dev:electron
  ```

---

## 4. Construir el instalador para distribución (NSIS)

El proyecto está configurado para generar **solo** instalador **NSIS** (Windows x64).

```bash
npm run pack
```

**Salida típica:** carpeta `project/release/` con el `.exe` del instalador y metadatos de `electron-builder`.

**Antes de empaquetar**, asegurate de:

1. Tener la **versión** deseada en `package.json` (`version`).
2. Tener `electron/publicKey.pem` correcto para la línea de producto.
3. Haber ejecutado al menos una vez `npm run build:electron` recientemente (el script `pack` ya incluye build de Vite y Electron).

**Prueba local sin instalador completo (carpeta desempaquetada):**

```bash
npm run pack:dir
```

Útil para depurar; el usuario final recibirá el NSIS.

### 4.1 Firma de código (recomendado en producción)

Windows puede mostrar advertencias (SmartScreen) si el `.exe` no está firmado con un certificado **Authenticode** de confianza. Para distribución seria:

- Obtené un certificado de firma de código.
- Configurá `electron-builder` / variables de entorno (`CSC_LINK`, `CSC_KEY_PASSWORD`, etc.) según la documentación oficial de `electron-builder`.

Esto no sustituye el sistema de `license.lic`; suma confianza en el instalador.

---

## 5. Emitir una licencia para un cliente

### 5.1 Obtener el HWID del cliente

El cliente puede:

- Verlo en la pantalla **Activación requerida** y usar **Copiar**, o
- Si tenés acceso remoto con Node en el mismo proyecto: `npm run license:hwid` en **su** PC (mismo método que usa la app).

El HWID debe ser el string **exacto** (sin espacios de más ni cortes).

### 5.2 Firmar y generar `license.lic`

En **tu** máquina, con `secrets/private.pem` correspondiente a la `publicKey.pem` del build que le diste al cliente:

```bash
npm run license:sign -- "PEGAR_HWID_DEL_CLIENTE_AQUI"
```

Por defecto crea `license.lic` en la raíz del proyecto. Para otra ruta:

```bash
npm run license:sign -- "HWID" "C:\ruta\salida\license.lic"
```

**Entregá al cliente** solo el archivo `license.lic` (nunca la clave privada).

### 5.3 Coherencia clave pública / privada

- Cada instalador que generes incluye la **publicKey** que había en `electron/publicKey.pem` al hacer `pack`.
- Las licencias firmadas con otra **privada** o un par distinto **no** validarán.

Si rotás claves: nuevo `gen-keys`, nuevo `build:electron`, nuevo `pack`, y **nuevas** licencias para todos los clientes que usen ese build.

---

## 6. Qué debe hacer el cliente después (resumen operativo)

1. Instalar con el `.exe` NSIS que le enviás.
2. Copiar `license.lic` a:
   - carpeta de `Scoreboard Pro.exe`, **o**
   - `%APPDATA%\scoreboard-pro\license.lic`
3. Abrir la aplicación; si ve la pantalla de activación, pulsar **Reintentar** tras colocar el archivo.

Material para el cliente:

- Guía larga: **`docs/GUIA-USUARIO.md`**
- **Una página** (email o PDF): **`docs/RESUMEN-CLIENTE.md`** o **`docs/RESUMEN-CLIENTE.html`** (HTML → imprimir a PDF desde el navegador).

---

## 7. Validación y pruebas antes de entregar al cliente

Checklist sugerido:

| Paso | Acción |
|------|--------|
| 1 | Instalar el mismo build NSIS en una VM o PC limpia. |
| 2 | Sin `license.lic`: debe aparecer pantalla de activación con HWID. |
| 3 | `npm run license:sign` con ese HWID; colocar `license.lic` en una ruta válida. |
| 4 | **Reintentar** o reiniciar app: debe entrar al panel sin bloqueo. |
| 5 | Copiar la carpeta instalada a **otra** VM: la misma `license.lic` **no** debe validar (HWID distinto). |
| 6 | Probar `?view=scoreboard` tras activar, si usan segunda pantalla. |

---

## 8. Después de la entrega (soporte)

- **Cambio de PC:** nuevo HWID → nueva firma → nuevo `license.lic`.
- **Reinstalación en la misma PC:** suele mantenerse el HWID; la misma licencia puede servir si no cambió hardware crítico ni el ID que expone `node-machine-id`.
- **Pérdida de `license.lic`:** podés volver a generar el mismo archivo si guardás el HWID y usás la misma privada.
- **Pérdida de `private.pem`:** no podés generar licencias válidas para builds ya emitidos; tendrías que rotar par, nuevo instalador y re-licenciar.

---

## 9. Referencias en el repo

| Documento | Contenido |
|-----------|-----------|
| `docs/GUIA-USUARIO.md` | Instalación y uso para el cliente. |
| `docs/LICENSE-SETUP.md` | Detalle técnico PEM, rutas, límites de seguridad, NSIS. |
| `package.json` → `scripts` | `license:gen-keys`, `license:sign`, `license:hwid`, `pack`, `dev:electron`. |

---

## 10. Orden típico “de cero a cliente” (checklist)

1. `npm install`
2. `npm run license:gen-keys` (una vez por producto)
3. Desarrollo / pruebas con `npm run dev:electron` y `license.lic` de prueba
4. `npm run pack` → entregar instalador desde `release/`
5. Cliente instala y te envía HWID (pantalla de activación)
6. `npm run license:sign -- "<HWID>"` → enviar `license.lic`
7. Cliente coloca archivo y pulsa **Reintentar**
8. Opcional: documentar versión y fecha de build para soporte

Con esto tenés cubiertos los pasos **anteriores** (claves, build, empaquetado), **durante** (emisión de licencia) y **posteriores** (instalación del usuario y revalidación) para el funcionamiento correcto del programa.
