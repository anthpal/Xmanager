import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Plugin nativo opcional (`native/android/XtvUpdaterPlugin.java`).
 *
 * Sin él la app sigue funcionando:
 * - la verificación SHA-256 se marca como "no verificada",
 * - no se pueden detectar apps instaladas (siempre se muestra "Instalar").
 */
export interface XtvUpdaterPlugin {
  getFileSha256(options: { path: string }): Promise<{ sha256: string }>;
  getInstalledVersions(options: { packages: string[] }): Promise<{ versions: Record<string, number> }>;
  openApp(options: { package: string }): Promise<void>;
}

export const XtvUpdater = registerPlugin<XtvUpdaterPlugin>('XtvUpdater');

const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

export async function getInstalledVersions(packages: string[]): Promise<Record<string, number>> {
  if (!isAndroid() || packages.length === 0) return {};
  try {
    const { versions } = await XtvUpdater.getInstalledVersions({ packages });
    return versions ?? {};
  } catch {
    return {};
  }
}

export async function openInstalledApp(packageName: string): Promise<boolean> {
  if (!isAndroid()) return false;
  try {
    await XtvUpdater.openApp({ package: packageName });
    return true;
  } catch {
    return false;
  }
}
