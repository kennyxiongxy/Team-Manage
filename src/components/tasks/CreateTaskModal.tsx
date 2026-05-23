import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Calendar,
  UserCircle,
  Flag,
  FolderOpen,
  Link2,
  Paperclip,
} from 'lucide-react';
import { priorityConfig } from '@/data/mockData';
import type { Priority, TaskStatus } from '@/data/mockData';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: Priority;
    status: TaskStatus;
    dueDate: string;
  }) => void;
  defaultStatus?: TaskStatus;
}

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

export default function CreateTaskModal({
  open,
  onClose,
  onCreate,
  defaultStatus = 'not-started',
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      projectId,
      assigneeId,
      priority,
      status: defaultStatus,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-[640px] max-h-[80vh] overflow-y-auto rounded-2xl bg-muted shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-muted z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">新建任务</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* AI Assistant Banner */}
            <motion.div
              className="mx-6 mt-4 p-3 rounded-lg border border-[#A855F7]/30 bg-[rgba(168,85,247,0.08)]"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3, ease: easeValues }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                <span className="text-sm font-medium text-[#A855F7]">AI 任务分析</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                填写任务信息后，AI 将自动分析预计工时、风险等级并给出建议
              </p>
            </motion.div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  任务标题 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入任务标题，例如：完成 Q3 需求文档"
                  className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder-[#64748B] text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  任务描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述任务目标、交付标准和注意事项"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder-[#64748B] text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              {/* Project & Assignee Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    所属项目
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                  >
                    {mockProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <UserCircle className="w-4 h-4 text-muted-foreground" />
                    负责人
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                  >
                    {mockTeamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Due Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    优先级
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(priorityConfig) as Priority[]).map((p) => {
                      const config = priorityConfig[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border"
                          style={{
                            backgroundColor:
                              priority === p ? config.bg : 'transparent',
                            color: priority === p ? config.color : '#94A3B8',
                            borderColor:
                              priority === p ? config.color : '#334155',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Linked Tasks & Attachments */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
                  <Link2 className="w-4 h-4" />
                  关联任务
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm hover:bg-muted transition-colors">
                  <Paperclip className="w-4 h-4" />
                  添加附件
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-muted rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                取消
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                  style={{
                    background:
                      'linear-gradient(135deg, #A855F7 0%, #3B82F6 50%, #06B6D4 100%)',
                  }}
                >
                  保存并指派
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
