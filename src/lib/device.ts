import { App } from '@capacitor/app';

export interface DeviceAppInfo {
  name: string;
  id: string;
  version: string;
  /** versionCode de Android (build number). */
  build: number;
}

/**
 * Versión real de la app instalada. `App.getInfo().build` es el versionCode
 * con el que se compiló el APK, así que no hay que hardcodear nada.
 */
export async function getDeviceAppInfo(): Promise<DeviceAppInfo> {
  try {
    const info = await App.getInfo();
    const build = Number.parseInt(info.build, 10);
    return {
      name: info.name,
      id: info.id,
      version: info.version,
      build: Number.isFinite(build) ? build : 0,
    };
  } catch {
    // Desarrollo web: no hay app nativa.
    const build = Number.parseInt(import.meta.env.VITE_DEV_BUILD ?? '100', 10);
    return {
      name: 'x TV',
      id: 'com.anthpal.xtv',
      version: import.meta.env.VITE_DEV_VERSION ?? '1.0.0',
      build: Number.isFinite(build) ? build : 100,
    };
  }
}
