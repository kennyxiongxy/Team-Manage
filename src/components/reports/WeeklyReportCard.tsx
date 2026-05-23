import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { weeklySummary } from '@/data/mockData';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const COLORS = {
  completed: '#22C55E',
  inProgress: '#3B82F6',
  overdue: '#EF4444',
  pendingReview: '#F97316',
};

function DonutChart({
  data,
  total,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
}) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {data.map((segment) => {
          const segmentLength = (segment.value / 100) * circumference;
          const dashArray = `${segmentLength} ${circumference - segmentLength}`;
          const currentOffset = offset;
          offset += segmentLength;
          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground font-mono">{total}</span>
        <span className="text-[10px] text-muted-foreground">完成任务</span>
      </div>
    </div>
  );
}

export default function WeeklyReportCard() {
  const stats = weeklySummary.completionStats;
  const chartData = [
    { label: '已完成', value: stats.completed, color: COLORS.completed },
    { label: '进行中', value: stats.inProgress, color: COLORS.inProgress },
    { label: '逾期', value: stats.overdue, color: COLORS.overdue },
    { label: '待审核', value: stats.pendingReview, color: COLORS.pendingReview },
  ];

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl bg-muted border border-border p-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: summary */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(168,85,247,0.15)]">
              <FileText className="h-5 w-5 text-[#A855F7]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                第 {weeklySummary.weekNumber} 周周报
              </h2>
              <p className="text-sm text-muted-foreground">{weeklySummary.dateRange}</p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {weeklySummary.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">
              生成时间：{weeklySummary.generatedAt}
            </span>
            <span className="rounded-full bg-[rgba(168,85,247,0.15)] px-2.5 py-0.5 text-[11px] text-[#A855F7]">
              {weeklySummary.status}
            </span>
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-4">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.label} {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: donut chart */}
        <div className="flex items-center justify-center">
          <DonutChart data={chartData} total={weeklySummary.totalCompleted} />
        </div>
      </div>
    </motion.div>
  );
}
