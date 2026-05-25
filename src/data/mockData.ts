// ─── Core Types ───

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

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
  createdAt?: string;  // 来自后端 created_at
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
  medium: { label: '中', color: '#3B82F6', bg: 'bg-[rgba(59,130,246,0.15)]' },
  low: { label: '低', color: '#22C55E', bg: 'bg-[rgba(34,197,94,0.15)]' },
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

export const arTeamMembers: TeamMember[] = [
  { id: 'm1', name: '张伟', role: '大客户经理', status: 'online', workload: 85, tasksCompleted: 12, tasksInProgress: 3, currentTask: '中国银行年度框架合同续签' },
  { id: 'm2', name: '李娜', role: '销售代表', status: 'busy', workload: 90, tasksCompleted: 8, tasksInProgress: 4, currentTask: '华为云POC演示准备' },
  { id: 'm3', name: '王强', role: '渠道经理', status: 'online', workload: 60, tasksCompleted: 15, tasksInProgress: 2, currentTask: '渠道合作伙伴培训' },
  { id: 'm4', name: '刘芳', role: '售前工程师', status: 'working', workload: 75, tasksCompleted: 10, tasksInProgress: 3, currentTask: '腾讯云迁移方案设计' },
  { id: 'm5', name: '赵磊', role: '销售代表', status: 'offline', workload: 40, tasksCompleted: 7, tasksInProgress: 1, currentTask: '客户回访计划' },
  { id: 'm6', name: '陈静', role: '客户成功经理', status: 'online', workload: 70, tasksCompleted: 9, tasksInProgress: 2, currentTask: 'VIP客户满意度调研' },
  { id: 'm7', name: '杨光', role: '销售代表', status: 'idle', workload: 30, tasksCompleted: 5, tasksInProgress: 1, currentTask: '竞品分析报告' },
];

export const initialChatMessages: ChatMessage[] = [];

export const quickPrompts: string[] = [
  '项目进度怎么样？',
  '谁现在最忙？',
  '给我本周的总结',
  '有什么风险需要关注？',
  '团队效率如何？',
  '有什么优化建议？',
];

export const decisionLogs: DecisionLog[] = [
  { id: 'dl-1', time: '09:15', type: 'allocation', status: 'applied', description: '将"华为云POC演示"任务自动分配给李娜（当前负载最低）' },
  { id: 'dl-2', time: '10:02', type: 'remind', status: 'applied', description: '提醒张伟：中国银行合同续签倒计时 3 天' },
  { id: 'dl-3', time: '10:30', type: 'analysis', status: 'completed', description: '分析本月销售漏斗，转化率环比上升 12%' },
  { id: 'dl-4', time: '11:15', type: 'priority', status: 'applied', description: '将"腾讯云迁移方案"升级为高优先级（客户要求下周交付）' },
  { id: 'dl-5', time: '13:45', type: 'suggest', status: 'pending', description: '建议为刘芳调配一名助手，当前负载过高' },
  { id: 'dl-6', time: '14:20', type: 'deadline', status: 'applied', description: '检测到 3 项任务将在 48 小时内到期' },
  { id: 'dl-7', time: '15:00', type: 'push', status: 'applied', description: '推送今日销售日报汇总到管理群' },
  { id: 'dl-8', time: '16:10', type: 'analysis', status: 'completed', description: 'AI分析：赵磊本月业绩达标率偏低，建议一对一辅导' },
  { id: 'dl-9', time: '17:30', type: 'review', status: 'pending', description: '生成明日工作优先级建议清单' },
];

export const aiCapabilities: AiCapability[] = [
  { id: 'cap-1', name: '智能任务分配', description: '基于负荷和技能自动推荐任务分配', enabled: true },
  { id: 'cap-2', name: '风险预测', description: '提前 48 小时预警潜在延期风险', enabled: true },
  { id: 'cap-3', name: '日报生成', description: '自动汇总成员日报内容', enabled: true },
  { id: 'cap-4', name: '效率优化', description: '分析工作模式，给出效率提升建议', enabled: false },
  { id: 'cap-5', name: '智能排期', description: '根据任务依赖和资源自动排期', enabled: false },
  { id: 'cap-6', name: '代码质量预警', description: '监控代码提交质量，提前发现隐患', enabled: false },
];

export const aiEffectiveness = { adoptionRate: 0, overdueReduction: 0, decisionTimeReduction: 0, weeklyAdoption: [], completionRateImprovement: [] };

export const riskProjects: RiskProject[] = [
  { name: '中国银行年度框架合同', lag: '滞后 3 天', issue: '法务审核进度缓慢，需管理层介入推动' },
  { name: '腾讯云迁移方案', lag: '滞后 2 天', issue: '售前资源不足，刘芳一人承担多项任务' },
  { name: '华为云联合POC', lag: '风险预警', issue: '演示环境准备进度 50%，距 deadline 仅 5 天' },
];

export const efficiencyRadarData: EfficiencyDimension[] = [
  { subject: '任务完成率', A: 78 },
  { subject: '客户响应', A: 85 },
  { subject: '商机转化', A: 62 },
  { subject: '协作效率', A: 70 },
  { subject: '准时交付', A: 55 },
  { subject: '客户满意', A: 88 },
];

export const managementSuggestions: ManagementSuggestion[] = [
  { id: 1, text: '赵磊本月产出偏低，建议安排一对一谈话了解原因', priority: 'high' },
  { id: 2, text: '中国银行合同续签已滞后，建议亲自拜访客户加快流程', priority: 'high' },
  { id: 3, text: '销售漏斗转化率提升明显，可考虑加大线索投放预算', priority: 'low' },
  { id: 4, text: '建议周五下午组织团队销售技巧分享会', priority: 'low' },
];

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
