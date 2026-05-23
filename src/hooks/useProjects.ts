import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '@/api/client';
import type { Project } from '@/data/mockData';

function mapBackendProject(p: any): Project {
  const health = p.health_score >= 80 ? 'good' : p.health_score >= 60 ? 'warning' : 'critical';
  return {
    id: p.id,
    name: p.name,
    progress: p.progress || 0,
    health,
    totalTasks: p.total_tasks || 0,
    completedTasks: p.completed_tasks || 0,
    color: '#3B82F6',
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    getProjects()
      .then((res) => {
        if (res.success) setProjects(res.data.map(mapBackendProject));
        else setError('加载项目失败');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projects, loading, error, refetch: fetch };
}
