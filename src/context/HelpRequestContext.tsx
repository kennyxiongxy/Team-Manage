import { createContext, useContext, type ReactNode } from 'react';
import { useHelpRequestsApi } from '@/hooks/useHelpRequests';

export interface HelpRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  taskName: string;
  taskId: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

interface HelpRequestContextType {
  helpRequests: HelpRequest[];
  addHelpRequest: (request: Omit<HelpRequest, 'id' | 'timestamp' | 'status'>) => void;
  resolveHelpRequest: (id: string) => void;
  pendingCount: number;
}

const HelpRequestContext = createContext<HelpRequestContextType | null>(null);

export function HelpRequestProvider({ children }: { children: ReactNode }) {
  const api = useHelpRequestsApi();

  const helpRequests: HelpRequest[] = api.helpRequests.map((h) => ({
    id: h.id,
    employeeName: h.employeeName,
    employeeId: h.employeeId,
    taskName: h.taskId ? '关联任务' : '未关联任务',
    taskId: h.taskId || '',
    reason: h.reason,
    timestamp: new Date(h.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    status: h.status,
  }));

  const addHelpRequest = async (request: Omit<HelpRequest, 'id' | 'timestamp' | 'status'>) => {
    await api.addHelpRequest({
      taskId: request.taskId || null,
      reason: request.reason,
    });
  };

  const resolveHelpRequest = async (id: string) => {
    await api.resolveHelpRequest(id);
  };

  const pendingCount = helpRequests.filter((r) => r.status === 'pending').length;

  return (
    <HelpRequestContext.Provider value={{ helpRequests, addHelpRequest, resolveHelpRequest, pendingCount }}>
      {children}
    </HelpRequestContext.Provider>
  );
}

export function useHelpRequests() {
  const ctx = useContext(HelpRequestContext);
  if (!ctx) throw new Error('useHelpRequests must be used within HelpRequestProvider');
  return ctx;
}
