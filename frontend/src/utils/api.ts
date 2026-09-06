/**
 * Utility module for API URL resolution, robust fetch fallbacks, and backend health checks.
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    return `${trimmed}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

/**
 * Normalizes endpoint paths by stripping redundant prefixes (e.g. `/api/v1`, domain names)
 * and ensuring a clean leading slash subpath like `/predict` or `/health`.
 */
export const normalizeSubpath = (path: string): string => {
  let cleaned = path.trim();
  // Strip protocol and host if full URL passed
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+/, '');
  // Strip repeated /api/v1 or /api prefixes
  cleaned = cleaned.replace(/^(\/api\/v1|\/api)+/i, '');
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  return cleaned;
};

/**
 * Robust API fetch wrapper.
 * First attempts relative fetch `/api/v1${subpath}`.
 * If relative fetch fails with network error or non-2xx HTTP status (e.g. 404, 502, 504),
 * automatically falls back to absolute `${getApiBaseUrl()}${subpath}`.
 */
export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const subpath = normalizeSubpath(path);
  const relativeUrl = `/api/v1${subpath}`;
  const baseUrl = getApiBaseUrl();
  const absoluteUrl = `${baseUrl}${subpath}`;

  let relativeRes: Response | null = null;
  try {
    relativeRes = await fetch(relativeUrl, options);
    if (relativeRes.ok) {
      return relativeRes;
    }
  } catch (_) {
    // Relative fetch failed due to network error (e.g. no proxy)
    relativeRes = null;
  }

  // Attempt absolute fetch
  try {
    const absRes = await fetch(absoluteUrl, options);
    if (absRes.ok) {
      return absRes;
    }
    // Return non-ok response if available (for JSON error extraction)
    return absRes;
  } catch (err: any) {
    // If relative returned a response (even non-200 like 404), return it as backup
    if (relativeRes) {
      return relativeRes;
    }
    throw new Error(`Backend server unreachable at ${absoluteUrl}. Please verify FastAPI is running on http://localhost:8000.`);
  }
};

export interface HealthCheckResult {
  isHealthy: boolean;
  statusText: string;
  data?: any;
  error?: string;
}

/**
 * Performs a health check against the backend.
 * Tries relative endpoint `/api/v1/health` first, falling back to absolute backend health URL.
 */
export const checkBackendHealth = async (): Promise<HealthCheckResult> => {
  try {
    let res: Response | null = null;
    
    // Try relative proxy route first
    try {
      res = await fetch('/api/v1/health');
    } catch (_) {
      res = null;
    }

    // If relative route failed or returned non-200 (e.g. 404 / 504)
    if (!res || !res.ok) {
      const baseUrl = getApiBaseUrl();
      res = await fetch(`${baseUrl}/health`).catch(() => null);
    }

    if (res && res.ok) {
      const data = await res.json();
      if (data && (data.status === 'HEALTHY' || data.status === 'ONLINE')) {
        return {
          isHealthy: true,
          statusText: 'ONLINE',
          data
        };
      }
    }

    return {
      isHealthy: false,
      statusText: 'OFFLINE',
      error: 'API Server returned non-200 status or invalid health response.'
    };
  } catch (err: any) {
    return {
      isHealthy: false,
      statusText: 'OFFLINE',
      error: err.message || 'API Server Disconnected.'
    };
  }
};
