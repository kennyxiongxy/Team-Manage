import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { queryAll, queryOne, run } from '../utils/db';
import { authMiddleware, AuthRequest, requireManager } from '../middleware/auth';
import { syncUserToFeishu } from '../utils/larkCli';

const router = Router();

// 获取所有用户（管理员可看全部，员工只能看自己）
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let sql = `SELECT u.id, u.name, u.email, u.phone, u.role, u.department, u.avatar_url, u.created_at,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as tasks_count,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'completed') as tasks_completed,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'in-progress') as tasks_in_progress,
        (SELECT COUNT(*) FROM tasks WHERE created_by = u.id) as created_tasks_count
       FROM users u`;
    const values: any[] = [];
    if (req.user!.role === 'employee') {
      sql += ' WHERE u.id = ?';
      values.push(req.user!.id);
    }
    sql += ' ORDER BY u.created_at DESC';
    const users = queryAll(sql, values);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 获取单个用户（员工只能看自己）
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role === 'employee' && req.user!.id !== req.params.id) {
      res.status(403).json({ success: false, message: '无权查看其他用户信息' });
      return;
    }

    const user = queryOne(
      'SELECT id, name, email, phone, role, department, avatar_url, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    const tasks = queryAll(
      'SELECT id, title, status, priority, progress, due_date FROM tasks WHERE assignee_id = ?',
      [req.params.id]
    );

    res.json({ success: true, data: { ...user, tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户失败' });
  }
});

// 更新用户
router.put(
  '/:id',
  authMiddleware,
  [
    param('id').notEmpty(),
    body('name').optional().isLength({ max: 50 }),
    body('role').optional().isIn(['manager', 'employee']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, role, department, avatarUrl, email, phone } = req.body;

    if (req.user!.role !== 'manager' && req.user!.id !== req.params.id) {
      res.status(403).json({ success: false, message: '无权修改其他用户' });
      return;
    }

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (role !== undefined) { fields.push('role = ?'); values.push(role); }
      if (department !== undefined) { fields.push('department = ?'); values.push(department); }
      if (avatarUrl !== undefined) { fields.push('avatar_url = ?'); values.push(avatarUrl); }
      if (email !== undefined) { fields.push('email = ?'); values.push(email); }
      if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }

      if (fields.length === 0) {
        res.status(400).json({ success: false, message: '没有要更新的字段' });
        return;
      }

      values.push(req.params.id);
      run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

      const user = queryOne(
        'SELECT id, name, email, phone, role, department, avatar_url FROM users WHERE id = ?',
        [req.params.id]
      );

      // 异步同步到飞书通讯录（不阻塞响应）
      syncUserToFeishu({
        userId: req.params.id,
        name,
        department,
        email,
        phone,
      }).then(r => {
        if (!r.success) console.log("[飞书同步]", r.message);
      }).catch(e => console.error("[飞书同步异常]", e));

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: '更新用户失败' });
    }
  }
);

// 删除用户（仅管理员）
router.delete('/:id', authMiddleware, requireManager, async (req: AuthRequest, res) => {
  try {
    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

export default router;
