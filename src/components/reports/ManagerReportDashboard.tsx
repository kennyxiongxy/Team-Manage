import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, User, CheckCircle2, AlertCircle, Clock, Filter } from 'lucide-react';
import { getReports, getUniqueEmployees, getUniqueDates } from '@/data/reportStore';

export default function ManagerReportDashboard() {
  const allReports = getReports();
  const employees = getUniqueEmployees();
  const dates = getUniqueDates();

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      const matchDate = dateFilter === 'all' || r.date === dateFilter;
      const matchEmployee = employeeFilter === 'all' || r.employeeId === employeeFilter;
      return matchDate && matchEmployee;
    });
  }, [allReports, dateFilter, employeeFilter]);

  const todayReports = allReports.filter((r) => r.date === '2024-07-15');
  const submittedCount = todayReports.length;
  const totalEmployees = employees.length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-accent" />
          <h2 className="text-[22px] font-semibold text-foreground">员工日报管理</h2>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-muted px-4 py-2">
          <span className="text-sm text-muted-foreground">
            今日提交：<span className="font-semibold text-[#22C55E]">{submittedCount}</span> / {totalEmployees}
          </span>
          <div className="h-4 w-px bg-muted" />
          <span className="text-sm text-muted-foreground">
            未提交：<span className="font-semibold text-destructive">{totalEmployees - submittedCount}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted p-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg bg-card border border-border px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="all">全部日期</option>
            {dates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="rounded-lg bg-card border border-border px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="all">全部员工</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}（{e.department}）</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="rounded-xl bg-muted p-8 text-center">
            <p className="text-muted-foreground">没有符合条件的日报</p>
          </div>
        ) : (
          filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl bg-muted border border-border p-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                    {report.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{report.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {report.date}
                  </span>
                  <span className="text-xs text-muted-foreground">提交于 {report.submitTime}</span>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Left - Completed Tasks */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                    完成任务
                  </h4>
                  {report.completedTasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 text-sm text-foreground">
                      <span className="text-[#22C55E]">&#10003;</span>
                      {task.title}
                      <span className="text-muted-foreground">({task.duration})</span>
                    </div>
                  ))}

                  <h4 className="text-xs font-semibold text-muted-foreground mt-3 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-accent" />
                    明日计划
                  </h4>
                  {report.tomorrowPlan.map((plan, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {plan}
                    </div>
                  ))}
                </div>

                {/* Right - Blockers & Support */}
                <div className="space-y-3">
                  {report.blockers ? (
                    <div className="rounded-lg bg-destructive/10 border border-[rgba(239,68,68,0.2)] p-3">
                      <h4 className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        遇到的问题
                      </h4>
                      <p className="text-sm text-foreground">{report.blockers}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-xs text-muted-foreground">未报告问题</p>
                    </div>
                  )}

                  {report.support ? (
                    <div className="rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.2)] p-3">
                      <h4 className="text-xs font-semibold text-[#A855F7] mb-1">需要支持</h4>
                      <p className="text-sm text-foreground">{report.support}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-xs text-muted-foreground">未请求支持</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
