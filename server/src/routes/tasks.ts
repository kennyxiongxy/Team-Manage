import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 获取任务列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      status,
      priority,
      assigneeId,
      projectId,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const conditions: string[] = [];
    const values: any[] = [];

    if (status) { conditions.push('t.status = ?'); values.push(status); }
    if (priority) { conditions.push('t.priority = ?'); values.push(priority); }
    if (assigneeId) { conditions.push('t.assignee_id = ?'); values.push(assigneeId); }
    if (projectId) { conditions.push('t.project_id = ?'); values.push(projectId); }
    if (search) { conditions.push('t.title LIKE ?'); values.push(`%${search}%`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const tasks = queryAll(
      `SELECT t.*,
        u.name as assignee_name, u.avatar_url as assignee_avatar,
        p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limitNum, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks t ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: tasks,
      pagination: { page: pageNum, limit: limitNum, total: countResult?.count || 0 },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
});

// 获取单个任务
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const task = queryOne(
      `SELECT t.*,
        u.name as assignee_name, u.avatar_url as assignee_avatar,
        p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!task) {
      res.status(404).json({ success: false, message: '任务不存在' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务失败' });
  }
});

// 创建任务
router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 200 }),
    body('priority').optional().isIn(['urgent', 'high', 'medium', 'low']),
    body('status').optional().isIn(['not-started', 'in-progress', 'pending-review', 'completed', 'overdue']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      title,
      description,
      projectId,
      assigneeId,
      priority = 'medium',
      status = 'not-started',
      progress = 0,
      dueDate,
      startDate,
    } = req.body;

    try {
      const id = uuidv4().replace(/-/g, '').substring(0, 32);
      run(
        `INSERT INTO tasks (id, title, description, project_id, assignee_id, priority, status, progress, due_date, start_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description || null, projectId || null, assigneeId || null, priority, status, progress, dueDate || null, startDate || null, req.user!.id]
      );

      const task = queryOne(
        `SELECT t.*,
          u.name as assignee_name, u.avatar_url as assignee_avatar,
          p.name as project_name
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.id = ?`,
        [id]
      );

      res.json({ success: true, data: task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ success: false, message: '创建任务失败' });
    }
  }
);

// 更新任务
router.put(
  '/:id',
  authMiddleware,
  [
    param('id').notEmpty(),
    body('priority').optional().isIn(['urgent', 'high', 'medium', 'low']),
    body('status').optional().isIn(['not-started', 'in-progress', 'pending-review', 'completed', 'overdue']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      status,
      progress,
      dueDate,
      startDate,
    } = req.body;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (title !== undefined) { fields.push('title = ?'); values.push(title); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (projectId !== undefined) { fields.push('project_id = ?'); values.push(projectId); }
      if (assigneeId !== undefined) { fields.push('assignee_id = ?'); values.push(assigneeId); }
      if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
      if (status !== undefined) { fields.push('status = ?'); values.push(status); }
      if (progress !== undefined) { fields.push('progress = ?'); values.push(progress); }
      if (dueDate !== undefined) { fields.push('due_date = ?'); values.push(dueDate); }
      if (startDate !== undefined) { fields.push('start_date = ?'); values.push(startDate); }

      if (fields.length === 0) {
        res.status(400).json({ success: false, message: '没有要更新的字段' });
        return;
      }

      values.push(req.params.id);
      run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);

      const task = queryOne(
        `SELECT t.*,
          u.name as assignee_name, u.avatar_url as assignee_avatar,
          p.name as project_name
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.id = ?`,
        [req.params.id]
      );

      if (!task) {
        res.status(404).json({ success: false, message: '任务不存在' });
        return;
      }

      res.json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({ success: false, message: '更新任务失败' });
    }
  }
);

// 删除任务（仅管理员或任务创建者可删除）
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const task = queryOne<{ created_by: string }>('SELECT created_by FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      res.status(404).json({ success: false, message: '任务不存在' });
      return;
    }
    if (req.user!.role !== 'manager' && task.created_by !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权删除此任务' });
      return;
    }
    run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除任务失败' });
  }
});

// 获取任务统计
router.get('/stats/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const totalResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
    const byStatusResult = queryAll('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
    const byPriorityResult = queryAll('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority');
    const overdueResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM tasks WHERE status = 'overdue'");

    res.json({
      success: true,
      data: {
        total: totalResult?.count || 0,
        byStatus: byStatusResult,
        byPriority: byPriorityResult,
        overdue: overdueResult?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

export default router;
