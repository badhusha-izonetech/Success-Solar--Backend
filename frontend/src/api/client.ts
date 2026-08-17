function toCamel(o: any): any {
  if (o instanceof Date) return o;
  if (Array.isArray(o)) {
    return o.map(toCamel);
  } else if (o !== null && typeof o === 'object') {
    return Object.keys(o).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      result[camelKey] = toCamel(o[key]);
      return result;
    }, {} as any);
  }
  return o;
}

function toSnake(o: any): any {
  if (o instanceof Date) return o;
  if (Array.isArray(o)) {
    return o.map(toSnake);
  } else if (o !== null && typeof o === 'object') {
    return Object.keys(o).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(o[key]);
      return result;
    }, {} as any);
  }
  return o;
}

const TOKEN_KEY = 'ssc-erp-token-v2';
const REFRESH_KEY = 'ssc-erp-refresh-v2';

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('ssc-erp-employee-v2');
  localStorage.removeItem('ssc-erp-portal-v2');
  window.location.href = '/login';
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.access_token;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    if (options.body && typeof options.body === 'string') {
      try {
        const parsed = JSON.parse(options.body);
        options.body = JSON.stringify(toSnake(parsed));
      } catch (e) {
        // Not a JSON string, leave it alone
      }
    }
  } else {
    headers.delete('Content-Type');
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      // Retry the original request with the new token
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (!(options.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      const retryResponse = await fetch(`${baseUrl}${endpoint}`, { ...options, headers: retryHeaders });
      if (retryResponse.status === 401) { clearSession(); throw new Error('Unauthorized'); }
      if (!retryResponse.ok) {
        const errorBody = await retryResponse.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'API request failed');
      }
      const text = await retryResponse.text();
      if (!text) return null as unknown as T;
      const json = JSON.parse(text);
      const result = toCamel(json);
      if (result && typeof result === 'object' && Array.isArray(result.items) && 'total' in result && 'page' in result) {
        return result.items as unknown as T;
      }
      return result;
    }
    clearSession();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'API request failed');
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return null as unknown as T;
  
  try {
    const json = JSON.parse(text);
    const result = toCamel(json);
    if (result && typeof result === 'object' && Array.isArray(result.items) && 'total' in result && 'page' in result) {
      return result.items as unknown as T;
    }
    return result;
  } catch (err) {
    return text as unknown as T;
  }
}
