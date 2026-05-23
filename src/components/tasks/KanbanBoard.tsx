import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, MessageSquare, Paperclip } from 'lucide-react';
import { mockTeamMembers, mockProjects, priorityConfig, statusConfig } from '@/data/mockData';
import type { Task, TaskStatus } from '@/data/mockData';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'not-started', label: '待处理', color: '#94A3B8' },
  { status: 'in-progress', label: '进行中', color: '#3B82F6' },
  { status: '待审核', label: '审核中', color: '#F97316' },
  { status: 'completed', label: '已完成', color: '#22C55E' },
];

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

function getMember(memberId: string) {
  return mockTeamMembers.find((m) => m.id === memberId);
}

function getProject(projectId: string) {
  return mockProjects.find((p) => p.id === projectId);
}

function isOverdue(dueDate: string, status: TaskStatus) {
  return new Date(dueDate) < new Date() && status !== '已完成';
}

function isDueToday(dueDate: string) {
  const today = new Date().toISOString().split('T')[0];
  return dueDate === today;
}

function formatDueDate(dueDate: string, status: TaskStatus) {
  const d = new Date(dueDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (isOverdue(dueDate, status)) {
    return { text: `${month}/${day}`, color: '#EF4444' };
  }
  if (isDueToday(dueDate)) {
    return { text: '今天', color: '#F97316' };
  }
  return { text: `${month}/${day}`, color: '#94A3B8' };
}

export default function KanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggingId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggingId) {
      onStatusChange(draggingId, status);
    }
    setDraggingId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col, colIdx) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isDragOver = dragOverColumn === col.status;

        return (
          <motion.div
            key={col.status}
            className={`rounded-lg overflow-hidden flex flex-col min-h-[400px] ${
              isDragOver ? 'bg-muted' : 'bg-card'
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: colIdx * 0.1,
              ease: easeValues,
            }}
            style={{
              borderTop: `3px solid ${col.color}`,
            }}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 bg-muted">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {col.label}
                </h3>
                <span className="text-xs text-muted-foreground bg-card px-1.5 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tasks */}
            <div
              className="flex-1 p-3 space-y-3 overflow-y-auto"
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {colTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">暂无任务</p>
                  <p className="text-xs text-muted-foreground">点击添加</p>
                </div>
              ) : (
                colTasks.map((task, taskIdx) => {
                  const project = getProject(task.projectId ?? '');
                  const priority = priorityConfig[task.priority];
                  const due = formatDueDate(task.dueDate, task.status);
                  const isDragging = draggingId === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onClick={() => onTaskClick(task)}
                      className="rounded-lg bg-muted p-3 cursor-pointer group"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{
                        scale: isDragging ? 1.02 : 1,
                        opacity: isDragging ? 0.8 : 1,
                      }}
                      transition={{
                        duration: 0.2,
                        delay: taskIdx * 0.05,
                      }}
                      whileHover={{
                        y: -2,
                        boxShadow: 'var(--shadow-hover)',
                      }}
                      style={{
                        borderTop: `2px solid ${priority.color}`,
                      }}
                    >
                      {/* Project Tag */}
                      {project && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] text-muted-foreground bg-card mb-2">
                          {project.name}
                        </span>
                      )}

                      {/* Title */}
                      <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {/* Due Date */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Calendar className="w-3 h-3" style={{ color: due.color }} />
                        <span className="text-xs" style={{ color: due.color }}>
                          {due.text}
                        </span>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between">
                        {/* Avatars */}
                        <div className="flex -space-x-1.5">
                          {[task.assigneeId, ...(task.collaboratorIds ?? [])]
                            .filter((uid): uid is string => !!uid)
                            .slice(0, 3)
                            .map((uid) => {
                              const m = getMember(uid);
                              return m ? (
                                <img
                                  key={uid}
                                  src={m.avatar}
                                  alt={m.name}
                                  className="w-5 h-5 rounded-full border border-border"
                                  title={m.name}
                                />
                              ) : null;
                            })}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {(task.comments ?? []).length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <MessageSquare className="w-3 h-3" />
                              {(task.comments ?? []).length}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Paperclip className="w-3 h-3" />
                            0
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${task.progress}%`,
                            background:
                              'linear-gradient(90deg, #06B6D4 0%, #22C55E 100%)',
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
