import { api } from './client';

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  webhookUrl: string;
  connected: boolean;
  connectedAt: string | null;
}

export interface FeishuUser {
  openId: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
  status: 'active' | 'inactive';
  employeeNo?: string;
}

export interface FeishuBase {
  token: string;
  name: string;
  url: string;
  owner: string;
  updateTime: string;
  docTypes?: string;
}

export interface FeishuTable {
  tableId: string;
  name: string;
  recordCount: number;
  lastModified: string;
  selected?: boolean;
  fields?: FeishuTableField[];
}

export interface FeishuTableField {
  fieldId: string;
  name: string;
  type: string;
  uiType: number;
  property?: any;
}

export interface FeishuRecordResult {
  records: { recordId: string; fields: Record<string, any> }[];
  hasMore: boolean;
}

// 配置管理
export function getFeishuConfig() {
  return api.get<{ success: boolean; data: FeishuConfig | null }>('/api/feishu/config');
}

export function saveFeishuConfig(config: { appId: string; appSecret: string; webhookUrl?: string }) {
  return api.post<{ success: boolean; data: FeishuConfig }>('/api/feishu/config', config);
}

export function updateFeishuConnection(id: number, connected: boolean) {
  return api.put<{ success: boolean; data: FeishuConfig }>(`/api/feishu/config/${id}/connect`, { connected });
}

// 飞书数据
export function fetchFeishuUsers(query?: string) {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return api.get<{ success: boolean; data: FeishuUser[] }>(`/api/feishu/users${qs}`);
}

export function fetchFeishuBases(keyword?: string) {
  const qs = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
  return api.get<{ success: boolean; data: FeishuBase[] }>(`/api/feishu/bases${qs}`);
}

export function fetchBaseTables(baseToken: string) {
  return api.get<{ success: boolean; data: FeishuTable[] }>(`/api/feishu/base/${baseToken}/tables`);
}

export function fetchTableFields(baseToken: string, tableId: string) {
  return api.get<{ success: boolean; data: FeishuTableField[] }>(`/api/feishu/base/${baseToken}/table/${tableId}/fields`);
}

export function fetchTableRecords(baseToken: string, tableId: string, limit = 50) {
  return api.get<{ success: boolean; data: FeishuRecordResult }>(`/api/feishu/base/${baseToken}/table/${tableId}/records?limit=${limit}`);
}

export interface CreatedTableInfo {
  tableId: string;
  tableName: string;
}

export interface CreatedBaseInfo {
  baseToken: string;
  baseName: string;
  url: string;
  tables: CreatedTableInfo[];
  existing: boolean;
}

export function createDefaultFeishuTables() {
  return api.post<{ success: boolean; data: CreatedBaseInfo }>('/api/feishu/create-default-tables');
}
