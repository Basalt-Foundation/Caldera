/** All browser requests go through the Next.js rewrite proxy at /api/node
 *  to avoid CORS issues with the Basalt node. */
const API_BASE = '/api/node';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with jitter: 500ms, 1s, 2s + random 0-250ms
      const delay =
        INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1) +
        Math.random() * 250;
      await sleep(delay);
    }

    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });

    if (res.status === 429 && attempt < MAX_RETRIES) {
      // Rate limited — retry after backoff
      const retryAfter = res.headers.get('Retry-After');
      if (retryAfter) {
        const retryMs = parseInt(retryAfter, 10) * 1000;
        if (!isNaN(retryMs) && retryMs > 0) {
          await sleep(Math.min(retryMs, 10_000));
        }
      }
      lastError = new ApiError(429, 'Rate limited');
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new ApiError(res.status, text);
    }

    return res.json();
  }

  throw lastError ?? new ApiError(429, 'Rate limited after retries');
}

export { request, ApiError, API_BASE };
