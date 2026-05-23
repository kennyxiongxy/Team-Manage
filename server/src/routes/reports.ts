import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { employeeId, date, page = '1', limit = '50' } = req.query;
    const conditions: string[] = [];
    const values: any[] = [];
    if (employeeId) { conditions.push('r.employee_id = ?'); values.push(employeeId); }
    if (date) { conditions.push('r.date = ?'); values.push(date); }
    if (req.user!.role === 'employee') { conditions.push('r.employee_id = ?'); values.push(req.user!.id); }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const reports = queryAll(
      `SELECT r.*, u.name as employee_name, u.avatar_url as employee_avatar FROM daily_reports r LEFT JOIN users u ON r.employee_id = u.id ${whereClause} ORDER BY r.date DESC LIMIT ? OFFSET ?`,
      [...values, limitNum, offset]
    );
    const countResult = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM daily_reports r ${whereClause}`, values);
    res.json({ success: true, data: reports, pagination: { page: pageNum, limit: limitNum, total: countResult?.count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取日报列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const report = queryOne(
      `SELECT r.*, u.name as employee_name, u.avatar_url as employee_avatar FROM daily_reports r LEFT JOIN users u ON r.employee_id = u.id WHERE r.id = ?`,
      [req.params.id]
    );
    if (!report) {
      res.status(404).json({ success: false, message: '日报不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (report as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权查看此日报' });
      return;
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取日报失败' });
  }
});

router.post('/', authMiddleware, [body('date').notEmpty().withMessage('日期不能为空').isISO8601()], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  const { date, completedTasks, tomorrowPlan, blockers, supportNeeded } = req.body;
  try {
    const normalizedDate = new Date(date).toISOString().split('T')[0];
    const existing = queryOne(
      'SELECT id FROM daily_reports WHERE employee_id = ? AND date = ?',
      [req.user!.id, normalizedDate]
    );
    if (existing) {
      res.status(409).json({ success: false, message: '今日日报已提交' });
      return;
    }
    const id = uuidv4().replace(/-/g, '').substring(0, 32);
    run(
      `INSERT INTO daily_reports (id, employee_id, date, completed_tasks, tomorrow_plan, blockers, support_needed) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user!.id, normalizedDate, JSON.stringify(completedTasks || []), JSON.stringify(tomorrowPlan || []), blockers || null, supportNeeded || null]
    );
    const report = queryOne(`SELECT r.*, u.name as employee_name, u.avatar_url as employee_avatar FROM daily_reports r LEFT JOIN users u ON r.employee_id = u.id WHERE r.id = ?`, [id]);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建日报失败' });
  }
});

router.put('/:id', authMiddleware, [param('id').notEmpty()], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const existing = queryOne('SELECT * FROM daily_reports WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ success: false, message: '日报不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (existing as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权修改此日报' });
      return;
    }
    const { completedTasks, tomorrowPlan, blockers, supportNeeded } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    if (completedTasks !== undefined) { fields.push('completed_tasks = ?'); values.push(JSON.stringify(completedTasks)); }
    if (tomorrowPlan !== undefined) { fields.push('tomorrow_plan = ?'); values.push(JSON.stringify(tomorrowPlan)); }
    if (blockers !== undefined) { fields.push('blockers = ?'); values.push(blockers); }
    if (supportNeeded !== undefined) { fields.push('support_needed = ?'); values.push(supportNeeded); }
    if (fields.length === 0) {
      res.status(400).json({ success: false, message: '没有要更新的字段' });
      return;
    }
    values.push(req.params.id);
    run(`UPDATE daily_reports SET ${fields.join(', ')} WHERE id = ?`, values);
    const report = queryOne(`SELECT r.*, u.name as employee_name, u.avatar_url as employee_avatar FROM daily_reports r LEFT JOIN users u ON r.employee_id = u.id WHERE r.id = ?`, [req.params.id]);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新日报失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const existing = queryOne('SELECT * FROM daily_reports WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ success: false, message: '日报不存在' });
      return;
    }
    if (req.user!.role === 'employee' && (existing as any).employee_id !== req.user!.id) {
      res.status(403).json({ success: false, message: '无权删除此日报' });
      return;
    }
    run('DELETE FROM daily_reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除日报失败' });
  }
});

export default router;
