import { useState, useMemo, useCallback } from 'react';
import { useUserRole } from '@/context/UserRoleContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  GanttChart as GanttIcon,
  List,
  Plus,
  Search,
  X,
  Filter,
  UserCircle,
  FolderOpen,
  Flag,
  CheckSquare,
  Trash2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  priorityConfig,
} from '@/data/mockData';
import type { Task, TaskStatus, Priority } from '@/data/mockData';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import GanttChart from '@/components/tasks/GanttChart';
import TaskList from '@/components/tasks/TaskList';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import PageHeader from '@/components/PageHeader';

type ViewMode = 'kanban' | 'gantt' | 'list';

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

export default function TaskCenter() {
  const { isEmployee, user } = useUserRole();
  const { tasks, loading: tasksLoading, addTask, editTask } = useTasks();
  const { users: teamMembers } = useUsers();
  const { projects } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>(isEmployee ? user.id : 'all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchId = task.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'all' && task.assigneeId !== assigneeFilter) return false;
      if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, assigneeFilter, projectFilter]);

  // View switch handler
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Task status change (for kanban drag-and-drop)
  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed' || newStatus === '已完成') {
        updates.progress = 100;
      }
      try {
        await editTask(taskId, updates);
        toast.success('任务状态已更新');
      } catch (err: any) {
        toast.error(err.message || '更新失败');
      }
    },
    [editTask]
  );

  // Task click -> open detail panel
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  // Task update
  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        await editTask(taskId, {
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          progress: updates.progress,
          dueDate: updates.dueDate,
          assigneeId: updates.assigneeId,
        });
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({ ...selectedTask, ...updates });
        }
        toast.success('任务已更新');
      } catch (err: any) {
        toast.error(err.message || '更新失败');
      }
    },
    [editTask, selectedTask]
  );

  // Create new task
  const handleCreateTask = useCallback(
    async (newTask: {
      title: string;
      description: string;
      projectId: string;
      assigneeId: string;
      priority: Priority;
      status: TaskStatus;
      dueDate: string;
    }) => {
      try {
        await addTask({
          title: newTask.title,
          description: newTask.description,
          projectId: newTask.projectId || null,
          assigneeId: newTask.assigneeId || null,
          priority: newTask.priority,
          status: newTask.status === '未开始' ? 'not-started' : newTask.status === '进行中' ? 'in-progress' : newTask.status === '待审核' ? 'pending-review' : newTask.status === '已完成' ? 'completed' : newTask.status,
          dueDate: newTask.dueDate,
        });
        toast.success('任务创建成功');
        setCreateModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || '创建失败');
      }
    },
    [addTask]
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setProjectFilter('all');
  };

  const hasFilters =
    searchQuery ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    projectFilter !== 'all';

  const viewIcons = [
    { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: '看板' },
    { mode: 'gantt' as ViewMode, icon: GanttIcon, label: '甘特图' },
    { mode: 'list' as ViewMode, icon: List, label: '列表' },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <PageHeader title={isEmployee ? "我的任务" : "任务中心"} />

      {/* Header Control Bar */}
      <motion.div
        className="sticky top-0 z-30 bg-card border-b border-border"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: easeValues }}
      >
        <div className="px-6 py-4">
          {/* Top Row: Title + View Switcher + Create */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-muted-foreground">
                  {tasksLoading ? '加载中...' : isEmployee ? `您有 ${filteredTasks.filter(t => t.status === '进行中' || t.status === 'in-progress').length} 个进行中任务` : `${filteredTasks.length} 个任务`}
                </span>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-background rounded-lg p-0.5">
                {viewIcons.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => handleViewChange(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-muted text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isEmployee && (
                <motion.button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background:
                      'linear-gradient(135deg, #A855F7 0%, #3B82F6 50%, #06B6D4 100%)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  新建任务
                </motion.button>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-[200px] pl-9 pr-3 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground placeholder-[#64748B] focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Project Filter */}
            <div className="relative">
              <FolderOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="pl-8 pr-6 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="all">全部项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              {(Object.keys(priorityConfig) as Priority[]).map((p) => {
                const config = priorityConfig[p];
                const active = priorityFilter === p;
                return (
                  <button
                    key={p}
                    onClick={() =>
                      setPriorityFilter(active ? 'all' : p)
                    }
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: active ? config.bg : 'transparent',
                      color: active ? config.color : '#64748B',
                      borderColor: active ? config.color + '40' : '#334155',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {!isEmployee && (
              <div className="relative">
                <UserCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="pl-8 pr-6 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">全部人员</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter (for list view mainly) */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="pl-8 pr-6 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="未开始">未开始</option>
                <option value="进行中">进行中</option>
                <option value="待审核">待审核</option>
                <option value="已完成">已完成</option>
              </select>
            </div>

            {/* Clear Filters */}
            <AnimatePresence>
              {hasFilters && (
                <motion.button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <X className="w-3 h-3" />
                  清除筛选
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <AnimatePresence mode="wait">
          {viewMode === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <KanbanBoard
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          )}
          {viewMode === 'gantt' && (
            <motion.div
              key="gantt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GanttChart
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
              />
            </motion.div>
          )}
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TaskList
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Action Bar (List view only, when tasks selected) */}
      <AnimatePresence>
        {viewMode === 'list' && selectedIds.length > 0 && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
            initial={{ y: 56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 56, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeValues }}
          >
            <div className="flex items-center gap-2 border-r border-border pr-3">
              <CheckSquare className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">
                已选 {selectedIds.length} 项
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                取消
              </button>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Flag className="w-3.5 h-3.5" />
              更改优先级
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <UserCircle className="w-3.5 h-3.5" />
              更改负责人
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Send className="w-3.5 h-3.5" />
              批量提醒
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateTask}
      />

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
