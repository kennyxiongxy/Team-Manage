import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronUp, ChevronDown, Bell, Plus,
  Zap, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, Clock, Users, FolderKanban, Target,
  BarChart3, FileText, Bot, ShieldCheck, Activity,
  LayoutGrid, ChevronRight, Calendar, RefreshCw,
  ListTodo, MessageSquare, Lightbulb, LineChart,
  UserCheck, AlertCircle, MoreHorizontal,
  Play, Pause,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import KpiBlock from '@/components/KpiBlock';
import TaskCard from '@/components/TaskCard';
import AiInsightCard from '@/components/AiInsightCard';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import EmployeeHeader from '@/components/workspace/EmployeeHeader';
import PriorityHighlight from '@/components/workspace/PriorityHighlight';
import TaskOverview from '@/components/workspace/TaskOverview';
import TodayTimeline from '@/components/workspace/TodayTimeline';
import AiPersonalReminders from '@/components/workspace/AiPersonalReminders';
import QuickDailyReport from '@/components/workspace/QuickDailyReport';
import TeamQuickView from '@/components/workspace/TeamQuickView';
import { useUserRole } from '@/context/UserRoleContext';
import { useHelpRequests } from '@/context/HelpRequestContext';
import {
  mockTasks, todayTasks, personalStats,
} from '@/data/mockData';
import { getDashboardOverview, getTasks, getProjects, getUsers } from '@/api/client';
import type { Task } from '@/data/mockData';
import { useSystemData } from '@/hooks/useSystemData';

/* ─── Module-level data refs — populated by HomeDataLoader ─── */
let mockAiInsights: any[] = [];
let mockActivities: any[] = [];
let mockProjects: any[] = [];
let mockDailyCompletionData: any[] = [];
let mockMorningBriefPoints: any[] = [];
let mockWeeklyReport: any = { completed: 0, new: 0, overdue: 0, aiInterventions: 0 };
let mockWeeklySuggestions: string[] = [];

const easeOut = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════
   全新首页设计 — 控制台仪表盘
   视觉原则：深色质感、青蓝点缀、层次分明、呼吸留白
   ═══════════════════════════════════════════════════════════ */

// ─── 通用小组件 ───

function SectionTitle({ icon: Icon, title, subtitle, action }: {
  icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
          <Icon size={16} className="text-accent" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

function GlassCard({ children, className = '', hover = true }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-card/90 to-card/60 border border-border/50 backdrop-blur-sm ${
        hover ? 'transition-all duration-200 hover:border-accent/20 hover:shadow-[0_8px_32px_rgba(6,182,212,0.08)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionCard({ icon, title, subtitle, action, children, className = '' }: {
  icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <GlassCard className={className}>
      <div className="p-6">
        <div className="mb-6">
          <SectionTitle icon={icon} title={title} subtitle={subtitle} action={action} />
        </div>
        {children}
      </div>
    </GlassCard>
  );
}

function GradientDivider() {
  return (
    <div className="h-px my-10 bg-gradient-to-r from-transparent via-border to-transparent" />
  );
}

/* ─── Data Loader ─── */
function HomeDataLoader({ children }: { children: React.ReactNode }) {
  const { data: ai } = useSystemData('mockAiInsights');
  const { data: acts } = useSystemData('mockActivities');
  const { data: projs } = useSystemData('mockProjects');
  const { data: completion } = useSystemData('mockDailyCompletionData');
  const { data: brief } = useSystemData('mockMorningBriefPoints');
  const { data: report } = useSystemData('mockWeeklyReport');
  const { data: suggestions } = useSystemData('mockWeeklySuggestions');

  if (ai) mockAiInsights = ai;
  if (acts) mockActivities = acts;
  if (projs) mockProjects = projs;
  if (completion) mockDailyCompletionData = completion;
  if (brief) mockMorningBriefPoints = brief;
  if (report) mockWeeklyReport = report;
  if (suggestions) mockWeeklySuggestions = suggestions;

  return <>{children}</>;
}

/* ═══════════════════════════════════════════════════════════
   管理者首页
   ═══════════════════════════════════════════════════════════ */

// ─── 顶部问候区 ───
function GreetingBanner() {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {greeting}，{user.name}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="ml-2 inline-block"
          >👋</motion.span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
          <Calendar size={13} className="text-muted-foreground/60" />
          {dateStr}
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1.5" />
          团队运行正常
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all"
        >
          <RefreshCw size={14} />
          刷新
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 text-sm text-accent font-medium hover:from-accent/30 hover:to-purple-500/30 transition-all"
        >
          <Sparkles size={14} />
          AI 分析
        </button>
      </div>
    </motion.div>
  );
}

// ─── 紧急通知 ───
function HelpRequestAlert() {
  const { helpRequests, pendingCount, resolveHelpRequest } = useHelpRequests();
  if (pendingCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="mb-6 overflow-hidden"
    >
      <GlassCard className="!border-red-500/30 !bg-gradient-to-r !from-red-500/10 !to-red-500/5">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400">
                  {pendingCount} 位员工需要帮助
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">请及时关注处理</p>
              </div>
            </div>
            <Link
              to="/help-requests"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              查看详情
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* 紧急求助列表 */}
          <div className="mt-4 space-y-2">
            {helpRequests.filter(h => h.status === 'pending').slice(0, 2).map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-500/5">
                <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center text-xs font-bold text-red-400">
                  {req.employeeName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{req.employeeName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{req.reason}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{req.timestamp}</span>
                <button
                  onClick={() => { resolveHelpRequest(req.id); toast.success('已标记为已处理'); }}
                  className="px-2 py-1 rounded-md bg-green-500/15 text-green-400 text-[10px] font-medium hover:bg-green-500/25 transition-colors"
                >
                  处理
                </button>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── KPI 指标行 ───
function KpiRow({ refreshKey }: { refreshKey: number }) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    getDashboardOverview().then((res: any) => {
      if (res.success) setDashboardData(res.data);
    }).catch(() => {});
  }, [refreshKey]);

  const stats = dashboardData?.stats || {};
  const completed = dashboardData?.taskStatusStats?.find((s: any) => s.status === 'completed')?.count || 0;
  const inProgress = dashboardData?.taskStatusStats?.find((s: any) => s.status === 'in-progress')?.count || 0;
  const kpis = useMemo(() => [
    { label: '总任务数', value: String(stats.totalTasks || 0), unit: '个', trend: 0, trendLabel: '', color: '#22C55E', icon: 'clipboard-list', sparkline: [0] },
    { label: '进行中', value: String(inProgress), unit: '个', trend: 0, trendLabel: '', color: '#3B82F6', icon: 'folder-open', sparkline: [0] },
    { label: '已完成', value: String(completed), unit: '个', trend: 0, trendLabel: '', color: '#A855F7', icon: 'check-circle', sparkline: [0] },
    { label: '总项目数', value: String(stats.totalProjects || 0), unit: '个', trend: 0, trendLabel: '', color: '#F97316', icon: 'bar-chart-3', sparkline: [0] },
  ], [dashboardData]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {kpis.map((kpi, i) => (
        <KpiBlock key={kpi.label} {...kpi} index={i} />
      ))}
    </div>
  );
}

// ─── AI 晨报 ───
function AiBriefBanner() {
  const [expanded, setExpanded] = useState(false);
  const [briefData, setBriefData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getDashboardOverview(),
      getTasks(),
      getProjects(),
      getUsers(),
    ]).then(([dashRes, tasksRes, projRes, usersRes]) => {
      const dashboard = dashRes?.data || {};
      const tasks = tasksRes?.data || [];
      const projects = projRes?.data || [];
      const users = usersRes?.data || [];

      const inProgress = tasks.filter((t: any) => t.status === 'in-progress').length;
      const overdue = tasks.filter((t: any) => t.status === 'overdue').length;
      const today = new Date().toISOString().split('T')[0];
      const dueToday = tasks.filter((t: any) => t.due_date === today).length;
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const total = tasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // 风险项目
      const riskProjects = projects.filter((p: any) => p.status === 'at-risk' || (p.health_score && p.health_score < 70));
      const riskText = riskProjects.length > 0
        ? `${riskProjects.length} 个项目存在风险：${riskProjects.map((p: any) => p.name).join('、')}`
        : '当前所有项目健康度良好，无异常风险';

      // 亮点
      let highlight = '团队数据正常，暂无特别亮点';
      if (completionRate >= 80) highlight = `团队任务完成率达 ${completionRate}%，表现优异`;
      else if (completed >= inProgress && inProgress > 0) highlight = `已完成任务(${completed})超过进行中(${inProgress})，节奏健康`;
      else if (dueToday > 0 && overdue === 0) highlight = `${dueToday} 个任务今日截止，当前无逾期，节奏良好`;

      // AI 建议
      let suggestion = '建议持续关注团队任务进展';
      if (overdue > 0) suggestion = `有 ${overdue} 项任务逾期，建议今天优先处理`;
      else if (riskProjects.length > 0) suggestion = `有 ${riskProjects.length} 个项目存在风险，建议重点关注`;
      else if (inProgress > users.length * 3) suggestion = `人均任务负载偏高（${inProgress}进行中 / ${users.length}人），建议评估优先级`;

      setBriefData({
        inProgress,
        dueToday,
        completionRate,
        overdue,
        riskText,
        highlight,
        suggestion,
      });
    }).catch(() => {});
  }, []);

  const d = briefData || { inProgress: '...', dueToday: '...', completionRate: '...', overdue: 0, riskText: '加载中...', highlight: '加载中...', suggestion: '加载中...' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
      className="mb-6"
    >
      <GlassCard className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-purple-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-purple-500/30 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={22} className="text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-foreground">AI 晨间简报</h3>
                  <span className="px-2 py-0.5 rounded-full bg-accent/15 text-[10px] font-medium text-accent">基于实时数据</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  今天团队有 <span className="text-accent font-semibold">{d.inProgress}</span> 个任务进行中，
                  <span className="text-yellow-400 font-semibold">{d.dueToday}</span> 个今日截止
                  {d.overdue > 0 && <><span className="text-red-400 font-semibold">（{d.overdue} 个逾期）</span></>}，
                  完成率 <span className="text-green-400 font-semibold">{d.completionRate}%</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/10 text-xs text-accent font-medium hover:bg-accent/20 transition-colors flex-shrink-0"
            >
              {expanded ? '收起' : '展开'}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="overflow-hidden"
              >
                <div className="h-px my-6 bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={15} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">风险提醒</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{d.riskText}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={15} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">亮点</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{d.highlight}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={15} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">AI 建议</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{d.suggestion}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── 快捷操作栏 ───
function QuickActionsBar() {
  const navigate = useNavigate();

  const actions = [
    { icon: Plus, label: '新建任务', color: '#3B82F6', to: '/tasks' },
    { icon: FileText, label: '写日报', color: '#22C55E', to: '/my-reports' },
    { icon: MessageSquare, label: 'AI 助手', color: '#A855F7', to: '/ai-assistant' },
    { icon: BarChart3, label: '团队分析', color: '#F97316', to: '/team-analysis' },
  ];

  return (
    <div className="flex items-center gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(action.to)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-all text-sm"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${action.color}18` }}
            >
              <Icon size={14} style={{ color: action.color }} />
            </div>
            <span className="text-muted-foreground font-medium">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── 今日任务 ───
function TodayTasksPanel({ onRefresh, refreshKey }: { onRefresh: () => void; refreshKey: number }) {
  const navigate = useNavigate();
  const [realTasks, setRealTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getTasks().then((res: any) => {
      if (res.success) setRealTasks(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);
  const today = new Date().toISOString().split('T')[0];
  const displayTasks = realTasks.length > 0 
    ? realTasks.filter((t: any) => {
        const due = (t.due_date || t.dueDate || '').slice(0, 10);
        const start = (t.start_date || t.startDate || '').slice(0, 10);
        if (due === today || start === today) return true;
        if (t.status === 'overdue') return true;
        if (t.status === 'in-progress' && due && due <= today) return true;
        return false;
      }).sort((a: any, b: any) => {
        // 今日到期的排最前，逾期的次之
        const da = (a.due_date || a.dueDate || '').slice(0, 10);
        const db = (b.due_date || b.dueDate || '').slice(0, 10);
        const aToday = da === today ? 0 : (a.status === 'overdue' ? 1 : 2);
        const bToday = db === today ? 0 : (b.status === 'overdue' ? 1 : 2);
        return aToday - bToday || da.localeCompare(db);
      }).slice(0, 6)
    : [];

  return (
    <SectionCard
      icon={ListTodo}
      title="今日任务"
      subtitle="今天需要关注的任务"
      action={
        <Link
          to="/tasks"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          查看全部
          <ChevronRight size={12} />
        </Link>
      }
    >
      {loading ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ListTodo size={24} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ListTodo size={24} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">暂无今日任务</p>
          <p className="text-xs text-muted-foreground/60 mt-1">所有任务进展顺利，今天没有需要关注的</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTasks.map((task: any, i: number) => (
            <TaskCard key={task.id} task={{
              id: task.id, title: task.title, description: task.description || '',
              priority: task.priority, status: task.status,
              progress: task.progress || 0, assignee: task.assignee_name || '未分配',
              dueDate: task.due_date, project: task.project_name || '',
              tags: []
            }} index={i} onClick={() => navigate('/tasks')}
              onTaskUpdated={onRefresh} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── 项目进度 ───
function ProjectProgressCard({ refreshKey }: { refreshKey: number }) {
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(() => {
    getProjects().then((res: any) => {
      if (res.success && res.data) {
        const mapped = res.data.slice(0, 4).map((p: any) => ({
          name: p.name,
          progress: p.progress || 0,
          health: (p.health_score || 100) >= 80 ? 'good' as const : (p.health_score || 100) >= 60 ? 'warning' as const : 'critical' as const,
          color: (p.health_score || 100) >= 80 ? '#22C55E' : (p.health_score || 100) >= 60 ? '#F97316' : '#EF4444',
        }));
        setProjects(mapped);
      }
    }).catch(() => {});
  }, [refreshKey]);

  const healthLabels: Record<string, { label: string; color: string }> = {
    good: { label: '健康', color: '#22C55E' },
    warning: { label: '注意', color: '#F97316' },
    critical: { label: '风险', color: '#EF4444' },
  };

  return (
    <SectionCard
      icon={FolderKanban}
      title="项目进度"
      subtitle="活跃项目状态"
    >
      <div className="space-y-4">
        {projects.map((proj) => {
          const health = healthLabels[proj.health];
          return (
            <div key={proj.name} className="px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-foreground">{proj.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{
                      backgroundColor: `${health.color}18`,
                      color: health.color,
                    }}
                  >
                    {health.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-foreground">{proj.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${proj.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: proj.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 团队状态 ───
function TeamStatusCard({ refreshKey }: { refreshKey: number }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => {
    import('@/api/client').then(({ getUsers }) => {
      getUsers().then((res: any) => {
        if (res.success && res.data) {
          const mapped = res.data.filter((u: any) => u.role !== 'manager').slice(0, 5).map((u: any) => ({
            name: u.name,
            role: u.department || '团队成员',
            status: 'online' as const,
            progress: Math.floor(Math.random() * 50) + 40,
            avatar: (u.name || '?')[0],
          }));
          setMembers(mapped);
        }
      }).catch(() => {});
    });
  }, [refreshKey]);

  const statusColors: Record<string, string> = {
    online: '#22C55E',
    busy: '#EF4444',
    idle: '#F97316',
  };

  return (
    <SectionCard
      icon={Users}
      title="团队成员"
      subtitle="今日在线状态"
      action={
        <Link
          to="/employees"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          管理
          <ChevronRight size={12} />
        </Link>
      }
    >
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.name}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
            onClick={() => navigate('/employees')}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-foreground">
                {member.avatar}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
                style={{ backgroundColor: statusColors[member.status] || '#94A3B8' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                <span className="text-[10px] text-muted-foreground">{member.role}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${member.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60"
                />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground flex-shrink-0">{member.progress}%</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 活动流 ───
function ActivityFeedCard({ refreshKey }: { refreshKey: number }) {
  const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([getTasks(), getProjects()]).then(([tRes, pRes]) => {
      const tasks = (tRes?.data || []) as any[];
      const projects = (pRes?.data || []) as any[];
      const acts: any[] = [];
      tasks.filter((t: any) => t.status === 'completed').slice(0, 3).forEach((t: any) => {
        acts.push({ type: 'complete', actor: t.assignee_name || '团队成员', detail: t.title, time: t.due_date || '最近' });
      });
      tasks.filter((t: any) => t.status === 'in-progress').slice(0, 2).forEach((t: any) => {
        acts.push({ type: 'update', actor: t.assignee_name || '团队成员', detail: t.title, time: t.due_date || '进行中' });
      });
      projects.filter((p: any) => p.status === 'at-risk' || (p.health_score && p.health_score < 70)).slice(0, 1).forEach((p: any) => {
        acts.push({ type: 'fix', actor: '系统', detail: p.name + ' 健康度偏低', time: '需关注' });
      });
      tasks.filter((t: any) => t.status === 'not-started' && t.assignee_name).slice(0, 1).forEach((t: any) => {
        acts.push({ type: 'pr', actor: t.assignee_name, detail: t.title, time: '待启动' });
      });
      setActivities(acts.slice(0, 6));
    }).catch(() => {});
  }, [refreshKey]);

  const activityIcons: Record<string, React.ElementType> = { complete: CheckCircle2, pr: Bot, ai: Sparkles, update: FileText, fix: Zap };
  const activityColors: Record<string, string> = { complete: '#22C55E', pr: '#3B82F6', ai: '#A855F7', update: '#F97316', fix: '#EF4444' };
  const actionLabels: Record<string, string> = { complete: '完成了', update: '推进中', fix: '需关注', pr: '待启动' };

  return (
    <SectionCard icon={Activity} title="团队动态" subtitle="实时任务与项目状态">
      <div className="space-y-1">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">暂无动态数据</div>
        ) : (
          activities.map((act, i) => {
            const Icon = activityIcons[act.type] || Activity;
            const color = activityColors[act.type] || '#94A3B8';
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color + '18' }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{act.actor}</span>
                    <span className="text-muted-foreground"> {actionLabels[act.type]} </span>
                    <span className="font-medium">{act.detail}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{act.time}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}


// ─── 周报预览 ───
function WeeklyPreviewCard({ refreshKey }: { refreshKey: number }) {
  const [weeklyData, setWeeklyData] = useState({ completed: 0, inProgress: 0, overdue: 0, notStarted: 0, total: 0 });
  useEffect(() => {
    getTasks().then((res: any) => {
      if (res.success && res.data) {
        const tasks = res.data;
        setWeeklyData({
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          inProgress: tasks.filter((t: any) => t.status === 'in-progress').length,
          overdue: tasks.filter((t: any) => t.status === 'overdue').length,
          notStarted: tasks.filter((t: any) => t.status === 'not-started').length,
          total: tasks.length,
        });
      }
    }).catch(() => {});
  }, [refreshKey]);
  const rate = weeklyData.total > 0 ? Math.round((weeklyData.completed / weeklyData.total) * 100) : 0;

  return (
    <SectionCard icon={FileText} title="周报预览" subtitle="本周团队概览"
      action={<Link to="/reports" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">详细周报<ChevronRight size={12} /></Link>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-green-400">{weeklyData.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">已完成</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-primary">{weeklyData.inProgress}</p>
          <p className="text-xs text-muted-foreground mt-1">进行中</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-red-400">{weeklyData.overdue}</p>
          <p className="text-xs text-muted-foreground mt-1">已逾期</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-orange-400">{rate}%</p>
          <p className="text-xs text-muted-foreground mt-1">完成率</p>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-3 font-medium">任务状态分布</p>
        <div className="h-28 flex items-end gap-2">
          {weeklyData.total > 0 ? (
            ['completed', 'in-progress', 'not-started', 'overdue'].map((status) => {
              const count = status === 'completed' ? weeklyData.completed : status === 'in-progress' ? weeklyData.inProgress : status === 'overdue' ? weeklyData.overdue : weeklyData.notStarted;
              const colors: Record<string, string> = { completed: '#22C55E', 'in-progress': '#3B82F6', 'not-started': '#F97316', overdue: '#EF4444' };
              const labels: Record<string, string> = { completed: '已完成', 'in-progress': '进行中', 'not-started': '待开始', overdue: '逾期' };
              const maxH = Math.max(count / Math.max(weeklyData.total, 1) * 100, 4);
              return (
                <div key={status} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: maxH + '%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full rounded-t-sm opacity-70 hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to top, ' + colors[status] + ', ' + colors[status] + '40)' }} />
                  <span className="text-[9px] text-muted-foreground">{labels[status]}</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: colors[status] }}>{count}</span>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">暂无数据</p>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {weeklyData.overdue > 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="px-4 py-3 bg-white/[0.03] rounded-xl border border-border hover:border-accent/30 transition-colors">
            <div className="flex items-start gap-3">
              <Lightbulb size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">有 {weeklyData.overdue} 个逾期任务，建议今天优先处理</p>
            </div>
          </motion.div>
        ) : weeklyData.total > 0 ? (
          <div className="text-center py-4"><p className="text-sm text-muted-foreground">🎉 暂无逾期，团队运转良好</p></div>
        ) : (
          <div className="text-center py-4"><p className="text-sm text-muted-foreground">暂无团队数据</p></div>
        )}
      </div>
    </SectionCard>
  );
}


/* ─── ManagerDashboard ─── */
function ManagerDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshDashboard = () => setRefreshKey(k => k + 1);

  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    setApiStatus('⏳ 正在请求API...');
    const token = localStorage.getItem('token') || '';
    fetch('/api/dashboard/overview', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    }).then(function(r) {
      if (r.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('token');
        navigate('/login');
        return null;
      }
      if (!r.ok) {
        setApiStatus('❌ HTTP ' + r.status);
        return null;
      }
      return r.json().then(function(d) { return d; });
    }).then(function(d) {
      if (!d) return;
      if (d.success) {
        var s = d.data.stats;
        setApiStatus('✅ 任务:' + s.totalTasks + ' 项目:' + s.totalProjects + ' 用户:' + s.totalUsers);
      } else {
        setApiStatus('❌ API失败');
      }
    }).catch(function() {
      setApiStatus('❌ 请求异常');
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {apiStatus && (
        <div style={{margin:'8px 0',padding:'10px 16px',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',
          background: apiStatus.startsWith('✅') ? '#064e3b' : '#7f1d1d',
          color: apiStatus.startsWith('✅') ? '#6ee7b7' : '#fca5a5',
          border: '2px solid ' + (apiStatus.startsWith('✅') ? '#10b981' : '#ef4444')}}>
          {apiStatus}
        </div>
      )}
      {/* 问候横幅 */}
      <GreetingBanner />

      {/* 紧急通知 */}
      <HelpRequestAlert />

      {/* AI 晨报 */}
      <AiBriefBanner />

      {/* KPI 指标行 */}
      <KpiRow refreshKey={refreshKey} />

      {/* 快捷操作栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: easeOut }}
        className="mb-8"
      >
        <QuickActionsBar />
      </motion.div>

      {/* 分割线 */}
      <GradientDivider />

      {/* 主内容区域：左侧任务 + 项目、右侧团队状态 */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* 左栏 */}
        <div className="flex-1 min-w-0 space-y-8">
          <TodayTasksPanel onRefresh={refreshDashboard} refreshKey={refreshKey} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ProjectProgressCard refreshKey={refreshKey} />
            <WeeklyPreviewCard refreshKey={refreshKey} />
          </div>
        </div>

        {/* 右栏 — 侧边信息 */}
        <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 space-y-8">
          <TeamStatusCard refreshKey={refreshKey} />
          <ActivityFeedCard refreshKey={refreshKey} />
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   员工首页
   ═══════════════════════════════════════════════════════════ */

function EmployeeDashboard() {
  const { user } = useUserRole();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
  const today = now.toISOString().split('T')[0];

  useEffect(() => {
    getTasks().then((res: any) => {
      if (res.success && res.data) {
        const mine = res.data.filter((t: any) =>
          t.assignee_id === user.id || t.assignee_name === user.name
        );
        setMyTasks(mine);
      }
    }).catch(() => {});
  }, [user.id, user.name]);

  const weekCompleted = myTasks.filter((t: any) => t.status === 'completed').length;
  const inProgressCount = myTasks.filter((t: any) => t.status === 'in-progress').length;
  const notStartedCount = myTasks.filter((t: any) => t.status === 'not-started').length;
  const dueToday = myTasks.filter((t: any) => t.due_date === today || t.dueDate === today).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 问候信息 + AI提醒 并列 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* 左侧：问候 + 今日摘要 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {greeting}，{user.name} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
              <Calendar size={13} className="text-muted-foreground/60" />
              {now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })} · 本周第 {Math.ceil((now.getDate() - now.getDay() + 1) / 7) || 1} 个工作日
            </p>
            <p className="text-sm text-foreground mt-2">
              今天你有 <span className="font-semibold text-accent">{myTasks.length}</span> 个任务
              {myTasks.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length > 0 && (
                <>, 其中 <span className="font-semibold text-red-400">{myTasks.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length}</span> 紧急</>
              )}
              {dueToday > 0 && <>, <span className="font-semibold text-yellow-400">{dueToday}</span> 个今日截止</>}
            </p>
          </div>
          {/* 右侧：AI提醒 */}
          <div className="lg:w-[300px] shrink-0">
            <AiPersonalReminders />
          </div>
        </div>
      </motion.div>

      {/* 个人 KPI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: easeOut }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GlassCard>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">本周完成</p>
              <p className="text-xl font-bold font-mono text-green-400">{weekCompleted}<span className="text-xs text-muted-foreground ml-0.5">个</span></p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">进行中</p>
              <p className="text-xl font-bold font-mono text-primary">{inProgressCount}<span className="text-xs text-muted-foreground ml-0.5">个</span></p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">待开始</p>
              <p className="text-xl font-bold font-mono text-orange-400">{notStartedCount}<span className="text-xs text-muted-foreground ml-0.5">个</span></p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">今日截止</p>
              <p className="text-xl font-bold font-mono text-red-400">{dueToday}<span className="text-xs text-muted-foreground ml-0.5">个</span></p>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      <EmployeeHeader />
      <PriorityHighlight />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 min-w-0 space-y-8 lg:max-w-[70%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: easeOut }}
          >
            <TaskOverview />
          </motion.div>
          <TodayTimeline />
          <QuickDailyReport />
        </div>
        <aside className="w-full shrink-0 lg:w-[30%]">
          <div className="lg:sticky lg:top-6">
            <GlassCard>
              <div className="p-6">
                <TeamQuickView />
              </div>
            </GlassCard>
          </div>
        </aside>
      </div>
      <div className="h-12" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   首页路由
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const { isManager, isEmployee } = useUserRole();

  return (
    <HomeDataLoader>
      <Layout>
        {isManager && <ManagerDashboard />}
        {isEmployee && <EmployeeDashboard />}
      </Layout>
    </HomeDataLoader>
  );
}
