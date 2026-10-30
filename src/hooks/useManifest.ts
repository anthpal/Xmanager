import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError, fetchManifest, readCachedManifest } from '../lib/manifest';
import type { Manifest } from '../types/manifest';

export type ManifestSource = 'cache' | 'network';

export interface UseManifestResult {
  manifest: Manifest | null;
  source: ManifestSource | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchedAt: number | null;
  refresh: () => Promise<void>;
}

export function useManifest(): UseManifestResult {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [source, setSource] = useState<ManifestSource | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchManifest();
      if (!alive.current) return;
      setManifest(fresh);
      setSource('network');
      setFetchedAt(Date.now());
      setError(null);
    } catch (cause) {
      if (!alive.current) return;
      setError(describeError(cause));
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;

    void (async () => {
      const cached = await readCachedManifest();
      if (!alive.current) return;
      if (cached) {
        setManifest(cached.manifest);
        setSource('cache');
        setFetchedAt(cached.fetchedAt);
        setLoading(false);
      }
      await refresh();
    })();

    return () => {
      alive.current = false;
    };
  }, [refresh]);

  return { manifest, source, loading, refreshing, error, fetchedAt, refresh };
}
