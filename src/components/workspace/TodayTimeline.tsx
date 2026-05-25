import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/data/mockData';
import { getTasks } from '@/api/client';
import { useUserRole } from '@/context/UserRoleContext';
import { useHelpRequests } from '@/context/HelpRequestContext';

type DateTab = 'yesterday' | 'today' | 'tomorrow';

function toTimelineTask(t: any): any {
  return {
    id: t.id, title: t.title, description: t.description || '',
    priority: t.priority || 'medium', status: t.status || 'not-started',
    progress: t.progress || 0, assignee: t.assignee_name || '未分配',
    dueDate: t.due_date || t.dueDate || '', project: t.project_name || '',
    startDate: t.start_date || t.startDate || '',
  };
}

const priorityColors: Record<string, string> = {
  urgent: '#EF4444',
  high: '#EF4444',
  medium: '#F97316',
  low: '#3B82F6',
  normal: '#3B82F6',
};

const statusConfig = {
  'not-started': { bg: 'bg-card', text: 'text-muted-foreground', label: '未开始', icon: Circle },
  'in-progress': { bg: 'bg-[rgba(59,130,246,0.15)]', text: 'text-primary', label: '进行中', icon: Clock },
  completed: { bg: 'bg-[rgba(34,197,94,0.15)]', text: 'text-[#22C55E]', label: '已完成', icon: CheckCircle2 },
  overdue: { bg: 'bg-[rgba(239,68,68,0.15)]', text: 'text-destructive', label: '已逾期', icon: AlertTriangle },
};

const dateTabLabels: Record<DateTab, string> = {
  yesterday: '昨日',
  today: '今日',
  tomorrow: '明日',
};

export default function TodayTimeline() {
  const { user } = useUserRole();
  const [activeTab, setActiveTab] = useState<DateTab>('today');
  const [allMyTasks, setAllMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpPanel, setHelpPanel] = useState<string | null>(null);
  const [helpReason, setHelpReason] = useState('');
  const [notePanel, setNotePanel] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    getTasks().then((res: any) => {
      if (res.success && res.data) {
        const mine = res.data.filter((t: any) =>
          t.assignee_id === user.id || t.assignee_name === user.name
        );
        setAllMyTasks(mine);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id, user.name]);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const filteredTasks = allMyTasks.filter((t: any) => {
    const due = (t.due_date || t.dueDate || '').slice(0, 10);
    const start = (t.start_date || t.startDate || '').slice(0, 10);
    switch (activeTab) {
      case 'today': return due === today || start === today || t.status === 'overdue' || (t.status === 'in-progress' && due && due <= today);
      case 'yesterday': return due === yesterday || start === yesterday;
      case 'tomorrow': return due === tomorrow || start === tomorrow;
      default: return false;
    }
  }).sort((a: any, b: any) => {
    const da = (a.due_date || a.dueDate || '').slice(0, 10);
    const db = (b.due_date || b.dueDate || '').slice(0, 10);
    const aToday = da === today ? 0 : 1;
    const bToday = db === today ? 0 : 1;
    return aToday - bToday || da.localeCompare(db);
  });

  const displayTasks = filteredTasks.map(toTimelineTask);

  const handleTabChange = (tab: DateTab) => {
    setActiveTab(tab);
  };

  const updateProgress = (taskId: string, newProgress: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              progress: newProgress,
              status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : t.status,
            }
          : t
      )
    );
    if (newProgress === 100) {
      toast.success('任务已标记为完成');
    } else {
      toast.success('进度已更新');
    }
  };

  const toggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, progress: t.status === 'completed' ? 0 : 100, status: t.status === 'completed' ? 'not-started' : 'completed' as const }
          : t
      )
    );
    const target = tasks.find(t => t.id === taskId);
    toast.success(target?.status === 'completed' ? '已取消完成状态' : '任务已标记为完成');
  };

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.12,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="space-y-4"
    >
      {/* Header with tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-foreground">今日任务</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().getMonth() + 1}/{new Date().getDate()}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {displayTasks.length} 个
          </span>
        </div>
        <div className="flex rounded-lg bg-muted p-1">
          {(Object.keys(dateTabLabels) as DateTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200',
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {dateTabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Vertical timeline line */}
          <div className="absolute left-[22px] top-0 hidden h-full w-[2px] bg-muted sm:block" />

          <div className="space-y-4">
            {displayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>{loading ? '加载中...' : '暂无任务'}</p>
                <p className="text-xs mt-1">{loading ? '' : '今天没有需要关注的任务'}</p>
              </div>
            ) : (
              displayTasks.map((task, index) => (
                <TimelineNode
                  key={task.id}
                  task={task}
                  index={index}
                  onProgressChange={updateProgress}
                  onToggleComplete={toggleComplete}
                  helpPanel={helpPanel}
                  setHelpPanel={setHelpPanel}
                  helpReason={helpReason}
                  setHelpReason={setHelpReason}
                  notePanel={notePanel}
                  setNotePanel={setNotePanel}
                  noteText={noteText}
                  setNoteText={setNoteText}
                />
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

interface TimelineNodeProps {
  task: TimelineTask;
  index: number;
  onProgressChange: (id: string, val: number) => void;
  onToggleComplete: (id: string) => void;
  helpPanel: string | null;
  setHelpPanel: (id: string | null) => void;
  helpReason: string;
  setHelpReason: (reason: string) => void;
  notePanel: string | null;
  setNotePanel: (id: string | null) => void;
  noteText: string;
  setNoteText: (text: string) => void;
}

function TimelineNode({
  task,
  index,
  onProgressChange,
  onToggleComplete,
  helpPanel,
  setHelpPanel,
  helpReason,
  setHelpReason,
  notePanel,
  setNotePanel,
  noteText,
  setNoteText,
}: TimelineNodeProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue';
  const isInProgress = task.status === 'in-progress';

  const StatusIcon = statusConfig[task.status].icon;
  const { addHelpRequest } = useHelpRequests();

  const handleHelpSubmit = (reason: string) => {
    addHelpRequest({
      employeeName: '当前用户',
      employeeId: 'current-user',
      taskName: task.title,
      taskId: task.id,
      reason: reason || '遇到技术难题，需要协助',
    });
    setHelpPanel(null);
    setHelpReason('');
    toast.warning('已发送求助给管理者', {
      description: `原因：${reason || '遇到技术难题，需要协助'}`,
      duration: 4000,
    });
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="relative flex gap-4"
    >
      {/* Time + Node */}
      <div className="hidden w-11 flex-col items-end sm:flex">
        <span className="mt-3 text-xs font-medium text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {task.time}
        </span>
      </div>
      {/* Dot on the line */}
      <div className="relative hidden sm:block">
        <div className="mt-3 flex h-3 w-3 items-center justify-center">
          {isCompleted ? (
            <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index * 0.1 + 0.2 }}
              className={cn('h-3 w-3 rounded-full', isInProgress && 'animate-pulse')}
              style={{ backgroundColor: priorityColors[task.priority] }}
            />
          )}
        </div>
      </div>

      {/* Task Card */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'rounded-xl border-l-2 bg-muted p-4 transition-all duration-200 hover:bg-muted',
            isCompleted && 'opacity-70',
            isOverdue && 'border-l-destructive bg-destructive/5',
            !isOverdue && !isCompleted && isInProgress && 'border-l-primary',
            !isOverdue && !isCompleted && !isInProgress && 'border-l-[#334155]'
          )}
        >
          {/* Top row: project + priority + status */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {task.project}
            </span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: priorityColors[task.priority] }}
            />
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                statusConfig[task.status].bg,
                statusConfig[task.status].text
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig[task.status].label}
            </span>
            {/* Mobile time display */}
            <span className="text-xs text-muted-foreground sm:hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {task.time}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              'mb-1 text-lg font-semibold text-foreground',
              isCompleted && 'line-through'
            )}
          >
            {task.title}
          </h3>

          {/* Description */}
          <p className="mb-3 truncate text-sm text-muted-foreground">{task.description}</p>

          {/* Progress slider */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">进度</span>
              <motion.span
                key={task.progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs font-semibold text-accent"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {task.progress}%
              </motion.span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #06B6D4 0%, #22C55E 100%)',
                }}
                initial={false}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={task.progress}
              onChange={(e) => onProgressChange(task.id, Number(e.target.value))}
              disabled={isCompleted}
              className="mt-1 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0 hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Bottom row: deadline + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              {task.hoursLeft !== undefined && (
                <span
                  className={cn(
                    'font-medium',
                    task.hoursLeft <= 3 ? 'text-destructive' : 'text-[#F97316]'
                  )}
                >
                  还剩 {task.hoursLeft} 小时
                </span>
              )}
              {task.duration && (
                <span className="text-muted-foreground">{task.duration}</span>
              )}
              <span className="text-muted-foreground">截止 {task.deadline}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleComplete(task.id)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  isCompleted
                    ? 'bg-[rgba(239,68,68,0.15)] text-destructive hover:bg-[rgba(239,68,68,0.25)] active:scale-[0.98]'
                    : 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.25)] active:scale-[0.98]'
                )}
              >
                <Check className="h-3 w-3" />
                {isCompleted ? '撤回完成' : '标记完成'}
              </button>
              <button
                onClick={() => setHelpPanel(helpPanel === task.id ? null : task.id)}
                className="flex items-center gap-1 rounded-md bg-[rgba(239,68,68,0.15)] px-3 py-1.5 text-xs font-medium text-destructive transition-all duration-150 hover:bg-[rgba(239,68,68,0.25)] active:scale-[0.98]"
              >
                <HelpCircle className="h-3 w-3" />
                需要帮助
              </button>
              <button
                onClick={() => setNotePanel(notePanel === task.id ? null : task.id)}
                className="flex items-center gap-1 rounded-md bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-muted active:scale-[0.98]"
              >
                <MessageSquare className="h-3 w-3" />
                备注
              </button>
            </div>
          </div>

          {/* Help panel */}
          <AnimatePresence>
            {helpPanel === task.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-sm text-muted-foreground">描述您需要帮助的原因：</p>
                  <textarea
                    rows={3}
                    placeholder="例如：遇到技术难题，需要后端同事协助..."
                    value={helpReason}
                    onChange={(e) => setHelpReason(e.target.value)}
                    className="mb-3 w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {['遇到技术难题', '时间不够', '需求不清晰'].map((reason) => (
                        <button
                          key={reason}
                          onClick={() => handleHelpSubmit(reason)}
                          className="rounded-md bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHelpSubmit(helpReason)}
                        className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        提交求助
                      </button>
                      <button
                        onClick={() => { setHelpPanel(null); setHelpReason(''); }}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Note panel */}
          <AnimatePresence>
            {notePanel === task.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-sm text-muted-foreground">添加备注：</p>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="输入备注内容..."
                    className="mb-3 w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNotePanel(null);
                        setNoteText('');
                        toast.success('备注已保存');
                      }}
                      className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      保存备注
                    </button>
                    <button
                      onClick={() => setNotePanel(null)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
