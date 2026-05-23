import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Sparkles, LayoutGrid, Table, BarChart3 } from 'lucide-react';
import { taTeamMembers } from '@/data/mockData';
import type { TeamMember } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': return 'bg-[#22C55E]/20 text-[#22C55E]';
    case 'A': return 'bg-primary/20 text-primary';
    case 'B+': return 'bg-[#F97316]/20 text-[#F97316]';
    case 'B': return 'bg-[#94A3B8]/20 text-muted-foreground';
    case 'C': return 'bg-[#EF4444]/20 text-destructive';
    default: return 'bg-[#94A3B8]/20 text-muted-foreground';
  }
}

function getCardBorder(member: TeamMember) {
  if ((member.workloadPercent ?? 0) > 100) return 'border-t-2 border-t-[#EF4444]';
  if (member.grade === 'B' || member.grade === 'B+') return 'border-t-2 border-t-[#F97316]';
  return '';
}

const radarDataKeys = [
  { key: 'completion', label: '完成率' },
  { key: 'onTime', label: '准时率' },
  { key: 'quality', label: '质量' },
  { key: 'workload', label: '负荷' },
  { key: 'collaboration', label: '协作' },
];

function MemberRadar({ member }: { member: TeamMember }) {
  const data = radarDataKeys.map((rk) => ({
    subject: rk.label,
    A: member.radar ? member.radar[rk.key] || 0 : 0,
    fullMark: 100,
  }));

  return (
    <div style={{ width: 120, height: 120 }}>
      <ResponsiveContainer>
        <RadarChart cx={60} cy={55} outerRadius={40} data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 9 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={member.name}
            dataKey="A"
            stroke="#06B6D4"
            fill="#06B6D4"
            fillOpacity={0.2}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className={`bg-muted rounded-xl p-5 relative hover:-translate-y-[3px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200 cursor-pointer group ${getCardBorder(member)}`}
    >
      {member.aiNote && (
        <div className="absolute top-3 right-3 group/tooltip">
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
          <div className="absolute right-0 top-6 w-48 bg-muted border border-[#A855F7]/30 rounded-lg p-2 text-xs text-muted-foreground opacity-0 group-hover/group:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
            {member.aiNote}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0"
          style={{ backgroundColor: member.color + '40', border: `2px solid ${member.color}` }}>
          {member.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground font-semibold text-base">{member.name}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getGradeColor(member.grade || '')}`}>
              {member.grade}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">{member.role}</p>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <MemberRadar member={member} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <div className="text-foreground text-sm font-bold font-mono">{member.tasksCompleted}</div>
          <div className="text-muted-foreground text-[10px]">完成</div>
        </div>
        <div>
          <div className="text-[#22C55E] text-sm font-bold font-mono">{member.onTimeRate}%</div>
          <div className="text-muted-foreground text-[10px]">准时</div>
        </div>
        <div>
          <div className={`text-sm font-bold font-mono ${(member.workloadPercent ?? 0) > 100 ? 'text-destructive' : 'text-foreground'}`}>
            {member.workloadPercent}%
          </div>
          <div className="text-muted-foreground text-[10px]">负荷</div>
        </div>
      </div>

      <div className="border-t border-border pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">较上周</span>
          <span className={`font-mono font-semibold ${(member.weekOverWeek ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-destructive'}`}>
            {(member.weekOverWeek ?? 0) >= 0 ? '+' : ''}{member.weekOverWeek} 个任务
          </span>
        </div>
        <div className="w-full h-1.5 bg-card rounded-full mt-1.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: (member.weekOverWeek ?? 0) >= 0 ? '#22C55E' : '#EF4444' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(member.weekOverWeek ?? 0) * 20, 100)}%` }}
            transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function TableView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground text-xs uppercase">
            <th className="text-left p-3 rounded-tl-lg">成员</th>
            <th className="text-center p-3">评级</th>
            <th className="text-center p-3">完成率</th>
            <th className="text-center p-3">准时率</th>
            <th className="text-center p-3">质量分</th>
            <th className="text-center p-3">负荷</th>
            <th className="text-center p-3">耗时(天)</th>
            <th className="text-center p-3 rounded-tr-lg">协作</th>
          </tr>
        </thead>
        <tbody>
          {taTeamMembers.map((member, i) => (
            <motion.tr
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`${i % 2 === 0 ? 'bg-muted' : 'bg-muted'} hover:bg-muted transition-colors`}
            >
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: member.color + '40', border: `1px solid ${member.color}` }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="text-foreground font-medium">{member.name}</div>
                    <div className="text-muted-foreground text-xs">{member.role}</div>
                  </div>
                </div>
              </td>
              <td className="p-3 text-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getGradeColor(member.grade || '')}`}>
                  {member.grade}
                </span>
              </td>
              <td className="p-3 text-center text-foreground font-mono">{member.completionRate}%</td>
              <td className="p-3 text-center text-[#22C55E] font-mono">{member.onTimeRate}%</td>
              <td className="p-3 text-center text-foreground font-mono">{member.qualityScore}</td>
              <td className={`p-3 text-center font-mono ${(member.workloadPercent ?? 0) > 100 ? 'text-destructive' : 'text-foreground'}`}>
                {member.workloadPercent}%
              </td>
              <td className="p-3 text-center text-foreground font-mono">{member.avgTaskDuration}</td>
              <td className="p-3 text-center text-muted-foreground font-mono">{member.collabCount}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

function CompareView() {
  const scatterData = useMemo(() =>
    taTeamMembers.map((m: TeamMember) => ({
      name: m.name,
      workload: m.workloadPercent ?? 0,
      onTime: m.onTimeRate ?? 0,
      tasks: m.tasksCompleted ?? 0,
      color: m.color || '#94A3B8',
    })),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-muted rounded-xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-foreground font-semibold text-sm mb-1">负荷率 × 准时率 分布图</h3>
        <p className="text-muted-foreground text-xs">气泡大小 = 任务完成数 | 警戒线: 负荷 100%</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <div style={{ position: 'relative', width: '100%', height: 320 }}>
          <svg width="100%" height="100%" viewBox="0 0 700 300">
            <rect x="50" y="10" width="600" height="250" fill="#0F172A" rx="4" />
            {/* Overload zone */}
            <rect x="450" y="10" width="200" height="250" fill="rgba(239,68,68,0.06)" />
            {/* Grid lines */}
            {[0, 25, 50, 75, 100, 125, 150].map((v) => (
              <g key={v}>
                <line x1={50 + (v / 150) * 600} y1={10} x2={50 + (v / 150) * 600} y2={260} stroke="#334155" strokeWidth={0.5} strokeDasharray={v === 100 ? "0" : "4"} />
                <text x={50 + (v / 150) * 600} y={275} textAnchor="middle" fill="#94A3B8" fontSize={9}>{v}%</text>
              </g>
            ))}
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={`y-${v}`}>
                <line x1={50} y1={10 + (1 - v / 100) * 250} x2={650} y2={10 + (1 - v / 100) * 250} stroke="#334155" strokeWidth={0.5} strokeDasharray="4" />
                <text x={42} y={14 + (1 - v / 100) * 250} textAnchor="end" fill="#94A3B8" fontSize={9}>{v}%</text>
              </g>
            ))}
            {/* Warning line at 100% workload */}
            <line x1={450} y1={10} x2={450} y2={260} stroke="#F97316" strokeWidth={1.5} strokeDasharray="6" />
            <text x={455} y={25} fill="#F97316" fontSize={9}>100% 警戒线</text>
            {/* Scatter points */}
            {scatterData.map((d: { name: string; workload: number; onTime: number; tasks: number; color: string }) => {
              const cx = 50 + (d.workload / 150) * 600;
              const cy = 10 + (1 - d.onTime / 100) * 250;
              const r = Math.max(6, Math.sqrt(d.tasks) * 2.5);
              return (
                <g key={d.name}>
                  <circle cx={cx} cy={cy} r={r} fill={d.color + '40'} stroke={d.color} strokeWidth={2} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#F8FAFC" fontSize={8} fontWeight="bold">{d.name[0]}</text>
                </g>
              );
            })}
            {/* Axis labels */}
            <text x="350" y={295} textAnchor="middle" fill="#94A3B8" fontSize={11}>负荷率 (%)</text>
            <text x={15} y={140} textAnchor="middle" fill="#94A3B8" fontSize={11} transform="rotate(-90, 15, 140)">准时率 (%)</text>
          </svg>
        </div>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default function EfficiencyMatrix() {
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'compare'>('card');

  const filteredMembers = useMemo(() => {
    switch (filter) {
      case 'high': return taTeamMembers.filter((m: TeamMember) => m.grade === 'A+' || m.grade === 'A');
      case 'attention': return taTeamMembers.filter((m: TeamMember) => m.grade === 'B+' || m.grade === 'B');
      case 'overload': return taTeamMembers.filter((m: TeamMember) => (m.workloadPercent ?? 0) > 100);
      default: return taTeamMembers;
    }
  }, [filter]);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'high', label: '高效' },
    { key: 'attention', label: '需关注' },
    { key: 'overload', label: '超负荷' },
  ];

  return (
    <motion.section
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-foreground text-xl font-semibold">人员效率分析</h2>
          <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-md">{taTeamMembers.length} 位成员</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  filter === f.key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5 ml-2">
            {([
              { key: 'card', icon: LayoutGrid },
              { key: 'table', icon: Table },
              { key: 'compare', icon: BarChart3 },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === v.key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'card' && (
          <motion.div
            key="card-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {filteredMembers.map((member: TeamMember, index: number) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </motion.div>
        )}
        {viewMode === 'table' && <TableView key="table-view" />}
        {viewMode === 'compare' && <CompareView key="compare-view" />}
      </AnimatePresence>
    </motion.section>
  );
}
