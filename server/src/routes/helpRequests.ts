import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status, employeeId, page = '1', limit = '50' } = req.query;
    const conditions: string[] = [];
    const values: any[] = [];
    if (status) { conditions.push('h.status = ?'); values.push(status); }
    if (employeeId) { conditions.push('h.employee_id = ?'); values.push(employeeId); }
    if (req.user!.role === 'employee') { conditions.push('h.employee_id = ?'); values.push(req.user!.id); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const requests = queryAll(
      `SELECT h.*, u.name as employee_name, u.avatar_url as employee_avatar FROM help_requests h LEFT JOIN users u ON h.employee_id = u.id ${whereClause} ORDER BY h.created_at DESC LIMIT ? OFFSET ?`,
      [...values, limitNum, offset]
    );
    const countResult = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM help_requests h ${whereClause}`, values);
    res.json({ success: true, data: requests, pagination: { page: pageNum, limit: limitNum, total: countResult?.count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取求助列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const request = queryOne(
      `SELECT h.*, u.name as employee_name, u.avatar_url as employee_avatar FROM help_requests h LEFT JOIN users u ON h.employee_id = u.id WHERE h.id = ?`,
      [req.params.id]
    );
    if (!request) {
      res.status(404).json({ success: false, message: '求助不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (request as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权查看此求助' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取求助失败' });
  }
});

router.post('/', authMiddleware, [body('reason').notEmpty().withMessage('求助原因不能为空')], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  const { taskId, reason } = req.body;
  try {
    const id = uuidv4().replace(/-/g, '').substring(0, 32);
    run(
      `INSERT INTO help_requests (id, employee_id, task_id, reason) VALUES (?, ?, ?, ?)`,
      [id, req.user!.id, taskId || null, reason]
    );
    const request = queryOne(`SELECT h.*, u.name as employee_name, u.avatar_url as employee_avatar FROM help_requests h LEFT JOIN users u ON h.employee_id = u.id WHERE h.id = ?`, [id]);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建求助失败' });
  }
});

router.put('/:id', authMiddleware, [param('id').notEmpty(), body('status').isIn(['pending', 'resolved'])], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const existing = queryOne('SELECT * FROM help_requests WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ success: false, message: '求助不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (existing as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权修改此求助' });
      return;
    }
    const { status } = req.body;
    run('UPDATE help_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    const request = queryOne(`SELECT h.*, u.name as employee_name, u.avatar_url as employee_avatar FROM help_requests h LEFT JOIN users u ON h.employee_id = u.id WHERE h.id = ?`, [req.params.id]);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新求助失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const existing = queryOne('SELECT * FROM help_requests WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ success: false, message: '求助不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (existing as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权删除此求助' });
      return;
    }
    run('DELETE FROM help_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除求助失败' });
  }
});

export default router;
