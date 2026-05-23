import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { queryOne, run } from '../utils/db';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 注册
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('姓名不能为空').isLength({ max: 50 }),
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('role').optional().isIn(['manager', 'employee']).withMessage('角色无效'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, email, password, role = 'employee', department } = req.body;

    try {
      if (email) {
        const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
          res.status(400).json({ success: false, message: '邮箱已被注册' });
          return;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4().replace(/-/g, '').substring(0, 32);

      run(
        `INSERT INTO users (id, name, email, password, role, department)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, email || null, hashedPassword, role, department || null]
      );

      const user = queryOne<{ id: string; name: string; email: string | null; role: string; department: string | null; created_at: string }>(
        'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?',
        [id]
      );

      const token = jwt.sign({ userId: user!.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      res.json({ success: true, data: { user, token } });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: '注册失败' });
    }
  }
);

// 登录
router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('邮箱不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const user = queryOne<{ id: string; name: string; email: string | null; password: string; role: string; department: string | null; avatar_url: string | null }>(
        'SELECT id, name, email, password, role, department, avatar_url FROM users WHERE email = ?',
        [email]
      );

      if (!user || !user.password) {
        res.status(401).json({ success: false, message: '邮箱或密码错误' });
        return;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ success: false, message: '邮箱或密码错误' });
        return;
      }

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            avatarUrl: user.avatar_url,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: '登录失败' });
    }
  }
);

// 获取当前用户
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = queryOne<{ id: string; name: string; email: string | null; role: string; department: string | null; avatar_url: string | null; created_at: string }>(
      'SELECT id, name, email, role, department, avatar_url, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

export default router;
