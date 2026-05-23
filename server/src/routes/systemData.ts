import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 获取所有系统数据键
router.get('/keys', authMiddleware, (_req: AuthRequest, res: Response) => {
  try {
    const rows = queryAll<{ data_key: string }>('SELECT data_key FROM system_data ORDER BY data_key');
    res.json({ success: true, data: rows.map((r) => r.data_key) });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取系统数据键失败' });
  }
});

// 获取单个系统数据
router.get('/:key', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const row = queryOne<{ data_value: string; updated_at: string }>(
      'SELECT data_value, updated_at FROM system_data WHERE data_key = ?',
      [req.params.key]
    );
    if (!row) {
      res.json({ success: true, data: null });
      return;
    }
    const parsed = JSON.parse(row.data_value);
    res.json({ success: true, data: parsed, updatedAt: row.updated_at });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取系统数据失败' });
  }
});

// 批量获取系统数据
router.post('/batch', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { keys } = req.body as { keys: string[] };
    if (!Array.isArray(keys) || keys.length === 0) {
      res.json({ success: true, data: {} });
      return;
    }
    const placeholders = keys.map(() => '?').join(',');
    const rows = queryAll<{ data_key: string; data_value: string }>(
      `SELECT data_key, data_value FROM system_data WHERE data_key IN (${placeholders})`,
      keys
    );
    const result: Record<string, any> = {};
    for (const row of rows) {
      try {
        result[row.data_key] = JSON.parse(row.data_value);
      } catch {}
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: '批量获取系统数据失败' });
  }
});

// 保存/更新系统数据（管理员）
router.put('/:key', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'manager') {
      res.status(403).json({ success: false, message: '需要管理员权限' });
      return;
    }
    const { data_value } = req.body;
    const value = typeof data_value === 'string' ? data_value : JSON.stringify(data_value);
    const existing = queryOne('SELECT data_key FROM system_data WHERE data_key = ?', [req.params.key]);
    if (existing) {
      run('UPDATE system_data SET data_value = ?, updated_at = CURRENT_TIMESTAMP WHERE data_key = ?', [value, req.params.key]);
    } else {
      run('INSERT INTO system_data (data_key, data_value) VALUES (?, ?)', [req.params.key, value]);
    }
    res.json({ success: true, message: '保存成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '保存系统数据失败' });
  }
});

export default router;
