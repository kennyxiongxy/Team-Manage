import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, Search, Filter,
  X, MessageSquare, ArrowRight, User, Briefcase,
  ShieldCheck, AlertOctagon, Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import { useHelpRequests } from '@/context/HelpRequestContext';

export default function HelpRequestManagement() {
  const { helpRequests, resolveHelpRequest, pendingCount } = useHelpRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return helpRequests.filter((r) => {
      const matchSearch =
        r.employeeName.includes(searchQuery) ||
        r.taskName.includes(searchQuery) ||
        r.reason.includes(searchQuery);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [helpRequests, searchQuery, statusFilter]);

  const pendingRequests = helpRequests.filter((r) => r.status === 'pending');
  const resolvedRequests = helpRequests.filter((r) => r.status === 'resolved');

  return (
    <Layout>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <PageHeader
          title="员工求助管理"
          subtitle="集中处理所有员工求助，查看历史记录"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <AlertOctagon size={20} className="text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">待处理求助</p>
                <p className="text-2xl font-bold text-destructive">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[#22C55E]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已处理</p>
                <p className="text-2xl font-bold text-[#22C55E]">{resolvedRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] flex items-center justify-center">
                <Inbox size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总求助数</p>
                <p className="text-2xl font-bold text-foreground">{helpRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索员工姓名、任务名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-muted border border-input pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <div className="flex bg-muted rounded-xl border border-input overflow-hidden">
              {[
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待处理' },
                { key: 'resolved', label: '已处理' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="bg-muted rounded-xl p-12 text-center border border-border">
              <Inbox size={48} className="mx-auto text-[#334155] mb-3" />
              <p className="text-muted-foreground">
                {statusFilter === 'pending'
                  ? '暂无待处理求助'
                  : statusFilter === 'resolved'
                  ? '暂无已处理求助'
                  : '暂无求助记录'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                员工在工作台发起求助后将显示在这里
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-muted rounded-xl border overflow-hidden transition-colors ${
                  request.status === 'pending'
                    ? 'border-[rgba(239,68,68,0.3)] hover:border-[rgba(239,68,68,0.5)]'
                    : 'border-border hover:border-slate-600/50'
                }`}
              >
                {/* Main Row */}
                <div
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                  onClick={() =>
                    setSelectedRequest(selectedRequest === request.id ? null : request.id)
                  }
                >
                  {/* Status */}
                  <div className="shrink-0">
                    {request.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(239,68,68,0.15)] text-destructive">
                        <AlertTriangle size={12} /> 待处理
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[rgba(34,197,94,0.15)] text-[#22C55E]">
                        <CheckCircle2 size={12} /> 已处理
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {request.employeeName}
                      </span>
                      <span className="text-xs text-muted-foreground">在任务中求助</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      「{request.taskName}」— {request.reason}
                    </p>
                  </div>

                  {/* Time + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {request.timestamp}
                    </span>
                    {request.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveHelpRequest(request.id);
                          toast.success('已标记为已处理', {
                            description: `${request.employeeName} 的求助已处理`,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        标记已处理
                      </button>
                    )}
                  </div>
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                  {selectedRequest === request.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-card rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">求助员工</p>
                            <p className="text-sm text-foreground font-medium">
                              {request.employeeName}（{request.employeeId}）
                            </p>
                          </div>
                          <div className="bg-card rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">相关任务</p>
                            <p className="text-sm text-foreground font-medium">
                              {request.taskName}（{request.taskId}）
                            </p>
                          </div>
                          <div className="bg-card rounded-lg p-3 md:col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">求助原因</p>
                            <p className="text-sm text-foreground">{request.reason}</p>
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                resolveHelpRequest(request.id);
                                toast.success('已标记为已处理');
                              }}
                              className="px-4 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors"
                            >
                              <CheckCircle2 size={14} className="inline mr-1" />
                              确认已处理
                            </button>
                            <button
                              onClick={() => {
                                toast.info('已发送消息给该员工', {
                                  description: '通知员工正在处理中',
                                });
                              }}
                              className="px-4 py-2 rounded-lg bg-muted border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors"
                            >
                              <MessageSquare size={14} className="inline mr-1" />
                              回复员工
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
