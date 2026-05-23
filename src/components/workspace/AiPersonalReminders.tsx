import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, BarChart3, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiReminders as initialReminders } from '@/data/mockData';
import type { AiReminder } from '@/data/mockData';

const typeIcons = {
  deadline: Clock,
  risk: BarChart3,
  optimize: Lightbulb,
  collaboration: Lightbulb,
};

type AiReminderType = keyof typeof typeIcons;

export default function AiPersonalReminders() {
  const [reminders, setReminders] = useState<AiReminder[]>(initialReminders);

  const markRead = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read: true } : r))
    );
  };

  const removeReminder = (id: string, actionLabel: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (actionLabel.includes('协助') || actionLabel.includes('同意')) {
      toast.success('已同意协助，任务已同步到您的日程');
    } else if (actionLabel.includes('延期') || actionLabel.includes('延长时间')) {
      toast.warning('已提交延期申请，等待管理者审批');
    } else if (actionLabel.includes('忽略') || actionLabel.includes('取消') || actionLabel.includes('暂不方便')) {
      toast.info('已忽略此提醒');
    } else if (actionLabel.includes('知道') || actionLabel.includes('了解') || actionLabel.includes('查看')) {
      toast.success('已标记为已处理');
    } else {
      toast.success('操作已完成');
    }
  };

  const unreadCount = reminders.filter((r) => !r.read).length;

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
    >
      {/* Section title */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-[22px] font-semibold text-foreground">AI 提醒</h2>
        <Sparkles className="h-5 w-5 text-[#A855F7]" />
        {unreadCount > 0 && (
          <span className="rounded-full bg-[rgba(168,85,247,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#A855F7]">
            {unreadCount} 条新
          </span>
        )}
      </div>

      {/* Container */}
      <div
        className="rounded-xl border border-[rgba(168,85,247,0.2)] bg-muted p-0"
        style={{ boxShadow: '0 0 20px rgba(168,85,247,0.08)' }}
      >
        <AnimatePresence mode="popLayout">
          {reminders.map((reminder, index) => {
            const TypeIcon = typeIcons[reminder.type as AiReminderType];
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: reminder.read ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                }}
                className={cn(
                  'border-b border-border p-4 last:border-b-0',
                  reminder.read && 'pointer-events-none'
                )}
              >
                <div className="flex gap-3">
                  {/* AI Icon */}
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(168,85,247,0.15)]">
                    <TypeIcon className="h-4 w-4 text-[#A855F7]" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="mb-3 text-sm leading-relaxed text-foreground">
                      {reminder.message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {reminder.actions?.primary && (
                        <button
                          onClick={() => {
                            if (reminder.type === 'deadline' || reminder.type === 'risk') {
                              markRead(reminder.id);
                            } else {
                              removeReminder(reminder.id, reminder.actions?.primary ?? '已处理');
                            }
                          }}
                          className="rounded-md bg-[#A855F7] px-4 py-1.5 text-xs font-medium text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                        >
                          {reminder.actions?.primary}
                        </button>
                      )}
                      {reminder.actions?.secondary && (
                        <button
                          onClick={() => {
                            if (reminder.type === 'deadline' || reminder.type === 'risk') {
                              markRead(reminder.id);
                            } else {
                              removeReminder(reminder.id, reminder.actions?.secondary ?? '已处理');
                            }
                          }}
                          className="rounded-md border border-border bg-transparent px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-[#A855F7] hover:text-foreground"
                        >
                          {reminder.actions?.secondary}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Sparkles className="mb-2 h-8 w-8 text-[#334155]" />
            <p className="text-sm">暂无新提醒</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
