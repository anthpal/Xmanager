import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5b8cff', light: '#8fb0ff', dark: '#3b6ae0', contrastText: '#05070c' },
    secondary: { main: '#ffb020' },
    success: { main: '#35d07f' },
    warning: { main: '#ffb020' },
    error: { main: '#ff5a6a' },
    background: { default: '#080a0f', paper: '#11151f' },
    text: { primary: '#f4f6fb', secondary: '#9aa5b8' },
    divider: 'rgba(255, 255, 255, 0.10)',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Roboto", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: { fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 },
    h2: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.35rem', fontWeight: 700 },
    body1: { fontSize: '1.05rem' },
    body2: { fontSize: '0.95rem' },
    button: { fontSize: '1rem', fontWeight: 700, textTransform: 'none' },
    caption: { fontSize: '0.8rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { fontSize: '18px', backgroundColor: '#080a0f' },
        body: {
          minHeight: '100vh',
          backgroundImage:
            'radial-gradient(1200px 600px at 12% -10%, rgba(91, 140, 255, 0.18), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(255, 176, 32, 0.10), transparent 55%)',
          backgroundAttachment: 'fixed',
          overflowX: 'hidden',
        },
        '*:focus-visible': { outline: '3px solid #5b8cff', outlineOffset: 3 },
        '::-webkit-scrollbar': { width: 10 },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 56,
          borderRadius: 14,
          paddingInline: 26,
          '&:focus': { outline: '3px solid #8fb0ff', outlineOffset: 2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: '#11151f' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 24, padding: 8 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});
