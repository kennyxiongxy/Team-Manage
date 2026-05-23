import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, ChevronDown, Sparkles, AlertTriangle, ShieldCheck, AlertCircle, Users, FileText } from 'lucide-react';
import DailyReportList from '@/components/reports/DailyReportList';
import WeeklyReportCard from '@/components/reports/WeeklyReportCard';
import ReportExport from '@/components/reports/ReportExport';
import ManagerReportDashboard from '@/components/reports/ManagerReportDashboard';
import PageHeader from '@/components/PageHeader';
import {
  DailyTrendChart,
  ProjectProgressChart,
  WeeklyHistoryChart,
  MemberLoadChart,
  TaskDistributionPie,
} from '@/components/reports/ReportCharts';
import {
  dailyReports,
} from '@/data/mockData';
import { useSystemData } from '@/hooks/useSystemData';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

type ReportTab = 'daily' | 'weekly' | 'daily-management';

// ─── Daily Summary Bar ───
function DailySummaryBar({ summary }: { summary: { completedTasks: number; completedChange: number; inProgressTasks: number; inProgressChange: number; newOverdue: number; aiGeneratedReports: number } }) {
  const items = [
    { label: '今日完成任务', value: summary.completedTasks, change: summary.completedChange, changeLabel: `+${summary.completedChange}`, isPositive: true },
    { label: '进行中任务', value: summary.inProgressTasks, change: summary.inProgressChange, changeLabel: `${summary.inProgressChange}`, isPositive: true },
    { label: '新增逾期', value: summary.newOverdue, change: 0, changeLabel: '需关注', isPositive: false, highlight: true },
    { label: 'AI生成日报数', value: summary.aiGeneratedReports, change: 0, changeLabel: '全员覆盖', isPositive: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease }}
          className={cn(
            'rounded-xl p-4 border',
            item.highlight
              ? 'bg-destructive/5 border-[rgba(239,68,68,0.2)]'
              : 'bg-muted border-border'
          )}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p
            className={cn(
              'mt-1 text-2xl font-bold font-mono',
              item.highlight ? 'text-destructive' : 'text-foreground'
            )}
          >
            {item.value}
          </p>
          <p className={cn('mt-0.5 text-xs', item.isPositive ? 'text-[#22C55E]' : 'text-destructive')}>
            {item.changeLabel}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Daily AI Summary ───
function DailyAiSummary({ summary }: { summary: string[] }) {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease }}
      className="rounded-2xl bg-muted border border-[rgba(168,85,247,0.3)] p-5 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#A855F7]" />
        <h2 className="text-base font-semibold text-foreground">AI 日报分析</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{summary[0]}</p>
      <ul className="space-y-2">
        {summary.slice(1).map((item, i) => (
          <motion.li
            key={i}
            initial={{ x: 5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05, ease }}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A855F7]" />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Weekly KPI Cards ───
function WeeklyKpiCards({ kpis }: { kpis: { label: string; value: number; unit?: string; change: number; changeLabel: string; isPositive: boolean }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease }}
          className="rounded-xl bg-muted border border-border p-4"
        >
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground font-mono">
            {kpi.value}
            {kpi.unit && <span className="text-base ml-0.5">{kpi.unit}</span>}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            {kpi.change > 0 ? (
              kpi.isPositive ? (
                <TrendingUp className="h-3 w-3 text-[#22C55E]" />
              ) : (
                <TrendingUp className="h-3 w-3 text-destructive" />
              )
            ) : kpi.change < 0 ? (
              kpi.isPositive ? (
                <TrendingDown className="h-3 w-3 text-[#22C55E]" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-xs',
                kpi.isPositive ? 'text-[#22C55E]' : 'text-destructive'
              )}
            >
              {kpi.changeLabel}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Member Stats Table ───
function MemberStatsTable({ members }: { members: { memberId: string; memberName: string; completed: number; overdue: number; onTimeRate: number; avgDuration: string; loadRate: number; qualityScore: number; grade: string }[] }) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A+')) return 'text-[#22C55E]';
    if (grade.startsWith('A')) return 'text-primary';
    if (grade.startsWith('B+')) return 'text-[#F97316]';
    if (grade.startsWith('B')) return 'text-[#EAB308]';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease }}
      className="rounded-2xl bg-muted border border-border overflow-hidden"
    >
      <div className="p-5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">人员效率矩阵</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              {['成员', '完成任务', '逾期', '准时率', '平均耗时', '负荷率', '质量分', '评级'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <motion.tr
                key={member.memberId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'border-t border-border transition-colors hover:bg-muted/30',
                  index % 2 === 1 ? 'bg-muted' : 'bg-muted'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-semibold text-foreground">{member.memberName[0]}</span>
                    </div>
                    <span className="text-sm text-foreground">{member.memberName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-foreground">{member.completed}</td>
                <td className="px-4 py-3 text-sm font-mono text-destructive">{member.overdue}</td>
                <td className="px-4 py-3 text-sm font-mono text-foreground">{member.onTimeRate}%</td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{member.avgDuration}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-sm font-mono',
                    member.loadRate > 100 ? 'text-destructive' : member.loadRate > 80 ? 'text-[#F97316]' : 'text-[#22C55E]'
                  )}>
                    {member.loadRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-foreground">{member.qualityScore}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-bold', getGradeColor(member.grade))}>
                    {member.grade}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ─── Weekly AI Analysis ───
function WeeklyAiAnalysis({ analysis }: { analysis: { taskAnalysis: string; peopleAnalysis: string; suggestions: { id: number; text: string; priority: string }[]; risks: { level: string; text: string }[] } }) {
  const { taskAnalysis, peopleAnalysis, suggestions, risks } = analysis;

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-[#F97316]" />;
      case 'low':
        return <ShieldCheck className="h-4 w-4 text-[#22C55E]" />;
    }
  };

  const getRiskBorder = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-l-destructive';
      case 'medium':
        return 'border-l-[#F97316]';
      case 'low':
        return 'border-l-[#22C55E]';
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease }}
      className="rounded-2xl bg-muted border border-[rgba(168,85,247,0.3)] p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-5 w-5 text-[#A855F7]" />
        <h2 className="text-lg font-semibold text-foreground">AI 深度分析与下周建议</h2>
      </div>

      {/* Task Analysis */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-accent mb-2">📋 任务分析</h3>
        <p className="text-sm leading-relaxed text-foreground">{taskAnalysis}</p>
      </div>

      {/* People Analysis */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-accent mb-2">👥 人员分析</h3>
        <p className="text-sm leading-relaxed text-foreground">{peopleAnalysis}</p>
      </div>

      {/* Suggestions */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-accent mb-2">🗓️ 周期建议</h3>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.1, ease }}
              className="flex items-start gap-2.5 rounded-lg bg-card p-3 border border-border"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  s.priority === 'high' ? 'bg-[#EF4444] text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {s.id}
              </span>
              <p className="text-sm text-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Risk Warnings */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-2">⚠️ 风险预警</h3>
        <div className="space-y-2">
          {risks.map((risk, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5 rounded-lg border border-border border-l-[3px] bg-card p-3',
                getRiskBorder(risk.level)
              )}
            >
              {getRiskIcon(risk.level)}
              <p className="text-sm text-foreground">{risk.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Reports Page ───
export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [showHistory, setShowHistory] = useState(false);

  const { data: dailySummaryData } = useSystemData('dailySummary');
  const { data: dailyAiSummaryData } = useSystemData('dailyAiSummary');
  const { data: weeklyKpisData } = useSystemData('weeklyKpis');
  const { data: dailyTrendData } = useSystemData('dailyTrendData');
  const { data: projectProgressData } = useSystemData('projectProgressData');
  const { data: weeklyMemberStatsData } = useSystemData('weeklyMemberStats');
  const { data: weeklyAiAnalysisData } = useSystemData('weeklyAiAnalysis');
  const { data: weeklyHistoryData } = useSystemData('weeklyHistoryData');
  const { data: taTeamMembersData } = useSystemData('taTeamMembers');


  // fallback mock data when system data is not available
  const fallbackDailySummary = { completedTasks: 12, completedChange: 8, inProgressTasks: 25, inProgressChange: 3, newOverdue: 2, aiGeneratedReports: 5 };
  const fallbackDailyAiSummary = ['今日团队整体效率良好，12个任务已完成。', '前端重构进展顺利，已完成首页和仪表盘', 'API集成测试通过，性能指标达标', '有2个任务出现逾期，需关注'];
  const fallbackWeeklyKpis = [
    { label: '完成任务数', value: 42, change: 12, changeLabel: '+12', isPositive: true },
    { label: '平均完成率', value: 92, unit: '%', change: 3, changeLabel: '+3%', isPositive: true },
    { label: '新任务数', value: 28, change: -5, changeLabel: '-5', isPositive: false },
    { label: '逾期率', value: 3.2, unit: '%', change: 1.1, changeLabel: '+1.1%', isPositive: false },
  ];
  const fallbackDailyTrend = [
    { day: '周一', completed: 8, onTime: 6 }, { day: '周二', completed: 10, onTime: 8 },
    { day: '周三', completed: 14, onTime: 12 }, { day: '周四', completed: 7, onTime: 5 },
    { day: '周五', completed: 12, onTime: 10 }, { day: '周六', completed: 3, onTime: 3 },
    { day: '周日', completed: 2, onTime: 2 },
  ];
  const fallbackProjectProgress = [
    { name: '统御升级', total: 24, completed: 18 }, { name: '培训平台', total: 16, completed: 5 },
    { name: '基础设施', total: 12, completed: 7 },
  ];
  const fallbackWeeklyMemberStats = [
    { memberId: '1', memberName: '陆河', completed: 15, overdue: 1, onTimeRate: 93, avgDuration: '2.5h', loadRate: 85, qualityScore: 90, grade: 'A' },
    { memberId: '2', memberName: '胡念祖', completed: 12, overdue: 2, onTimeRate: 83, avgDuration: '3.2h', loadRate: 78, qualityScore: 82, grade: 'B+' },
  ];
  const fallbackWeeklyAiAnalysis = {
    taskAnalysis: '本周团队整体表现稳定，任务完成率维持在较高水平',
    peopleAnalysis: '团队成员负荷分布合理，无明显过载',
    suggestions: [
      { id: 1, text: '关注逾期任务的根因分析', priority: 'high' },
      { id: 2, text: '推进培训平台数据导入功能', priority: 'medium' },
    ],
    risks: [
      { level: 'medium', text: 'API限流可能影响数据同步频率' },
    ],
  };
  const fallbackWeeklyHistory = [
    { week: 'W20', completed: 28, overdue: 2 }, { week: 'W21', completed: 32, overdue: 3 },
    { week: 'W22', completed: 35, overdue: 1 }, { week: 'W23', completed: 42, overdue: 2 },
  ];

  const taskDistData = [
    { name: '已完成', value: 65, color: '#22C55E' },
    { name: '进行中', value: 25, color: '#3B82F6' },
    { name: '逾期', value: 7, color: '#EF4444' },
    { name: '待审核', value: 3, color: '#F97316' },
  ];

  const memberLoadData = (taTeamMembersData ?? []).map((m: any) => ({
    name: m.name,
    load: m.load ?? 0,
  }));

  const effectiveDailySummary = dailySummaryData || fallbackDailySummary;
  const effectiveDailyAiSummary = dailyAiSummaryData || fallbackDailyAiSummary;
  const effectiveWeeklyKpis = weeklyKpisData || fallbackWeeklyKpis;
  const effectiveDailyTrend = dailyTrendData || fallbackDailyTrend;
  const effectiveProjectProgress = projectProgressData || fallbackProjectProgress;
  const effectiveWeeklyMemberStats = weeklyMemberStatsData || fallbackWeeklyMemberStats;
  const effectiveWeeklyAiAnalysis = weeklyAiAnalysisData || fallbackWeeklyAiAnalysis;
  const effectiveWeeklyHistory = weeklyHistoryData || fallbackWeeklyHistory;

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="日报与周报" subtitle="AI 自动汇总 · 管理者深度分析 · 员工简洁日报" />

        {/* ─── Header ─── */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease }}
          className="mb-6 rounded-2xl bg-card border border-border p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Right: Tabs + Export */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Tab switcher */}
              <div className="flex rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={cn(
                    'relative rounded-md px-5 py-2 text-sm font-medium transition-colors',
                    activeTab === 'daily'
                      ? 'bg-card text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  日报
                  {activeTab === 'daily' && (
                    <motion.div
                      layoutId="report-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={cn(
                    'relative rounded-md px-5 py-2 text-sm font-medium transition-colors',
                    activeTab === 'weekly'
                      ? 'bg-card text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  周报
                  {activeTab === 'weekly' && (
                    <motion.div
                      layoutId="report-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('daily-management')}
                  className={cn(
                    'relative rounded-md px-5 py-2 text-sm font-medium transition-colors',
                    activeTab === 'daily-management'
                      ? 'bg-card text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    日报管理
                  </span>
                  {activeTab === 'daily-management' && (
                    <motion.div
                      layoutId="report-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent"
                    />
                  )}
                </button>
              </div>

              <ReportExport />
            </div>
          </div>
        </motion.div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          {activeTab === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-6"
            >
              <DailySummaryBar summary={effectiveDailySummary} />
              <DailyAiSummary summary={effectiveDailyAiSummary} />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">团队日报列表</h3>
                <DailyReportList reports={dailyReports} />
              </div>
            </motion.div>
          ) : activeTab === 'daily-management' ? (
            <motion.div
              key="daily-management"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease }}
            >
              <ManagerReportDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-6"
            >
              <WeeklyReportCard />
              <WeeklyKpiCards kpis={effectiveWeeklyKpis} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DailyTrendChart data={effectiveDailyTrend.map((d: any) => ({ day: d.day, newTasks: d.completed, completedTasks: d.onTime }))} />
                <ProjectProgressChart data={effectiveProjectProgress.map((p: any) => ({ projectName: p.name, planned: p.total, actual: p.completed, atRisk: p.completed / p.total < 0.5 }))} />
              </div>

              {/* Task Distribution + Member Load */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TaskDistributionPie data={taskDistData} />
                <MemberLoadChart data={memberLoadData} />
              </div>

              {/* Member Stats Table */}
              <MemberStatsTable members={effectiveWeeklyMemberStats} />

              {/* AI Analysis */}
              <WeeklyAiAnalysis analysis={effectiveWeeklyAiAnalysis} />

              {/* Weekly History Comparison */}
              <div className="rounded-2xl bg-muted border border-border overflow-hidden">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex w-full items-center justify-between p-5 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">历史周报对比</h3>
                  </div>
                  <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <WeeklyHistoryChart data={effectiveWeeklyHistory.map((w: any) => ({ ...w, avgLoad: 78 }))} />
                        <p className="mt-3 text-xs text-muted-foreground">
                          过去 8 周任务完成率稳步上升，但逾期率在第 26 周出现峰值后逐渐下降
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
