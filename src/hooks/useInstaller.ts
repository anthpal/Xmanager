import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import type { CatalogApp, CatalogUpdate } from '../types/manifest';
import {
  type DownloadProgress,
  type IntegrityStatus,
  downloadApk,
  launchInstaller,
  removeDownloadedApk,
  verifyApk,
} from '../lib/installer';
import { getDeviceAppInfo } from '../lib/device';

export type InstallPhase =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'awaiting-install'
  | 'done'
  | 'error';

export type InstallJob =
  | { kind: 'self'; target: CatalogUpdate }
  | { kind: 'catalog'; app: CatalogApp };

export interface InstallerState {
  job: InstallJob | null;
  phase: InstallPhase;
  progress: DownloadProgress | null;
  integrity: IntegrityStatus | null;
  error: string | null;
  start: (job: InstallJob) => Promise<void>;
  retry: () => void;
  reset: () => void;
}

function fileNameFor(job: InstallJob, versionCode: number): string {
  const prefix = job.kind === 'self' ? 'xtv-self' : job.app.package.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}-${versionCode}.apk`;
}

export function useInstaller(): InstallerState {
  const [job, setJob] = useState<InstallJob | null>(null);
  const [phase, setPhase] = useState<InstallPhase>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastJob = useRef<InstallJob | null>(null);
  const pending = useRef<InstallJob | null>(null);

  const start = useCallback(async (next: InstallJob) => {
    const target = next.kind === 'self' ? next.target : next.app;

    setJob(next);
    setPhase('downloading');
    setProgress(null);
    setIntegrity(null);
    setError(null);
    lastJob.current = next;

    const fileName = fileNameFor(next, target.versionCode);

    try {
      const { path, uri } = await downloadApk({
        url: target.apkUrl,
        fileName,
        onProgress: setProgress,
      });

      setPhase('verifying');
      const result = await verifyApk(path, target.sha256);
      setIntegrity(result);

      if (result === 'mismatch') {
        throw new Error(
          'El archivo descargado no coincide con el SHA-256 publicado. Se canceló la instalación por seguridad.',
        );
      }

      setPhase('installing');
      pending.current = next;
      await launchInstaller(uri);
      setPhase('awaiting-install');
    } catch (cause) {
      setPhase('error');
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la instalación.');
    }
  }, []);

  const retry = useCallback(() => {
    const previous = lastJob.current;
    if (previous) void start(previous);
  }, [start]);

  const reset = useCallback(() => {
    pending.current = null;
    setJob(null);
    setPhase('idle');
    setProgress(null);
    setIntegrity(null);
    setError(null);
  }, []);

  // Al volver del instalador comprobamos si el APK se aplicó de verdad.
  useEffect(() => {
    if (phase !== 'awaiting-install' || !pending.current) return;

    let handle: PluginListenerHandle | undefined;
    let disposed = false;

    void App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive || disposed) return;

      const current = pending.current;
      if (!current) return;

      if (current.kind === 'self') {
        const info = await getDeviceAppInfo();
        if (info.build >= current.target.versionCode) {
          pending.current = null;
          setPhase('done');
          setProgress(null);
          void removeDownloadedApk(fileNameFor(current, current.target.versionCode));
        } else {
          setPhase('error');
          setError('La instalación se canceló o no se completó. Puedes reintentarlo.');
        }
      } else {
        pending.current = null;
        setPhase('done');
      }
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [phase]);

  return { job, phase, progress, integrity, error, start, retry, reset };
}
