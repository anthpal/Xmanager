import { Capacitor, CapacitorHttp } from '@capacitor/core';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface GetJsonOptions {
  timeoutMs?: number;
}

/**
 * GET JSON con dos caminos:
 * - Android/iOS: `CapacitorHttp` (pila nativa, sin CORS ni caché del WebView).
 * - Web (desarrollo): `fetch` con `no-store` y timeout.
 */
export async function getJson<T>(url: string, options: GetJsonOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const headers = { 'Cache-Control': 'no-cache', Pragma: 'no-cache' };

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url,
      headers,
      connectTimeout: Math.min(timeoutMs, 8_000),
      readTimeout: timeoutMs,
      responseType: 'json',
    });

    if (response.status < 200 || response.status >= 300) {
      throw new HttpError(`El servidor respondió ${response.status}`, response.status);
    }
    if (response.data !== null && typeof response.data === 'object') {
      return response.data as T;
    }
    try {
      return JSON.parse(String(response.data)) as T;
    } catch {
      throw new HttpError('El servidor devolvió una respuesta que no es JSON');
    }
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers,
    });
    if (!response.ok) {
      throw new HttpError(`El servidor respondió ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new HttpError('Tiempo de espera agotado');
    }
    throw new HttpError('No se pudo conectar con el servidor');
  } finally {
    window.clearTimeout(timer);
  }
}
