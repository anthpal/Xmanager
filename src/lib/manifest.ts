import { Preferences } from '@capacitor/preferences';
import { getJson } from './http';
import { parseManifest } from './parseManifest';
import type { Manifest } from '../types/manifest';

const CACHE_KEY = 'xtv.manifest.v1';
const configuredUrl = (import.meta.env.VITE_MANIFEST_URL ?? '').trim();

/**
 * En desarrollo, si no hay URL configurada se usa el `store.json` local
 * (servido por Vite). En producción la variable es obligatoria.
 */
export const MANIFEST_URL = configuredUrl || (import.meta.env.DEV ? '/store.json' : '');
export const USING_LOCAL_FALLBACK = configuredUrl === '' && import.meta.env.DEV;

export interface CachedManifest {
  manifest: Manifest;
  fetchedAt: number;
}

function withCacheBuster(url: string): string {
  const parsed = new URL(url, window.location.href);
  parsed.searchParams.set('_', String(Date.now()));
  return parsed.toString();
}

export async function readCachedManifest(): Promise<CachedManifest | null> {
  try {
    const { value } = await Preferences.get({ key: CACHE_KEY });
    if (!value) return null;
    const parsed = JSON.parse(value) as CachedManifest;
    if (!parsed || typeof parsed !== 'object' || !parsed.manifest) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchManifest(): Promise<Manifest> {
  if (!MANIFEST_URL) {
    throw new Error('Falta configurar VITE_MANIFEST_URL con la URL pública de store.json.');
  }

  const raw = await getJson<unknown>(withCacheBuster(MANIFEST_URL), { timeoutMs: 12_000 });
  const manifest = parseManifest(raw);

  await Preferences.set({
    key: CACHE_KEY,
    value: JSON.stringify({ manifest, fetchedAt: Date.now() } satisfies CachedManifest),
  });

  return manifest;
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}
