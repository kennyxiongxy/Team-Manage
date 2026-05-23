import bcrypt from 'bcryptjs';
import { exec, run, waitForDb } from '../src/utils/db';
import { v4 as uuidv4 } from 'uuid';

function genId() { return uuidv4().replace(/-/g, '').substring(0, 32); }

async function main() {
  await waitForDb();
  console.log('Seeding relational data...');

  // 用户ID映射
  const users = [
    { id: genId(), name: '管理员', email: 'manager@example.com', password: '$2a$10$CxE4Db.jCMXqvNVlRMSgW.JpkYLoVCKj0uy.wTMP7ITsxH9Ybn0QO', role: 'manager', department: '销售管理部' },
    { id: 'u_zhangwei', name: '张伟', email: 'zhangwei@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '大客户部' },
    { id: 'u_lina', name: '李娜', email: 'lina@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '解决方案部' },
    { id: 'u_wangqiang', name: '王强', email: 'wangqiang@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '渠道部' },
    { id: 'u_liufang', name: '刘芳', email: 'liufang@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '售前技术部' },
    { id: 'u_zhaolei', name: '赵磊', email: 'zhaolei@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '销售一部' },
    { id: 'u_chenjing', name: '陈静', email: 'chenjing@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '客户成功部' },
    { id: 'u_yangguang', name: '杨光', email: 'yangguang@example.com', password: '$2a$10$n67DiWZr/0ANj.sVJG/0v.O/Tpq1S7NWANScWuzy47zj6Lvrv.Pmi', role: 'employee', department: '销售二部' },
  ];

  // 项目 (带owner)
  const projects = [
    { id: 'p_bank', name: '中国银行年度框架合同', health_score: 65, progress: 70, status: 'at-risk', owner_id: 'u_zhangwei' },
    { id: 'p_huawei', name: '华为云联合POC', health_score: 55, progress: 50, status: 'at-risk', owner_id: 'u_lina' },
    { id: 'p_tencent', name: '腾讯云迁移方案', health_score: 70, progress: 40, status: 'active', owner_id: 'u_liufang' },
    { id: 'p_channel', name: '渠道合作伙伴拓展', health_score: 72, progress: 40, status: 'active', owner_id: 'u_wangqiang' },
    { id: 'p_q2', name: 'Q2季末冲量专项', health_score: 60, progress: 45, status: 'active', owner_id: 'u_zhaolei' },
    { id: 'p_training', name: '销售技能认证培训', health_score: 78, progress: 55, status: 'active', owner_id: 'u_chenjing' },
    { id: 'p_vip', name: 'VIP客户满意度提升计划', health_score: 85, progress: 60, status: 'active', owner_id: 'u_chenjing' },
  ];

  // 任务 (带project_id和assignee_id)
  const tasks = [
    { title: '拜访TOP10大客户梳理作战地图', project_id: 'p_q2', assignee_id: 'u_zhaolei', priority: 'high', status: 'completed', progress: 100, due_date: '2025-05-15', start_date: '2025-05-08' },
    { title: '中国银行年度框架合同续签谈判', project_id: 'p_bank', assignee_id: 'u_zhangwei', priority: 'high', status: 'in-progress', progress: 70, due_date: '2025-05-17', start_date: '2025-05-10' },
    { title: '华为云联合解决方案POC演示', project_id: 'p_huawei', assignee_id: 'u_lina', priority: 'high', status: 'in-progress', progress: 50, due_date: '2025-05-02', start_date: '2025-04-25' },
    { title: '腾讯云迁移方案技术评审', project_id: 'p_tencent', assignee_id: 'u_liufang', priority: 'high', status: 'in-progress', progress: 40, due_date: '2025-05-01', start_date: '2025-04-20' },
    { title: '渠道合作伙伴培训课程开发', project_id: 'p_channel', assignee_id: 'u_wangqiang', priority: 'medium', status: 'in-progress', progress: 60, due_date: '2025-05-20', start_date: '2025-05-10' },
    { title: '银行客户回访计划', project_id: 'p_bank', assignee_id: 'u_zhangwei', priority: 'medium', status: 'not-started', progress: 0, due_date: '2025-05-25', start_date: '2025-05-18' },
    { title: 'POC环境搭建与调试', project_id: 'p_huawei', assignee_id: 'u_lina', priority: 'medium', status: 'in-progress', progress: 65, due_date: '2025-05-10', start_date: '2025-05-01' },
    { title: '竞品分析报告', project_id: 'p_q2', assignee_id: 'u_yangguang', priority: 'low', status: 'not-started', progress: 0, due_date: '2025-06-01', start_date: '2025-05-20' },
    { title: 'VIP客户满意度调研', project_id: 'p_vip', assignee_id: 'u_chenjing', priority: 'high', status: 'in-progress', progress: 55, due_date: '2025-05-18', start_date: '2025-05-05' },
    { title: '销售话术标准化手册', project_id: 'p_training', assignee_id: 'u_chenjing', priority: 'medium', status: 'in-progress', progress: 80, due_date: '2025-05-15', start_date: '2025-05-01' },
    { title: 'Q2销售漏斗分析', project_id: 'p_q2', assignee_id: 'u_zhaolei', priority: 'high', status: 'in-progress', progress: 45, due_date: '2025-05-08', start_date: '2025-04-28' },
    { title: '新销售入职培训计划', project_id: 'p_training', assignee_id: 'u_chenjing', priority: 'medium', status: 'not-started', progress: 0, due_date: '2025-06-05', start_date: '2025-05-25' },
    { title: '客户投诉处理流程优化', project_id: 'p_vip', assignee_id: 'u_chenjing', priority: 'high', status: 'in-progress', progress: 30, due_date: '2025-05-12', start_date: '2025-05-01' },
    { title: '渠道政策更新公告', project_id: 'p_channel', assignee_id: 'u_wangqiang', priority: 'low', status: 'not-started', progress: 0, due_date: '2025-05-28', start_date: '2025-05-22' },
    { title: '行业解决方案白皮书', project_id: 'p_tencent', assignee_id: 'u_liufang', priority: 'medium', status: 'in-progress', progress: 25, due_date: '2025-06-10', start_date: '2025-05-15' },
    { title: 'CRM数据清洗迁移', project_id: 'p_q2', assignee_id: 'u_yangguang', priority: 'high', status: 'in-progress', progress: 35, due_date: '2025-05-05', start_date: '2025-04-22' },
    { title: '合同模板更新', project_id: 'p_bank', assignee_id: 'u_zhangwei', priority: 'low', status: 'completed', progress: 100, due_date: '2025-05-05', start_date: '2025-04-28' },
    { title: '演示Demo开发', project_id: 'p_huawei', assignee_id: 'u_lina', priority: 'medium', status: 'in-progress', progress: 60, due_date: '2025-05-08', start_date: '2025-04-28' },
    { title: '销售线索清洗分配', project_id: 'p_q2', assignee_id: 'u_zhaolei', priority: 'medium', status: 'completed', progress: 100, due_date: '2025-05-03', start_date: '2025-04-25' },
    { title: '渠道伙伴政策宣讲', project_id: 'p_channel', assignee_id: 'u_wangqiang', priority: 'medium', status: 'not-started', progress: 0, due_date: '2025-06-03', start_date: '2025-05-27' },
    { title: '客户健康度评分模型', project_id: 'p_vip', assignee_id: 'u_liufang', priority: 'high', status: 'in-progress', progress: 50, due_date: '2025-05-22', start_date: '2025-05-08' },
    { title: '腾讯云迁移试点部署', project_id: 'p_tencent', assignee_id: 'u_liufang', priority: 'high', status: 'not-started', progress: 0, due_date: '2025-06-15', start_date: '2025-05-25' },
    { title: '季度业绩复盘报告', project_id: 'p_q2', assignee_id: 'u_zhaolei', priority: 'high', status: 'in-progress', progress: 30, due_date: '2025-05-20', start_date: '2025-05-10' },
    { title: '老客户续约提醒', project_id: 'p_bank', assignee_id: 'u_zhangwei', priority: 'high', status: 'in-progress', progress: 80, due_date: '2025-05-10', start_date: '2025-05-01' },
    { title: '新产品培训材料准备', project_id: 'p_training', assignee_id: 'u_yangguang', priority: 'low', status: 'not-started', progress: 0, due_date: '2025-06-08', start_date: '2025-05-25' },
    { title: '客户案例整理发布', project_id: 'p_vip', assignee_id: 'u_yangguang', priority: 'low', status: 'not-started', progress: 0, due_date: '2025-05-30', start_date: '2025-05-20' },
    { title: 'POC测试报告输出', project_id: 'p_huawei', assignee_id: 'u_lina', priority: 'high', status: 'not-started', progress: 0, due_date: '2025-05-15', start_date: '2025-05-08' },
    { title: '销售激励方案调整', project_id: 'p_q2', assignee_id: 'u_zhaolei', priority: 'medium', status: 'not-started', progress: 0, due_date: '2025-05-18', start_date: '2025-05-12' },
    { title: 'CRM培训课程录制', project_id: 'p_training', assignee_id: 'u_yangguang', priority: 'low', status: 'completed', progress: 100, due_date: '2025-05-05', start_date: '2025-04-25' },
    { title: '渠道返点政策核算', project_id: 'p_channel', assignee_id: 'u_wangqiang', priority: 'medium', status: 'completed', progress: 100, due_date: '2025-05-02', start_date: '2025-04-22' },
  ];

  // 清理旧数据
  exec('DELETE FROM daily_reports');
  exec('DELETE FROM help_requests');
  exec('DELETE FROM tasks');
  exec('DELETE FROM projects');
  exec('DELETE FROM users');

  // 插入用户
  for (const u of users) {
    run('INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.password, u.role, u.department]);
  }
  console.log(`Seeded ${users.length} users`);

  // 插入项目
  for (const p of projects) {
    run('INSERT INTO projects (id, name, health_score, progress, status, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.health_score, p.progress, p.status, p.owner_id]);
  }
  console.log(`Seeded ${projects.length} projects`);

  // 插入任务
  for (const t of tasks) {
    run('INSERT INTO tasks (id, title, project_id, assignee_id, priority, status, progress, due_date, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [genId(), t.title, t.project_id, t.assignee_id, t.priority, t.status, t.progress, t.due_date, t.start_date]);
  }
  console.log(`Seeded ${tasks.length} tasks`);

  console.log('Relational seed complete!');
}

main().catch(console.error);
