import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Pencil,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import {
  mockTeamMembers,
  mockProjects,
  priorityConfig,
  statusConfig,
} from '@/data/mockData';
import type { Task, Priority, TaskStatus } from '@/data/mockData';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

type SortKey = 'priority' | 'title' | 'assignee' | 'dueDate' | 'progress' | 'status';
type SortDir = 'asc' | 'desc';

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

function getMember(memberId: string) {
  return mockTeamMembers.find((m) => m.id === memberId);
}

function getProject(projectId: string) {
  return mockProjects.find((p) => p.id === projectId);
}

const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function isOverdue(dueDate: string, status: TaskStatus) {
  return new Date(dueDate) < new Date() && status !== '已完成';
}

export default function TaskList({
  tasks,
  onTaskClick,
  selectedIds,
  onSelectionChange,
}: TaskListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'priority':
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
      case 'title':
        return a.title.localeCompare(b.title) * dir;
      case 'assignee': {
        const ma = getMember(a.assigneeId ?? '')?.name ?? '';
        const mb = getMember(b.assigneeId ?? '')?.name ?? '';
        return ma.localeCompare(mb) * dir;
      }
      case 'dueDate':
        return a.dueDate.localeCompare(b.dueDate) * dir;
      case 'progress':
        return (a.progress - b.progress) * dir;
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      default:
        return 0;
    }
  });

  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tasks.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-accent" />
    ) : (
      <ChevronDown className="w-3 h-3 text-accent" />
    );
  };

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="w-[40px] px-2 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border bg-card text-accent accent-[#06B6D4] cursor-pointer"
                />
              </th>
              <th
                className="w-[80px] px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('priority')}
              >
                <span className="flex items-center gap-1">优先级 <SortIcon col="priority" /></span>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors min-w-[200px]"
                onClick={() => handleSort('title')}
              >
                <span className="flex items-center gap-1">任务名 <SortIcon col="title" /></span>
              </th>
              <th
                className="w-[100px] px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('assignee')}
              >
                <span className="flex items-center gap-1">负责人 <SortIcon col="assignee" /></span>
              </th>
              <th
                className="w-[100px] px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('dueDate')}
              >
                <span className="flex items-center gap-1">截止日 <SortIcon col="dueDate" /></span>
              </th>
              <th
                className="w-[120px] px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('progress')}
              >
                <span className="flex items-center gap-1">进度 <SortIcon col="progress" /></span>
              </th>
              <th
                className="w-[90px] px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('status')}
              >
                <span className="flex items-center gap-1">状态 <SortIcon col="status" /></span>
              </th>
              <th className="w-[80px] px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedTasks.map((task, idx) => {
                const member = getMember(task.assigneeId ?? '');
                const project = getProject(task.projectId ?? '');
                const priority = priorityConfig[task.priority];
                const status = statusConfig[task.status];
                const selected = selectedIds.includes(task.id);
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <motion.tr
                    key={task.id}
                    className={`group cursor-pointer transition-colors ${
                      selected
                        ? 'bg-muted border-l-2 border-l-[#06B6D4]'
                        : idx % 2 === 0
                          ? 'bg-muted'
                          : 'bg-muted'
                    } hover:bg-muted`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: idx * 0.02,
                      ease: easeValues,
                    }}
                    onClick={(e) => {
                      // Don't trigger when clicking checkbox
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                      onTaskClick(task);
                    }}
                  >
                    {/* Checkbox */}
                    <td className="px-2 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(task.id)}
                        className="w-4 h-4 rounded border-border bg-card accent-[#06B6D4] cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          backgroundColor: priority.bg,
                          color: priority.color,
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-3 py-3.5">
                      <div className="text-sm font-medium text-foreground truncate max-w-[280px]">
                        {task.title}
                      </div>
                      {project && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">
                          {project.name}
                        </span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-3.5">
                      {member && (
                        <div className="flex items-center gap-2">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-foreground">{member.name}</span>
                        </div>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-3.5">
                      <span
                        className="text-sm"
                        style={{
                          color: overdue ? '#EF4444' : '#F8FAFC',
                        }}
                      >
                        {new Date(task.dueDate).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {overdue && (
                        <span className="text-[10px] text-destructive block">已逾期</span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background:
                                'linear-gradient(90deg, #06B6D4 0%, #22C55E 100%)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.02 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                          {task.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: status.bg,
                          color: status.color,
                        }}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3">
            <svg
              className="w-10 h-10 text-[#334155]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">暂无任务</p>
          <p className="text-xs text-muted-foreground mt-1">使用筛选条件调整或创建新任务</p>
        </div>
      )}
    </div>
  );
}
