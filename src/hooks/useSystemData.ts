import { useEffect, useState, useCallback } from 'react';
import { api } from '@/api/client';

interface UseSystemDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemData<T = any>(key: string): UseSystemDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<{ success: boolean; data: T }>(`/api/system-data/${key}`)
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError('数据不存在');
        }
      })
      .catch((err) => setError(err.message || '网络错误'))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => {
    fetch();
  }, [key, fetch]);

  return { data, loading, error, refetch: fetch };
}
