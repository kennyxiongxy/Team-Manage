import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Loader2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { dailyReportData } from '@/data/mockData';
import { addReport } from '@/data/reportStore';

export default function QuickDailyReport() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(dailyReportData.submitted);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockers, setBlockers] = useState(dailyReportData.blockers);
  const [support, setSupport] = useState(dailyReportData.support);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);

      // Save to report store
      addReport({
        employeeId: 'current-user',
        employeeName: '当前用户',
        department: '',
        date: new Date().toISOString().slice(0, 10),
        completedTasks: dailyReportData.completedTasks,
        tomorrowPlan: dailyReportData.tomorrowPlan,
        blockers,
        support,
      });

      toast.success('日报已提交成功', { description: '您可以查看日报历史' });
    }, 1200);
  };

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      className="relative"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-foreground">今日日报</h2>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          {!submitted ? (
            <>
              <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2.5 py-0.5 text-xs font-medium text-destructive">
                未提交
              </span>
              <span className="text-xs text-muted-foreground">18:00 截止提交</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 rounded-full bg-[rgba(34,197,94,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#22C55E]">
                <Check className="h-3 w-3" />
                已提交
              </span>
              <span className="text-xs text-muted-foreground">今日 18:05 提交</span>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {!submitted && (
        <div className="mb-4 rounded-lg bg-[rgba(168,85,247,0.08)] px-4 py-2.5 text-sm text-[#A855F7]">
          AI 已为你预生成日报，请确认或修改
        </div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card p-5">
              {/* Completed tasks */}
              <div className="mb-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">今日完成任务：</h3>
                {dailyReportData.completedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无完成任务记录</p>
                ) : (
                  <ul className="space-y-2">
                    {dailyReportData.completedTasks.map((task) => (
                      <li key={task.id} className="flex items-start gap-2 text-sm">
                        {task.status === 'completed' ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                        ) : (
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          </span>
                        )}
                        <span className="text-foreground">
                          {task.title}
                          <span className="ml-2 text-muted-foreground">（{task.duration}）</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tomorrow's plan */}
              <div className="mb-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">明日计划：</h3>
                {dailyReportData.tomorrowPlan.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无明日计划</p>
                ) : (
                  <ul className="space-y-2">
                    {dailyReportData.tomorrowPlan.map((plan, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {plan}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Blockers input */}
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">遇到的问题：</h3>
                  {isEditing && <Pencil className="h-3 w-3 text-[#A855F7]" />}
                </div>
                <textarea
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  readOnly={!isEditing && submitted}
                  placeholder="暂无（可添加...）"
                  className={cn(
                    'min-h-[60px] w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder-[#94A3B8] outline-none transition-colors resize-none',
                    (isEditing || !submitted) && 'focus:border-accent'
                  )}
                />
              </div>

              {/* Support input */}
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">需要支持：</h3>
                  {isEditing && <Pencil className="h-3 w-3 text-[#A855F7]" />}
                </div>
                <textarea
                  value={support}
                  onChange={(e) => setSupport(e.target.value)}
                  readOnly={!isEditing && submitted}
                  placeholder="暂无（可添加...）"
                  className={cn(
                    'min-h-[60px] w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder-[#94A3B8] outline-none transition-colors resize-none',
                    (isEditing || !submitted) && 'focus:border-accent'
                  )}
                />
              </div>

              {/* Action buttons */}
              {!submitted ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        确认并提交
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:border-accent hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                    {isEditing ? '完成修改' : '修改内容'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-[#22C55E]">
                  <Check className="h-4 w-4" />
                  日报已提交成功
                </div>
                <button
                  onClick={() => navigate('/my-reports')}
                  className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  查看我的日报
                </button>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
