'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ApiResponse } from '../shared/types/index.js';

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.get<T>(endpoint);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (endpoint: string, payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiClient.post<T>(endpoint, payload);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, get, post };
}
