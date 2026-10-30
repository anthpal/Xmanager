package com.anthpal.xtv;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Plugin nativo opcional para x TV.
 *
 * Expone tres cosas que el WebView no puede hacer por sí solo:
 *  - SHA-256 real del APK descargado (verificación de integridad).
 *  - Versiones instaladas de los paquetes del catálogo.
 *  - Abrir una app instalada por package name.
 *
 * La instalación del APK NO se hace aquí: se delega en el instalador de
 * Android mediante @capawesome-team/capacitor-file-opener, de modo que el
 * usuario siempre confirma la instalación.
 */
@CapacitorPlugin(name = "XtvUpdater")
public class XtvUpdaterPlugin extends Plugin {

    @PluginMethod
    public void getFileSha256(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.trim().isEmpty()) {
            call.reject("Falta el parámetro path");
            return;
        }

        File file = resolveFile(path);
        if (file == null || !file.exists() || !file.isFile()) {
            call.reject("No se encontró el archivo: " + path);
            return;
        }

        try (InputStream input = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }

            StringBuilder hex = new StringBuilder();
            for (byte value : digest.digest()) {
                hex.append(String.format(Locale.US, "%02x", value));
            }

            JSObject result = new JSObject();
            result.put("sha256", hex.toString());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("No se pudo calcular el SHA-256", exception);
        }
    }

    @PluginMethod
    public void getInstalledVersions(PluginCall call) {
        JSArray packages = call.getArray("packages");
        JSObject versions = new JSObject();

        if (packages != null) {
            PackageManager manager = getContext().getPackageManager();
            for (int index = 0; index < packages.length(); index++) {
                try {
                    String packageName = packages.getString(index);
                    PackageInfo info = manager.getPackageInfo(packageName, 0);
                    long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                        ? info.getLongVersionCode()
                        : (long) info.versionCode;
                    versions.put(packageName, versionCode);
                } catch (Exception ignored) {
                    // El paquete no está instalado: simplemente no se incluye.
                }
            }
        }

        JSObject result = new JSObject();
        result.put("versions", versions);
        call.resolve(result);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String packageName = call.getString("package");
        if (packageName == null || packageName.trim().isEmpty()) {
            call.reject("Falta el parámetro package");
            return;
        }

        Intent intent = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
        if (intent == null) {
            call.reject("La aplicación no está instalada: " + packageName);
            return;
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private File resolveFile(String rawPath) {
        if (rawPath.startsWith("file://")) {
            String decoded = Uri.parse(rawPath).getPath();
            return decoded == null ? null : new File(decoded);
        }
        if (rawPath.startsWith("content://")) {
            return null; // El hash se calcula sobre file:// del cache de la app.
        }
        return new File(rawPath);
    }
}
