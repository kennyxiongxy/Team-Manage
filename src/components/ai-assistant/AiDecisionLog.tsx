import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Lightbulb, Bell, Zap, BarChart3, ChevronDown, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { DecisionLog } from '@/data/mockData';
import { decisionLogs } from '@/data/mockData';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const typeConfig = {
  push: { icon: Bot, label: '推送', color: 'text-primary', bg: 'bg-[rgba(59,130,246,0.15)]' },
  suggest: { icon: Lightbulb, label: '建议', color: 'text-[#A855F7]', bg: 'bg-[rgba(168,85,247,0.15)]' },
  remind: { icon: Bell, label: '提醒', color: 'text-[#F97316]', bg: 'bg-[rgba(249,115,22,0.15)]' },
  auto: { icon: Zap, label: '自动', color: 'text-accent', bg: 'bg-accent/15' },
  analysis: { icon: BarChart3, label: '分析', color: 'text-[#22C55E]', bg: 'bg-[rgba(34,197,94,0.15)]' },
  deadline: { icon: Clock, label: '截止', color: 'text-[#F97316]', bg: 'bg-[rgba(249,115,22,0.15)]' },
  allocation: { icon: Bot, label: '分配', color: 'text-primary', bg: 'bg-[rgba(59,130,246,0.15)]' },
  priority: { icon: AlertTriangle, label: '优先级', color: 'text-destructive', bg: 'bg-[rgba(239,68,68,0.15)]' },
  escalation: { icon: Zap, label: '升级', color: 'text-destructive', bg: 'bg-[rgba(239,68,68,0.15)]' },
  review: { icon: CheckCircle2, label: 'review', color: 'text-[#22C55E]', bg: 'bg-[rgba(34,197,94,0.15)]' },
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-[#22C55E]', label: '已完成' },
  pending: { icon: Clock, color: 'text-[#F97316]', label: '待确认' },
  rejected: { icon: XCircle, color: 'text-destructive', label: '已驳回' },
  applied: { icon: CheckCircle2, color: 'text-[#22C55E]', label: '已应用' },
  dismissed: { icon: XCircle, color: 'text-muted-foreground', label: '已忽略' },
};

export default function AiDecisionLog() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-muted border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">AI 今日决策日志</h2>
        <div className="flex rounded-lg bg-card p-0.5">
          {['今日', '本周', '本月'].map((f) => (
            <button
              key={f}
              onClick={() => toast.info(`已切换到${f}视图`)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                f === '今日'
                  ? 'bg-muted text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-[52px] top-2 bottom-2 w-px bg-muted" />

        {decisionLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>暂无 AI 决策记录</p>
            <p className="text-xs mt-1">连接飞书并开启 AI 自动化后将显示决策日志</p>
          </div>
        ) : (
          decisionLogs.map((log, index) => (
            <LogItem
              key={log.id}
              log={log}
              index={index}
              isExpanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LogItem({
  log,
  index,
  isExpanded,
  onToggle,
}: {
  log: DecisionLog;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = typeConfig[log.type];
  const status = statusConfig[log.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease }}
      className="relative"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/30"
      >
        {/* Time */}
        <span className="mt-0.5 w-[38px] shrink-0 text-right text-[11px] text-muted-foreground font-mono">
          {log.time}
        </span>

        {/* Icon node on timeline */}
        <div
          className={cn(
            'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            config.bg
          )}
        >
          <Icon className={cn('h-3 w-3', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', config.bg, config.color)}>
              {config.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{log.description}</p>

          <div className="mt-1.5 flex items-center justify-between">
            <div className={cn('flex items-center gap-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              <span className="text-[11px]">{status.label}</span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="ml-[76px] rounded-lg bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">
                AI 基于团队数据分析做出此决策。相关数据已自动同步到任务管理系统。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
