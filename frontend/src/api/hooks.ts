import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './client';

export function useApi<T>(endpoint: string | null) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApi = useCallback(async () => {
    if (!endpoint) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient<T>(endpoint);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchApi();
  }, [fetchApi]);

  return { data, loading, error, mutate: fetchApi, setData };
}
