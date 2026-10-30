export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Tamaño no disponible';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

export function formatRelative(timestamp: number | null): string {
  if (!timestamp) return 'nunca';
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

/** Una actualización solo existe si el versionCode remoto es mayor. */
export function isOutdated(targetVersionCode: number, currentVersionCode: number): boolean {
  return targetVersionCode > currentVersionCode;
}
