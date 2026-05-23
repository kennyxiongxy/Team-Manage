import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { queryOne, run } from '../utils/db';
import { authMiddleware, requireManager } from '../middleware/auth';
import { getFeishuUsers, searchFeishuBases, getBaseTables, getTableFields, getTableRecords, createDefaultTaskBase } from '../utils/larkCli';

const router = Router();

/** 将数据库 snake_case 字段转换为前端 camelCase */
function formatConfig(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id || '',
    appSecret: row.app_secret || '',
    webhookUrl: row.webhook_url || '',
    connected: !!row.connected,
    connectedAt: row.connected_at || null,
  };
}

// ─── 配置管理 ───

router.get('/config', authMiddleware, requireManager, async (_req: Request, res: Response) => {
  try {
    const config = queryOne('SELECT * FROM feishu_configs LIMIT 1');
    res.json({ success: true, data: formatConfig(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取配置失败' });
  }
});

router.post('/config', authMiddleware, requireManager, [
  body('appId').notEmpty().withMessage('App ID 不能为空'),
  body('appSecret').notEmpty().withMessage('App Secret 不能为空'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  const { appId, appSecret, webhookUrl } = req.body;
  try {
    const existing = queryOne('SELECT id FROM feishu_configs LIMIT 1');
    let result;
    if (existing) {
      run('UPDATE feishu_configs SET app_id = ?, app_secret = ?, webhook_url = ? WHERE id = ?', [appId, appSecret, webhookUrl || null, (existing as any).id]);
      result = queryOne('SELECT * FROM feishu_configs WHERE id = ?', [(existing as any).id]);
    } else {
      const insert = run('INSERT INTO feishu_configs (app_id, app_secret, webhook_url) VALUES (?, ?, ?)', [appId, appSecret, webhookUrl || null]);
      result = queryOne('SELECT * FROM feishu_configs WHERE id = ?', [insert.lastInsertRowid]);
    }
    res.json({ success: true, data: formatConfig(result) });
  } catch (error) {
    res.status(500).json({ success: false, message: '保存配置失败' });
  }
});

router.put('/config/:id/connect', authMiddleware, requireManager, [body('connected').isBoolean()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  const { connected } = req.body;
  try {
    run('UPDATE feishu_configs SET connected = ?, connected_at = ? WHERE id = ?', [connected ? 1 : 0, connected ? new Date().toISOString() : null, req.params.id]);
    const config = queryOne('SELECT * FROM feishu_configs WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: formatConfig(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新连接状态失败' });
  }
});

// ─── 真实飞书数据接口 ───

/** 获取飞书通讯录人员 */
router.get('/users', authMiddleware, requireManager, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const users = getFeishuUsers(query);
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取飞书用户失败: ' + (error.message || '') });
  }
});

/** 搜索飞书多维表格（Base） */
router.get('/bases', authMiddleware, requireManager, async (req: Request, res: Response) => {
  try {
    const keyword = (req.query.q as string) || '';
    const bases = searchFeishuBases(keyword);
    res.json({ success: true, data: bases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '搜索飞书表格失败: ' + (error.message || '') });
  }
});

/** 获取 Base 下的数据表列表 */
router.get('/base/:token/tables', authMiddleware, requireManager, async (req: Request, res: Response) => {
  try {
    const tables = getBaseTables(req.params.token);
    res.json({ success: true, data: tables });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取数据表列表失败: ' + (error.message || '') });
  }
});

/** 获取数据表的字段列表 */
router.get('/base/:token/table/:tableId/fields', authMiddleware, requireManager, async (req: Request, res: Response) => {
  try {
    const fields = getTableFields(req.params.token, req.params.tableId);
    res.json({ success: true, data: fields });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取字段列表失败: ' + (error.message || '') });
  }
});

/** 获取数据表的记录 */
router.get('/base/:token/table/:tableId/records', authMiddleware, requireManager, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = getTableRecords(req.params.token, req.params.tableId, limit);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取记录失败: ' + (error.message || '') });
  }
});

/** 一键创建标准任务管理表格 */
router.post('/create-default-tables', authMiddleware, requireManager, async (_req: Request, res: Response) => {
  try {
    const result = createDefaultTaskBase();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '创建标准表格失败: ' + (error.message || '') });
  }
});

export default router;
