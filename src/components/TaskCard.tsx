import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, MessageSquare, Zap, Bot, X, RotateCcw, Lightbulb, Clock, Users, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from './StatusBadge';
import type { Task } from '@/data/mockData';
import { api } from '@/api/client';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface TaskCardProps {
  task: Task;
  index?: number;
  onClick?: () => void;
  onTaskUpdated?: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#3B82F6',
  low: '#22C55E',
};

// 状态映射：API 英文状态 -> 中文展示
const statusDisplay: Record<string, string> = {
  'completed': '已完成',
  'in-progress': '进行中',
  'not-started': '未开始',
  'overdue': '已逾期',
  'pending-review': '待审核',
};

// 反向映射：中文展示 -> API 英文状态
const statusToApi: Record<string, string> = {
  '已完成': 'completed',
  '进行中': 'in-progress',
  '未开始': 'not-started',
  '已逾期': 'overdue',
  '待审核': 'pending-review',
};

const TaskCard = memo(function TaskCard({ task, index = 0, onClick, onTaskUpdated }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue' || (task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted);
  const priorityColor = priorityColors[task.priority];

  // ─── 完成/撤回 ───
  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubmitting(true);
    try {
      const newStatus = isCompleted ? 'in-progress' : 'completed';
      await api.put(`/api/tasks/${task.id}`, { status: newStatus });
      toast.success(isCompleted ? '已撤回完成标记' : '已标记完成', { description: task.title });
      onTaskUpdated?.();
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 备注 ───
  const handleRemarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRemarkInput(!showRemarkInput);
  };

  const handleSubmitRemark = async () => {
    if (!remarkText.trim()) {
      setShowRemarkInput(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put(`/api/tasks/${task.id}`, { description: remarkText.trim() });
      toast.success('备注已保存', { description: remarkText.trim().slice(0, 30) });
      setRemarkText('');
      setShowRemarkInput(false);
      onTaskUpdated?.();
    } catch {
      toast.error('保存备注失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 催促 ───
  const handleNudge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubmitting(true);
    try {
      // 获取任务最新信息确认负责人
      const res = await api.get<{ success: boolean; data: any }>(`/api/tasks/${task.id}`);
      const assigneeName = res.success ? res.data.assignee_name : task.assignee;
      await api.put(`/api/tasks/${task.id}`, { priority: 'high' });
      toast.success(`已催促 ${assigneeName || '负责人'}`, {
        description: `任务「${task.title.slice(0, 20)}...」优先级已提升为高`,
      });
      onTaskUpdated?.();
    } catch {
      toast.error('催促失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── AI 分析 ───
  const handleAiAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (showAiPanel) {
      setShowAiPanel(false);
      setAiResponse(null);
      return;
    }
    setShowAiPanel(true);
    if (aiResponse) return; // 已有结果，不重复请求

    setAiLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { reply: string } }>('/api/ai/chat', {
        message: `分析这个任务：${task.title}，当前进度 ${task.progress}%，状态 ${statusDisplay[task.status] || task.status}，负责人 ${task.assignee}，截止日期 ${task.dueDate}。给出具体的风险判断和行动建议。`,
        context: {
          taskCount: 1,
          inProgressCount: 1,
          overdueCount: isOverdue ? 1 : 0,
          recentTasks: [`${task.title}（负责人: ${task.assignee}, 进度: ${task.progress}%）`],
        },
      });
      if (res.success) {
        setAiResponse(res.data.reply);
      }
    } catch {
      setAiResponse('AI 分析暂时不可用，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  const displayStatus = statusDisplay[task.status] || task.status;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.()}
      className={`bg-muted rounded-xl p-3 relative overflow-hidden transition-colors duration-200 cursor-pointer ${
        isOverdue ? 'border-l-2 border-l-destructive bg-destructive/5' : ''
      }`}
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Priority bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: priorityColor }} />

      {/* Top row: Title + Due date */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="text-body font-semibold text-foreground truncate">{task.title}</h4>
          {(task.aiRecommended || aiResponse) && (
            <Sparkles size={14} className="text-[#A855F7] flex-shrink-0" />
          )}
        </div>
        <span className="text-caption font-medium flex-shrink-0" style={{ color: isOverdue ? '#EF4444' : '#94A3B8' }}>
          {task.dueTime || task.dueDate}
        </span>
      </div>

      {/* Project + Description / Remark */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-caption px-1.5 py-0.5 rounded bg-card text-muted-foreground shrink-0">
          {task.project}
        </span>
        {task.description ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1" title={task.description}>
            <MessageSquare size={10} className="text-[#60a5fa] shrink-0" />
            <span className="text-body text-[#93c5fd] truncate">{task.description}</span>
          </div>
        ) : (
          <span className="text-body text-muted-foreground/40 text-xs italic">暂无备注</span>
        )}
      </div>

      {/* Bottom row: Assignee + Progress + Status */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-caption font-semibold text-foreground">
            {task.assignee?.charAt(0) || '?'}
          </div>
          <span className="text-body text-foreground">{task.assignee || '未分配'}</span>
        </div>

        <div className="flex-1 max-w-[120px]">
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isCompleted ? 100 : task.progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.06 + 0.3, ease: 'easeOut' }}
              className="h-full rounded-full gradient-progress"
            />
          </div>
        </div>

        <StatusBadge status={displayStatus} />
      </div>

      {/* Remark input */}
      <AnimatePresence>
        {showRemarkInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="添加备注..."
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitRemark(); if (e.key === 'Escape') setShowRemarkInput(false); }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleSubmitRemark(); }}
                disabled={isSubmitting}
                className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-border overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#A855F7]" />
                <span className="text-sm font-semibold text-[#A855F7]">AI 分析</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAiPanel(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 size={14} className="animate-spin" />
                正在调用 AI 分析此任务...
              </div>
            ) : aiResponse ? (
              <MarkdownRenderer content={aiResponse} />
            ) : (
              <div className="text-xs text-muted-foreground py-2">AI 分析加载失败</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover quick actions overlay */}
      <AnimatePresence>
        {isHovered && !showAiPanel && !showRemarkInput && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 p-2 rounded-b-xl bg-muted/95 backdrop-blur-sm border-t border-border z-10"
          >
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center disabled:opacity-50"
            style={{
              backgroundColor: isCompleted ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: isCompleted ? '#EF4444' : '#22C55E',
            }}
            onClick={handleToggleComplete}
            disabled={isSubmitting}
          >
            {isCompleted ? <RotateCcw size={11} /> : <CheckCircle size={11} />}
            {isCompleted ? '撤回' : '完成'}
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(59,130,246,0.15)] text-primary text-[11px] font-medium hover:bg-[rgba(59,130,246,0.25)] transition-colors flex-1 justify-center"
            onClick={handleRemarkClick}
          >
            <MessageSquare size={11} />
            备注
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(249,115,22,0.15)] text-[#F97316] text-[11px] font-medium hover:bg-[rgba(249,115,22,0.25)] transition-colors flex-1 justify-center disabled:opacity-50"
            onClick={handleNudge}
            disabled={isSubmitting}
          >
            <Zap size={11} />
            催促
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(168,85,247,0.15)] text-[#A855F7] text-[11px] font-medium hover:bg-[rgba(168,85,247,0.25)] transition-colors flex-1 justify-center"
            onClick={handleAiAnalysis}
          >
            <Bot size={11} />
            AI
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
});

export default TaskCard;
