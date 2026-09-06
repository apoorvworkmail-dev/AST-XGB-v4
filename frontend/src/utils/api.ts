/**
 * Utility module for API URL resolution, robust fetch fallbacks, and backend health checks.
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:8000/api/v1';
};

/**
 * Robust API fetch wrapper.
 * First attempts relative fetch `/api/v1${path}`.
 * If that throws a network error or returns a non-2xx HTTP status (e.g. 404, 502, 504),
 * automatically falls back to absolute `getApiBaseUrl()${path}`.
 */
export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const relativeUrl = `/api/v1${normalizedPath}`;
  const absoluteUrl = `${getApiBaseUrl()}${normalizedPath}`;

  try {
    const res = await fetch(relativeUrl, options);
    // Check if relative fetch succeeded with 2xx HTTP status
    if (res.ok) {
      return res;
    }
  } catch (_) {
    // Network error on relative fetch (e.g., host unreachable)
  }

  // Fallback to direct absolute URL (http://localhost:8000/api/v1...)
  return fetch(absoluteUrl, options);
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
