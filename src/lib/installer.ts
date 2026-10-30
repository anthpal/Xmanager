import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { XtvUpdater } from './native';

export const APK_MIME = 'application/vnd.android.package-archive';

export interface DownloadProgress {
  bytes: number;
  total: number;
  /** `null` cuando el servidor no informa Content-Length. */
  percent: number | null;
}

export interface DownloadedApk {
  /** Ruta absoluta informada por el sistema de archivos (para el hash). */
  path: string | null;
  /** URI que puede abrir el instalador. */
  uri: string;
}

export type IntegrityStatus = 'verified' | 'unverified' | 'mismatch';

export function canInstallApks(): boolean {
  return Capacitor.isNativePlatform();
}

export async function downloadApk(options: {
  url: string;
  fileName: string;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<DownloadedApk> {
  if (!canInstallApks()) {
    throw new Error('La instalación de APK solo está disponible en Android.');
  }

  const { url, fileName, onProgress } = options;

  const listener = await Filesystem.addListener('progress', (status) => {
    if (status.url !== url) return;
    const total = status.contentLength > 0 ? status.contentLength : 0;
    onProgress?.({
      bytes: status.bytes,
      total,
      percent: total > 0 ? Math.min(99, Math.round((status.bytes / total) * 100)) : null,
    });
  });

  let downloadedPath: string | null = null;
  try {
    const result = await Filesystem.downloadFile({
      url,
      path: fileName,
      directory: Directory.Cache,
      progress: true,
      recursive: true,
      connectTimeout: 15_000,
      readTimeout: 120_000,
    });
    downloadedPath = result.path ?? null;
  } finally {
    await listener.remove();
  }

  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

  return { path: downloadedPath, uri };
}

const normalizeHash = (value: string): string =>
  value.trim().toLowerCase().replace(/^sha256:/, '');

/**
 * Verifica el APK descargado. Requiere el plugin nativo `XtvUpdater`
 * (MessageDigest en Java); sin él devuelve `unverified` y la instalación
 * continúa (se avisa en la UI).
 */
export async function verifyApk(path: string | null, expected?: string): Promise<IntegrityStatus> {
  if (!expected || !path) return 'unverified';
  try {
    const { sha256 } = await XtvUpdater.getFileSha256({ path });
    return normalizeHash(sha256) === normalizeHash(expected) ? 'verified' : 'mismatch';
  } catch {
    return 'unverified';
  }
}

export async function launchInstaller(uri: string): Promise<void> {
  if (!canInstallApks()) {
    throw new Error('La instalación de APK solo está disponible en Android.');
  }
  await FileOpener.openFile({ path: uri, mimeType: APK_MIME });
}

export async function removeDownloadedApk(fileName: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
  } catch {
    // El archivo pudo desaparecer o el SO limpió la caché: no es un error real.
  }
}
