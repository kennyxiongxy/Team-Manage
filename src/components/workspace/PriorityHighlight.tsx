import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { todayTasks } from '@/data/mockData';

export default function PriorityHighlight() {
  const navigate = useNavigate();

  // Find the most urgent task (urgent priority, not completed, earliest deadline)
  const urgentTask = todayTasks.find(
    (t) => t.priority === 'urgent' && t.status !== 'completed'
  );

  if (!urgentTask) return null;

  const milestones = [
    { name: '需求确认', completed: true },
    { name: '技术方案', completed: true },
    { name: '开发实现', completed: false },
    { name: '测试验收', completed: false },
  ];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.04,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="relative overflow-hidden rounded-xl border border-[#EF4444] bg-destructive/10 p-5"
      style={{ boxShadow: '0 0 16px rgba(239,68,68,0.15)' }}
    >
      {/* Background gradient decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-destructive/10 blur-2xl" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(239,68,68,0.2)]">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                最紧急
              </span>
              <span className="flex items-center gap-1 text-xs text-destructive">
                <Clock className="h-3 w-3" />
                还剩 {urgentTask.hoursLeft} 小时
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{urgentTask.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{urgentTask.description}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            navigate('/tasks');
            toast.success('已跳转到任务中心', { description: '请优先处理最紧急的任务' });
          }}
          className="flex items-center gap-2 self-start rounded-lg bg-[#EF4444] px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:brightness-110 sm:self-center"
        >
          立即处理
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">里程碑进度 ({completedCount}/{milestones.length})</span>
          <span
            className="text-xs font-semibold text-destructive"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {progress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-card">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
            }}
          />
        </div>
        <div className="mt-3 flex items-center gap-1">
          {milestones.map((m, i) => (
            <div key={m.name} className="group relative flex items-center gap-1">
              <div className={cn(
                'h-2 w-2 rounded-full',
                m.completed ? 'bg-[#22C55E]' : 'bg-muted'
              )} />
              <span className={cn(
                'text-[11px]',
                m.completed ? 'text-[#22C55E]' : 'text-muted-foreground'
              )}>{m.name}</span>
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-muted px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {m.completed ? '已完成' : '未完成'}: {m.name}
              </div>
              {i < milestones.length - 1 && <div className="mx-1 h-px w-4 bg-muted" />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
