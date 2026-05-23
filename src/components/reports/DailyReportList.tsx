import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CircleAlert, Clock, CheckCircle2, Eye, FileCheck } from 'lucide-react';
import type { DailyReport } from '@/data/mockData';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface DailyReportListProps {
  reports: DailyReport[];
}

export default function DailyReportList({ reports }: DailyReportListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: DailyReport['status']) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-3.5 w-3.5 text-primary" />;
      case 'reviewed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />;
      case 'unsubmitted':
        return <CircleAlert className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: DailyReport['status']) => {
    switch (status) {
      case 'submitted':
        return '已提交';
      case 'reviewed':
        return '已审阅';
      case 'unsubmitted':
        return '未提交';
    }
  };

  const getStatusBg = (status: DailyReport['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-[rgba(59,130,246,0.15)] text-primary';
      case 'reviewed':
        return 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]';
      case 'unsubmitted':
        return 'bg-[rgba(239,68,68,0.15)] text-destructive';
    }
  };

  const getRiskBadge = (risk: DailyReport['riskLevel']) => {
    switch (risk) {
      case 'high':
        return <span className="rounded bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[10px] text-destructive">高风险</span>;
      case 'medium':
        return <span className="rounded bg-[rgba(249,115,22,0.15)] px-1.5 py-0.5 text-[10px] text-[#F97316]">中风险</span>;
      case 'low':
        return <span className="rounded bg-[rgba(34,197,94,0.15)] px-1.5 py-0.5 text-[10px] text-[#22C55E]">低风险</span>;
    }
  };

  return (
    <div className="space-y-2">
      {reports.map((report, index) => {
        const isExpanded = expandedId === report.id;
        return (
          <motion.div
            key={report.id}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease }}
            className={cn(
              'rounded-xl border transition-colors',
              report.status === 'unsubmitted'
                ? 'border-[rgba(239,68,68,0.2)] bg-destructive/5'
                : report.status === 'reviewed'
                  ? 'border-l-2 border-l-[#22C55E] border-border bg-muted'
                  : 'border-border bg-muted'
            )}
          >
            {/* Row header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : report.id)}
              className="flex w-full items-center gap-4 px-4 py-3 text-left"
            >
              {/* Member */}
              <div className="flex items-center gap-2 w-[100px] shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs font-semibold text-foreground">
                    {report.memberName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">{report.memberName}</span>
                {report.status === 'unsubmitted' && (
                  <CircleAlert className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
              </div>

              {/* Completed tasks */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1">
                  {report.completedTasks.slice(0, 3).map((task) => (
                    <span
                      key={task}
                      className="rounded-md bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {task}
                    </span>
                  ))}
                  {report.completedTasks.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{report.completedTasks.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Issues */}
              <div className="w-[80px] shrink-0 text-center">
                {report.hasIssue ? (
                  <span className="flex items-center justify-center gap-1 text-xs text-destructive">
                    <CircleAlert className="h-3.5 w-3.5" />
                    有问题
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">无</span>
                )}
              </div>

              {/* Submit time */}
              <div className="w-[70px] shrink-0 text-right">
                <span
                  className={cn(
                    'text-xs font-mono',
                    report.status === 'unsubmitted' ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {report.submitTime}
                </span>
              </div>

              {/* Status */}
              <div className="w-[72px] shrink-0 flex justify-end">
                <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]', getStatusBg(report.status))}>
                  {getStatusIcon(report.status)}
                  {getStatusLabel(report.status)}
                </span>
              </div>

              {/* Expand arrow */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-4 py-4 space-y-3">
                    {/* Completed tasks detail */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        今日完成
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {report.completedTasks.map((task) => (
                          <span
                            key={task}
                            className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Planned tasks */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        明日计划
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {report.plannedTasks.map((task) => (
                          <span
                            key={task}
                            className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    {report.hasIssue && report.issueDescription && (
                      <div className="rounded-lg bg-destructive/10 border border-[rgba(239,68,68,0.2)] px-3 py-2">
                        <h4 className="text-xs font-semibold text-destructive mb-0.5">遇到的问题</h4>
                        <p className="text-xs text-foreground">{report.issueDescription}</p>
                      </div>
                    )}

                    {/* Risk & Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div>{getRiskBadge(report.riskLevel)}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toast.info('功能开发中，敬请期待', { duration: 2000 })}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-[#94A3B8]"
                        >
                          <Eye className="h-3 w-3" />
                          查看
                        </button>
                        {report.status !== 'reviewed' && (
                          <button
                            onClick={() => toast.success('日报已标记为已审阅')}
                            className="flex items-center gap-1 rounded-lg bg-[#22C55E] px-3 py-1.5 text-xs text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            <FileCheck className="h-3 w-3" />
                            审阅
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
