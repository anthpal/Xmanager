/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública del manifiesto (store.json). Obligatoria en producción. */
  readonly VITE_MANIFEST_URL?: string;
  /** Solo desarrollo: versionCode simulado. */
  readonly VITE_DEV_BUILD?: string;
  /** Solo desarrollo: versionName simulado. */
  readonly VITE_DEV_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
