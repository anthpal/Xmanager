import { useCallback, useEffect, useMemo, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import AppsIcon from '@mui/icons-material/Apps';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import { AppCard } from './components/AppCard';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { Header } from './components/Header';
import { InstallOverlay } from './components/InstallOverlay';
import { LoadingGrid } from './components/LoadingGrid';
import { UpdateDialog } from './components/UpdateDialog';
import { useInstaller } from './hooks/useInstaller';
import { useManifest } from './hooks/useManifest';
import { useTvNavigation } from './hooks/useTvNavigation';
import { getDeviceAppInfo, type DeviceAppInfo } from './lib/device';
import { canInstallApks } from './lib/installer';
import { MANIFEST_URL, USING_LOCAL_FALLBACK } from './lib/manifest';
import { getInstalledVersions, openInstalledApp } from './lib/native';
import { formatRelative, isOutdated } from './lib/version';
import type { CatalogApp } from './types/manifest';

export default function App() {
  const { manifest, source, loading, refreshing, error, fetchedAt, refresh } = useManifest();
  const [appInfo, setAppInfo] = useState<DeviceAppInfo | null>(null);
  const [installed, setInstalled] = useState<Record<string, number>>({});
  const [dismissedUpdate, setDismissedUpdate] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState(0);

  const installer = useInstaller();
  const ready = Boolean(manifest) && !loading;

  useTvNavigation(ready);

  useEffect(() => {
    let alive = true;
    void getDeviceAppInfo().then((info) => {
      if (alive) setAppInfo(info);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!manifest || manifest.apps.length === 0) {
      setInstalled({});
      return;
    }
    let alive = true;
    void getInstalledVersions(manifest.apps.map((app) => app.package)).then((versions) => {
      if (alive) setInstalled(versions);
    });
    return () => {
      alive = false;
    };
  }, [manifest]);

  useEffect(() => {
    if (fetchedAt) setLastCheck(fetchedAt);
  }, [fetchedAt]);

  // Refresco silencioso al volver a primer plano (como máximo cada 5 minutos).
  useEffect(() => {
    let handle: { remove: () => Promise<void> } | undefined;
    let disposed = false;

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive || disposed) return;
      if (Date.now() - lastCheck < 5 * 60_000) return;
      setLastCheck(Date.now());
      void refresh();
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [lastCheck, refresh]);

  useEffect(() => {
    if (installer.phase !== 'done') return;
    setToast('Instalador abierto. Completa la instalación en pantalla.');
    const timer = window.setTimeout(() => installer.reset(), 4000);
    return () => window.clearTimeout(timer);
  }, [installer.phase, installer.reset]);

  const update = useMemo(() => {
    if (!manifest || !appInfo) return null;
    const target = manifest.catalogApp;
    if (!isOutdated(target.versionCode, appInfo.build)) return null;
    return {
      target,
      required: target.mandatory || appInfo.build < target.minSupportedVersionCode,
    };
  }, [manifest, appInfo]);

  const showUpdateDialog =
    update !== null &&
    installer.phase === 'idle' &&
    (update.required || dismissedUpdate !== update.target.versionCode);

  const handleCatalogAction = useCallback(
    async (app: CatalogApp) => {
      const installedVersion = installed[app.package];

      if (installedVersion !== undefined && !isOutdated(app.versionCode, installedVersion)) {
        const opened = await openInstalledApp(app.package);
        if (!opened) setToast(`No se pudo abrir ${app.name}.`);
        return;
      }

      await installer.start({ kind: 'catalog', app });
    },
    [installed, installer],
  );

  const currentBuild = appInfo?.build ?? 0;
  const versionLabel = appInfo ? `v${appInfo.version} · build ${appInfo.build}` : 'v—';
  const online = source === 'network' && !error;
  const installing = installer.phase !== 'idle' && installer.phase !== 'done';
  const busyPackage =
    installer.job?.kind === 'catalog' &&
    (installer.phase === 'downloading' ||
      installer.phase === 'verifying' ||
      installer.phase === 'installing' ||
      installer.phase === 'awaiting-install')
      ? installer.job.app.package
      : null;

  const canCloseInstall =
    installer.job?.kind === 'catalog' || (update !== null && !update.required);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Header
        versionLabel={versionLabel}
        online={online}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
      />

      <Box component="main" sx={{ flex: 1, px: { xs: 3, md: 6 }, pb: 6 }}>
        {manifest && error ? (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            Sin conexión con el servidor ({error}). Se muestra el catálogo guardado.
          </Alert>
        ) : null}

        {USING_LOCAL_FALLBACK ? (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            Modo desarrollo: usando <code>/store.json</code> local. Configura{' '}
            <code>VITE_MANIFEST_URL</code> para producción.
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
          <AppsIcon color="primary" />
          <Typography variant="h2" component="h2">
            Aplicaciones
          </Typography>
          {manifest ? <Chip size="small" label={manifest.apps.length} variant="outlined" /> : null}
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Actualizado {formatRelative(fetchedAt)}
          </Typography>
        </Stack>

        {loading && !manifest ? <LoadingGrid /> : null}

        {!loading && !manifest ? (
          <ErrorState
            message={error ?? 'No se pudo cargar el catálogo.'}
            hint={
              MANIFEST_URL
                ? MANIFEST_URL
                : 'Configura VITE_MANIFEST_URL con la URL pública de tu store.json.'
            }
            onRetry={() => void refresh()}
          />
        ) : null}

        {manifest && manifest.apps.length === 0 ? <EmptyState /> : null}

        {manifest && manifest.apps.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
                xl: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {manifest.apps.map((app, index) => (
              <AppCard
                key={app.package}
                app={app}
                installedVersion={installed[app.package]}
                busy={busyPackage === app.package}
                autoFocus={index === 0}
                onAction={(selected) => void handleCatalogAction(selected)}
              />
            ))}
          </Box>
        ) : null}

        {!canInstallApks() ? (
          <Alert severity="info" sx={{ mt: 3, borderRadius: 3 }}>
            Estás en el navegador: la descarga y la instalación de APK solo funcionan en Android.
          </Alert>
        ) : null}
      </Box>

      <Divider />

      <Box
        component="footer"
        sx={{
          px: { xs: 3, md: 6 },
          py: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          x TV · {versionLabel}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '60%' }}>
          {MANIFEST_URL || 'sin manifiesto configurado'}
        </Typography>
      </Box>

      <UpdateDialog
        open={showUpdateDialog}
        currentBuild={currentBuild}
        target={update?.target ?? null}
        required={update?.required ?? false}
        busy={installing}
        onUpdate={() => {
          if (update) void installer.start({ kind: 'self', target: update.target });
        }}
        onDismiss={() => {
          if (update) setDismissedUpdate(update.target.versionCode);
        }}
      />

      <InstallOverlay
        open={installer.phase !== 'idle' && installer.phase !== 'done'}
        phase={installer.phase}
        job={installer.job}
        progress={installer.progress}
        integrity={installer.integrity}
        error={installer.error}
        onRetry={installer.retry}
        onClose={canCloseInstall ? installer.reset : undefined}
        onExit={
          canCloseInstall
            ? undefined
            : () => {
                void CapacitorApp.exitApp();
              }
        }
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
