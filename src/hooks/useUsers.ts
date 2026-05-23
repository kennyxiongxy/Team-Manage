import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '@/api/client';
import type { TeamMember } from '@/data/mockData';

function mapBackendUser(u: any): TeamMember {
  return {
    id: u.id,
    name: u.name,
    role: u.role === 'manager' ? '管理者' : '员工',
    avatar: u.avatar_url || '',
    department: u.department || '',
    workload: 0,
    workloadPercent: 0,
    tasksCompleted: u.tasks_count || 0,
    tasksInProgress: 0,
    status: 'online',
    completionRate: 0,
    onTimeRate: 100,
    qualityScore: 0,
    avgTaskDuration: '0天',
    collabCount: 0,
    grade: 'B',
    color: '#3B82F6',
    weekOverWeek: 0,
    aiNote: '',
  };
}

export function useUsers() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    getUsers()
      .then((res) => {
        if (res.success) setUsers(res.data.map(mapBackendUser));
        else setError('加载用户失败');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { users, loading, error, refetch: fetch };
}
