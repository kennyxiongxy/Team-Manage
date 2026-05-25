import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MoreHorizontal,
  Calendar,
  Clock,
  UserCircle,
  CheckCircle2,
  Circle,
  MessageSquare,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Send,
  Play,
  Pencil,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  priorityConfig,
  statusConfig,
} from '@/data/mockData';
import type { Task } from '@/data/mockData';
import { useUserRole } from '@/context/UserRoleContext';
import { useHelpRequestsApi } from '@/hooks/useHelpRequests';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];
const helpReasons = ['任务卡住了', '需要资源支持', '进度有风险', '需要管理者决策', '其他问题'];

function getMember(task: any) { 
  // task could be a string (assignee name) or an object with .assignee
  const name = typeof task === 'string' ? task : (task?.assignee || task?.name || '');
  if (name && name !== '未分配') return { name, avatar: task?.avatar_url || task?.assignee_avatar || '' };
  return null;
}

function getProject(task: any) { if (task.project && task.project !== "未分配") return { name: task.project, color: "#3B82F6" }; return null; }

function UserAvatar({ name, src, size = 28 }: { name?: string; src?: string; size?: number }) {
  const initial = (name || '?')[0].toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  const colors = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#06B6D4', '#EF4444', '#EC4899'];
  const color = colors[(name || '?').charCodeAt(0) % colors.length];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: color + '20', color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(timestamp: string) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return '刚刚';
  if (diffH < 24) return `${diffH}小时前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}天前`;
  return formatDate(timestamp);
}

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const { isEmployee } = useUserRole();
  const helpApi = useHelpRequestsApi();
  const [activeTab, setActiveTab] = useState<'info'|'subtasks'|'comments'|'ai'>('info');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [helpReason, setHelpReason] = useState('');
  const [aiExpanded, setAiExpanded] = useState(true);
  const [subTasksExpanded, setSubTasksExpanded] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [aiInsight, setAiInsight] = useState<{ estimatedCompletion: string; riskLevel: string; suggestion: string } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  // 获取AI洞察
  useEffect(() => {
    if (!task?.id) return;
    let cancelled = false;
    setAiInsightLoading(true);
    setAiInsight(null);
    const token = localStorage.getItem('token');
    fetch('/api/ai/task-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ taskId: task.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) setAiInsight(data.data);
      })
      .catch(e => console.warn('AI insight fetch failed:', e))
      .finally(() => { if (!cancelled) setAiInsightLoading(false); });
    return () => { cancelled = true; };
  }, [task?.id]);

  if (!task) return null;

  const assignee = task.assignee && task.assignee !== '未分配' ? { name: task.assignee, avatar: task.assigneeAvatar || '' } : null;
  const project = task.project && task.project !== '未分配' ? { name: task.project, color: '#3B82F6' } : null;
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const completedSubTasks = (task.subTasks ?? []).filter((st) => st.completed).length;

  const handleSubTaskToggle = (subTaskId: string) => {
    const subTasks = task.subTasks ?? [];
    const updatedSubTasks = subTasks.map((st) =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    const allDone = updatedSubTasks.every((st) => st.completed);
    const newProgress = allDone
      ? 100
      : Math.round(
          (updatedSubTasks.filter((st) => st.completed).length /
            updatedSubTasks.length) *
            100
        );
    onUpdate(task.id, {
      subTasks: updatedSubTasks,
      progress: newProgress,
      status: allDone ? 'pending-review' : task.status === 'completed' ? 'in-progress' : task.status,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c-${Date.now()}`,
      author: '',
      authorId: 'u1',
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
    };
    onUpdate(task.id, { comments: [...(task.comments ?? []), comment] });
    setNewComment('');
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-background/40 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-muted border-l border-border z-50 overflow-hidden flex flex-col"
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ duration: 0.35, ease: easeValues }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate">
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isEmployee && (
                <button
                  onClick={() => setShowHelpPanel(!showHelpPanel)}
                  className={`p-1.5 rounded-lg transition-colors ${showHelpPanel ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-muted text-muted-foreground'}`}
                  title="向管理者求助"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Help Panel */}
          <AnimatePresence>
            {showHelpPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border bg-orange-500/5"
              >
                <div className="px-5 py-4 space-y-3">
                  <p className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    向管理者求助
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {helpReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => {
                          setHelpReason(reason);
                          helpApi.addHelpRequest({
                            taskId: task?.id || '',
                            taskTitle: task?.title || '',
                            reason,
                            employeeName: task?.assignee_name || '',
                          }).then(() => {
                            toast.success('已发送求助给管理者');
                            setShowHelpPanel(false);
                            setHelpReason('');
                          }).catch(() => toast.error('求助发送失败'));
                        }}
                        className="rounded-md bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-orange-500/20 hover:text-orange-400"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Meta Info Row */}
            <div className="flex flex-wrap gap-2">
              {project && (
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: project.color + '20',
                    color: project.color,
                  }}
                >
                  {project.name}
                </span>
              )}
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: priority.bg, color: priority.color }}
              >
                {task.priority} {priority.label}
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {task.status}
              </span>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                负责人
              </label>
              <div className="flex items-center gap-3">
                {assignee && (
                  <>
                    <UserAvatar name={assignee.name} src={assignee.avatar} size={28} />
                    <div>
                      <div className="text-sm text-foreground">{assignee.name}</div>
                      <div className="text-xs text-muted-foreground">{assignee.role}</div>
                    </div>
                  </>
                )}
                {(task.collaboratorIds ?? []).length > 0 && (
                  <div className="flex -space-x-2 ml-3">
                    {(task.collaboratorIds ?? []).slice(0, 3).map((cid) => {
                      const m = getMember(cid);
                      return m ? (
                        <UserAvatar name={m.name} src={m.avatar} size={24} />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Time Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card group">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  截止日期
                </div>
                <input
                  id="due-date-picker"
                  type="date"
                  className="w-full bg-transparent text-sm font-medium text-foreground border-none outline-none cursor-pointer focus:ring-1 focus:ring-accent rounded p-0"
                  style={{
                    color: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
                      ? '#EF4444' : '#F8FAFC',
                  }}
                  value={task.dueDate || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (newDate) {
                      onUpdate(task.id, { dueDate: newDate });
                      toast.success('截止日期已更新为 ' + newDate);
                    }
                  }}
                />
              </div>
              <div className="p-3 rounded-lg bg-card">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  创建日期
                </div>
                <div className="text-sm font-medium text-foreground">
                  {formatDate(task.createdAt || task.startDate || task.dueDate)}
                </div>
              </div>
            </div>

            {/* 启动任务 / 进度 */}
            <div>
              {task.status === 'not-started' && (
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    onUpdate(task.id, {
                      status: 'in-progress',
                      startDate: task.startDate || today,
                      progress: 5,
                    });
                    toast.success('🚀 任务已启动', { description: '状态已更新为「进行中」' });
                  }}
                  className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#22C55E] text-white text-sm font-medium hover:shadow-[0_0_16px_rgba(6,182,212,0.3)] transition-all"
                >
                  <Play className="w-4 h-4" />
                  启动任务
                </button>
              )}
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                进度 ({task.progress}%)
              </label>
              <div className="h-3 bg-card rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, #06B6D4 0%, #22C55E 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">
                  描述
                </label>
                {!editingDescription && (
                  <button
                    onClick={() => {
                      setDescDraft(task.description || '');
                      setEditingDescription(true);
                    }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    编辑
                  </button>
                )}
              </div>
              {editingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    placeholder="输入任务描述..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder-[#64748B] focus:outline-none focus:border-accent resize-y"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingDescription(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        onUpdate(task.id, { description: descDraft });
                        setEditingDescription(false);
                        toast.success('描述已更新');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground leading-relaxed">
                  {task.description || '暂无描述，点击「编辑」添加'}
                </p>
              )}
            </div>

            {/* Sub Tasks */}
            <div>
              <button
                onClick={() => setSubTasksExpanded(!subTasksExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors"
              >
                {subTasksExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                子任务 ({completedSubTasks}/{(task.subTasks ?? []).length})
              </button>
              <AnimatePresence>
                {subTasksExpanded && (
                  <motion.div
                    className="space-y-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(task.subTasks ?? []).map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-card hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => handleSubTaskToggle(st.id)}
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`text-sm flex-1 ${st.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                        >
                          {st.title}
                        </span>
                        {st.assigneeId && (
                          <UserAvatar name={getMember(st.assigneeId)?.name} src={getMember(st.assigneeId)?.avatar} size={20} />
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Analysis */}
            <div className="rounded-lg border border-[#A855F7]/30 bg-[rgba(168,85,247,0.05)] overflow-hidden">
              <button
                onClick={() => setAiExpanded(!aiExpanded)}
                className="flex items-center justify-between w-full px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A855F7]" />
                  <span className="text-sm font-medium text-[#A855F7]">
                    AI 任务洞察
                  </span>
                </div>
                {aiExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {aiExpanded && (
                  <motion.div
                    className="px-4 pb-3 space-y-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {aiInsightLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-3 h-3 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground">AI 正在分析任务...</span>
                      </div>
                    ) : aiInsight ? (
                      <>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-foreground">预计完成：</span>
                          {aiInsight.estimatedCompletion}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-foreground">风险等级：</span>
                          {aiInsight.riskLevel}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="text-foreground">AI 建议：</span>
                          {aiInsight.suggestion}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground py-1">无法加载 AI 洞察</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comments */}
            <div>
              <button
                onClick={() => setCommentsExpanded(!commentsExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors"
              >
                {commentsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <MessageSquare className="w-3.5 h-3.5" />
                评论 ({(task.comments ?? []).length})
              </button>
              <AnimatePresence>
                {commentsExpanded && (
                  <motion.div
                    className="space-y-3"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(task.comments ?? []).map((comment) => {
                      const author = getMember(comment.authorId ?? comment.author ?? '');
                      return (
                        <div key={comment.id} className="flex gap-3">
<UserAvatar name={author?.name} src={author?.avatar} size={28} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-foreground">
                                {author?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {timeAgo(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Comment */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment();
                        }}
                        placeholder="添加评论..."
                        className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder-[#64748B] text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Activity Log */}
            <div>
              <button
                onClick={() => setActivityExpanded(!activityExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 hover:text-foreground transition-colors"
              >
                {activityExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <Activity className="w-3.5 h-3.5" />
                活动日志
              </button>
              <AnimatePresence>
                {activityExpanded && (
                  <motion.div
                    className="space-y-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(task.activityLog ?? []).map((log) => {
                      const user = getMember(log.userId ?? log.actor ?? '');
                      return (
                        <div
                          key={log.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                          <span className="text-foreground">{user?.name}</span>
                          <span className="text-muted-foreground">{log.action ?? log.description}</span>
                          <span className="text-muted-foreground ml-auto">
                            {timeAgo(log.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
