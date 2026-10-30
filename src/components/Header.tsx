import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';

interface HeaderProps {
  versionLabel: string;
  online: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function Header({ versionLabel, online, refreshing, onRefresh }: HeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, md: 3 },
        px: { xs: 3, md: 6 },
        py: 3,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 62,
          height: 62,
          flex: '0 0 auto',
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #5b8cff, #8b5cf6)',
          boxShadow: '0 10px 30px rgba(91, 140, 255, 0.35)',
          fontSize: '2rem',
          fontWeight: 900,
          color: '#fff',
        }}
      >
        x
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h2" component="h1" sx={{ lineHeight: 1 }}>
          x TV
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Catálogo de aplicaciones
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Chip label={versionLabel} variant="outlined" />
        <Chip
          icon={online ? <WifiIcon /> : <WifiOffIcon />}
          label={online ? 'En línea' : 'Sin conexión'}
          color={online ? 'success' : 'warning'}
          variant="outlined"
        />
        <IconButton
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Actualizar catálogo"
          data-tv-focusable="true"
          sx={{
            width: 56,
            height: 56,
            border: '2px solid transparent',
            '&:focus': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
