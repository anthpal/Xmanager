import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { DownloadProgress, IntegrityStatus } from '../lib/installer';
import type { InstallJob, InstallPhase } from '../hooks/useInstaller';
import { formatBytes } from '../lib/version';

interface InstallOverlayProps {
  open: boolean;
  phase: InstallPhase;
  job: InstallJob | null;
  progress: DownloadProgress | null;
  integrity: IntegrityStatus | null;
  error: string | null;
  onRetry: () => void;
  onClose?: () => void;
  onExit?: () => void;
}

const PHASE_MESSAGE: Record<InstallPhase, string> = {
  idle: '',
  downloading: 'Descargando el paquete de instalación…',
  verifying: 'Verificando la integridad del archivo…',
  installing: 'Abriendo el instalador de Android…',
  'awaiting-install': 'Esperando a que completes la instalación en pantalla.',
  done: 'Listo.',
  error: 'La instalación no se completó.',
};

export function InstallOverlay({
  open,
  phase,
  job,
  progress,
  integrity,
  error,
  onRetry,
  onClose,
  onExit,
}: InstallOverlayProps) {
  const name = job?.kind === 'self' ? 'x TV' : job?.app.name ?? 'la aplicación';
  const failed = phase === 'error';
  const verifying = phase === 'verifying';

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      aria-labelledby="install-dialog-title"
    >
      <DialogTitle id="install-dialog-title" sx={{ pb: 1 }}>
        {failed ? 'No se pudo instalar' : `Instalando ${name}`}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ alignItems: 'center', py: 2 }}>
          {failed ? (
            <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
          ) : phase === 'awaiting-install' ? (
            <SystemUpdateAltIcon color="primary" sx={{ fontSize: 64 }} />
          ) : (
            <CircularProgress size={64} />
          )}

          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            {failed ? error ?? PHASE_MESSAGE.error : PHASE_MESSAGE[phase]}
          </Typography>

          {phase === 'downloading' ? (
            <Box sx={{ width: '100%' }}>
              <LinearProgress
                variant={progress?.percent !== null && progress?.percent !== undefined ? 'determinate' : 'indeterminate'}
                value={progress?.percent ?? undefined}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {progress ? formatBytes(progress.bytes) : 'Iniciando…'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progress?.percent !== null && progress?.percent !== undefined
                    ? `${progress.percent}%`
                    : progress && progress.total > 0
                      ? formatBytes(progress.total)
                      : ''}
                </Typography>
              </Stack>
            </Box>
          ) : null}

          {verifying ? <LinearProgress sx={{ width: '100%', height: 10, borderRadius: 5 }} /> : null}

          {integrity ? (
            <Chip
              size="small"
              label={
                integrity === 'verified'
                  ? 'SHA-256 verificado'
                  : integrity === 'mismatch'
                    ? 'SHA-256 no coincide'
                    : 'Integridad no verificada (falta el plugin nativo)'
              }
              color={integrity === 'verified' ? 'success' : integrity === 'mismatch' ? 'error' : 'warning'}
              variant="outlined"
            />
          ) : null}

          {phase === 'awaiting-install' ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              El instalador de Android está abierto. Cuando termines, vuelve a x TV: se comprobará la
              versión automáticamente.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      {failed ? (
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={onRetry} variant="contained" data-tv-focusable="true" autoFocus>
            Reintentar
          </Button>
          {onClose ? (
            <Button onClick={onClose} data-tv-focusable="true">
              Cerrar
            </Button>
          ) : null}
          {onExit ? (
            <Button onClick={onExit} data-tv-focusable="true">
              Salir
            </Button>
          ) : null}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
