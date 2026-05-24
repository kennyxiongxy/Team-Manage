/**
 * 飞书双向同步工具 v3
 * 使用 lark-cli base +record-upsert，JSON 通过文件传递避免 shell 转义问题
 */

import { execSync, spawnSync } from 'child_process';
import { queryOne, queryAll, run } from './db';

const LARK_CLI = '/Users/yaoxiong/.npm-global/bin/lark-cli';

function execLark(args: string): any {
  try {
    const cmd = `${LARK_CLI} ${args} --format json 2>/dev/null`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, shell: true, timeout: 15000 });
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) { try { return JSON.parse(e.stdout.toString()); } catch {} }
    return { ok: false, error: { message: e.message } };
  }
}

function execLarkRaw(args: string): any {
  try {
    const cmd = `${LARK_CLI} ${args} 2>/dev/null`;
    const out = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, shell: true, timeout: 15000 });
    return JSON.parse(out);
  } catch (e: any) {
    if (e.stdout) { try { return JSON.parse(e.stdout.toString()); } catch {} }
    return { ok: false, error: { message: e.message } };
  }
}

function execLarkJson(args: string[], jsonData: any): any {
  const jsonStr = JSON.stringify(jsonData);
  const allArgs = [...args, '--json', jsonStr];
  
  try {
    const result = spawnSync(LARK_CLI, allArgs, {
      encoding: 'utf-8',
      maxBuffer: 5 * 1024 * 1024,
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = result.stdout?.trim() || '';
    const stderr = result.stderr?.trim() || '';
    if (stdout) {
      try { return JSON.parse(stdout); } catch { return { ok: false, error: { message: 'Parse error: ' + stdout.substring(0, 100) } }; }
    }
    return { ok: false, error: { message: stderr || 'No output' } };
  } catch (e: any) {
    return { ok: false, error: { message: e.message } };
  }
}

// ─── 缓存 Base ───
let cachedBaseToken: string | null = null;

function getOrCreateBase(): { baseToken: string; baseName: string } | null {
  if (cachedBaseToken) return { baseToken: cachedBaseToken, baseName: '团队任务管理' };

  const existing = queryOne<{ feishu_base_token: string }>(
    "SELECT feishu_base_token FROM feishu_sync_map WHERE feishu_base_token IS NOT NULL LIMIT 1"
  );
  if (existing?.feishu_base_token) {
    cachedBaseToken = existing.feishu_base_token;
    return { baseToken: cachedBaseToken, baseName: '团队任务管理' };
  }

  const searchRes = execLark('docs +search --query "团队任务管理" --as user');
  if (searchRes.ok && searchRes.data?.results) {
    for (const r of searchRes.data.results) {
      if (r.result_meta?.doc_types === 'BITABLE' && r.result_meta?.token) {
        cachedBaseToken = r.result_meta.token;
        return { baseToken: cachedBaseToken, baseName: '团队任务管理' };
      }
    }
  }

  const createRes = execLarkRaw('base +base-create --name "团队任务管理" --as user');
  if (createRes.ok && createRes.data?.base?.base_token) {
    cachedBaseToken = createRes.data.base.base_token;
    return { baseToken: cachedBaseToken, baseName: '团队任务管理' };
  }

  return null;
}

function getOrCreateTable(baseToken: string, tableName: string, fieldsJson: string): string | null {
  // Find or create table
  let tableId: string | null = null;
  const tablesRes = execLarkRaw(`base +table-list --base-token ${baseToken} --as user`);
  if (tablesRes.ok && tablesRes.data?.items) {
    const table = tablesRes.data.items.find((t: any) => t.table_name === tableName);
    if (table) tableId = table.table_id;
  }

  if (!tableId) {
    const createRes = execLarkRaw(`base +table-create --base-token ${baseToken} --name "${tableName}" --as user`);
    if (!createRes.ok || !createRes.data?.table?.table_id) {
      console.error('[feishuSync] 创建表失败:', JSON.stringify(createRes.error).substring(0, 100));
      return null;
    }
    tableId = createRes.data.table.table_id;
  }

  // Get existing fields
  const existingFields = new Set<string>();
  const fieldsRes = execLarkRaw(`base +field-list --base-token ${baseToken} --table-id ${tableId} --as user`);
  if (fieldsRes.ok && fieldsRes.data?.items) {
    for (const f of fieldsRes.data.items) {
      existingFields.add(f.field_name);
    }
  }

  // Create missing fields
  try {
    const fields: any[] = JSON.parse(fieldsJson);
    for (const f of fields) {
      if (existingFields.has(f.field_name)) continue;
      const fieldDef: any = { field_name: f.field_name, type: f.type };
      if (f.property) fieldDef.property = f.property;
      const res = execLarkJson(['base', '+field-create', '--base-token', baseToken, '--table-id', tableId, '--as', 'user'], fieldDef);
      if (res.ok) {
        console.log(`[feishuSync] 创建字段: ${f.field_name}`);
      } else {
        console.warn(`[feishuSync] 字段创建失败 ${f.field_name}:`, JSON.stringify(res.error).substring(0, 100));
      }
    }
  } catch (e: any) {
    console.warn('[feishuSync] 字段创建异常:', e.message?.substring(0, 100));
  }

  return tableId;
}

// ─── 同步任务 ───

export async function syncTaskToFeishu(taskId: string): Promise<{ success: boolean; message: string }> {
  try {
    const task = queryOne<any>(
      `SELECT t.*, u.name as assignee_name, p.name as project_name
       FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`, [taskId]
    );
    if (!task) return { success: false, message: '任务不存在' };

    const base = getOrCreateBase();
    if (!base) return { success: false, message: '未找到飞书 Base' };

    const taskFields = JSON.stringify([
      { field_name: '标题', type: 'text' },
      { field_name: '描述', type: 'text' },
      { field_name: '负责人', type: 'text' },
      { field_name: '所属项目', type: 'text' },
      { field_name: '优先级', type: 'text' },
      { field_name: '状态', type: 'text' },
      { field_name: '进度', type: 'number' },
      { field_name: '截止日期', type: 'text' },
    ]);

    const tableId = getOrCreateTable(base.baseToken, '任务清单', taskFields);
    if (!tableId) return { success: false, message: '无法创建飞书表格' };

    const priorityMap: Record<string, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' };
    const statusMap: Record<string, string> = { 'not-started': '未开始', 'in-progress': '进行中', 'completed': '已完成', 'overdue': '已逾期' };

    const recordData: any = {
      标题: task.title || '',
      描述: (task.description || '').substring(0, 500),
      负责人: task.assignee_name || '未分配',
      所属项目: task.project_name || '无',
      优先级: priorityMap[task.priority] || '中',
      状态: statusMap[task.status] || '未开始',
      进度: task.progress || 0,
      截止日期: task.due_date || '',
    };

    const mapping = queryOne<any>(
      'SELECT feishu_record_id FROM feishu_sync_map WHERE entity_type = ? AND local_id = ?',
      ['tasks', taskId]
    );

    let cmd = ['base', '+record-upsert', '--base-token', base.baseToken, '--table-id', tableId];
    if (mapping?.feishu_record_id) cmd.push('--record-id', mapping.feishu_record_id);
    cmd.push('--as', 'user');

    const upsertRes = execLarkJson(cmd, recordData);

    if (!upsertRes.ok) {
      const errMsg = upsertRes.error?.message || JSON.stringify(upsertRes.error).substring(0, 100);
      return { success: false, message: '飞书同步失败: ' + errMsg };
    }

    const feishuRecordId = upsertRes.data?.record?.record_id_list?.[0] || mapping?.feishu_record_id || '';
    if (feishuRecordId) {
      run(
        `INSERT OR REPLACE INTO feishu_sync_map (entity_type, local_id, feishu_record_id, feishu_base_token, feishu_table_id, last_synced_at, sync_status)
         VALUES (?, ?, ?, ?, ?, datetime('now'), 'synced')`,
        ['tasks', taskId, feishuRecordId, base.baseToken, tableId]
      );
      console.log(`[feishuSync] ✅ ${task.title?.substring(0, 30)}`);
      return { success: true, message: '已同步到飞书' };
    }

    return { success: false, message: '飞书返回无 record_id' };
  } catch (error: any) {
    console.error('[feishuSync] error:', error.message);
    return { success: false, message: error.message?.slice(0, 100) };
  }
}

export async function syncProjectToFeishu(projectId: string): Promise<{ success: boolean; message: string }> {
  try {
    const project = queryOne<any>('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) return { success: false, message: '项目不存在' };

    const base = getOrCreateBase();
    if (!base) return { success: false, message: '未找到飞书 Base' };

    const projectFields = JSON.stringify([
      { field_name: '项目名称', type: 'text' },
      { field_name: '项目进度', type: 'number' },
      { field_name: '健康评分', type: 'number' },
      { field_name: '项目状态', type: 'text' },
    ]);

    const tableId = getOrCreateTable(base.baseToken, '项目管理', projectFields);
    if (!tableId) return { success: false, message: '无法创建飞书表格' };

    const statusMap: Record<string, string> = { active: '进行中', completed: '已完成', paused: '已暂停' };
    const recordData: any = {
      项目名称: project.name || '',
      项目进度: project.progress || 0,
      健康评分: project.health_score || 100,
      项目状态: statusMap[project.status] || '进行中',
    };

    const mapping = queryOne<any>(
      'SELECT feishu_record_id FROM feishu_sync_map WHERE entity_type = ? AND local_id = ?',
      ['projects', projectId]
    );

    let cmd = ['base', '+record-upsert', '--base-token', base.baseToken, '--table-id', tableId];
    if (mapping?.feishu_record_id) cmd.push('--record-id', mapping.feishu_record_id);
    cmd.push('--as', 'user');

    const upsertRes = execLarkJson(cmd, recordData);
    if (!upsertRes.ok) {
      return { success: false, message: '飞书同步失败: ' + (upsertRes.error?.message || '').substring(0, 100) };
    }

    const feishuRecordId = upsertRes.data?.record?.record_id_list?.[0] || mapping?.feishu_record_id || '';
    if (feishuRecordId) {
      run(
        `INSERT OR REPLACE INTO feishu_sync_map (entity_type, local_id, feishu_record_id, feishu_base_token, feishu_table_id, last_synced_at, sync_status)
         VALUES (?, ?, ?, ?, ?, datetime('now'), 'synced')`,
        ['projects', projectId, feishuRecordId, base.baseToken, tableId]
      );
      return { success: true, message: '已同步到飞书' };
    }
    return { success: false, message: '飞书返回无 record_id' };
  } catch (error: any) {
    return { success: false, message: error.message?.slice(0, 100) };
  }
}

export function getSyncStatus(entityType: string, localId: string) {
  return queryOne<any>('SELECT * FROM feishu_sync_map WHERE entity_type = ? AND local_id = ?', [entityType, localId]);
}

export async function syncAllToFeishu(): Promise<{ synced: number; failed: number }> {
  let synced = 0, failed = 0;
  const tasks = queryAll<any>('SELECT id FROM tasks');
  for (const t of tasks) { (await syncTaskToFeishu(t.id)).success ? synced++ : failed++; }
  const projects = queryAll<any>('SELECT id FROM projects');
  for (const p of projects) { (await syncProjectToFeishu(p.id)).success ? synced++ : failed++; }
  return { synced, failed };
}
