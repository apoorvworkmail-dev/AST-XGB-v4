/**
 * Utility module for API URL resolution, robust fetch fallbacks, and backend health checks.
 * Supports Local Uvicorn backend (http://localhost:8000) & Deployed Render backend (https://ast-xgb-v4.onrender.com).
 */

export const PROD_BACKEND_URL = 'https://ast-xgb-v4.onrender.com/api/v1';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    return `${trimmed}/api/v1`;
  }

  // Detect local vs deployed production host dynamically
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return 'http://localhost:8000/api/v1';
    }
  }

  // Fallback to deployed production Render backend for Vercel/Netlify hosting
  return PROD_BACKEND_URL;
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
 * First attempts relative fetch `/api/v1${subpath}` (handled by Vite proxy or Vercel rewrites).
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
    // Relative fetch failed due to network error (e.g. static host without rewrite)
    relativeRes = null;
  }

  // Attempt absolute fetch to resolved backend base URL
  try {
    const absRes = await fetch(absoluteUrl, options);
    if (absRes.ok) {
      return absRes;
    }
    return absRes;
  } catch (err: any) {
    if (relativeRes) {
      return relativeRes;
    }
    const cleanErr = err?.message === 'Failed to fetch'
      ? `Backend server unreachable (${baseUrl}). If on Render free tier, server may be spinning up.`
      : (err?.message || 'Network fetch error.');
    throw new Error(cleanErr);
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
 * Includes retries to handle Render free-tier cold starts gracefully.
 */
export const checkBackendHealth = async (retries = 1): Promise<HealthCheckResult> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let res: Response | null = null;

      // Try relative proxy/rewrite route first
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
    } catch (_) {
      // Ignore intermediate attempt errors
    }

    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const baseUrl = getApiBaseUrl();
  return {
    isHealthy: false,
    statusText: 'OFFLINE',
    error: `API Server Disconnected (${baseUrl}). Ensure backend server is running.`
  };
};
