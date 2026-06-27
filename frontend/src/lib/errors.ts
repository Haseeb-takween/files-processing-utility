export interface ApiErrorBody {
  message?: string;
  error?: string;
}

/** Pick the best human-readable string from a JSON error body. */
export function parseApiErrorBody(body: ApiErrorBody | null | undefined): string | undefined {
  return body?.message || body?.error;
}

/** Map HTTP status codes to user-friendly copy (Render cold start, timeouts, etc.). */
export function getFriendlyApiError(
  status: number,
  body?: ApiErrorBody | null
): string {
  const fromBody = parseApiErrorBody(body);

  // Prefer backend validation messages for client errors.
  if (fromBody && status >= 400 && status < 500 && status !== 401) {
    return fromBody;
  }

  switch (status) {
    case 401:
      return fromBody || 'Please sign in to continue.';
    case 502:
      return (
        fromBody ||
        'Could not reach the processing server. It may be restarting — please try again in a few seconds.'
      );
    case 503:
      return (
        fromBody ||
        'Our processing server is waking up. On free hosting this can take up to a minute after idle — please wait and try again.'
      );
    case 504:
      return (
        fromBody ||
        'This request timed out. The server may have been sleeping — please try again in a few seconds.'
      );
    case 500:
      return fromBody || 'Something went wrong on the server. Please try again.';
    default:
      return fromBody || 'Processing failed. Please try again.';
  }
}

/** Status codes worth retrying once (typical Render sleep / gateway issues). */
export function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

export const SERVER_WAKE_MESSAGE =
  'If this is your first request in a while, the server may need up to 60 seconds to wake up on free hosting.';
