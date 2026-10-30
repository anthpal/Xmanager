import type { CatalogApp, CatalogUpdate, Manifest } from '../types/manifest';

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestError';
  }
}

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fail = (path: string, message: string): never => {
  throw new ManifestError(`${path}: ${message}`);
};

const asText = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return fail(path, 'se esperaba un texto no vacío');
  }
  return value.trim();
};

const optionalText = (value: unknown, path: string): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return asText(value, path);
};

const asNumber = (value: unknown, path: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fail(path, 'se esperaba un número');
  }
  return value;
};

const optionalNumber = (value: unknown, path: string): number | undefined => {
  if (value === undefined || value === null) return undefined;
  return asNumber(value, path);
};

const optionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

const asPackage = (value: unknown, path: string): string => {
  const pkg = asText(value, path);
  if (!PACKAGE_RE.test(pkg)) return fail(path, `"${pkg}" no es un package name válido`);
  return pkg;
};

const asAssetUrl = (value: unknown, path: string): string => {
  const raw = asText(value, path);
  if (raw.startsWith('/')) return raw; // recurso empaquetado en la app
  if (!/^https:\/\//i.test(raw)) return fail(path, 'debe ser una URL https');
  return raw;
};

const asVersionCode = (value: unknown, path: string): number => {
  const code = asNumber(value, path);
  if (!Number.isInteger(code) || code <= 0) {
    return fail(path, 'debe ser un entero mayor que 0');
  }
  return code;
};

function parseUpdate(raw: unknown, path: string): CatalogUpdate {
  if (!isRecord(raw)) return fail(path, 'se esperaba un objeto');

  const result: CatalogUpdate = {
    package: asPackage(raw.package, `${path}.package`),
    versionCode: asVersionCode(raw.version_code, `${path}.version_code`),
    versionName: asText(raw.version_name, `${path}.version_name`),
    minSupportedVersionCode:
      optionalNumber(raw.min_supported_version_code, `${path}.min_supported_version_code`) ?? 0,
    apkUrl: asAssetUrl(raw.apk_url, `${path}.apk_url`),
    sha256: optionalText(raw.sha256, `${path}.sha256`),
    sizeBytes: optionalNumber(raw.size_bytes, `${path}.size_bytes`),
    changelog: optionalText(raw.changelog, `${path}.changelog`),
    mandatory: optionalBoolean(raw.mandatory) ?? false,
  };

  if (result.minSupportedVersionCode > result.versionCode) {
    fail(`${path}.min_supported_version_code`, 'no puede ser mayor que version_code');
  }

  return result;
}

function parseApp(raw: unknown, path: string): CatalogApp {
  if (!isRecord(raw)) return fail(path, 'se esperaba un objeto');

  return {
    package: asPackage(raw.package, `${path}.package`),
    name: asText(raw.name, `${path}.name`),
    versionCode: asVersionCode(raw.version_code, `${path}.version_code`),
    versionName: asText(raw.version_name, `${path}.version_name`),
    icon: raw.icon === undefined ? undefined : asAssetUrl(raw.icon, `${path}.icon`),
    apkUrl: asAssetUrl(raw.apk_url, `${path}.apk_url`),
    sha256: optionalText(raw.sha256, `${path}.sha256`),
    sizeBytes: optionalNumber(raw.size_bytes, `${path}.size_bytes`),
    minSdk: optionalNumber(raw.min_sdk, `${path}.min_sdk`),
    category: optionalText(raw.category, `${path}.category`),
    order: optionalNumber(raw.order, `${path}.order`),
    featured: optionalBoolean(raw.featured),
    changelog: optionalText(raw.changelog, `${path}.changelog`),
  };
}

export function parseManifest(raw: unknown): Manifest {
  if (!isRecord(raw)) return fail('manifest', 'se esperaba un objeto JSON');

  const schema = optionalNumber(raw.schema, 'manifest.schema') ?? 1;
  if (schema < 2) return fail('manifest.schema', 'se requiere schema >= 2');

  if (!isRecord(raw.catalog_app)) return fail('manifest.catalog_app', 'falta el objeto catalog_app');
  if (!Array.isArray(raw.apps)) return fail('manifest.apps', 'se esperaba un array');

  const apps = raw.apps.map((item, index) => parseApp(item, `apps[${index}]`));

  const seen = new Set<string>();
  for (const app of apps) {
    if (seen.has(app.package)) {
      return fail('manifest.apps', `package duplicado: ${app.package}`);
    }
    seen.add(app.package);
  }

  apps.sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000) || a.name.localeCompare(b.name, 'es'));

  const policy = isRecord(raw.policy) ? raw.policy : {};
  const rollout = optionalNumber(policy.rollout_percent, 'policy.rollout_percent') ?? 100;

  return {
    schema,
    generatedAt: optionalText(raw.generated_at, 'manifest.generated_at') ?? '',
    catalogApp: parseUpdate(raw.catalog_app, 'catalog_app'),
    apps,
    policy: {
      rolloutPercent: Math.min(100, Math.max(0, Math.round(rollout))),
      killSwitch: optionalBoolean(policy.kill_switch) ?? false,
    },
  };
}
