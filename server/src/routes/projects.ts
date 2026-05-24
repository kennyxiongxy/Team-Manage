import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest, requireManager } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncProjectToFeishu } from '../utils/feishuSync';

const router = Router();

// 获取项目列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const projects = queryAll(
      `SELECT p.*, u.name as owner_name,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN tasks t ON p.id = t.project_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    const enriched = projects.map((p: any) => ({
      ...p,
      progress: p.total_tasks > 0
        ? Math.round((parseInt(p.completed_tasks) / parseInt(p.total_tasks)) * 100)
        : parseInt(p.progress) || 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

// 获取单个项目
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      res.status(404).json({ success: false, message: '项目不存在' });
      return;
    }

    const tasks = queryAll(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...project, tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取项目失败' });
  }
});

// 创建项目
router.post(
  '/',
  authMiddleware,
  requireManager,
  [body('name').notEmpty().withMessage('项目名称不能为空').isLength({ max: 100 })],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, healthScore, progress, status } = req.body;

    try {
      const id = uuidv4().replace(/-/g, '').substring(0, 32);
      const owner_id = req.body.owner_id || null;
      run(
        `INSERT INTO projects (id, name, health_score, progress, status, owner_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, healthScore || 100, progress || 0, status || 'active', owner_id]
      );

      const project = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
      res.json({ success: true, data: project });
      syncProjectToFeishu(id).catch(e => console.warn('[projects] 飞书同步失败:', e.message));
    } catch (error) {
      res.status(500).json({ success: false, message: '创建项目失败' });
    }
  }
);

// 更新项目
router.put(
  '/:id',
  authMiddleware,
  requireManager,
  [param('id').notEmpty()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, healthScore, progress, status } = req.body;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (healthScore !== undefined) { fields.push('health_score = ?'); values.push(healthScore); }
      if (progress !== undefined) { fields.push('progress = ?'); values.push(progress); }
      if (status !== undefined) { fields.push('status = ?'); values.push(status); }
      if (req.body.owner_id !== undefined) { fields.push('owner_id = ?'); values.push(req.body.owner_id); }

      if (fields.length === 0) {
        res.status(400).json({ success: false, message: '没有要更新的字段' });
        return;
      }

      values.push(req.params.id);
      run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);

      const project = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
      res.json({ success: true, data: project });
      syncProjectToFeishu(req.params.id).catch(e => console.warn('[projects] 飞书同步失败:', e.message));
    } catch (error) {
      res.status(500).json({ success: false, message: '更新项目失败' });
    }
  }
);

// 删除项目
router.delete('/:id', authMiddleware, requireManager, async (req: AuthRequest, res) => {
  try {
    run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除项目失败' });
  }
});

export default router;
