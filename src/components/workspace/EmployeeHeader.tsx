import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell } from 'recharts';
import { personalStats } from '@/data/mockData';
import { useUserRole } from '@/context/UserRoleContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatDate() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const day = dayNames[now.getDay()];
  return `${month} 月 ${date} 日 星期${day}`;
}

function getWeekDayInfo() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
  return `本周第 ${dayNum} 个工作日`;
}

export default function EmployeeHeader() {
  const { user } = useUserRole();
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const pieData = useMemo(
    () => [
      { name: 'completed', value: personalStats.completed, color: '#06B6D4' },
      { name: 'remaining', value: personalStats.remaining, color: '#334155' },
    ],
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = personalStats.weekCompletion;
      const duration = 1000;
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        start = Math.round(end * eased);
        setAnimatedPercent(start);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="w-full rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Left - Greeting & Info */}
        <div className="flex-1 space-y-3">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
            {getGreeting()}，{user.name}
            <span className="ml-2 inline-block">👋</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {formatDate()} · {getWeekDayInfo()}
          </p>
          <p className="text-base font-medium text-muted-foreground">
            今天你有{' '}
            <span className="font-bold text-accent">{personalStats.remaining + personalStats.completed}</span>{' '}
            个任务，其中{' '}
            <span className="font-bold text-destructive">1</span>{' '}
            <span className="font-bold text-destructive">紧急</span>
          </p>
        </div>

        {/* Right - Progress Ring */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            <PieChart width={120} height={120}>
              <Pie
                data={pieData}
                cx={60}
                cy={60}
                innerRadius={44}
                outerRadius={54}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                <Cell fill="#06B6D4" />
                <Cell fill="#334155" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-extrabold tracking-tight text-accent"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {animatedPercent}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              本周任务完成度
            </p>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>
                已完成{' '}
                <span className="font-semibold text-[#22C55E]">{personalStats.completed}</span>
              </span>
              <span>|</span>
              <span>
                剩余{' '}
                <span className="font-semibold text-foreground">{personalStats.remaining}</span>
              </span>
              <span>|</span>
              <span>
                逾期{' '}
                <span className="font-semibold text-destructive">{personalStats.overdue}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
