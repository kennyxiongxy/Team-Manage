// ─── Core Types ───

export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'P0' | 'P1' | 'P2' | 'P3' | 'medium';

export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'overdue'
  | 'pending-review'
  | 'ai-intervened'
  | '未开始'
  | '进行中'
  | '待审核'
  | '已完成'
  | '已逾期';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'status_change' | 'comment' | 'assignment' | 'time_log' | 'file_upload' | 'ai_action';
  description: string;
  timestamp: string;
  actor: string;
  userId?: string;
  action?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  dueTime?: string;
  progress: number;
  project: string;
  aiRecommended?: boolean;
  assigneeId?: string;
  projectId?: string;
  startDate?: string;
  completedDate?: string;
  subTasks?: SubTask[];
  comments?: Comment[];
  activityLog?: ActivityLogItem[];
  collaboratorIds?: string[];
  tags?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  workload?: number;
  tasksCompleted?: number;
  tasksInProgress?: number;
  status?: 'online' | 'offline' | 'busy' | 'working' | 'idle';
  currentTask?: string;
  grade?: string;
  completionRate?: number;
  onTimeRate?: number;
  qualityScore?: number;
  avgTaskDuration?: string;
  collabCount?: number;
  department?: string;
  color?: string;
  radar?: Record<string, number>;
  weekOverWeek?: number;
  aiNote?: string;
  load?: number;
  workloadPercent?: number;
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  health: 'good' | 'warning' | 'critical';
  totalTasks: number;
  completedTasks: number;
  color?: string;
}

export interface AiInsight {
  id: string;
  type: 'risk' | 'suggestion' | 'ai-generated';
  icon: string;
  title: string;
  description: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  actor: string;
  actorType: 'user' | 'ai';
  action: string;
  detail: string;
  icon?: string;
}

export interface KpiDataItem {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trend: number;
  trendLabel: string;
  color: string;
  icon: string;
  sparkline: number[];
}

// ─── Core Data ───

export const mockTasks: Task[] = [];

export const mockTeamMembers: TeamMember[] = [];

export const mockProjects: Project[] = [];

export const mockAiInsights: AiInsight[] = [];

export const mockActivities: ActivityItem[] = [];

export const mockKpis: KpiDataItem[] = [];

export const mockWeeklyReport = { completed: 0, new: 0, overdue: 0, aiInterventions: 0, summary: '' };

export const mockWeeklySuggestions: string[] = [];

export const mockDailyCompletionData: { day: string; completed: number }[] = [];

export const mockMorningBriefPoints: { id: number; text: string; type: string; color: string }[] = [];

// ─── Configs ───

export const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: '紧急', color: '#EF4444', bg: 'bg-[rgba(239,68,68,0.15)]' },
  high: { label: '高', color: '#F97316', bg: 'bg-[rgba(249,115,22,0.15)]' },
  normal: { label: '普通', color: '#3B82F6', bg: 'bg-[rgba(59,130,246,0.15)]' },
  low: { label: '低', color: '#22C55E', bg: 'bg-[rgba(34,197,94,0.15)]' },
  medium: { label: '中', color: '#F97316', bg: 'bg-[rgba(249,115,22,0.15)]' },
  P0: { label: 'P0', color: '#EF4444', bg: 'bg-[rgba(239,68,68,0.15)]' },
  P1: { label: 'P1', color: '#F97316', bg: 'bg-[rgba(249,115,22,0.15)]' },
  P2: { label: 'P2', color: '#3B82F6', bg: 'bg-[rgba(59,130,246,0.15)]' },
  P3: { label: 'P3', color: '#22C55E', bg: 'bg-[rgba(34,197,94,0.15)]' },
};

export const statusConfig: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  'not-started': { label: '未开始', color: '#94A3B8', icon: 'circle', bg: 'bg-[rgba(148,163,184,0.15)]' },
  'in-progress': { label: '进行中', color: '#3B82F6', icon: 'loader', bg: 'bg-[rgba(59,130,246,0.15)]' },
  completed: { label: '已完成', color: '#22C55E', icon: 'check', bg: 'bg-[rgba(34,197,94,0.15)]' },
  overdue: { label: '已逾期', color: '#EF4444', icon: 'alert', bg: 'bg-[rgba(239,68,68,0.15)]' },
  'pending-review': { label: '待审核', color: '#F97316', icon: 'clock', bg: 'bg-[rgba(249,115,22,0.15)]' },
  'ai-intervened': { label: 'AI 介入', color: '#A855F7', icon: 'sparkles', bg: 'bg-[rgba(168,85,247,0.15)]' },
  '未开始': { label: '未开始', color: '#94A3B8', icon: 'circle', bg: 'bg-[rgba(148,163,184,0.15)]' },
  '进行中': { label: '进行中', color: '#3B82F6', icon: 'loader', bg: 'bg-[rgba(59,130,246,0.15)]' },
  '待审核': { label: '待审核', color: '#F97316', icon: 'clock', bg: 'bg-[rgba(249,115,22,0.15)]' },
  '已完成': { label: '已完成', color: '#22C55E', icon: 'check', bg: 'bg-[rgba(34,197,94,0.15)]' },
};

// ─── Workspace Types ───

export interface TimelineTask {
  id: string;
  time: string;
  title: string;
  description: string;
  priority: Priority;
  duration: string;
  completed: boolean;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  project: string;
  deadline: string;
  hoursLeft?: number;
}

export interface AiReminder {
  id: string;
  type: 'deadline' | 'risk' | 'optimize' | 'collaboration';
  message: string;
  time: string;
  priority: 'high' | 'medium';
  dismissed?: boolean;
  read?: boolean;
  actions?: {
    primary?: string;
    secondary?: string;
  };
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface WorkspaceTeamActivity {
  id: string;
  type: 'complete' | 'start' | 'update' | 'assign' | 'risk';
  user: string;
  action: string;
  target: string;
  time: string;
}

// ─── Workspace Data ───

export const currentUser = { name: '', role: '', avatar: '', department: '', level: '' };

export const personalStats = { completedThisWeek: 0, completedLastWeek: 0, onTimeRate: 0, avgTaskDuration: '', collaborationIndex: 0, completed: 0, remaining: 0, weekCompletion: 0, overdue: 0 };

export const todayTasks: TimelineTask[] = [];

export const yesterdayTasks: TimelineTask[] = [];

export const tomorrowTasks: TimelineTask[] = [];

export const taskOverview = { total: 0, completed: 0, inProgress: 0, overdue: 0, highPriority: 0, pending: 0, dueToday: 0, categories: [] };

export const aiReminders: AiReminder[] = [];

export const teamActivities: WorkspaceTeamActivity[] = [];

export const wsTeamMembers: TeamMember[] = [];

export const dailyReportData = { date: '', summary: '', achievements: [], blockers: '', tomorrowPlan: [], aiSuggestions: [], submitted: false, support: '', completedTasks: [] };

// ─── AI Assistant Types ───

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  actions?: { label: string; action: string }[];
  cards?: AiInsightCardData[];
}

export interface AiInsightCardData {
  id: string;
  type: 'risk' | 'warning' | 'success' | 'info' | 'opportunity' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence?: number;
  impact?: 'high' | 'medium' | 'low';
  relatedTasks?: string[];
  action?: string;
  value?: string;
}

export interface DecisionLog {
  id: string;
  timestamp: string;
  type: 'push' | 'suggest' | 'remind' | 'auto' | 'analysis' | 'allocation' | 'priority' | 'deadline' | 'escalation' | 'review';
  decision: string;
  context: string;
  confidence: number;
  impact: string;
  status: 'applied' | 'pending' | 'dismissed' | 'completed' | 'rejected';
  feedback?: string;
  time?: string;
  description?: string;
}

export interface AiCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface RiskProject {
  name: string;
  lag: string;
  issue: string;
}

export interface EfficiencyDimension {
  subject: string;
  A: number;
}

export interface ManagementSuggestion {
  id: number;
  text: string;
  priority: 'high' | 'low';
}

// ─── AI Assistant Data ───

export const arTeamMembers: TeamMember[] = [];

export const initialChatMessages: ChatMessage[] = [];

export const quickPrompts: string[] = [];

export const decisionLogs: DecisionLog[] = [];

export const aiCapabilities: AiCapability[] = [];

export const aiEffectiveness = { adoptionRate: 0, overdueReduction: 0, decisionTimeReduction: 0, weeklyAdoption: [], completionRateImprovement: [] };

export const riskProjects: RiskProject[] = [];

export const efficiencyRadarData: EfficiencyDimension[] = [];

export const managementSuggestions: ManagementSuggestion[] = [];

// ─── Reports Types ───

export interface DailyReport {
  id: string;
  memberName: string;
  date: string;
  summary: string;
  completedCount: number;
  overdueCount: number;
  aiGenerated: boolean;
  status: 'submitted' | 'reviewed' | 'unsubmitted';
  riskLevel: 'high' | 'medium' | 'low';
  completedTasks: string[];
  plannedTasks: string[];
  hasIssue: boolean;
  issueDescription?: string;
  submitTime: string;
}

export interface WeeklyMemberStats {
  memberId: string;
  memberName: string;
  completed: number;
  overdue: number;
  onTimeRate: number;
  avgDuration: string;
  loadRate: number;
  qualityScore: number;
  grade: string;
}

export interface WeeklyProjectProgress {
  name: string;
  completed: number;
  total: number;
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
}

// ─── Reports Data ───

export const dailyReports: DailyReport[] = [];

export const dailySummary = { completedTasks: 0, completedChange: 0, inProgressTasks: 0, inProgressChange: 0, newOverdue: 0, aiGeneratedReports: 0 };

export const dailyAiSummary: string[] = [];

export const weeklySummary = { week: '', period: '', completedTasks: 0, activeProjects: 0, overdueTasks: 0, teamLoadAvg: 0, highlights: [], concerns: [], totalCompleted: 0, weekNumber: 0, dateRange: '', summary: '', generatedAt: '', status: '', completionStats: { completed: 0, total: 0, overdue: 0, inProgress: 0, pendingReview: 0 } };

export const weeklyKpis: { label: string; value: number; unit: string; change: number; changeLabel: string; isPositive: boolean }[] = [];

export const dailyTrendData: { day: string; completed: number; overdue: number; onTime: number }[] = [];

export const projectProgressData: WeeklyProjectProgress[] = [];

export const weeklyMemberStats: WeeklyMemberStats[] = [];

export const weeklyAiAnalysis = { taskAnalysis: '', peopleAnalysis: '', suggestions: [], risks: [] };

export const weeklyHistoryData: { week: string; completed: number; overdue: number; onTime: number }[] = [];

export const exportFormats: ExportFormat[] = [
  { id: 'pdf', name: 'PDF 报告', extension: '.pdf', description: '适合打印和邮件发送' },
  { id: 'excel', name: 'Excel 表格', extension: '.xlsx', description: '包含所有原始数据' },
  { id: 'ppt', name: 'PPT 演示', extension: '.pptx', description: '适合会议汇报' },
  { id: 'markdown', name: 'Markdown', extension: '.md', description: '适合文档系统导入' },
];

// ─── Team Analysis Types ───

export interface Milestone {
  name: string;
  date: string;
  status: 'completed' | 'current' | 'pending' | 'overdue' | 'in-progress' | 'not-started' | 'delayed';
}

export interface ProjectHealth {
  id: string;
  name: string;
  health: 'good' | 'warning' | 'critical';
  healthColor: string;
  milestones: Milestone[];
  delays: string[];
  risks: string[];
  teamLoad: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  tag: string;
  status: 'active' | 'completed' | 'at-risk';
  members: number;
  progress: number;
  plannedProgress: number;
  lag: number;
  healthScore: number;
  riskLabel: string;
  metrics: {
    taskCompletionRate: number;
    overdueTasks: number;
    estimatedDelay: number;
  };
}

export interface WorkloadData {
  memberName: string;
  completed: number;
  inProgress: number;
  pending: number;
  overload: boolean;
  department: string;
}

export interface CollaborationEdge {
  source: string;
  target: string;
  weight: number;
  type: 'task' | 'comment' | 'file';
}

export interface CollaborationNode {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface TrendData {
  month: string;
  completed: number;
  overdue: number;
  onTime: number;
}

export interface VelocityData {
  week: string;
  storyPoints: number;
  tasks: number;
}

export interface PriorityData {
  priority: string;
  count: number;
  color: string;
}

export interface OnTimeData {
  month: string;
  rate: number;
}

export interface AiRecommendation {
  id: string;
  type: 'resource' | 'optimization' | 'collaboration' | 'quality' | 'schedule';
  title: string;
  description: string;
  dataSupport: string;
  action: string;
  impact: string;
  difficulty: string;
}

export interface TeamAnalysisKpiData {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  sparkline: number[];
}

// ─── Team Analysis Data ───

export const taTeamMembers: TeamMember[] = [];

export const taProjects: ProjectHealth[] = [];

export const workloadDistribution: WorkloadData[] = [];

export const collaborationNodes: CollaborationNode[] = [];

export const collaborationEdges: CollaborationEdge[] = [];

export const aiInsights: { id: string; title: string; description: string; icon: string; color: string }[] = [];

export const aiRecommendations: AiRecommendation[] = [];

export const actionPlans: { id: string; type: string; icon: string; color: string; title: string; items: string[]; button: string }[] = [];

export const trendData: TrendData[] = [];

export const velocityData: VelocityData[] = [];

export const priorityData: PriorityData[] = [];

export const onTimeData: OnTimeData[] = [];

export const kpiData: TeamAnalysisKpiData[] = [];
