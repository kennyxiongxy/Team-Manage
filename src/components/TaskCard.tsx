import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, MessageSquare, Zap, Bot, X, RotateCcw, Lightbulb, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from './StatusBadge';
import type { Task } from '@/data/mockData';

interface TaskCardProps {
  task: Task;
  index?: number;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#3B82F6',
  low: '#22C55E',
};



const TaskCard = memo(function TaskCard({ task, index = 0, onClick }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMarkedDone, setIsMarkedDone] = useState(task.status === '已完成');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const priorityColor = priorityColors[task.priority];

  const isOverdue = task.status === 'overdue' || task.status === '已逾期';
  const isToday = task.dueDate === '2024-07-15' && !isOverdue;
  const dueColor = isOverdue ? '#EF4444' : isToday ? '#EF4444' : '#94A3B8';

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMarkedDone) {
      setIsMarkedDone(false);
      toast.info('已撤回完成标记', { description: task.title });
    } else {
      setIsMarkedDone(true);
      toast.success('已标记完成', { description: task.title });
    }
  };

  const handleAiAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAiPanel(true);
    toast.success('AI 分析完成', { description: task.title });
  };

  // AI 分析建议数据
  const aiSuggestions = [
    { icon: Clock, text: `建议截止前${isOverdue ? '已逾期，请立即处理' : '2小时'}完成`, color: isOverdue ? '#EF4444' : '#3B82F6' },
    { icon: Users, text: `${task.assignee}当前负荷${task.priority === 'urgent' || task.priority === 'P0' ? '较高' : '适中'}，建议${task.collaboratorIds && task.collaboratorIds.length > 0 ? '协同' : '单独'}推进`, color: '#A855F7' },
    { icon: Lightbulb, text: `此任务${task.progress > 50 ? '进度过半，保持节奏' : '进度滞后，建议拆分'}`, color: '#F97316' },
  ];

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
      className={`
        bg-muted rounded-xl p-3 relative overflow-hidden transition-colors duration-200 cursor-pointer
        ${isOverdue ? 'border-l-2 border-l-destructive bg-destructive/5' : ''}
        ${isHovered ? 'bg-muted' : ''}
      `}
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
          {(task.aiRecommended || showAiPanel) && (
            <Sparkles size={14} className="text-[#A855F7] flex-shrink-0" />
          )}
        </div>
        <span className="text-caption font-medium flex-shrink-0" style={{ color: dueColor }}>
          {task.dueTime || task.dueDate}
        </span>
      </div>

      {/* Project + Description */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-caption px-1.5 py-0.5 rounded bg-card text-muted-foreground">
          {task.project}
        </span>
        <p className="text-body text-muted-foreground truncate">{task.description}</p>
      </div>

      {/* Bottom row: Assignee + Progress + Status */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-caption font-semibold text-foreground">
            {task.assignee.charAt(0)}
          </div>
          <span className="text-body text-foreground">{task.assignee}</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 max-w-[120px]">
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isMarkedDone ? 100 : task.progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.06 + 0.3, ease: 'easeOut' }}
              className="h-full rounded-full gradient-progress"
            />
          </div>
        </div>

        <StatusBadge status={isMarkedDone ? '已完成' : task.status} />
      </div>

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
                <span className="text-sm font-semibold text-[#A855F7]">AI 智能分析</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAiPanel(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-xs"
                >
                  <suggestion.icon size={14} style={{ color: suggestion.color }} className="mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{suggestion.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover quick actions overlay */}
      {isHovered && !showAiPanel && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 p-2 rounded-b-xl bg-muted/95 backdrop-blur-sm border-t border-border z-10"
        >
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center"
            style={{
              backgroundColor: isMarkedDone ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: isMarkedDone ? '#EF4444' : '#22C55E',
            }}
            onClick={handleToggleComplete}
          >
            {isMarkedDone ? <RotateCcw size={11} /> : <CheckCircle size={11} />}
            {isMarkedDone ? '撤回' : '完成'}
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(59,130,246,0.15)] text-primary text-[11px] font-medium hover:bg-[rgba(59,130,246,0.25)] transition-colors flex-1 justify-center"
            onClick={(e) => {
              e.stopPropagation();
              toast.info('添加备注', { description: task.title });
            }}
          >
            <MessageSquare size={11} />
            备注
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(249,115,22,0.15)] text-[#F97316] text-[11px] font-medium hover:bg-[rgba(249,115,22,0.25)] transition-colors flex-1 justify-center"
            onClick={(e) => {
              e.stopPropagation();
              toast.warning('已发送催促', { description: task.title });
            }}
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
    </motion.div>
  );
});

export default TaskCard;
