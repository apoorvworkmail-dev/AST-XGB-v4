/**
 * Utility module for API URL resolution, robust fetch fallbacks, and backend health checks.
 * Supports:
 *   - Local dev: Vite proxy at /api/v1 -> http://localhost:8000/api/v1
 *   - Production (Vercel): Direct HTTPS fetch to Render backend https://ast-xgb-v4.onrender.com/api/v1
 */

export const PROD_BACKEND_URL = 'https://ast-xgb-v4.onrender.com/api/v1';

/**
 * Returns true when running on localhost (dev server with Vite proxy).
 */
const isLocalDev = (): boolean => {
  if (typeof window !== 'undefined' && window.location) {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
  }
  return false;
};

/**
 * Resolves the absolute backend API base URL.
 *   - If VITE_API_URL env var is set and starts with https://, use it directly.
 *   - On localhost, use http://localhost:8000/api/v1 (Vite proxy handles it anyway).
 *   - On any deployed host (Vercel, Netlify, etc.), use the Render HTTPS URL.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // Ensure it ends with /api/v1
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  }

  if (isLocalDev()) {
    return 'http://localhost:8000/api/v1';
  }

  return PROD_BACKEND_URL;
};

/**
 * Strips redundant /api/v1 prefixes and protocol+host from a path,
 * returning a clean subpath like `/predict` or `/health`.
 */
export const normalizeSubpath = (path: string): string => {
  let cleaned = path.trim();
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+/, '');
  cleaned = cleaned.replace(/^(\/api\/v1|\/api)+/i, '');
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  return cleaned;
};

/**
 * Robust API fetch wrapper with environment-aware routing:
 *
 *   LOCAL DEV  → tries relative `/api/v1/...` first (Vite proxy), falls back to absolute.
 *   PRODUCTION → goes directly to absolute HTTPS backend URL (no relative call that would 404).
 */
export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const subpath = normalizeSubpath(path);
  const baseUrl = getApiBaseUrl();
  const absoluteUrl = `${baseUrl}${subpath}`;

  // On local dev, try the Vite proxy first (relative URL)
  if (isLocalDev()) {
    const relativeUrl = `/api/v1${subpath}`;
    try {
      const relRes = await fetch(relativeUrl, options);
      if (relRes.ok) return relRes;
    } catch (_) {
      // Vite proxy unavailable — fall through to absolute
    }
  }

  // Primary production path: direct HTTPS fetch to Render backend
  try {
    const res = await fetch(absoluteUrl, options);
    return res; // return even non-ok so callers can read error JSON
  } catch (err: any) {
    const msg = err?.message === 'Failed to fetch'
      ? `Backend unreachable at ${baseUrl}. If on Render free tier, the server may be waking up — please retry in 30 seconds.`
      : (err?.message || 'Network error reaching backend.');
    throw new Error(msg);
  }
};

export interface HealthCheckResult {
  isHealthy: boolean;
  statusText: string;
  data?: any;
  error?: string;
}

/**
 * Health check with retry to handle Render free-tier cold starts (up to ~30s wake-up).
 */
export const checkBackendHealth = async (retries = 2): Promise<HealthCheckResult> => {
  const baseUrl = getApiBaseUrl();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let res: Response | null = null;

      // On local dev, try relative first
      if (isLocalDev()) {
        try {
          res = await fetch('/api/v1/health');
          if (res && res.ok) {
            const data = await res.json();
            if (data?.status === 'HEALTHY' || data?.status === 'ONLINE') {
              return { isHealthy: true, statusText: 'ONLINE', data };
            }
          }
        } catch (_) {
          res = null;
        }
      }

      // Direct HTTPS call to backend
      res = await fetch(`${baseUrl}/health`);
      if (res && res.ok) {
        const data = await res.json();
        if (data?.status === 'HEALTHY' || data?.status === 'ONLINE') {
          return { isHealthy: true, statusText: 'ONLINE', data };
        }
      }
    } catch (_) {
      // Retry on failure
    }

    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  return {
    isHealthy: false,
    statusText: 'OFFLINE',
    error: `Backend server at ${baseUrl} is not responding. It may be starting up — please retry in a moment.`
  };
};
