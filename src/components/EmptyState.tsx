import AppsIcon from '@mui/icons-material/Apps';
import { Paper, Stack, Typography } from '@mui/material';

export function EmptyState() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 6, borderRadius: 4, textAlign: 'center', borderStyle: 'dashed' }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <AppsIcon color="primary" sx={{ fontSize: 56 }} />
        <Typography variant="h3">Todavía no hay aplicaciones</Typography>
        <Typography variant="body1" color="text.secondary">
          Publica tu primer APK en <code>store.json</code> y aparecerá aquí.
        </Typography>
      </Stack>
    </Paper>
  );
}
