/**
 * Modelo normalizado (camelCase) que consume la aplicación.
 * El manifiesto remoto usa snake_case; la conversión y validación viven en
 * `src/lib/parseManifest.ts`.
 */

export interface CatalogUpdate {
  package: string;
  versionCode: number;
  versionName: string;
  /** Versión mínima que puede seguir funcionando sin actualizar. */
  minSupportedVersionCode: number;
  apkUrl: string;
  sha256?: string;
  sizeBytes?: number;
  changelog?: string;
  mandatory: boolean;
}

export interface CatalogApp {
  package: string;
  name: string;
  versionCode: number;
  versionName: string;
  icon?: string;
  apkUrl: string;
  sha256?: string;
  sizeBytes?: number;
  minSdk?: number;
  category?: string;
  order?: number;
  featured?: boolean;
  changelog?: string;
}

export interface ManifestPolicy {
  rolloutPercent: number;
  killSwitch: boolean;
}

export interface Manifest {
  schema: number;
  generatedAt: string;
  catalogApp: CatalogUpdate;
  apps: CatalogApp[];
  policy: ManifestPolicy;
}

/* ------------------------------------------------------------------ */
/* Formato "wire" (lo que se publica en store.json)                    */
/* ------------------------------------------------------------------ */

export interface RawCatalogUpdate {
  package: string;
  version_code: number;
  version_name: string;
  min_supported_version_code?: number;
  apk_url: string;
  sha256?: string;
  size_bytes?: number;
  changelog?: string;
  mandatory?: boolean;
}

export interface RawCatalogApp {
  package: string;
  name: string;
  version_code: number;
  version_name: string;
  icon?: string;
  apk_url: string;
  sha256?: string;
  size_bytes?: number;
  min_sdk?: number;
  category?: string;
  order?: number;
  featured?: boolean;
  changelog?: string;
}

export interface RawManifest {
  schema: number;
  generated_at?: string;
  catalog_app: RawCatalogUpdate;
  apps: RawCatalogApp[];
  policy?: {
    rollout_percent?: number;
    kill_switch?: boolean;
  };
}
