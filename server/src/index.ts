import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import reportRoutes from './routes/reports';
import helpRequestRoutes from './routes/helpRequests';
import feishuRoutes from './routes/feishu';
import dashboardRoutes from './routes/dashboard';
import systemDataRoutes from './routes/systemData';

const app = express();

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 根路径 - API 信息
app.get('/', (_req, res) => {
  res.json({
    name: 'Team Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      projects: '/api/projects',
      reports: '/api/reports',
      helpRequests: '/api/help-requests',
      feishu: '/api/feishu',
      dashboard: '/api/dashboard',
    },
  });
});

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/feishu', feishuRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/system-data', systemDataRoutes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? '服务器内部错误' : err.message,
  });
});

import { waitForDb, exec, run } from './utils/db';
import { execSync } from 'child_process';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'employee' CHECK(role IN ('manager', 'employee')),
      department TEXT,
      avatar_url TEXT,
      feishu_open_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      health_score INTEGER DEFAULT 100,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'at-risk')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project_id TEXT,
      assignee_id TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('urgent', 'high', 'medium', 'low')),
      status TEXT DEFAULT 'not-started' CHECK(status IN ('not-started', 'in-progress', 'pending-review', 'completed', 'overdue')),
      progress INTEGER DEFAULT 0,
      due_date TEXT,
      start_date TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      date TEXT NOT NULL,
      completed_tasks TEXT DEFAULT '[]',
      tomorrow_plan TEXT DEFAULT '[]',
      blockers TEXT,
      support_needed TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      task_id TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS feishu_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT,
      app_secret TEXT,
      webhook_url TEXT,
      connected INTEGER DEFAULT 0,
      connected_at DATETIME
    )
  `);
  exec(`
    CREATE TABLE IF NOT EXISTS system_data (
      data_key TEXT PRIMARY KEY,
      data_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Migrations completed.');
}

async function seedDatabase() {
  try {
    exec('DELETE FROM daily_reports');
    exec('DELETE FROM help_requests');
    exec('DELETE FROM tasks');
    exec('DELETE FROM projects');
    exec('DELETE FROM users');
    console.log('Business tables cleared.');

    const prismaDir = path.resolve(__dirname, '../../prisma');
    execSync('npx tsx seedSystem.ts', { cwd: prismaDir, stdio: 'inherit' });
    console.log('System data seeded.');
  } catch (err) {
    console.error('Auto-seed failed:', err);
  }
}

async function start() {
  await waitForDb();
  await runMigrations();
  await seedDatabase();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}
start();
