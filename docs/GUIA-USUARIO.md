# Guía para el usuario — Scoreboard Pro

**Versión corta (correo / imprimir):** [RESUMEN-CLIENTE.md](RESUMEN-CLIENTE.md) · [RESUMEN-CLIENTE.html](RESUMEN-CLIENTE.html) (abrir en el navegador y usar *Imprimir → Guardar como PDF*).

Esta guía está pensada para quien **instala y usa** la aplicación en una computadora con Windows. No requiere conocimientos de programación.

---

## 1. Requisitos

- **Sistema operativo:** Windows de64 bits (x64).
- **Permisos:** poder instalar programas (o que un administrador lo haga por vos).
- **Archivo de licencia:** `license.lic` que te entrega el proveedor o administrador, **generado para esta PC** (no sirve copiar la licencia de otra máquina).

---

## 2. Antes de instalar

1. Cerrá otras versiones de Scoreboard Pro si las hubiera.
2. Tené a mano el instalador que te enviaron (archivo `.exe` del tipo instalador NSIS).
3. Tené el archivo **`license.lic`** listo (por correo, pendrive, etc.). Podés copiarlo **después** de instalar; no es obligatorio tenerlo antes del instalador.

---

## 3. Instalar el programa

1. Hacé doble clic en el **instalador** de Scoreboard Pro.
2. Si Windows muestra **SmartScreen** o “Windows protegió tu PC”, es habitual en software no firmado aún con certificado comercial. Solo podés continuar si confiás en el origen del instalador.
3. Seguí el asistente:
   - Elegí la carpeta de instalación si el asistente lo permite.
   - Completá los pasos hasta el final.
4. Opcional: dejá marcada la opción de crear acceso directo en el escritorio o menú Inicio, si aparece.

Al terminar, el programa suele quedar en una carpeta similar a:

`C:\Program Files\Scoreboard Pro\`

(el nombre exacto puede variar según lo que elegiste al instalar).

---

## 4. Primera ejecución y licencia

### 4.1 Si la app abre directamente

Si ya colocaste `license.lic` en el lugar correcto **antes** del primer arranque (ver sección 5), deberías ver el **panel de control** sin pasos extra.

### 4.2 Si aparece la pantalla “Activación requerida”

Significa que la app **no encontró** una licencia válida para esta computadora.

En esa pantalla vas a ver:

- Un mensaje explicando el problema.
- Tu **ID de hardware** (texto largo o un GUID).
- Botón **Copiar** para copiar ese ID y enviárselo por correo o chat a quien te vendió el producto.
- La lista de **carpetas** donde el programa busca el archivo `license.lic`.

**Qué hacer:**

1. Copiá el **ID de hardware** y enviáselo al proveedor para que te genere el archivo `license.lic` correcto.
2. Cuando te envíen `license.lic`, guardalo en **una** de las rutas que muestra la pantalla (ver sección 5).
3. Volvé a la app y pulsá **Reintentar**.
4. Si la licencia es válida para esta PC, la pantalla de activación desaparecerá y podrás usar el programa.
5. Si querés cerrar sin activar, pulsá **Salir**.

---

## 5. Dónde colocar `license.lic`

El programa busca el archivo en este **orden**:

1. **Misma carpeta que el ejecutable**  
   Donde esté `Scoreboard Pro.exe` (por ejemplo la carpeta de instalación bajo `Program Files\Scoreboard Pro\`).  
   **Nota:** en algunas instalaciones esta carpeta es de **solo lectura** para usuarios normales. Si no podés pegar el archivo ahí, usá la opción 2.

2. **Carpeta de datos de la aplicación**  
   `C:\Users\<tu_usuario>\AppData\Roaming\scoreboard-pro\license.lic`  
   (La carpeta `AppData` suele estar oculta: en el Explorador podés escribir `%APPDATA%\scoreboard-pro` en la barra de direcciones y pulsar Enter.)

Solo necesitás **un** archivo `license.lic` en **una** de esas ubicaciones.

---

## 6. Uso habitual del programa

### Panel de control

Al abrir Scoreboard Pro (sin `?view=scoreboard` en la dirección) se muestra el **panel de control** para operar tiempo, goles, equipos, etc.

### Pantalla de marcador (segunda pantalla o proyector)

Para mostrar solo el marcador en otra ventana o monitor:

1. Abrí de nuevo Scoreboard Pro (o una segunda ventana, según cómo lo configures).
2. En la barra de direcciones interna o el enlace que uses, agregá al final de la URL:  
   `?view=scoreboard`   Ejemplo conceptual: si la app abre en una página interna, la variante “marcador” es la misma aplicación con ese parámetro.

En la práctica, el proveedor puede darte un **acceso directo** que ya lleve `?view=scoreboard` para el operador de la mesa o la cabina.

Los datos del partido se sincronizan entre panel y marcador cuando usás la misma instalación y el almacenamiento local del navegador/Electron (según diseño del producto).

---

## 7. Después de instalar (recomendaciones)

- **Copias de seguridad:** si cambiás de PC, necesitarás una **nueva licencia** para el nuevo ID de hardware. Conservá el contacto del proveedor.
- **Actualizaciones:** si te envían un instalador nuevo, instalá encima o según las instrucciones del proveedor. Comprobá si debés conservar tu `license.lic` en la misma ruta.
- **Antivirus:** falsos positivos son poco frecuentes pero posibles; si el programa deja de abrir tras una actualización del antivirus, informá al proveedor.

---

## 8. Problemas frecuentes

| Situación | Qué probar |
|-----------|------------|
| “Activación requerida” después de pegar la licencia | Confirmá que el archivo se llama exactamente `license.lic`, que está en una de las rutas indicadas y que la licencia fue hecha **para este** ID de hardware. Pulsá **Reintentar**. |
| No puedo guardar `license.lic` junto al `.exe` | Usá `%APPDATA%\scoreboard-pro\license.lic`. |
| Cambié de disco o reinstalé Windows | El ID de hardware puede cambiar; pedí una licencia nueva al proveedor. |
| La app no abre | Reinstalá con el instalador oficial; si persiste, contactá al proveedor con capturas de pantalla o mensaje de error. |

---

## 9. Documentación técnica adicional

Para detalles de licencias y criptografía (referencia del proveedor), existe también `docs/LICENSE-SETUP.md` en el proyecto de desarrollo.
