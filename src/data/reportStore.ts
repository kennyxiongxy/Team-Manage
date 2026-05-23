export interface DailyReportEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  completedTasks: { title: string; status: string; duration: string }[];
  tomorrowPlan: string[];
  blockers: string;
  support: string;
  submitTime: string;
}

// In-memory store
let reportStore: DailyReportEntry[] = [];

export function getReports(): DailyReportEntry[] {
  return [...reportStore];
}

export function addReport(report: Omit<DailyReportEntry, 'id' | 'submitTime'>): DailyReportEntry {
  const newReport: DailyReportEntry = {
    ...report,
    id: `r-${Date.now()}`,
    submitTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };
  reportStore = [newReport, ...reportStore];
  return newReport;
}

export function getReportsByEmployee(employeeId: string): DailyReportEntry[] {
  return reportStore.filter((r) => r.employeeId === employeeId);
}

export function getReportsByDate(date: string): DailyReportEntry[] {
  return reportStore.filter((r) => r.date === date);
}

export function getUniqueEmployees() {
  const map = new Map();
  reportStore.forEach((r) => {
    if (!map.has(r.employeeId)) {
      map.set(r.employeeId, { id: r.employeeId, name: r.employeeName, department: r.department });
    }
  });
  return Array.from(map.values());
}

export function getUniqueDates() {
  return [...new Set(reportStore.map((r) => r.date))].sort().reverse();
}
