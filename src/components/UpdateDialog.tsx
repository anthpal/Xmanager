import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { CatalogUpdate } from '../types/manifest';
import { formatBytes } from '../lib/version';

interface UpdateDialogProps {
  open: boolean;
  currentBuild: number;
  target: CatalogUpdate | null;
  required: boolean;
  busy: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateDialog({
  open,
  currentBuild,
  target,
  required,
  busy,
  onUpdate,
  onDismiss,
}: UpdateDialogProps) {
  if (!target) return null;

  return (
    <Dialog
      open={open}
      onClose={required ? undefined : onDismiss}
      maxWidth="sm"
      fullWidth
      aria-labelledby="update-dialog-title"
    >
      <DialogTitle id="update-dialog-title" sx={{ pb: 1 }}>
        {required ? 'Actualización obligatoria' : 'Actualización disponible'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5}>
          <Typography variant="body1" color="text.secondary">
            Hay una nueva versión de <strong>x TV</strong> lista para instalar.
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={`build ${currentBuild}`} variant="outlined" />
            <Typography aria-hidden>→</Typography>
            <Chip
              label={`v${target.versionName} (build ${target.versionCode})`}
              color="primary"
            />
          </Stack>

          {target.changelog ? (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {target.changelog}
              </Typography>
            </Box>
          ) : null}

          {target.sizeBytes ? (
            <Typography variant="body2" color="text.secondary">
              Descarga: {formatBytes(target.sizeBytes)}
            </Typography>
          ) : null}

          <Typography variant="body2" color="text.secondary">
            Se descargará el APK y se abrirá el instalador de Android. Tendrás que confirmar la
            instalación en pantalla.
          </Typography>

          {required ? (
            <Alert severity="warning">
              Esta actualización es obligatoria para seguir usando la aplicación.
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {!required ? (
          <Button onClick={onDismiss} disabled={busy} data-tv-focusable="true">
            Ahora no
          </Button>
        ) : null}
        <Button
          variant="contained"
          onClick={onUpdate}
          disabled={busy}
          data-tv-focusable="true"
          autoFocus
        >
          Descargar e instalar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
