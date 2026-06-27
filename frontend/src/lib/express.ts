export function getExpressApiUrl(): string {
  return process.env.EXPRESS_API_URL || 'http://localhost:5000';
}

/** Health ping — keep short so Render returns JSON before its ~30s gateway limit. */
export const EXPRESS_HEALTH_TIMEOUT_MS = 20_000;

/** PDF upload + processing — used after backend is confirmed awake. */
export const EXPRESS_PDF_TIMEOUT_MS = 90_000;

/** Default for JSON auth/usage routes. */
export const EXPRESS_FETCH_TIMEOUT_MS = 30_000;

export class ExpressFetchError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ExpressFetchError';
    this.statusCode = statusCode;
  }
}

export async function proxyJsonToExpress<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number }> {
  const response = await fetchExpress(path, options);
  const data = (await response.json()) as T;
  return { data, status: response.status };
}

/**
 * Fetch the Express API with a timeout. Converts network failures and
 * aborts into ExpressFetchError with appropriate status codes.
 */
export async function fetchExpress(
  path: string,
  options: RequestInit = {},
  timeoutMs = EXPRESS_FETCH_TIMEOUT_MS
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${getExpressApiUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ExpressFetchError(
        504,
        'This request timed out. The server may have been sleeping — please try again in a few seconds.'
      );
    }
    throw new ExpressFetchError(
      503,
      'Our processing server is waking up or unreachable. Please wait a moment and try again.'
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Ping Express /health to wake a sleeping Render backend before heavy work. */
export async function wakeExpressBackend(): Promise<void> {
  const response = await fetchExpress('/health', { method: 'GET' }, EXPRESS_HEALTH_TIMEOUT_MS);
  if (!response.ok) {
    throw new ExpressFetchError(
      503,
      'Our processing server is waking up. Please wait about a minute and try again.'
    );
  }
}
