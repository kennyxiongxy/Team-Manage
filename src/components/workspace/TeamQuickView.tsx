import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Play,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUsers, getTasks } from '@/api/client';

const statusConfig: Record<string, { color: string; label: string }> = {
  busy: { color: '#EF4444', label: '忙碌' },
  working: { color: '#3B82F6', label: '工作中' },
  idle: { color: '#22C55E', label: '空闲' },
  offline: { color: '#64748B', label: '离线' },
  online: { color: '#22C55E', label: '在线' },
};

type ActivityType = 'complete' | 'start' | 'update' | 'assign' | 'risk';

const activityIcons: Record<ActivityType, typeof CheckCircle2> = {
  complete: CheckCircle2,
  start: Play,
  update: RefreshCw,
  assign: UserPlus,
  risk: AlertTriangle,
};

const activityColors: Record<ActivityType, string> = {
  complete: 'text-[#22C55E]',
  start: 'text-primary',
  update: 'text-accent',
  assign: 'text-foreground',
  risk: 'text-destructive',
};

const workloadColor = (load: number) => {
  if (load >= 80) return '#EF4444';
  if (load >= 50) return '#F97316';
  if (load > 0) return '#22C55E';
  return '#64748B';
};

export default function TeamQuickView() {
  const [members, setMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getTasks()]).then(([uRes, tRes]) => {
      const users = (uRes?.data || []) as any[];
      const tasks = (tRes?.data || []) as any[];

      setMembers(users.filter((u: any) => u.role === 'employee').map((u: any) => {
        const userTasks = tasks.filter((t: any) => t.assignee_id === u.id || t.assignee_name === u.name);
        const inProgress = userTasks.filter((t: any) => t.status === 'in-progress').length;
        const total = userTasks.length;
        return {
          id: u.id, name: u.name,
          currentTask: userTasks.find((t: any) => t.status === 'in-progress')?.title || '暂无进行中任务',
          workload: total > 0 ? Math.round((inProgress / Math.max(total, 1)) * 100) : 0,
          status: inProgress > 3 ? 'busy' : inProgress > 0 ? 'working' : 'idle',
        };
      }));

      const acts: any[] = [];
      tasks.filter((t: any) => t.status === 'completed').slice(0, 3).forEach((t: any) => {
        acts.push({ id: t.id, type: 'complete' as ActivityType, user: t.assignee_name || '成员', action: '完成了', target: t.title, time: t.due_date || '' });
      });
      tasks.filter((t: any) => t.status === 'in-progress').slice(0, 2).forEach((t: any) => {
        acts.push({ id: t.id, type: 'start' as ActivityType, user: t.assignee_name || '成员', action: '正在推进', target: t.title, time: '' });
      });
      setActivities(acts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Team Activities */}
      <motion.div
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">团队动态</h2>
          {!loading && <div className="flex h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />}
        </div>
        <div className="rounded-xl bg-muted p-4">
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">加载中...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">暂无团队动态</p>
            ) : (
              activities.map((activity, index) => {
                const ActivityIcon = activityIcons[activity.type];
                return (
                  <motion.div key={activity.id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card">
                      <ActivityIcon className={cn('h-3.5 w-3.5', activityColors[activity.type])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-foreground">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="text-muted-foreground">{activity.target}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">团队成员</h2>
        </div>
        <div className="rounded-xl bg-muted p-4">
          <div className="space-y-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">加载中...</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">暂无成员数据</p>
            ) : (
              [...members].sort((a, b) => b.workload - a.workload).map((member, index) => {
                const cfg = statusConfig[member.status || 'offline'];
                return (
                  <motion.div key={member.id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.06, duration: 0.3 }}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-bold text-muted-foreground">
                      {member.name?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{member.currentTask}</p>
                    </div>
                    <div className="w-12">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-card">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${member.workload ?? 0}%`, backgroundColor: workloadColor(member.workload ?? 0) }} />
                        </div>
                      </div>
                      <span className="block text-right text-[10px] font-medium"
                        style={{ color: workloadColor(member.workload ?? 0), fontFamily: "'JetBrains Mono', monospace" }}>
                        {member.workload}%
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
