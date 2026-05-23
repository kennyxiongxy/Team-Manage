import { exec, waitForDb } from '../src/utils/db';

async function main() {
  await waitForDb();
  console.log('Creating tables...');

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

  console.log('All tables created successfully!');
}

main().catch(console.error);
