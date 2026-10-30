# x TV

Catálogo de aplicaciones para Android TV con actualizaciones controladas desde
un manifiesto JSON (`store.json`). Construido con **React + TypeScript +
Material UI + Capacitor**.

La app comprueba el manifiesto al arrancar, muestra el catálogo, permite
instalar/actualizar apps y, si hay una versión nueva de x TV, descarga el APK y
abre el instalador de Android. **La instalación siempre la confirma el
usuario**: no hay instalación silenciosa ni root.

---

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| React + TypeScript | 19 / 5.9 | UI |
| Material UI | 9 | Componentes y tema 10-foot |
| Vite | 7 | Build web |
| Capacitor | 7 | Empaquetado Android (Node 20+) |
| `@capacitor/filesystem` | 7 | Descarga del APK a `Cache` con progreso |
| `@capacitor/preferences` | 7 | Caché offline del manifiesto |
| `@capawesome-team/capacitor-file-opener` | 7 | Abrir el instalador de Android |
| Plugin nativo opcional | — | SHA-256, apps instaladas, abrir apps |

> ¿Por qué Capacitor y no Tauri? Todo el código es TypeScript y la lógica de
> `src/lib` no depende de React ni de Capacitor, así que se puede reutilizar en
> otra shell (Tauri incluido). Capacitor ya trae Filesystem/Preferences y el
> flujo de FileProvider que necesita el instalador de APK.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env      # ajusta VITE_MANIFEST_URL
npm run dev               # http://localhost:5173
```

En el navegador se puede revisar todo el catálogo y el diálogo de
actualización. La descarga e instalación de APK solo funcionan en Android.

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_MANIFEST_URL` | Sí en producción | URL `https` del `store.json` |
| `VITE_DEV_BUILD` | No | `versionCode` simulado en desarrollo (100 por defecto) |
| `VITE_DEV_VERSION` | No | `versionName` simulado en desarrollo |

En desarrollo, si no defines `VITE_MANIFEST_URL`, se usa el
`public/store.json` incluido. Ese archivo declara `version_code: 101`, así que
verás el diálogo de actualización con la app "instalada" en build 100. Baja ese
valor a `100` si quieres arrancar sin el diálogo.

---

## `store.json`

Es el único archivo que cambias para publicar. Se sirve por HTTPS (mejor desde
un CDN con soporte de `Range` para reanudar descargas).

```json
{
  "schema": 2,
  "generated_at": "2026-10-30T18:00:00Z",
  "catalog_app": {
    "package": "com.anthpal.xtv",
    "version_code": 102,
    "version_name": "1.0.2",
    "min_supported_version_code": 100,
    "apk_url": "https://cdn.tusitio.com/xtv/xtv-1.0.2-universal.apk",
    "sha256": "9f2c...",
    "size_bytes": 15234567,
    "changelog": "Mejoras de rendimiento y nuevos botones.",
    "mandatory": true
  },
  "apps": [
    {
      "package": "com.anthpal.videopro",
      "name": "Reproductor de Video Pro",
      "version_code": 310,
      "version_name": "3.1.0",
      "icon": "https://cdn.tusitio.com/icons/video.webp",
      "apk_url": "https://cdn.tusitio.com/apps/video-pro-3.1.0.apk",
      "sha256": "1a2b...",
      "size_bytes": 24120320,
      "min_sdk": 21,
      "category": "Video",
      "order": 10,
      "featured": true
    }
  ],
  "policy": {
    "rollout_percent": 100,
    "kill_switch": false
  }
}
```

### Reglas

- `version_code` es un **entero creciente**. Es lo que compara Android; nunca
  compares `version_name`.
- `apk_url` debe ser **https** y apuntar a un archivo **inmutable**
  (`...-1.0.2.apk`, no `latest.apk`). Los iconos pueden ser rutas locales
  (`/icons/video.svg`).
- `mandatory: true` o `version_code actual < min_supported_version_code`
  bloquean la app hasta actualizar.
- `sha256` es opcional, pero sin él la UI muestra "integridad no verificada".
- `order` controla el orden de la rejilla; `featured` pinta la etiqueta
  "Destacada".
- El manifiesto se valida al cargar (`src/lib/parseManifest.ts`). Un campo mal
  escrito no rompe la app: se descarta el manifiesto nuevo y se mantiene el
  cacheado.

---

## Flujo de actualización

1. La app arranca y **pinta el catálogo cacheado** de inmediato.
2. En paralelo pide el manifiesto con `Cache-Control: no-cache` y timeout de
   12 s (`CapacitorHttp` en Android, `fetch` en web).
3. Compara `catalog_app.version_code` con su propio `versionCode`
   (`App.getInfo().build`, sin hardcodear nada).
4. Si hay versión nueva:
   - **Opcional** → diálogo con "Descargar e instalar" / "Ahora no".
   - **Obligatoria** → diálogo bloqueante sin opción de cerrar.
5. Descarga el APK en `Directory.Cache` mostrando progreso real
   (evento `progress` de Filesystem).
6. Verifica `sha256`/tamaño si el plugin nativo está presente.
7. Abre el instalador de Android (`FileOpener` + FileProvider).
8. Al volver del instalador se recompone la versión:
   - coincide → listo;
   - no coincide → "instalación cancelada", con reintento.
9. Sin red: se muestra el catálogo cacheado y un aviso, nunca una pantalla en
   blanco.

---

## Mando a distancia (D-pad)

- Flechas: navegación espacial por geometría real de los elementos.
- OK/Enter: activa la tarjeta o el botón enfocado.
- Atrás: cierra diálogos; en la raíz, sale de la app.
- La navegación se limita al diálogo abierto para que el foco no se escape al
  fondo.
- Los estilos de foco escalan la tarjeta y pintan borde azul, pensados para
  verse a 3 metros.

---

## Compilar el APK

Requisitos de Capacitor 7: **JDK 21**, Android SDK 35 y Android Studio reciente.
`npm run apk:debug` necesita `ANDROID_HOME` configurado.

```bash
npm run build
npx cap add android      # una sola vez
npm run cap:sync

cd android
./gradlew assembleDebug       # android/app/build/outputs/apk/debug/
# o
./gradlew assembleRelease     # requiere firma
```

Checklist de release:

1. Sube `versionCode` y `versionName` en `android/app/build.gradle` (deben
   coincidir con `catalog_app` del manifiesto).
2. Firma con la **misma keystore siempre**. Si la pierdes, no podrás
   actualizar: habrá que desinstalar y reinstalar.
3. Genera un **APK universal** (no AAB, no splits): los TV boxes usan
   arm64/armeabi-v7a/x86 y el AAB no se instala a mano.
4. Publica el APK con nombre versionado y calcula su SHA-256:
   `sha256sum xtv-1.0.2.apk`.
5. Actualiza `store.json` (URL, `version_code`, `sha256`, `size_bytes`).
6. Si quieres despliegue gradual, baja `policy.rollout_percent`.

Para Android TV conviene añadir al manifiesto:

```xml
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
```

y el permiso `REQUEST_INSTALL_PACKAGES`. Todo está en
`native/android/AndroidManifest.additions.xml`.

En el dispositivo hay que conceder **"Instalar apps desconocidas"** a x TV la
primera vez (Ajustes → Apps → x TV → Instalar apps desconocidas).

---

## Estructura

```
src/
  App.tsx                 orquestación (catálogo, update, instalador)
  theme.ts                tema MUI 10-foot
  types/manifest.ts       modelo + formato wire
  lib/
    http.ts               GET JSON nativo (CapacitorHttp) / web
    manifest.ts           fetch + caché en Preferences + cache-busting
    parseManifest.ts      validación estricta del JSON
    device.ts             versión real de la app
    native.ts             puente al plugin XtvUpdater (opcional)
    installer.ts          descarga, SHA-256, FileOpener
    version.ts            formato de bytes/fechas y comparación
  hooks/
    useManifest.ts        caché primero, red después
    useInstaller.ts       máquina de estados de descarga/instalación
    useTvNavigation.ts    navegación espacial D-pad
  components/             Header, AppCard, UpdateDialog, InstallOverlay, ...
public/
  store.json              manifiesto de desarrollo
  icons/*.svg
native/android/           plugin opcional + snippets de manifiesto
```

---

## Decisiones y límites

- **Sin instalación silenciosa.** Android exige confirmación salvo que la app
  sea *device owner* o app de sistema. Este proyecto asume sideload.
- **Google Play**: descargar y ejecutar actualizaciones fuera de Play va contra
  la política *Device and Network Abuse*. Este flujo es para distribución
  propia (TV boxes, Fire TV por ADB, etc.).
- **El plugin nativo es opcional**; sin él todo funciona salvo la verificación
  de hash y la detección de apps instaladas. Ver `native/README.md`.
- **`kill_switch` y `rollout_percent`** se validan y quedan disponibles en el
  modelo, pero la UI todavía no los aplica (siguiente paso natural).
- **La caché del manifiesto** vive en `Preferences`; el APK, en `Cache` (el
  sistema puede limpiarlo, y está bien: se vuelve a descargar).

### Siguientes pasos recomendados

1. Aplicar `kill_switch`/`rollout_percent` con un id de dispositivo estable.
2. Telemetría mínima: `{device_id, from, to, result}`.
3. OTA de bundle web (Capgo auto-hospedado) para cambios de UI sin instalar
   APK.
4. Firma del manifiesto con Ed25519 y clave pública embebida.
5. Separar un "launcher/updater" mínimo del catálogo, para que una actualización
   fallida nunca deje la TV sin app funcional.
