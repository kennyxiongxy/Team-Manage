import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, ChevronDown, ChevronUp,
  Briefcase, TrendingUp, Clock, Award, Target, BarChart3,
  ArrowRight, X, Mail, Phone, ShieldCheck, Zap, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { useTeamStore } from '@/context/TeamStoreContext';
import type { TeamMember } from '@/data/mockData';

const departmentColors: Record<string, string> = {
  '开发': '#3B82F6',
  '测试': '#22C55E',
  '运维': '#F97316',
  '设计': '#A855F7',
  '产品': '#06B6D4',
  '数据': '#EC4899',
};

const gradeColors: Record<string, string> = {
  'A+': '#22C55E',
  'A': '#22C55E',
  'B+': '#3B82F6',
  'B': '#F97316',
};

function EmployeeCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const deptColor = departmentColors[member.department || ''] || '#94A3B8';
  const gradeColor = gradeColors[member.grade || ''] || '#94A3B8';
  const workloadPercent = member.workloadPercent || member.workload || 0;
  const isOverloaded = workloadPercent > 95;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="bg-muted rounded-xl border border-input p-5 cursor-pointer hover:border-slate-600/50 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground"
            style={{ backgroundColor: deptColor + '30', color: deptColor }}
          >
            {member.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{member.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{member.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-md text-xs font-bold"
            style={{ backgroundColor: gradeColor + '20', color: gradeColor }}
          >
            {member.grade || 'B'}
          </span>
          {isOverloaded && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[rgba(239,68,68,0.15)] text-destructive">
              超负荷
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">完成率</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{member.completionRate || 0}%</p>
        </div>
        <div className="bg-card rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">准时率</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{member.onTimeRate || 0}%</p>
        </div>
        <div className="bg-card rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">质量分</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{member.qualityScore || 0}</p>
        </div>
        <div className="bg-card rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">负荷</p>
          <p className={`text-lg font-bold mt-0.5 ${isOverloaded ? 'text-destructive' : 'text-foreground'}`}>
            {workloadPercent}%
          </p>
        </div>
      </div>

      {/* Workload Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">工作负荷</span>
          <span className={isOverloaded ? 'text-destructive' : 'text-muted-foreground'}>{workloadPercent}%</span>
        </div>
        <div className="h-2 bg-card rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(workloadPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: isOverloaded ? '#EF4444' : workloadPercent > 80 ? '#F97316' : '#3B82F6' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Briefcase size={12} style={{ color: deptColor }} />
          <span>{member.department || '研发部'}</span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          查看详情 <ArrowRight size={12} />
        </span>
      </div>
    </motion.div>
  );
}

function EmployeeDetailModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const deptColor = departmentColors[member.department || ''] || '#94A3B8';
  const workloadPercent = member.workloadPercent || member.workload || 0;
  const isOverloaded = workloadPercent > 95;

  const stats = [
    { label: '完成任务', value: member.tasksCompleted || 0, icon: Target, color: '#3B82F6' },
    { label: '平均耗时', value: typeof member.avgTaskDuration === 'number' ? `${member.avgTaskDuration}天` : (member.avgTaskDuration || '0天'), icon: Clock, color: '#F97316' },
    { label: '协作频次', value: member.collabCount || 0, icon: Users, color: '#06B6D4' },
    { label: '周环比', value: `${(member.weekOverWeek || 0) > 0 ? '+' : ''}${member.weekOverWeek || 0}%`, icon: TrendingUp, color: '#22C55E' },
  ];

  const radar = member.radar || { completion: 0, onTime: 0, quality: 0, workload: 0, collaboration: 0 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-input shadow-2xl"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-card border-b border-input p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: deptColor + '30', color: deptColor }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{member.role} · {member.department || '研发部'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-muted rounded-xl p-4 border border-border">
                <s.icon size={18} style={{ color: s.color }} className="mb-2" />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Performance Bars */}
          <div className="bg-muted rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#A855F7]" />
              能力雷达
            </h3>
            <div className="space-y-3">
              {[
                { label: '任务完成率', value: radar.completion, color: '#3B82F6' },
                { label: '准时交付率', value: radar.onTime, color: '#22C55E' },
                { label: '质量评分', value: radar.quality, color: '#A855F7' },
                { label: '负荷承受', value: radar.workload, color: '#F97316' },
                { label: '协作能力', value: radar.collaboration, color: '#06B6D4' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value}分</span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Note */}
          {member.aiNote && (
            <div className="bg-[rgba(168,85,247,0.08)] rounded-xl p-4 border border-[rgba(168,85,247,0.2)]">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-[#A855F7]" />
                <span className="text-sm font-semibold text-[#A855F7]">AI 洞察</span>
              </div>
              <p className="text-sm text-foreground">{member.aiNote}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-muted rounded-xl p-4 border border-border flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} />
              <span>{member.name}@company.com</span>
            </div>
            <div className="h-4 w-px bg-muted" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={14} />
              <span>138****{Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
            <div className="h-4 w-px bg-muted" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck size={14} className="text-[#22C55E]" />
              <span>在职</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                toast.success('已发送绩效评估通知', { description: `通知已发送，员工可在「绩效反馈」页面查看` });
              }}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              发送绩效评估
            </button>
            <button
              onClick={() => {
                toast.success('已调整任务分配', { description: `${member.name} 的任务已重新分配` });
              }}
              className="flex-1 py-2.5 rounded-lg bg-muted border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              调整任务分配
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EmployeeManagement() {
  const { members } = useTeamStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const departments = ['all', ...new Set(members.map((m) => m.department || '研发部'))];

  const filteredMembers = members.filter((m) => {
    const matchSearch = m.name.includes(searchQuery) || (m.role || '').includes(searchQuery);
    const matchDept = selectedDept === 'all' || (m.department || '研发部') === selectedDept;
    return matchSearch && matchDept;
  });

  const overloadedCount = members.filter((m) => (m.workloadPercent || m.workload || 0) > 95).length;
  const avgCompletion = members.length > 0 ? Math.round(
    members.reduce((sum, m) => sum + (m.completionRate || 0), 0) / members.length
  ) : 0;

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader title="员工管理" subtitle="查看团队成员详情、绩效与任务分配" />

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">团队总人数</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{members.length}人</p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-[#22C55E]" />
              <span className="text-xs text-muted-foreground">平均完成率</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{avgCompletion}%</p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-destructive" />
              <span className="text-xs text-muted-foreground">超负荷人数</span>
            </div>
            <p className={`text-2xl font-bold ${overloadedCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {overloadedCount}人
            </p>
          </div>
          <div className="bg-muted rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-[#A855F7]" />
              <span className="text-xs text-muted-foreground">AI 建议待处理</span>
            </div>
            <p className="text-2xl font-bold text-foreground">3条</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索姓名、职位..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-muted border border-input pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl bg-muted border border-input px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">全部部门</option>
              {departments.filter((d) => d !== 'all').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <EmployeeCard
              key={member.id}
              member={member}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-[#334155] mb-4" />
            <p className="text-muted-foreground">未找到匹配的员工</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <EmployeeDetailModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
