import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

interface ErrorStateProps {
  message: string;
  hint?: string;
  onRetry: () => void;
}

export function ErrorState({ message, hint, onRetry }: ErrorStateProps) {
  return (
    <Paper variant="outlined" sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h3">No se pudo cargar el catálogo</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          {message}
        </Typography>
        {hint ? (
          <Box
            component="code"
            sx={{
              display: 'block',
              maxWidth: '100%',
              overflowWrap: 'anywhere',
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
            }}
          >
            {hint}
          </Box>
        ) : null}
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRetry} data-tv-focusable="true">
          Reintentar
        </Button>
      </Stack>
    </Paper>
  );
}
