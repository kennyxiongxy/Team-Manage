const API_BASE = '';

function getToken() {
  return localStorage.getItem('token') || '';
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ success: false, message: '请求失败' }));

  if (!res.ok || !data.success) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// Auth
export function login(email: string, password: string) {
  return api.post<{ success: boolean; data: { token: string; user: any } }>('/api/auth/login', { email, password });
}

export function register(body: { name: string; email: string; password: string; role?: string; department?: string }) {
  return api.post<{ success: boolean; data: any }>('/api/auth/register', body);
}

export function getMe() {
  return api.get<{ success: boolean; data: any }>('/api/auth/me');
}

// Users
export function getUsers() {
  return api.get<{ success: boolean; data: any[] }>('/api/users');
}

export function getUser(id: string) {
  return api.get<{ success: boolean; data: any }>(`/api/users/${id}`);
}

export function updateUser(id: string, body: Partial<any>) {
  return api.put<{ success: boolean; data: any }>(`/api/users/${id}`, body);
}

// Tasks
export function getTasks() {
  return api.get<{ success: boolean; data: any[] }>('/api/tasks');
}

export function createTask(body: any) {
  return api.post<{ success: boolean; data: any }>('/api/tasks', body);
}

export function updateTask(id: string, body: any) {
  return api.put<{ success: boolean; data: any }>(`/api/tasks/${id}`, body);
}

export function deleteTask(id: string) {
  return api.del<{ success: boolean; data: any }>(`/api/tasks/${id}`);
}

// Projects
export function getProjects() {
  return api.get<{ success: boolean; data: any[] }>('/api/projects');
}

export function createProject(body: any) {
  return api.post<{ success: boolean; data: any }>('/api/projects', body);
}

export function updateProject(id: string, body: any) {
  return api.put<{ success: boolean; data: any }>(`/api/projects/${id}`, body);
}

// Reports
export function getReports() {
  return api.get<{ success: boolean; data: any[] }>('/api/reports');
}

export function createReport(body: any) {
  return api.post<{ success: boolean; data: any }>('/api/reports', body);
}

export function updateReport(id: string, body: any) {
  return api.put<{ success: boolean; data: any }>(`/api/reports/${id}`, body);
}

// Help Requests
export function getHelpRequests() {
  return api.get<{ success: boolean; data: any[] }>('/api/help-requests');
}

export function createHelpRequest(body: any) {
  return api.post<{ success: boolean; data: any }>('/api/help-requests', body);
}

export function updateHelpRequest(id: string, body: any) {
  return api.put<{ success: boolean; data: any }>(`/api/help-requests/${id}`, body);
}

// Dashboard
export function getDashboardOverview() {
  return api.get<{ success: boolean; data: any }>('/api/dashboard/overview');
}

export function getDashboardRecent() {
  return api.get<{ success: boolean; data: any }>('/api/dashboard/recent');
}
