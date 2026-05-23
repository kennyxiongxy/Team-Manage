import { execSync } from 'child_process';

const LARK_CLI = '/Users/yaoxiong/.npm-global/bin/lark-cli';

interface LarkCliResult {
  ok: boolean;
  data?: any;
  error?: any;
  identity?: string;
  meta?: any;
}

function execLark(args: string): LarkCliResult {
  try {
    const cmd = `${LARK_CLI} ${args} --format json 2>/dev/null`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, shell: true });
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) {
      try { return JSON.parse(e.stdout.toString()); } catch {}
    }
    return { ok: false, error: { message: e.message } };
  }
}

/** Try multiple common queries to find Feishu users */
export function getFeishuUsers(query = '') {
  const searchQueries = query ? [query] : ['陆', '河', '王', '李', '张', '刘', '陈', 'a', 'test'];
  const seen = new Set<string>();
  const users: any[] = [];

  for (const q of searchQueries) {
    const res = execLark(`contact +search-user --query "${q}" --as user`);
    if (!res.ok || !res.data?.users) continue;
    for (const u of res.data.users) {
      if (!seen.has(u.open_id)) {
        seen.add(u.open_id);
        users.push({
          openId: u.open_id,
          name: u.name || u.localized_name || '',
          email: u.enterprise_email || u.email || '',
          department: Array.isArray(u.department_ids) ? u.department_ids.join(',') : (u.department || ''),
          avatar: u.avatar?.avatar_origin || u.avatar?.avatar_thumb || '',
          status: u.is_activated !== false ? 'active' : 'inactive',
          employeeNo: u.user_id || '',
        });
      }
    }
  }
  return users;
}

/** 搜索飞书文档（含多维表格） */
export function searchFeishuBases(keyword = '') {
  const searchQuery = keyword || '';
  const res = execLark(`docs +search --query "${searchQuery}" --as user`);
  if (!res.ok) {
    console.error('[larkCli] searchFeishuBases failed:', JSON.stringify(res.error));
    return [];
  }

  const systemOwners = new Set(['飞书多维表格', '云文档助手']);

  return (res.data?.results || [])
    .filter((r: any) => r.result_meta?.doc_types === 'BITABLE')
    .filter((r: any) => {
      // 如果没有提供 keyword，过滤掉系统模板；有 keyword 时保留所有匹配结果
      if (!keyword) {
        return !systemOwners.has(r.result_meta?.owner_name);
      }
      return true;
    })
    .map((r: any) => ({
      token: r.result_meta.token,
      name: (r.title_highlighted || r.result_meta?.title_highlighted || '').replace(/<\/?h>/g, ''),
      url: r.result_meta.url,
      owner: r.result_meta.owner_name,
      updateTime: r.result_meta.update_time_iso,
    }));
}

/** 获取 Base 下的数据表列表 (base 子命令默认输出 JSON，不支持 --format) */
export function getBaseTables(baseToken: string) {
  const res = execLarkRaw(`base +table-list --base-token ${baseToken} --as user`);
  if (!res.ok) return [];
  return (res.data?.items || []).map((t: any) => ({
    tableId: t.table_id,
    name: t.table_name,
    recordCount: 0,
    lastModified: t.last_modified_at || '',
  }));
}

/** 获取数据表的字段列表 */
export function getTableFields(baseToken: string, tableId: string) {
  const res = execLarkRaw(`base +field-list --base-token ${baseToken} --table-id ${tableId} --as user`);
  if (!res.ok) return [];
  return (res.data?.items || []).map((f: any) => ({
    fieldId: f.field_id,
    name: f.field_name,
    type: mapFeishuFieldType(f.type),
    uiType: f.type,
    property: f.property || null,
  }));
}

/** 获取数据表的记录 (base +record-list 返回表格形式: data.data + data.fields + data.record_id_list) */
export function getTableRecords(baseToken: string, tableId: string, limit = 50) {
  const res = execLarkRaw(`base +record-list --base-token ${baseToken} --table-id ${tableId} --limit ${limit} --as user`);
  if (!res.ok) return { records: [], hasMore: false };
  const payload = res.data || {};
  const rows: any[][] = payload.data || [];
  const fieldNames: string[] = payload.fields || [];
  const recordIds: string[] = payload.record_id_list || [];
  const records = rows.map((row, idx) => {
    const fields: Record<string, any> = {};
    fieldNames.forEach((name, fIdx) => {
      fields[name] = row[fIdx] ?? null;
    });
    return {
      recordId: recordIds[idx] || String(idx),
      fields,
    };
  });
  return {
    records,
    hasMore: payload.has_more || false,
  };
}

/** 执行 lark-cli 命令（base 子命令默认输出 JSON，不支持 --format flag） */
function execLarkRaw(args: string): LarkCliResult {
  try {
    const cmd = `${LARK_CLI} ${args} 2>/dev/null`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, shell: true, timeout: 20000 });
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) {
      try { return JSON.parse(e.stdout.toString()); } catch {}
    }
    return { ok: false, error: { message: e.message } };
  }
}

function mapFeishuFieldType(type: number): string {
  const typeMap: Record<number, string> = {
    1: 'text', 2: 'number', 3: 'singleSelect', 4: 'multiSelect',
    5: 'date', 7: 'checkbox', 11: 'user', 13: 'url',
    15: 'progress', 100: 'phone',
  };
  return typeMap[type] || 'text';
}

// ══════════════════════════════════════════════════════════════
// 一键创建标准飞书表格
// ══════════════════════════════════════════════════════════════

interface CreatedTableInfo {
  tableId: string;
  tableName: string;
}

export interface CreatedBaseInfo {
  baseToken: string;
  baseName: string;
  url: string;
  tables: CreatedTableInfo[];
  existing: boolean; // true = 已存在，false = 新创建
}

/** 检查是否已有名为"团队任务管理"的 Base，返回最近更新的那个 */
function findExistingBase(): { token: string; name: string; url: string } | null {
  try {
    const res = execLarkRaw('docs +search --query "团队任务管理" --as user');
    if (!res.ok) return null;

    let best: { token: string; name: string; url: string; updateTime: string } | null = null;
    for (const r of res.data?.results || []) {
      const meta = r.result_meta || {};
      const title = (r.title_highlighted || '').replace(/<\/?h>/g, '');
      if (meta.doc_types === 'BITABLE' && title === '团队任务管理') {
        const updateTime = meta.update_time_iso || '';
        if (!best || updateTime > best.updateTime) {
          best = { token: meta.token, name: title, url: meta.url, updateTime };
        }
      }
    }
    if (best) {
      return { token: best.token, name: best.name, url: best.url };
    }
  } catch {
    // ignore
  }
  return null;
}

/** 在指定 Base 中创建一张表格并添加字段和示例记录 */
function createTable(
  baseToken: string,
  tableName: string,
  fields: { field_name: string; type: string; options?: any[] }[],
  sampleRecords: Record<string, any>[]
): CreatedTableInfo {
  // 创建表格
  const tableRes = execLarkRaw(`base +table-create --base-token ${baseToken} --name "${tableName}" --as user`);
  if (!tableRes.ok || !tableRes.data?.table?.id) {
    throw new Error(`创建表格「${tableName}」失败: ` + JSON.stringify(tableRes.error));
  }
  const tableId = tableRes.data.table.id;

  // 创建字段
  for (const field of fields) {
    const bodyObj: any = { field_name: field.field_name, type: field.type };
    if (field.options && field.type === 'select') {
      bodyObj.options = field.options.map((o, i) => ({ name: o, color: i }));
    }
    const body = JSON.stringify(bodyObj);
    const apiRes = execLarkRaw(`api POST /open-apis/base/v3/bases/${baseToken}/tables/${tableId}/fields --data '${body}' --as user`) as any;
    if (apiRes.code !== 0 && !apiRes.data?.id) {
      console.warn(`[createTable] 创建字段失败:`, field.field_name, apiRes);
    }
  }

  // 添加示例记录
  for (const record of sampleRecords) {
    const body = JSON.stringify(record);
    const res = execLarkRaw(`base +record-upsert --base-token ${baseToken} --table-id ${tableId} --json '${body}' --as user`);
    if (!res.ok) {
      console.warn(`[createTable] 添加示例记录失败:`, res);
    }
  }

  return { tableId, tableName };
}

/** 在已有 Base 中补充缺失的表格 */
function fillMissingTables(baseToken: string, existingTables: any[]): CreatedTableInfo[] {
  const existingNames = new Set(existingTables.map((t: any) => t.name));
  const result: CreatedTableInfo[] = existingTables.map((t: any) => ({ tableId: t.tableId, tableName: t.name }));

  // ── 表格1: 任务跟踪 ──
  if (!existingNames.has('任务跟踪')) {
    const taskFields = [
      { field_name: '任务名称', type: 'text' },
      { field_name: '负责人', type: 'user' },
      { field_name: '任务状态', type: 'select', options: ['未开始', '进行中', '待评审', '已完成', '已逾期'] },
      { field_name: '优先级', type: 'select', options: ['紧急', '高', '中', '低'] },
      { field_name: '截止日期', type: 'datetime' },
      { field_name: '开始日期', type: 'datetime' },
      { field_name: '完成进度', type: 'number' },
      { field_name: '任务描述', type: 'text' },
      { field_name: '所属项目', type: 'text' },
    ];
    const taskRecords = [
      { '任务名称': '完成API文档', '任务状态': '进行中', '优先级': '高', '完成进度': 60, '任务描述': '编写REST API接口文档', '所属项目': 'Q3产品升级' },
      { '任务名称': '修复登录bug', '任务状态': '待评审', '优先级': '紧急', '完成进度': 90, '任务描述': '用户反馈登录态偶尔丢失', '所属项目': '客户Demo部署' },
      { '任务名称': 'UI设计稿确认', '任务状态': '已完成', '优先级': '中', '完成进度': 100, '任务描述': '确认新版官网设计稿', '所属项目': '官网重构v2' },
    ];
    result.push(createTable(baseToken, '任务跟踪', taskFields, taskRecords));
  }

  // ── 表格2: 项目管理 ──
  if (!existingNames.has('项目管理')) {
    const projectFields = [
      { field_name: '项目名称', type: 'text' },
      { field_name: '项目经理', type: 'user' },
      { field_name: '项目状态', type: 'select', options: ['进行中', '已完成', '风险中'] },
      { field_name: '项目进度', type: 'number' },
      { field_name: '健康评分', type: 'number' },
      { field_name: '开始日期', type: 'datetime' },
      { field_name: '结束日期', type: 'datetime' },
    ];
    const projectRecords = [
      { '项目名称': 'Q3产品升级', '项目状态': '进行中', '项目进度': 65, '健康评分': 88, '开始日期': '2026-04-01' },
      { '项目名称': '官网重构v2', '项目状态': '进行中', '项目进度': 40, '健康评分': 75, '开始日期': '2026-05-01' },
    ];
    result.push(createTable(baseToken, '项目管理', projectFields, projectRecords));
  }

  // ── 表格3: 日报汇总 ──
  if (!existingNames.has('日报汇总')) {
    const reportFields = [
      { field_name: '汇报人', type: 'user' },
      { field_name: '汇报日期', type: 'datetime' },
      { field_name: '今日完成', type: 'text' },
      { field_name: '明日计划', type: 'text' },
      { field_name: '遇到的阻碍', type: 'text' },
      { field_name: '需要的支持', type: 'text' },
    ];
    const reportRecords = [
      { '汇报日期': '2026-05-09', '今日完成': '完成API文档编写，修复3个bug', '明日计划': '对接前端联调，撰写测试用例', '遇到的阻碍': '接口文档字段定义有歧义，需后端确认', '需要的支持': '希望项目经理协调后端接口评审' },
      { '汇报日期': '2026-05-09', '今日完成': '完成首页UI设计稿，通过内部评审', '明日计划': '细化详情页交互，准备设计规范文档', '遇到的阻碍': '设计规范中缺少暗色模式标准', '需要的支持': '需要设计负责人补充暗色模式规范' },
    ];
    result.push(createTable(baseToken, '日报汇总', reportFields, reportRecords));
  }

  // ── 表格4: 求助处理 ──
  if (!existingNames.has('求助处理')) {
    const helpFields = [
      { field_name: '求助人', type: 'user' },
      { field_name: '关联任务', type: 'text' },
      { field_name: '求助原因', type: 'text' },
      { field_name: '处理状态', type: 'select', options: ['待处理', '已解决'] },
    ];
    const helpRecords = [
      { '关联任务': 'API接口文档编写', '求助原因': '接口字段定义与后端不一致，无法对接', '处理状态': '待处理' },
      { '关联任务': '前端联调测试', '求助原因': '测试环境OAuth配置过期，需要管理员重新授权', '处理状态': '待处理' },
    ];
    result.push(createTable(baseToken, '求助处理', helpFields, helpRecords));
  }

  return result;
}

/** 创建标准团队管理 Base（含4张核心表格 + 示例数据），防重复创建，自动补充缺失表格 */
export function createDefaultTaskBase(): CreatedBaseInfo {
  // Step 1: 检查是否已存在同名 Base
  const existing = findExistingBase();
  if (existing) {
    const existingTables = getBaseTables(existing.token);
    const filledTables = fillMissingTables(existing.token, existingTables);
    return {
      baseToken: existing.token,
      baseName: existing.name,
      url: existing.url,
      tables: filledTables,
      existing: true,
    };
  }

  // Step 2: 创建新 Base
  const baseRes = execLarkRaw('base +base-create --name "团队任务管理" --as user');
  if (!baseRes.ok || !baseRes.data?.base?.base_token) {
    throw new Error('创建 Base 失败: ' + JSON.stringify(baseRes.error));
  }
  const baseToken = baseRes.data.base.base_token;
  const baseUrl = baseRes.data.base.url;

  // Step 3: 创建 4 张核心表格
  const createdTables = fillMissingTables(baseToken, []);

  return {
    baseToken,
    baseName: '团队任务管理',
    url: baseUrl,
    tables: createdTables,
    existing: false,
  };
}

// ─── 同步用户信息到飞书通讯录 ───

interface SyncUserResult {
  success: boolean;
  message: string;
}

/**
 * 将系统用户信息同步到飞书通讯录
 * 使用飞书 Open API: PATCH /open-apis/contact/v3/users/:user_id
 */
export async function syncUserToFeishu(params: {
  userId: string;
  name?: string;
  department?: string;
  email?: string;
  phone?: string;
}): Promise<SyncUserResult> {
  const { userId, name, department, email, phone } = params;

  // 1. 获取飞书配置
  const { queryOne } = await import('./db');
  const config = queryOne<{ app_id: string; app_secret: string; connected: number }>(
    'SELECT app_id, app_secret, connected FROM feishu_configs LIMIT 1'
  );

  if (!config || !config.connected || !config.app_id || !config.app_secret) {
    return { success: false, message: '飞书未连接或配置不完整，跳过同步' };
  }

  // 2. 获取用户飞书 open_id
  const user = queryOne<{ feishu_open_id: string }>(
    'SELECT feishu_open_id FROM users WHERE id = ?',
    [userId]
  );

  if (!user?.feishu_open_id) {
    return { success: false, message: '用户未绑定飞书账号，跳过同步' };
  }

  // 3. 获取 tenant_access_token
  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.app_id,
        app_secret: config.app_secret,
      }),
    });

    if (!tokenRes.ok) {
      return { success: false, message: `获取飞书Token失败: ${tokenRes.status}` };
    }

    const tokenData = await tokenRes.json() as any;
    const accessToken = tokenData?.tenant_access_token;
    if (!accessToken) {
      return { success: false, message: '飞书Token响应异常' };
    }

    // 4. 构建更新字段
    const body: Record<string, any> = {};
    if (name) body.name = name;
    if (department) {
      // Feishu department_ids is an array
      body.department_ids = [department];
    }
    if (email) body.email = email;
    if (phone) body.mobile = phone;

    if (Object.keys(body).length === 0) {
      return { success: true, message: '无需同步的字段' };
    }

    // 5. 调用飞书更新用户 API
    const updateRes = await fetch(
      `https://open.feishu.cn/open-apis/contact/v3/users/${user.feishu_open_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return { success: false, message: `飞书更新失败: ${updateRes.status} ${errText.slice(0, 100)}` };
    }

    const updateData = await updateRes.json() as any;
    if (updateData.code !== 0) {
      return { success: false, message: `飞书更新异常: ${updateData.msg || '未知错误'}` };
    }

    return { success: true, message: '已同步到飞书通讯录' };
  } catch (error: any) {
    return { success: false, message: `飞书同步异常: ${error.message?.slice(0, 100)}` };
  }
}
