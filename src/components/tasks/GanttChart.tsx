import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { priorityConfig } from '@/data/mockData';
import type { Task } from '@/data/mockData';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const priorityBarColors: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#3B82F6',
  low: '#22C55E',
};

const easeValues = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

function getMember(task: any) {
  // Real data: assignee is a string name, not an ID
  if (task.assignee && task.assignee !== '未分配') {
    return { name: task.assignee, avatar: '' };
  }
  return null;
}

function getProject(task: any) {
  if (task.project && task.project !== '未分配') {
    return { name: task.project, color: '#3B82F6' };
  }
  return null;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function diffDays(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [zoom, setZoom] = useState<'day' | 'week'>('day');

  const { dateRange, days } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (tasks.length === 0 || !tasks.some((t: Task) => t.dueDate)) {
      return { dateRange: [today, addDays(today, 14)], days: 15 };
    }
    const sd = (t: Task) => t.startDate || t.dueDate;
    let minDate = sd(tasks[0]);
    let maxDate = tasks[0].dueDate;
    tasks.forEach((t) => {
      const s = sd(t);
      if (s && s < minDate) minDate = s;
      if (t.dueDate && t.dueDate > maxDate) maxDate = t.dueDate;
    });
    // Add padding
    minDate = addDays(minDate, -2);
    maxDate = addDays(maxDate, 5);
    const d = diffDays(minDate, maxDate) + 1;
    return { dateRange: [minDate, maxDate] as [string, string], days: Math.max(d, 14) };
  }, [tasks]);

  const today = new Date().toISOString().split('T')[0];
  const todayOffset = diffDays(dateRange[0], today);

  const dayWidth = zoom === 'day' ? 48 : 24;
  const chartWidth = days * dayWidth;

  const dateLabels = useMemo(() => {
    const labels: { date: string; label: string; isWeekend: boolean }[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(dateRange[0], i);
      const d = new Date(date);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const label =
        zoom === 'day'
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : d.getDay() === 1
            ? `${d.getMonth() + 1}/${d.getDate()}`
            : '';
      labels.push({ date, label, isWeekend });
    }
    return labels;
  }, [dateRange, days, zoom]);

  const getTaskOffset = (task: Task) => {
    const startDate = task.startDate || task.dueDate;
    return diffDays(dateRange[0], startDate) * dayWidth;
  };

  const getTaskWidth = (task: Task) => {
    const startDate = task.startDate || task.dueDate;
    const dueDate = task.dueDate;
    const w = Math.max(diffDays(startDate, dueDate) + 1, 1) * dayWidth;
    return w;
  };

  return (
    <motion.div
      className="rounded-lg bg-card border border-border overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeValues }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom('day')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              zoom === 'day'
                ? 'bg-muted text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            按天
          </button>
          <button
            onClick={() => setZoom('week')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              zoom === 'week'
                ? 'bg-muted text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            按周
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          共 {tasks.length} 个任务
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth + 280 }}>
          {/* Header Row */}
          <div className="flex border-b border-border">
            {/* Fixed left columns */}
            <div className="sticky left-0 z-10 flex bg-muted shrink-0" style={{ width: 280 }}>
              <div className="w-[140px] px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border flex items-center">
                任务名
              </div>
              <div className="w-[70px] px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border flex items-center">
                负责人
              </div>
              <div className="w-[70px] px-3 py-2 text-xs font-medium text-muted-foreground flex items-center">
                优先级
              </div>
            </div>
            {/* Date headers */}
            <div className="flex" style={{ width: chartWidth }}>
              {dateLabels.map((dl, i) => (
                <div
                  key={i}
                  className="shrink-0 text-center py-2 text-[10px] text-muted-foreground border-r border-border"
                  style={{
                    width: dayWidth,
                    backgroundColor: dl.isWeekend ? 'rgba(30,41,59,0.5)' : 'transparent',
                  }}
                >
                  {dl.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {tasks.map((task, idx) => {
            const member = getMember(task.assigneeId ?? '');
            const priority = priorityConfig[task.priority];
            const barColor = priorityBarColors[task.priority];
            const offset = getTaskOffset(task);
            const width = getTaskWidth(task);

            return (
              <motion.div
                key={task.id}
                className="flex border-b border-border hover:bg-muted transition-colors cursor-pointer group"
                onClick={() => onTaskClick(task)}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.03, ease: easeValues }}
                style={{ transformOrigin: 'left' }}
              >
                {/* Fixed left */}
                <div
                  className="sticky left-0 z-10 flex bg-inherit shrink-0"
                  style={{ width: 280 }}
                >
                  <div className="w-[140px] px-3 py-2.5 text-xs text-foreground truncate border-r border-border flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-2 shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div className="w-[70px] px-3 py-2.5 border-r border-border flex items-center">
                    {member && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center text-[10px] font-bold text-accent">
                          {member.name.charAt(0)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {member.name.slice(0, 3)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-[70px] px-3 py-2.5 flex items-center">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: priority.bg,
                        color: priority.color,
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Timeline area */}
                <div className="relative" style={{ width: chartWidth, height: 44 }}>
                  {/* Weekend columns */}
                  {dateLabels.map((dl, i) =>
                    dl.isWeekend ? (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 bg-[rgba(30,41,59,0.3)]"
                        style={{
                          left: i * dayWidth,
                          width: dayWidth,
                        }}
                      />
                    ) : null
                  )}

                  {/* Today line */}
                  {todayOffset >= 0 && todayOffset < days && (
                    <div
                      className="absolute top-0 bottom-0 z-10 border-l border-dashed border-accent"
                      style={{ left: todayOffset * dayWidth }}
                    >
                      <div className="absolute -top-0 bg-accent text-accent-foreground text-[9px] font-bold px-1 rounded-b">
                        今天
                      </div>
                    </div>
                  )}

                  {/* Task Bar */}
                  <motion.div
                    className="absolute top-2 h-7 rounded flex items-center px-2 overflow-hidden"
                    style={{
                      left: offset,
                      width,
                      backgroundColor: barColor + '25',
                      borderLeft: `3px solid ${barColor}`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.03 + 0.1,
                      ease: easeValues,
                    }}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute top-0 left-0 bottom-0 opacity-30"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: barColor,
                      }}
                    />
                    <span className="relative z-10 text-[10px] text-foreground truncate">
                      {width > 80 && task.title}
                    </span>
                    <span className="relative z-10 text-[10px] text-muted-foreground ml-auto shrink-0">
                      {task.progress}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
