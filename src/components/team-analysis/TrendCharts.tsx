import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import { trendData, velocityData, priorityData, onTimeData } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function TaskCompletionChart() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="bg-muted rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="text-foreground font-semibold text-sm">任务完成趋势（30天）</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} interval={4} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} dot={false} name="已完成" />
          <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={2} dot={false} name="新建" strokeDasharray="4 4" />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function VelocityChart() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="bg-muted rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-accent" />
        <h3 className="text-foreground font-semibold text-sm">团队速度（周）</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={velocityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Bar dataKey="velocity" fill="#06B6D4" radius={[4, 4, 0, 0]} name="实际速度" />
          <Bar dataKey="planned" fill="#334155" radius={[4, 4, 0, 0]} name="计划速度" />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function PriorityChart() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: 0.16, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="bg-muted rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-accent" />
        <h3 className="text-foreground font-semibold text-sm">优先级分布</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={priorityData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {priorityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#F8FAFC' }}
            formatter={(value: number, name: string) => [`${value} 个任务`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
            formatter={(value: string) => <span style={{ color: '#94A3B8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function OnTimeChart() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="bg-muted rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="text-foreground font-semibold text-sm">准时交付率</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={onTimeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="onTimeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} interval={2} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[70, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#F8FAFC' }}
            formatter={(value: number) => [`${value}%`, '准时率']}
          />
          <Area type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} fill="url(#onTimeGrad)" name="准时率" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default function TrendCharts() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TaskCompletionChart />
      <VelocityChart />
      <PriorityChart />
      <OnTimeChart />
    </section>
  );
}
