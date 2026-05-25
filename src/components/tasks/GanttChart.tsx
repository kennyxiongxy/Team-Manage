import { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

// Timezone-safe date helpers
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function diffDays(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

function getMember(task: any) {
  // Try multiple sources for member name
  const name = task.assignee_name || task.assignee;
  if (name && name !== '未分配') {
    return { name: typeof name === 'string' ? name : name.name || '', avatar: task.assignee_avatar || '' };
  }
  return null;
}

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [zoom, setZoom] = useState<'day' | 'week'>('day');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fixedColRef = useRef<HTMLDivElement>(null);

  const { dateRange, days } = useMemo(() => {
    const today = todayStr();
    if (tasks.length === 0 || !tasks.some((t: Task) => t.dueDate)) {
      return { dateRange: [today, addDays(today, 14)] as [string, string], days: 15 };
    }
    let minDate = today;
    let maxDate = today;
    tasks.forEach((t) => {
      const s = t.startDate || t.dueDate;
      if (s && s < minDate) minDate = s;
      if (t.dueDate && t.dueDate > maxDate) maxDate = t.dueDate;
    });
    if (today < minDate) minDate = today;
    if (today > maxDate) maxDate = addDays(today, 14);
    minDate = addDays(minDate, -2);
    maxDate = addDays(maxDate, 5);
    const d = diffDays(minDate, maxDate) + 1;
    return { dateRange: [minDate, maxDate] as [string, string], days: Math.max(d, 14) };
  }, [tasks]);

  const today = todayStr();
  const todayOffset = diffDays(dateRange[0], today);
  const dayWidth = zoom === 'day' ? 48 : 24;
  const chartWidth = days * dayWidth;

  const dateLabels = useMemo(() => {
    const labels: { date: string; label: string; isWeekend: boolean }[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(dateRange[0], i);
      const d = new Date(date);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const label = zoom === 'day' ? formatDateLabel(date) : (d.getDay() === 1 ? formatDateLabel(date) : '');
      labels.push({ date, label, isWeekend });
    }
    return labels;
  }, [dateRange, days, zoom]);

  // Sync vertical scroll between chart area and fixed column
  useEffect(() => {
    const chartEl = scrollContainerRef.current;
    const fixedEl = fixedColRef.current;
    if (!chartEl || !fixedEl) return;
    const handler = () => { fixedEl.scrollTop = chartEl.scrollTop; };
    chartEl.addEventListener('scroll', handler, { passive: true });
    return () => chartEl.removeEventListener('scroll', handler);
  }, []);

  const getTaskOffset = (task: Task) => {
    const startDate = task.startDate || task.dueDate;
    if (!startDate) return 0;
    return diffDays(dateRange[0], startDate) * dayWidth;
  };

  const getTaskWidth = (task: Task) => {
    const startDate = task.startDate || task.dueDate;
    const dueDate = task.dueDate;
    if (!startDate || !dueDate) return dayWidth * 3;
    return Math.max(diffDays(startDate, dueDate) + 1, 1) * dayWidth;
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
          <button onClick={() => setZoom('day')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${zoom === 'day' ? 'bg-muted text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
            按天
          </button>
          <button onClick={() => setZoom('week')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${zoom === 'week' ? 'bg-muted text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
            按周
          </button>
        </div>
        <div className="text-xs text-muted-foreground">共 {tasks.length} 个任务</div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          暂无任务数据。创建任务并设置截止日期后，甘特图将在此显示。
        </div>
      ) : (
        /* Chart area: fixed left column + scrollable right area */
        <div className="flex">
          {/* Fixed left column */}
          <div className="shrink-0" style={{ width: 280 }}>
            {/* Column headers */}
            <div className="flex border-b border-border bg-muted">
              <div className="w-[140px] px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border">任务名</div>
              <div className="w-[70px] px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border">负责人</div>
              <div className="w-[70px] px-3 py-2 text-xs font-medium text-muted-foreground">优先级</div>
            </div>
            {/* Task info rows */}
            <div ref={fixedColRef} className="overflow-hidden" style={{ maxHeight: '55vh' }}>
              {tasks.map((task) => {
                const member = getMember(task);
                const barColor = priorityBarColors[task.priority] || '#3B82F6';
                return (
                  <div key={task.id}
                    className="flex border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => onTaskClick(task)}
                    style={{ height: 44 }}
                  >
                    <div className="w-[140px] px-3 flex items-center text-xs text-foreground truncate border-r border-border">
                      <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: barColor }} />
                      <span className="truncate">{task.title}</span>
                    </div>
                    <div className="w-[70px] px-3 flex items-center border-r border-border">
                      {member && <span className="text-[10px] text-muted-foreground truncate">{member.name}</span>}
                    </div>
                    <div className="w-[70px] px-3 flex items-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: priorityBarColors[task.priority] + '20', color: priorityBarColors[task.priority] }}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable chart bars */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto">
            <div style={{ width: chartWidth, maxHeight: '55vh' }}>
              {/* Date headers */}
              <div className="flex border-b border-border bg-muted">
                {dateLabels.map((dl, i) => (
                  <div key={i}
                    className="shrink-0 border-r border-border/30 flex items-center justify-center"
                    style={{ width: dayWidth, backgroundColor: dl.isWeekend ? 'rgba(30,41,59,0.15)' : undefined }}>
                    <span className="text-[10px] text-muted-foreground">{dl.label}</span>
                  </div>
                ))}
              </div>
              {/* Task bars */}
              {tasks.map((task, idx) => {
                const offset = getTaskOffset(task);
                const width = getTaskWidth(task);
                const barColor = priorityBarColors[task.priority] || '#3B82F6';
                return (
                  <div key={task.id} className="relative" style={{ width: chartWidth, height: 44 }}>
                    {/* Weekend backgrounds */}
                    {dateLabels.map((dl, i) =>
                      dl.isWeekend ? (
                        <div key={i} className="absolute top-0 bottom-0 bg-[rgba(30,41,59,0.1)]"
                          style={{ left: i * dayWidth, width: dayWidth }} />
                      ) : null
                    )}
                    {/* Today line */}
                    {todayOffset >= 0 && todayOffset < days && (
                      <div className="absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-accent"
                        style={{ left: todayOffset * dayWidth + dayWidth / 2 }}>
                        <span className="absolute -top-0 left-1/2 -translate-x-1/2 bg-accent text-white text-[9px] font-bold px-1 rounded-b whitespace-nowrap">今天</span>
                      </div>
                    )}
                    {/* Task bar */}
                    <div className="absolute top-2 h-7 rounded flex items-center px-2 overflow-hidden border-b border-border/30"
                      style={{ left: offset, width: Math.max(width, 40), backgroundColor: barColor + '15', borderLeft: `3px solid ${barColor}` }}>
                      <div className="absolute top-0 left-0 bottom-0 opacity-40 rounded-r" style={{ width: `${task.progress}%`, backgroundColor: barColor }} />
                      <span className="relative z-10 text-[10px] text-foreground truncate">{width > 50 ? task.title : ''}</span>
                      <span className="relative z-10 text-[10px] text-muted-foreground ml-auto shrink-0">{task.progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
