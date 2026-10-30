# Plugin nativo opcional: `XtvUpdater`

La app funciona sin este plugin. Si lo instalas ganas:

| Función | Sin plugin | Con plugin |
|---|---|---|
| Descarga con progreso | Sí (`@capacitor/filesystem`) | Sí |
| Verificar SHA-256 del APK | No (se marca "no verificada") | Sí |
| Detectar apps instaladas y su versión | No (siempre "Instalar") | Sí |
| Abrir una app instalada | No | Sí |

La instalación **siempre** la confirma el usuario en el instalador de Android.
Este plugin no instala nada por su cuenta.

## Instalación

1. Genera la plataforma Android (una sola vez):

   ```bash
   npm run android:add
   ```

2. Copia los archivos Java:

   ```bash
   cp native/android/XtvUpdaterPlugin.java \
      android/app/src/main/java/com/anthpal/xtv/
   cp native/android/MainActivity.java \
      android/app/src/main/java/com/anthpal/xtv/
   ```

   > Ajusta el paquete `com.anthpal.xtv` si cambiaste `appId` en
   > `capacitor.config.ts`.

3. Comprueba que `MainActivity` registra el plugin **antes** de
   `super.onCreate()` (el archivo copiado ya lo hace).

4. Añade los permisos y `<queries>` de
   `native/android/AndroidManifest.additions.xml` a
   `android/app/src/main/AndroidManifest.xml`.

5. Asegúrate de que
   `android/app/src/main/res/xml/file_paths.xml` incluye:

   ```xml
   <cache-path name="my_cache_files" path="." />
   ```

   (Capacitor ya lo incluye por defecto; si no, usa el archivo de ejemplo.)

6. Sincroniza y compila:

   ```bash
   npm run cap:sync
   npm run apk:debug
   ```

## Cómo comprobar que está activo

En la app, al descargar una actualización, el overlay debe mostrar
**"SHA-256 verificado"** cuando `store.json` tenga un `sha256` válido, y las
tarjetas de apps ya instaladas deben mostrar **"Abrir"** en lugar de
"Instalar".

Si ves **"Integridad no verificada (falta el plugin nativo)"**, el plugin no
está registrado o el `sha256` del manifiesto está vacío.

## Nota sobre seguridad

Verificar el SHA-256 detecta descargas corruptas o manipuladas en tránsito,
pero la confianza última está en el manifiesto. Si quieres defensa en
profundidad, firma el JSON (Ed25519) y valida la firma con una clave pública
embebida en la app antes de descargar cualquier APK.
