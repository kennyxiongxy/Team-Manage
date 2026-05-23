import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { taProjects } from '@/data/mockData';
import type { ProjectHealth, Milestone } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function getRiskBorder(level: string) {
  switch (level) {
    case 'high': return 'border-l-[3px] border-l-destructive';
    case 'medium': return 'border-l-[3px] border-l-[#F97316]';
    case 'low': return 'border-l-[3px] border-l-[#F97316]/50';
    default: return 'border-l-[3px] border-l-[#22C55E]';
  }
}

function getHealthColor(score: number) {
  if (score >= 9) return 'text-[#22C55E]';
  if (score >= 7) return 'text-[#F97316]';
  if (score >= 5) return 'text-[#F97316]';
  return 'text-destructive';
}

function getRiskBg(level: string) {
  switch (level) {
    case 'high': return 'bg-[#EF4444]/15 text-destructive';
    case 'medium': return 'bg-[#F97316]/15 text-[#F97316]';
    case 'low': return 'bg-[#F97316]/10 text-[#F97316]/80';
    default: return 'bg-[#22C55E]/15 text-[#22C55E]';
  }
}

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="flex items-center gap-1 mt-3 overflow-x-auto">
      {milestones.map((ms, i) => (
        <div key={i} className="flex items-center shrink-0">
          <div className="flex flex-col items-center">
            {ms.status === 'completed' && (
              <div className="w-6 h-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              </div>
            )}
            {ms.status === 'current' && (
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center relative">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <div className="absolute w-6 h-6 rounded-full border border-accent animate-ping opacity-30" />
              </div>
            )}
            {ms.status === 'pending' && (
              <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center">
                <Circle className="w-3 h-3 text-[#334155]" />
              </div>
            )}
            {ms.status === 'overdue' && (
              <div className="w-6 h-6 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">{ms.name}</span>
            <span className="text-[9px] text-muted-foreground">{ms.date}</span>
          </div>
          {i < milestones.length - 1 && (
            <div className={`w-6 h-[2px] mx-1 shrink-0 ${
              ms.status === 'completed' ? 'bg-[#22C55E]' : 'bg-muted border-t border-dashed border-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SegmentedProgress({ progress, planned }: { progress: number; planned: number }) {
  const completed = Math.min(progress, planned);
  const inProgress = Math.max(0, planned - progress);
  const notStarted = Math.max(0, 100 - planned);

  return (
    <div className="w-full h-3 bg-card rounded-full overflow-hidden flex">
      <motion.div
        className="h-full bg-[#22C55E]"
        initial={{ width: 0 }}
        animate={{ width: `${completed}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
      {progress < planned && (
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${inProgress}%` }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      <motion.div
        className="h-full bg-muted"
        initial={{ width: 0 }}
        animate={{ width: `${notStarted}%` }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

function ProjectCard({ project, index }: { project: ProjectHealth; index: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className={`bg-muted rounded-xl p-5 ${getRiskBorder(project.riskLevel)} hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left - Project Info */}
        <div className="lg:col-span-1 space-y-2">
          <div>
            <h3 className="text-foreground font-semibold text-base">{project.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-xs bg-card px-2 py-0.5 rounded">{project.tag}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                project.status === 'completed' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                project.status === 'at-risk' ? 'bg-[#EF4444]/15 text-destructive' :
                'bg-primary/15 text-primary'
              }`}>
                {project.status === 'active' ? '进行中' : project.status === 'completed' ? '已完成' : '风险中'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(project.members, 5) }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-muted border border-[#1E293B] flex items-center justify-center -ml-1 first:ml-0">
                <span className="text-[9px] text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              </div>
            ))}
            {project.members > 5 && (
              <span className="text-[10px] text-muted-foreground ml-1">+{project.members - 5}</span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{project.members} 人参与</p>
        </div>

        {/* Center - Progress & Milestones */}
        <div className="lg:col-span-2 space-y-3">
          <SegmentedProgress progress={project.progress} planned={project.plannedProgress} />
          <div className="flex items-center gap-3 text-xs">
            <span className="text-foreground font-semibold">整体 {project.progress}%</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">计划 {project.plannedProgress}%</span>
            {project.lag > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-destructive font-semibold">滞后 {project.lag}%</span>
              </>
            )}
            {project.lag < 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-[#22C55E] font-semibold">超前 {Math.abs(project.lag)}%</span>
              </>
            )}
          </div>
          <MilestoneTimeline milestones={project.milestones} />
        </div>

        {/* Right - Health Score */}
        <div className="lg:col-span-1 space-y-3 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-4">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold font-mono ${getHealthColor(project.healthScore)}`}>
              {project.healthScore}/10
            </span>
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getRiskBg(project.riskLevel)}`}>
              {project.riskLevel === 'high' && <AlertTriangle className="w-3 h-3" />}
              {project.riskLabel}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">任务完成率</span>
              <span className="text-foreground font-mono">{project.metrics.taskCompletionRate}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">逾期任务</span>
              <span className={project.metrics.overdueTasks > 0 ? 'text-destructive font-mono' : 'text-[#22C55E] font-mono'}>
                {project.metrics.overdueTasks} 个
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">预计延期</span>
              <span className={project.metrics.estimatedDelay > 0 ? 'text-[#F97316] font-mono' : 'text-[#22C55E] font-mono'}>
                {project.metrics.estimatedDelay} 天
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.hash = '#/'}
            className="text-accent text-xs flex items-center gap-1 hover:underline mt-2"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectHealthCards() {
  const [filter, setFilter] = useState('all');

  const filtered = taProjects.filter((p) => {
    if (filter === 'healthy') return p.riskLevel === 'none' || p.riskLevel === 'low';
    if (filter === 'warning') return p.riskLevel === 'medium';
    if (filter === 'risk') return p.riskLevel === 'high';
    return true;
  });

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'healthy', label: '健康' },
    { key: 'warning', label: '预警' },
    { key: 'risk', label: '风险' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-foreground text-xl font-semibold">项目健康度</h2>
          <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-md">{taProjects.length} 个项目</span>
        </div>
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
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>暂无项目数据</p>
            <p className="text-xs mt-1">连接飞书后可同步项目健康度分析</p>
          </div>
        ) : (
          filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))
        )}
      </div>
    </section>
  );
}
