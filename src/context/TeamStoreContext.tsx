import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUsers, getTasks } from '@/api/client';
import type { TeamMember } from '@/data/mockData';

interface TeamStoreContextType {
  members: TeamMember[];
  addMembers: (newMembers: TeamMember[]) => void;
  importFeishuUsers: (feishuUsers: { openId: string; name: string; email: string; department: string; phone?: string; employeeNo?: string; _role?: string }[]) => void;
  getImportStatus: (feishuUserId: string) => boolean;
  importedCount: number;
  loading: boolean;
}

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
    avgTaskDuration: 0,
    collabCount: 0,
    grade: 'B',
    color: '#3B82F6',
    weekOverWeek: 0,
    aiNote: '',
  };
}

const TeamStoreContext = createContext<TeamStoreContextType | null>(null);

export function TeamStoreProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getTasks()])
      .then(([usersRes, tasksRes]) => {
        if (usersRes.success) {
          const users = usersRes.data;
          const tasks = tasksRes.success ? tasksRes.data : [];
          
          // 计算每个用户的任务统计
          const taskCountByUser: Record<string, { total: number; completed: number; inProgress: number }> = {};
          for (const t of tasks) {
            if (!t.assignee_id) continue;
            if (!taskCountByUser[t.assignee_id]) {
              taskCountByUser[t.assignee_id] = { total: 0, completed: 0, inProgress: 0 };
            }
            taskCountByUser[t.assignee_id].total++;
            if (t.status === 'completed') taskCountByUser[t.assignee_id].completed++;
            if (t.status === 'in-progress') taskCountByUser[t.assignee_id].inProgress++;
          }
          
          setMembers(users.map((u: any) => {
            const stats = taskCountByUser[u.id] || { total: 0, completed: 0, inProgress: 0 };
            return {
              ...mapBackendUser(u),
              workload: stats.total,
              workloadPercent: users.length > 1 ? Math.round((stats.total / Math.max(1, tasks.length / users.length)) * 100) : 0,
              tasksCompleted: stats.completed,
              tasksInProgress: stats.inProgress,
            };
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addMembers = (newMembers: TeamMember[]) => {
    setMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const uniqueNew = newMembers.filter((m) => !existingIds.has(m.id));
      return [...prev, ...uniqueNew];
    });
  };

  const importFeishuUsers = (feishuUsers: { openId: string; name: string; email: string; department: string; phone?: string; employeeNo?: string; _role?: string }[]) => {
    setMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMembers: TeamMember[] = feishuUsers
        .filter((u) => !existingIds.has(u.openId))
        .map((u, index) => ({
          id: u.openId,
          name: u.name,
          avatar: '',
          role: u._role || '新成员',
          workload: 0,
          department: u.department,
          status: 'idle' as const,
          grade: 'B',
          completionRate: 0,
          onTimeRate: 100,
          qualityScore: 0,
          avgTaskDuration: 0,
          tasksCompleted: 0,
          collabCount: 0,
          color: '#3B82F6',
          weekOverWeek: 0,
          aiNote: '从飞书导入的新成员',
        }));
      return [...prev, ...newMembers];
    });
  };

  const getImportStatus = (feishuUserId: string) => {
    return members.some((m) => m.id === feishuUserId);
  };

  return (
    <TeamStoreContext.Provider
      value={{
        members,
        addMembers,
        importFeishuUsers,
        getImportStatus,
        importedCount: Math.max(0, members.length - 6),
        loading,
      }}
    >
      {children}
    </TeamStoreContext.Provider>
  );
}

export function useTeamStore() {
  const ctx = useContext(TeamStoreContext);
  if (!ctx) throw new Error('useTeamStore must be used within TeamStoreProvider');
  return ctx;
}
