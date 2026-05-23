// ══════════════════════════════════════════════════════════════
// 飞书集成 Mock 数据
// ══════════════════════════════════════════════════════════════

// ─── 飞书集成配置 ───
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  webhookUrl: string;
  connected: boolean;
  connectedAt: string | null;
}

export const defaultFeishuConfig: FeishuConfig = {
  appId: '',
  appSecret: '',
  webhookUrl: '',
  connected: false,
  connectedAt: null,
};

// ─── 飞书人员 ───
export interface FeishuUser {
  openId: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
  phone?: string;
  employeeNo?: string;
  status: 'active' | 'inactive';
}

export const mockFeishuUsers: FeishuUser[] = [];

// ─── 飞书智能表格 ───
export interface FeishuTable {
  tableId: string;
  name: string;
  sheetName?: string;
  recordCount: number;
  lastModified: string;
  selected: boolean;
  fields: FeishuTableField[];
  baseToken?: string;
}

export interface FeishuTableField {
  fieldId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'singleSelect' | 'multiSelect' | 'user' | 'checkbox' | 'url' | 'phone';
  sampleValues?: string[];
}

export const mockFeishuTables: FeishuTable[] = [];

// ─── 字段映射 ───
export type SystemField = 'title' | 'assignee' | 'status' | 'priority' | 'dueDate' | 'progress' | 'description' | 'project' | 'tags';

export interface FieldMapping {
  feishuFieldId: string;
  feishuFieldName: string;
  systemField: SystemField | null;
  transform: 'direct' | 'convert_status' | 'convert_priority' | 'convert_date' | 'custom';
  customRule?: string;
  confidence: number; // AI 映射置信度 0-1
}

export const systemFieldLabels: Record<SystemField, string> = {
  title: '任务标题',
  assignee: '负责人',
  status: '任务状态',
  priority: '优先级',
  dueDate: '截止日期',
  progress: '完成进度',
  description: '任务描述',
  project: '所属项目',
  tags: '标签',
};

// AI 推荐映射（模拟 AI 分析结果）
export function generateAiMapping(tableFields: FeishuTableField[]): FieldMapping[] {
  const keywordMap: Record<string, SystemField> = {
    '任务名称': 'title', '标题': 'title', '名称': 'title', '任务': 'title',
    '负责人': 'assignee', '执行人': 'assignee', '指派': 'assignee',
    '状态': 'status', '进展': 'status',
    '优先级': 'priority', '重要程度': 'priority',
    '截止日期': 'dueDate', '结束日期': 'dueDate', '期限': 'dueDate',
    '进度': 'progress', '完成度': 'progress', '百分比': 'progress',
    '描述': 'description', '详情': 'description',
    '项目': 'project',
    '标签': 'tags',
  };

  return tableFields.map((field) => {
    let matchedSystemField: SystemField | null = null;
    let transform: FieldMapping['transform'] = 'direct';
    let confidence = 0;

    for (const [keyword, sysField] of Object.entries(keywordMap)) {
      if (field.name.includes(keyword)) {
        matchedSystemField = sysField;
        if (sysField === 'status') transform = 'convert_status';
        else if (sysField === 'priority') transform = 'convert_priority';
        else if (sysField === 'dueDate') transform = 'convert_date';
        confidence = Math.min(0.95, 0.6 + keyword.length / field.name.length * 0.3);
        break;
      }
    }

    if (!matchedSystemField) {
      confidence = 0.1;
    }

    return {
      feishuFieldId: field.fieldId,
      feishuFieldName: field.name,
      systemField: matchedSystemField,
      transform,
      confidence,
    };
  });
}

// ─── 同步日志 ───
export interface SyncLog {
  id: string;
  type: 'import' | 'export' | 'sync';
  tableName: string;
  status: 'success' | 'failed' | 'partial';
  recordsAffected: number;
  details: string;
  timestamp: string;
}

export const mockSyncLogs: SyncLog[] = [];

// ─── 同步配置 ───
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // 分钟
  conflictStrategy: 'override' | 'skip' | 'manual';
  syncDirection: 'bidirectional' | 'import_only' | 'export_only';
}

export const defaultSyncConfig: SyncConfig = {
  autoSync: true,
  syncInterval: 15,
  conflictStrategy: 'manual',
  syncDirection: 'bidirectional',
};
