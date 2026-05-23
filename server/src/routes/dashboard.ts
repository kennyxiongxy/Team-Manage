import { Router } from 'express';
import { queryAll, queryOne } from '../utils/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const totalUsersResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const totalTasksResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
    const totalProjectsResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM projects');
    const pendingHelpResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM help_requests WHERE status = 'pending'");
    const taskStatusResult = queryAll('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
    const recentTasksResult = queryAll(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.created_at DESC LIMIT 10`
    );
    const recentReportsResult = queryAll(
      `SELECT r.*, u.name as employee_name, u.avatar_url as employee_avatar
       FROM daily_reports r
       LEFT JOIN users u ON r.employee_id = u.id
       ORDER BY r.date DESC LIMIT 5`
    );
    const recentHelpResult = queryAll(
      `SELECT h.*, u.name as employee_name, u.avatar_url as employee_avatar
       FROM help_requests h
       LEFT JOIN users u ON h.employee_id = u.id
       WHERE h.status = 'pending'
       ORDER BY h.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsersResult?.count || 0,
          totalTasks: totalTasksResult?.count || 0,
          totalProjects: totalProjectsResult?.count || 0,
          pendingHelpRequests: pendingHelpResult?.count || 0,
        },
        taskStatusStats: taskStatusResult,
        recentTasks: recentTasksResult,
        recentReports: recentReportsResult,
        recentHelpRequests: recentHelpResult,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: '获取仪表盘数据失败' });
  }
});

router.get('/my-tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const assignedResult = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?', [userId]);
    const completedResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'completed'", [userId]);
    const inProgressResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'in-progress'", [userId]);
    const overdueResult = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'overdue'", [userId]);
    const tasksResult = queryAll(
      `SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.assignee_id = ? ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, t.due_date ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        stats: {
          assigned: assignedResult?.count || 0,
          completed: completedResult?.count || 0,
          inProgress: inProgressResult?.count || 0,
          overdue: overdueResult?.count || 0,
        },
        tasks: tasksResult,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取我的任务失败' });
  }
});

router.get('/team-stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = queryAll(
      `SELECT u.id, u.name, u.role, u.department, u.avatar_url,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_tasks
       FROM users u
       LEFT JOIN tasks t ON u.id = t.assignee_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    const enriched = result.map((m: any) => ({
      ...m,
      workload: m.total_tasks > 0 ? Math.round((parseInt(m.completed_tasks) / parseInt(m.total_tasks)) * 100) : 0,
      tasksCompleted: parseInt(m.completed_tasks),
      tasksInProgress: parseInt(m.in_progress_tasks),
      tasksOverdue: parseInt(m.overdue_tasks),
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取团队统计失败' });
  }
});

export default router;
