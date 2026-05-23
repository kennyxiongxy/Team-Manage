import { useSystemData } from './useSystemData';

export function useSystemDataOrFallback<T>(key: string, fallback: T): { data: T; loading: boolean; error: string | null } {
  const { data: sysData, loading, error } = useSystemData<T>(key);
  return {
    data: sysData ?? fallback,
    loading,
    error,
  };
}
