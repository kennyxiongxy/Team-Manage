/**
 * 🧠 动态字段映射引擎
 * 自动识别飞书表格类型，智能匹配字段映射关系
 * 无需手动配置，支持任意格式的表格
 */

import { getBaseTables, getTableFields, getTableRecords, searchFeishuBases } from './larkCli';

// ─── 类型定义 ───

export interface FieldMap {
  /** 飞书字段名 → 系统字段名 */
  [feishuField: string]: string;
}

export interface TableMatch {
  baseToken: string;
  tableId: string;
  tableName: string;
  tableType: 'tasks' | 'projects' | 'reports' | 'help' | 'unknown';
  confidence: number;           // 0-1 整体置信度
  fieldMap: FieldMap;           // 飞书字段 → 系统字段
  fieldConfidence: Record<string, number>; // 每个字段的置信度
  unmatchedFields: string[];    // 未能匹配的飞书字段
  recordCount: number;          // 记录数
}

export interface AutoScanResult {
  tasksTable: TableMatch | null;
  projectsTable: TableMatch | null;
  reportsTable: TableMatch | null;
  helpTable: TableMatch | null;
  allMatches: TableMatch[];     // 所有匹配的表格
  message: string;
}

// ─── 系统字段定义：每种表类型期望的字段及关键词 ───

const FIELD_PATTERNS: Record<string, { field: string; keywords: string[][]; types: string[]; required: boolean }[]> = {
  tasks: [
    { field: 'title',      keywords: [['任务名称', '标题', '名称', '任务', 'title', 'name'], ['标题']], types: ['text', 'string'], required: true },
    { field: 'status',     keywords: [['状态', '进度状态', '任务状态', 'status', '进展'], ['state']], types: ['text', 'string', 'select'], required: false },
    { field: 'priority',   keywords: [['优先级', '重要程度', 'priority'], ['紧急', '重要']], types: ['text', 'string', 'select'], required: false },
    { field: 'assignee',   keywords: [['负责人', '执行人', '指派', '处理人', 'assignee', 'owner'], ['人员']], types: ['text', 'string', 'user', 'person'], required: false },
    { field: 'dueDate',    keywords: [['截止日期', '结束日期', '期限', 'deadline', 'due', 'due_date'], ['日期']], types: ['text', 'string', 'date', 'datetime'], required: false },
    { field: 'progress',   keywords: [['进度', '完成度', '百分比', 'progress', '完成'], ['率', '数']], types: ['number'], required: false },
    { field: 'description', keywords: [['描述', '详情', '内容', 'description', '说明', '备注'], ['desc']], types: ['text', 'string'], required: false },
    { field: 'project',    keywords: [['项目', '所属项目', '关联项目', 'project'], ['名称']], types: ['text', 'string', 'select'], required: false },
    { field: 'tags',       keywords: [['标签', 'tag', '分类', '类别', '类型'], ['label']], types: ['text', 'string', 'multiselect'], required: false },
  ],
  projects: [
    { field: 'name',       keywords: [['项目名称', '名称', '项目', 'name', 'project'], ['标题']], types: ['text', 'string'], required: true },
    { field: 'status',     keywords: [['状态', '项目状态', 'status', '进展'], ['state']], types: ['text', 'string', 'select'], required: false },
    { field: 'manager',    keywords: [['项目经理', '负责人', '经理', 'manager', 'owner'], ['人员']], types: ['text', 'string', 'user'], required: false },
    { field: 'progress',   keywords: [['进度', '项目进度', '完成度', 'progress'], ['率']], types: ['number'], required: false },
    { field: 'healthScore', keywords: [['健康评分', '健康度', '评分', 'score', '健康'], ['health']], types: ['number'], required: false },
    { field: 'startDate',  keywords: [['开始日期', '启动日期', 'start', 'start_date', '起始'], ['日期']], types: ['text', 'string', 'date', 'datetime'], required: false },
    { field: 'endDate',    keywords: [['结束日期', '截止日期', 'end', 'end_date', '期限'], ['日期']], types: ['text', 'string', 'date', 'datetime'], required: false },
  ],
  reports: [
    { field: 'author',     keywords: [['汇报人', '提交人', '作者', 'author', '姓名', '员工'], ['creator']], types: ['text', 'string', 'user', 'person'], required: true },
    { field: 'date',       keywords: [['日期', '汇报日期', 'date', '时间'], ['日报']], types: ['text', 'string', 'date', 'datetime'], required: true },
    { field: 'completed',  keywords: [['今日完成', '完成', 'completed', '工作总结', '完成内容'], ['工作']], types: ['text', 'string'], required: false },
    { field: 'plan',       keywords: [['明日计划', '计划', 'plan', '规划'], ['明天']], types: ['text', 'string'], required: false },
    { field: 'blockers',   keywords: [['阻碍', '遇到的阻碍', 'blocker', '问题', '困难'], ['障碍']], types: ['text', 'string'], required: false },
    { field: 'support',    keywords: [['需要的支持', '支持', 'support', '帮助', '协助'], ['need']], types: ['text', 'string'], required: false },
  ],
  help: [
    { field: 'applicant',  keywords: [['求助人', '申请人', '申请人姓名', '姓名', '人员', 'applicant'], ['author']], types: ['text', 'string', 'user', 'person'], required: true },
    { field: 'task',       keywords: [['关联任务', '任务', 'task', '相关'], ['关联']], types: ['text', 'string'], required: false },
    { field: 'reason',     keywords: [['求助原因', '原因', 'reason', '问题描述', '描述'], ['说明']], types: ['text', 'string'], required: false },
    { field: 'status',     keywords: [['处理状态', '状态', 'status', '处理'], ['state']], types: ['text', 'string', 'select'], required: false },
  ],
};

// 表类型识别的表名关键词
const TABLE_TYPE_KEYWORDS: Record<string, string[]> = {
  tasks: ['任务', 'task', 'todo', '工作', '待办', '事项', 'ticket'],
  projects: ['项目', 'project', '计划', '规划'],
  reports: ['日报', '报告', 'report', '汇报', '总结', 'daily', 'weekly', '周报'],
  help: ['求助', '问题', 'help', 'issue', '支持', '反馈'],
};

// ─── 核心匹配逻辑 ───

/**
 * 计算字段名与关键词的匹配度
 * @returns 0-1 之间的置信度
 */
function matchFieldKeyword(fieldName: string, patterns: string[][]): number {
  const lower = fieldName.toLowerCase().trim();
  let bestScore = 0;

  for (const [primary, secondary = []] of patterns.map((p, i) => {
    const [first, ...rest] = p;
    return [first || [], rest.flat()];
  })) {
    // 检查主关键词
    let mainHit = false;
    for (const kw of primary) {
      if (lower.includes(kw.toLowerCase())) {
        mainHit = true;
        break;
      }
    }

    if (mainHit) {
      let score = 0.6; // 基本得分
      // 检查辅关键词提高置信度
      for (const kw of secondary) {
        if (lower.includes(kw.toLowerCase())) {
          score += 0.2;
        }
      }
      bestScore = Math.max(bestScore, Math.min(score, 1.0));
    }
  }

  // 精确匹配给更高分
  for (const primary of patterns.map(p => p[0] || [])) {
    for (const kw of primary) {
      if (lower === kw.toLowerCase()) {
        bestScore = Math.max(bestScore, 1.0);
      }
    }
  }

  return bestScore;
}

/**
 * 匹配单个表格的所有字段
 */
function matchTableFields(
  tableType: string,
  fields: { fieldId: string; name: string; type: string }[]
): { fieldMap: FieldMap; fieldConfidence: Record<string, number>; unmatched: string[] } {
  const patterns = FIELD_PATTERNS[tableType];
  if (!patterns) return { fieldMap: {}, fieldConfidence: {}, unmatched: fields.map(f => f.name) };

  const fieldMap: FieldMap = {};
  const fieldConfidence: Record<string, number> = {};
  const usedFields = new Set<string>();

  // 第一轮：高置信度匹配（精确匹配）
  for (const pattern of patterns) {
    let bestMatch = '';
    let bestScore = 0;

    for (const field of fields) {
      if (usedFields.has(field.fieldId)) continue;
      const score = matchFieldKeyword(field.name, pattern.keywords);
      if (score > bestScore && score > 0.3) {
        bestMatch = field.name;
        bestScore = score;
      }
    }

    if (bestMatch && bestScore > 0.3) {
      fieldMap[bestMatch] = pattern.field;
      fieldConfidence[pattern.field] = bestScore;
      // 标记已使用的字段
      const matchedField = fields.find(f => f.name === bestMatch);
      if (matchedField) usedFields.add(matchedField.fieldId);
    }
  }

  const unmatched = fields.filter(f => !usedFields.has(f.fieldId)).map(f => f.name);

  return { fieldMap, fieldConfidence, unmatched };
}

/**
 * 识别表格类型（基于表名和字段）
 */
function detectTableType(tableName: string, fields: { name: string; type: string }[]): { type: string; confidence: number } {
  let bestType = 'unknown';
  let bestConfidence = 0;

  for (const [type, keywords] of Object.entries(TABLE_TYPE_KEYWORDS)) {
    let score = 0;
    const lowerName = tableName.toLowerCase().trim();

    // 表名关键词匹配
    for (const kw of keywords) {
      if (lowerName.includes(kw.toLowerCase())) {
        score += 0.4;
        if (lowerName.startsWith(kw.toLowerCase())) score += 0.2; // 开头匹配加分
      }
    }

    // 字段名匹配：如果表名不明显，通过字段推测
    const patterns = FIELD_PATTERNS[type];
    if (patterns && score < 0.6) {
      let fieldHits = 0;
      const requiredFields = patterns.filter(p => p.required);
      for (const pattern of requiredFields) {
        for (const field of fields) {
          if (matchFieldKeyword(field.name, pattern.keywords) > 0.5) {
            fieldHits++;
            break;
          }
        }
      }
      if (fieldHits > 0) {
        score += 0.25 * fieldHits;
      }
    }

    if (score > bestConfidence) {
      bestConfidence = Math.min(score, 1.0);
      bestType = type;
    }
  }

  return { type: bestType, confidence: bestConfidence };
}

// ─── 公开 API ───

/**
 * 自动扫描飞书中的所有 Base，识别可用的表格并进行字段映射
 */
export async function autoScanAndMap(): Promise<AutoScanResult> {
  const result: AutoScanResult = {
    tasksTable: null,
    projectsTable: null,
    reportsTable: null,
    helpTable: null,
    allMatches: [],
    message: '',
  };

  try {
    // Step 1: 搜索所有可用的多维表格
    const bases = searchFeishuBases('');

    // Step 2: 遍历所有 Base 和 Table
    for (const base of bases) {
      if (!base.token) continue;
      const tables = getBaseTables(base.token);
      
      for (const table of tables) {
        const fields = getTableFields(base.token, table.tableId);
        if (fields.length === 0) continue;

        // Step 3: 识别表格类型
        const { type, confidence: typeConfidence } = detectTableType(table.name, fields);

        if (type === 'unknown' || typeConfidence < 0.3) continue;

        // Step 4: 匹配字段
        const { fieldMap, fieldConfidence, unmatched } = matchTableFields(type, fields);

        // 计算整体置信度
        const mappedCount = Object.keys(fieldMap).length;
        const requiredCount = (FIELD_PATTERNS[type] || []).filter(p => p.required).length;
        const requiredMapped = (FIELD_PATTERNS[type] || [])
          .filter(p => p.required)
          .filter(p => Object.values(fieldMap).includes(p.field))
          .length;
        
        // 整体置信度 = 表类型置信度 * 0.3 + 字段匹配率 * 0.5 + 必填完成率 * 0.2
        const fieldRate = fields.length > 0 ? mappedCount / fields.length : 0;
        const requiredRate = requiredCount > 0 ? requiredMapped / requiredCount : 1;
        const overallConfidence = typeConfidence * 0.3 + fieldRate * 0.5 + requiredRate * 0.2;

        const match: TableMatch = {
          baseToken: base.token,
          tableId: table.tableId,
          tableName: table.name,
          tableType: type as TableMatch['tableType'],
          confidence: Math.round(overallConfidence * 100) / 100,
          fieldMap,
          fieldConfidence,
          unmatchedFields: unmatched,
          recordCount: table.recordCount || 0,
        };

        result.allMatches.push(match);

        // 对每种类型保留最高置信度的匹配
        const bestMap: Record<string, TableMatch | null> = {
          tasks: result.tasksTable,
          projects: result.projectsTable,
          reports: result.reportsTable,
          help: result.helpTable,
        };

        if (!bestMap[type] || match.confidence > (bestMap[type]?.confidence || 0)) {
          if (type === 'tasks') result.tasksTable = match;
          else if (type === 'projects') result.projectsTable = match;
          else if (type === 'reports') result.reportsTable = match;
          else if (type === 'help') result.helpTable = match;
        }
      }
    }

    // 获取最佳匹配表的实际记录数
    for (const table of [result.tasksTable, result.projectsTable, result.reportsTable, result.helpTable]) {
      if (table) {
        try {
          const { records } = getTableRecords(table.baseToken, table.tableId, 200);
          table.recordCount = records.length;
        } catch {
          table.recordCount = 0;
        }
      }
    }

    // 生成摘要
    const found = [
      result.tasksTable && '任务表',
      result.projectsTable && '项目表',
      result.reportsTable && '日报表',
      result.helpTable && '求助表',
    ].filter(Boolean);

    result.message = found.length > 0
      ? `发现 ${found.length} 个可用表格: ${found.join('、')}`
      : '未找到可自动识别的表格，请确认飞书中有包含任务/项目/日报/求助相关字段的表格';

    return result;
  } catch (error: any) {
    result.message = `扫描失败: ${error.message}`;
    return result;
  }
}

/**
 * 获取表格的完整数据（按映射后的字段名）
 */
export function getMappedRecords(
  baseToken: string,
  tableId: string,
  fieldMap: FieldMap,
  limit = 200
): any[] {
  const { records } = getTableRecords(baseToken, tableId, limit);
  return records.map((r: any) => {
    const mapped: Record<string, any> = {};
    for (const [feishuField, systemField] of Object.entries(fieldMap)) {
      mapped[systemField] = r.fields?.[feishuField];
    }
    mapped._recordId = r.recordId;
    mapped._rawFields = r.fields;
    return mapped;
  });
}

/**
 * 导出字段模式供前端使用
 */
export { TABLE_TYPE_KEYWORDS, FIELD_PATTERNS };
