import { useState } from 'react';
import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import type { CatalogApp } from '../types/manifest';
import { formatBytes, isOutdated } from '../lib/version';

interface AppCardProps {
  app: CatalogApp;
  installedVersion?: number;
  busy: boolean;
  autoFocus?: boolean;
  onAction: (app: CatalogApp) => void;
}

export function AppCard({ app, installedVersion, busy, autoFocus, onAction }: AppCardProps) {
  const [brokenIcon, setBrokenIcon] = useState(false);
  const [focused, setFocused] = useState(false);

  const isInstalled = installedVersion !== undefined;
  const needsUpdate = isInstalled && isOutdated(app.versionCode, installedVersion);
  const actionLabel = !isInstalled ? 'Instalar' : needsUpdate ? 'Actualizar' : 'Abrir';

  const activate = () => {
    if (!busy) onAction(app);
  };

  return (
    <Card
      data-tv-focusable="true"
      data-tv-autofocus={autoFocus ? 'true' : undefined}
      role="button"
      tabIndex={0}
      aria-label={`${app.name}. ${actionLabel}`}
      aria-busy={busy}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      sx={{
        cursor: busy ? 'progress' : 'pointer',
        opacity: busy ? 0.65 : 1,
        outline: 'none',
        border: '2px solid',
        // Estado de foco controlado en React: en TV el foco es programático y
        // el selector :focus no siempre pinta de forma fiable.
        borderColor: focused ? 'primary.main' : 'divider',
        transform: focused ? 'scale(1.04)' : 'none',
        boxShadow: focused ? '0 18px 48px rgba(91, 140, 255, 0.35)' : 'none',
        zIndex: focused ? 3 : 0,
        transition: 'transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 9',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1b2233, #0f1420)',
        }}
      >
        {app.icon && !brokenIcon ? (
          <Box
            component="img"
            src={app.icon}
            alt=""
            loading="lazy"
            onError={() => setBrokenIcon(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="h1" sx={{ color: 'primary.main', opacity: 0.8 }}>
            {app.name.charAt(0).toUpperCase()}
          </Typography>
        )}

        {app.featured ? (
          <Chip
            size="small"
            label="Destacada"
            color="secondary"
            sx={{ position: 'absolute', top: 12, left: 12 }}
          />
        ) : null}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h3" noWrap title={app.name}>
            {app.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            v{app.versionName} · {formatBytes(app.sizeBytes)}
            {app.category ? ` · ${app.category}` : ''}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Chip
            label={actionLabel}
            color={needsUpdate ? 'secondary' : isInstalled ? 'success' : 'primary'}
            variant={isInstalled && !needsUpdate ? 'outlined' : 'filled'}
            sx={{ height: 38, px: 1, fontSize: '1rem', fontWeight: 700 }}
          />
          {isInstalled ? (
            <Typography variant="caption" color="text.secondary">
              Instalada (build {installedVersion})
            </Typography>
          ) : null}
        </Stack>

        {busy ? <LinearProgress sx={{ mt: 2, borderRadius: 2 }} /> : null}
      </CardContent>
    </Card>
  );
}
