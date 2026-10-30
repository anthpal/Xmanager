import { Box, Skeleton } from '@mui/material';

export function LoadingGrid() {
  return (
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
      {Array.from({ length: 6 }).map((_, index) => (
        <Box key={index}>
          <Skeleton variant="rounded" sx={{ aspectRatio: '16 / 9', borderRadius: 3, height: 'auto' }} />
          <Skeleton width="70%" height={40} />
          <Skeleton width="45%" height={24} />
        </Box>
      ))}
    </Box>
  );
}
