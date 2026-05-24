import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '@/api/client';
import type { Task } from '@/data/mockData';

function mapBackendTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description || '',
    priority: t.priority as Task['priority'],
    status: t.status as Task['status'],
    assignee: t.assignee_name || '未分配',
    assigneeAvatar: t.assignee_avatar || '',
    dueDate: t.due_date || '',
    startDate: t.start_date || t.due_date || '',
    progress: t.progress || 0,
    project: t.project_name || '未分配',
    projectId: t.project_id || '',
    assigneeId: t.assignee_id || '',
    createdAt: t.created_at || '',
    aiRecommended: false,
    subTasks: [],
    comments: [],
    activityLog: [],
    tags: [],
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    getTasks()
      .then((res) => {
        if (res.success) setTasks(res.data.map(mapBackendTask));
        else setError('加载任务失败');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addTask = async (body: any) => {
    const res = await createTask(body);
    if (res.success) {
      setTasks((prev) => [...prev, mapBackendTask(res.data)]);
    }
    return res;
  };

  const editTask = async (id: string, body: any) => {
    const res = await updateTask(id, body);
    if (res.success) {
      setTasks((prev) => prev.map((t) => (t.id === id ? mapBackendTask(res.data) : t)));
    }
    return res;
  };

  const removeTask = async (id: string) => {
    const res = await deleteTask(id);
    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
    return res;
  };

  return { tasks, loading, error, refetch: fetch, addTask, editTask, removeTask };
}
