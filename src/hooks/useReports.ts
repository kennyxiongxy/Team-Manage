import { useState, useEffect, useCallback } from 'react';
import { getReports, createReport, updateReport } from '@/api/client';

export interface ReportItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  date: string;
  completedTasks: string[];
  tomorrowPlan: string[];
  blockers: string | null;
  supportNeeded: string | null;
}

function mapBackendReport(r: any): ReportItem {
  let completed: string[] = [];
  let tomorrow: string[] = [];
  try {
    completed = JSON.parse(r.completed_tasks || '[]');
  } catch {}
  try {
    tomorrow = JSON.parse(r.tomorrow_plan || '[]');
  } catch {}
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employee_name || '未知',
    employeeAvatar: r.employee_avatar || '',
    date: r.date,
    completedTasks: completed,
    tomorrowPlan: tomorrow,
    blockers: r.blockers,
    supportNeeded: r.support_needed,
  };
}

export function useReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    getReports()
      .then((res) => {
        if (res.success) setReports(res.data.map(mapBackendReport));
        else setError('加载日报失败');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addReport = async (body: any) => {
    const res = await createReport(body);
    if (res.success) {
      setReports((prev) => [mapBackendReport(res.data), ...prev]);
    }
    return res;
  };

  const editReport = async (id: string, body: any) => {
    const res = await updateReport(id, body);
    if (res.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? mapBackendReport(res.data) : r)));
    }
    return res;
  };

  return { reports, loading, error, refetch: fetch, addReport, editReport };
}
