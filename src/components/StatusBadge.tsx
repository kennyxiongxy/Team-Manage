import { memo } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Circle, Loader2, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue' | 'pending-review' | 'ai-intervened' | '未开始' | '进行中' | '待审核' | '已完成' | '已逾期';
  className?: string;
}

const statusConfig = {
  'not-started': {
    label: '未开始',
    bg: 'bg-[rgba(148,163,184,0.15)]',
    text: 'text-muted-foreground',
    icon: Circle,
  },
  'in-progress': {
    label: '进行中',
    bg: 'bg-[rgba(59,130,246,0.15)]',
    text: 'text-primary',
    icon: Loader2,
  },
  'completed': {
    label: '已完成',
    bg: 'bg-[rgba(34,197,94,0.15)]',
    text: 'text-[#22C55E]',
    icon: CheckCircle2,
  },
  'overdue': {
    label: '已逾期',
    bg: 'bg-[rgba(239,68,68,0.15)]',
    text: 'text-destructive',
    icon: AlertTriangle,
  },
  'pending-review': {
    label: '待审核',
    bg: 'bg-[rgba(249,115,22,0.15)]',
    text: 'text-[#F97316]',
    icon: Clock,
  },
  'ai-intervened': {
    label: 'AI 介入',
    bg: 'bg-[rgba(168,85,247,0.15)]',
    text: 'text-[#A855F7]',
    icon: Sparkles,
  },
  '未开始': {
    label: '未开始',
    bg: 'bg-[rgba(148,163,184,0.15)]',
    text: 'text-muted-foreground',
    icon: Circle,
  },
  '进行中': {
    label: '进行中',
    bg: 'bg-[rgba(59,130,246,0.15)]',
    text: 'text-primary',
    icon: Loader2,
  },
  '待审核': {
    label: '待审核',
    bg: 'bg-[rgba(249,115,22,0.15)]',
    text: 'text-[#F97316]',
    icon: Clock,
  },
  '已完成': {
    label: '已完成',
    bg: 'bg-[rgba(34,197,94,0.15)]',
    text: 'text-[#22C55E]',
    icon: CheckCircle2,
  },
  '已逾期': {
    label: '已逾期',
    bg: 'bg-[rgba(239,68,68,0.15)]',
    text: 'text-destructive',
    icon: AlertTriangle,
  },
};

const StatusBadge = memo(function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-medium ${config.bg} ${config.text} ${className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
});

export default StatusBadge;
