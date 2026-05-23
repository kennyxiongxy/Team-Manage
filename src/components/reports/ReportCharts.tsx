import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

// ─── Daily Trend Chart (Bar + Line) ───
export function DailyTrendChart({ data }: { data: { day: string; newTasks: number; completedTasks: number }[] }) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">每日任务趋势</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="newTasks" name="新增任务" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="completedTasks" name="完成任务" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─── Project Progress Chart (Horizontal Bar) ───
export function ProjectProgressChart({
  data,
}: {
  data: { projectName: string; planned: number; actual: number; atRisk: boolean }[];
}) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">项目进度对比</h3>
      <div className="space-y-4">
        {data.map((project) => (
          <div key={project.projectName}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-foreground">{project.projectName}</span>
              <div className="flex items-center gap-2">
                {project.atRisk && (
                  <span className="text-[10px] text-destructive">⚠ 风险</span>
                )}
                <span className="text-xs text-muted-foreground font-mono">{project.actual}%</span>
              </div>
            </div>
            <div className="relative h-2.5 rounded-full bg-card">
              {/* Planned */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-muted"
                style={{ width: `${project.planned}%` }}
              />
              {/* Actual */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.actual}%` }}
                transition={{ duration: 0.8, ease }}
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  project.atRisk ? 'bg-[#EF4444]' : 'bg-accent'
                )}
              />
            </div>
            <div className="mt-0.5 flex justify-between">
              <span className="text-[10px] text-muted-foreground">计划 {project.planned}%</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Weekly History Chart (Line) ───
export function WeeklyHistoryChart({
  data,
}: {
  data: { week: string; completed: number; overdue: number; avgLoad: number }[];
}) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">历史周报对比（过去8周）</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="完成任务数"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={{ fill: '#06B6D4', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="overdue"
            name="逾期任务数"
            stroke="#EF4444"
            strokeWidth={2}
            dot={{ fill: '#EF4444', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="avgLoad"
            name="平均负荷%"
            stroke="#A855F7"
            strokeWidth={2}
            dot={{ fill: '#A855F7', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─── Radar Chart for Efficiency ───
export function EfficiencyRadarChart({
  data,
}: {
  data: { subject: string; A: number; fullMark: number }[];
}) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">团队效率雷达图</h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748B', fontSize: 10 }}
          />
          <Radar
            name="团队效率"
            dataKey="A"
            stroke="#06B6D4"
            fill="#06B6D4"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// ─── Pie Chart for Task Distribution ───
export function TaskDistributionPie({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">任务状态分布</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-muted-foreground">
              {item.name} {item.value}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Member Load Bar Chart ───
export function MemberLoadChart({
  data,
}: {
  data: { name: string; load: number }[];
}) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl bg-muted border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">人员负荷分布</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 120]}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="load" name="负荷率" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.load > 100 ? '#EF4444' : entry.load > 80 ? '#F97316' : '#06B6D4'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
