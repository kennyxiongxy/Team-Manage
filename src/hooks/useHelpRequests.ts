import { useState, useEffect, useCallback } from 'react';
import { getHelpRequests, createHelpRequest, updateHelpRequest } from '@/api/client';

export interface HelpRequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  taskId: string | null;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

function mapBackendHelpRequest(h: any): HelpRequestItem {
  return {
    id: h.id,
    employeeId: h.employee_id,
    employeeName: h.employee_name || '未知',
    employeeAvatar: h.employee_avatar || '',
    taskId: h.task_id || null,
    reason: h.reason,
    status: h.status,
    createdAt: h.created_at,
  };
}

export function useHelpRequestsApi() {
  const [helpRequests, setHelpRequests] = useState<HelpRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    getHelpRequests()
      .then((res) => {
        if (res.success) {
          const items = (res.data as any[]).map(mapBackendHelpRequest);
          setHelpRequests(items);
        } else {
          setError('加载求助失败');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addHelpRequest = async (body: any) => {
    const res = await createHelpRequest(body);
    if (res.success) {
      setHelpRequests((prev) => [mapBackendHelpRequest(res.data), ...prev]);
    }
    return res;
  };

  const resolveHelpRequest = async (id: string) => {
    const res = await updateHelpRequest(id, { status: 'resolved' });
    if (res.success) {
      setHelpRequests((prev) => prev.map((h) => (h.id === id ? mapBackendHelpRequest(res.data) : h)));
    }
    return res;
  };

  const pendingCount = helpRequests.filter((h) => h.status === 'pending').length;

  return { helpRequests, loading, error, refetch: fetch, addHelpRequest, resolveHelpRequest, pendingCount };
}
