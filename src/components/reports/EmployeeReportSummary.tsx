import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getReportsByEmployee } from '@/data/reportStore';
import type { DailyReportEntry } from '@/data/reportStore';

function ReportCard({ report, isLatest }: { report: DailyReportEntry; isLatest?: boolean }) {
  const [expanded, setExpanded] = useState(isLatest || false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted border border-border overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{report.date}</span>
          {isLatest && (
            <span className="rounded-full bg-[rgba(34,197,94,0.15)] px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
              最新
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">提交于 {report.submitTime}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border">
              {/* Completed Tasks */}
              <div className="pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                  完成任务
                </h4>
                {report.completedTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-sm text-foreground">
                    <span className="text-[#22C55E]">&#10003;</span>
                    {task.title}
                    <span className="text-muted-foreground">({task.duration})</span>
                  </div>
                ))}
              </div>

              {/* Tomorrow Plan */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-accent" />
                  明日计划
                </h4>
                {report.tomorrowPlan.map((plan, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {plan}
                  </div>
                ))}
              </div>

              {/* Blockers */}
              {report.blockers && (
                <div className="rounded-lg bg-destructive/10 border border-[rgba(239,68,68,0.2)] p-3">
                  <h4 className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    遇到的问题
                  </h4>
                  <p className="text-sm text-foreground">{report.blockers}</p>
                </div>
              )}

              {/* Support */}
              {report.support && (
                <div className="rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.2)] p-3">
                  <h4 className="text-xs font-semibold text-[#A855F7] mb-1">需要支持</h4>
                  <p className="text-sm text-foreground">{report.support}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EmployeeReportSummary() {
  const myReports = getReportsByEmployee('e1');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="text-[22px] font-semibold text-foreground">我的日报</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {myReports.length} 篇
        </span>
      </div>

      {myReports.length === 0 ? (
        <div className="rounded-xl bg-muted p-8 text-center">
          <p className="text-muted-foreground">暂无日报记录</p>
        </div>
      ) : (
        myReports.map((report, index) => (
          <ReportCard key={report.id} report={report} isLatest={index === 0} />
        ))
      )}
    </div>
  );
}
