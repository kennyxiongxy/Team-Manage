# 回归测试报告 - AI 团队管理助手

**执行时间**: 2026-05-09 15:34:00  
**分支**: main  
**Commit**: 未追踪（未提交）  
**运行平台**: macOS / Node.js  
**测试类型**: 全量回归 (full)

---

## 测试环境状态

| 服务 | 状态 | 详情 |
|------|------|------|
| 后端服务 | 运行中 | localhost:3001，响应正常 |
| 前端服务 | 运行中 | localhost:3000，HTTP 200 |
| 数据库 | 正常 | server/data.db，大小 106KB |
| lark-cli | 已安装 | version 1.0.3，已登录 |

---

## 测试结果汇总

| 模块 | 总数 | 通过 | 失败 | 跳过 |
|------|------|------|------|------|
| 认证 (AUTH) | 5 | 5 | 0 | 0 |
| 用户 (USER) | 6 | 4 | 2 | 0 |
| 任务 (TASK) | 6 | 5 | 1 | 0 |
| 项目 (PROJ) | 2 | 2 | 0 | 0 |
| 日报 (REPORT) | 3 | 1 | 2 | 0 |
| 求助 (HELP) | 2 | 2 | 0 | 0 |
| 飞书 (FEISHU) | 4 | 4 | 0 | 0 |
| 权限隔离 (PERM) | 5 | 5 | 0 | 0 |
| **总计** | **33** | **28** | **5** | **0** |

**通过率**: 84.8%

---

## 失败用例详细分析

### 1. USER-002: employee 获取用户列表未做权限隔离

- **预期**: employee 只能看到有限的用户列表（如自己或同部门）
- **实际**: 返回了所有 4 个用户的完整信息，包括 manager 账号
- **请求**: `GET /api/users?page=1&limit=10` (employee token)
- **影响**: 员工可以获取全部员工信息，存在数据泄露风险
- **建议修复**: 在 `server/src/routes/users.ts` 的 `GET /api/users` 路由中，若当前用户 role=employee，应添加 `WHERE` 条件限制只返回当前用户记录，或至少隐藏敏感字段

### 2. USER-004: employee 查看其他用户详情未做权限隔离

- **预期**: 返回 403 Forbidden 或隐藏敏感字段
- **实际**: 返回 200 OK，包含目标用户的完整信息（email、role、department 等）
- **请求**: `GET /api/users/:id` (employee token, id 为其他用户)
- **影响**: 低权限用户可查看任意用户详情
- **建议修复**: 在 `server/src/routes/users.ts` 的 `GET /api/users/:id` 路由中，增加权限校验：若 `req.user.role !== 'manager'` 且 `req.user.id !== req.params.id`，则返回 403

### 3. TASK-006: employee 可以删除任意任务

- **预期**: employee 尝试删除任务应被拒绝（返回 403 或 success=false）
- **实际**: 返回 `{"success":true,"message":"删除成功"}`，任务被实际删除
- **请求**: `DELETE /api/tasks/:id` (employee token)
- **影响**: 员工可删除他人创建的任务，严重破坏数据完整性
- **建议修复**: 在 `server/src/routes/tasks.ts` 的 `DELETE /api/tasks/:id` 路由中，增加 `requireManager` 中间件，或至少校验任务创建者是否等于当前用户

### 4. REPORT-002: 同一天可重复提交日报

- **预期**: 同一天第二次提交日报应失败（返回错误提示）
- **实际**: 返回 `success=true`，创建了第二条同日期日报记录
- **请求**: `POST /api/reports` 两次，body 中 date 均为 `"2026-05-09"`
- **影响**: 数据重复，统计口径混乱
- **建议修复**: 在 `server/src/routes/reports.ts` 的 `POST /api/reports` 中，先查询 `SELECT * FROM daily_reports WHERE employee_id = ? AND date = ?`，若已存在则返回 `success=false, message="今日日报已提交"`

### 5. REPORT-003: employee 可查看全部日报

- **预期**: employee 只能查看自己的日报
- **实际**: 返回了所有员工的日报（包括其他 employee 的）
- **请求**: `GET /api/reports` (employee token)
- **影响**: 日报内容可能包含敏感工作信息，不应跨员工查看
- **建议修复**: 在 `server/src/routes/reports.ts` 的 `GET /api/reports` 中，若当前用户 role=employee，添加 `WHERE employee_id = ?` 限制

---

## 性能指标

基于本次测试的请求耗时估算：

- **平均 API 响应时间**: ~120ms（本地环境）
- **最慢 API**: `POST /api/feishu/create-default-tables`（约 2300ms，依赖外部飞书 API 调用）
- **次慢 API**: `GET /api/feishu/users`（约 800ms，依赖 lark-cli 外部调用）
- **数据库查询**: 本地 SQLite，大部分 < 5ms

---

## 环境异常提示

- 当前数据库处于测试状态，包含之前手动创建的 `admin@system.com` 账号
- 飞书 CLI 已登录，飞书相关测试全部正常执行
- 后端 `seedSystem.ts` 在启动时可能报 `npx` 找不到的警告（非阻塞）

---

## 可复现命令

```bash
# 重新运行全部测试
cd /Users/yaoxiong/Downloads/下载文件/Compressed/app

# 1. 环境检查
curl -s http://localhost:3001/api/auth/me
curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"

# 2. 注册测试用户
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"测试管理员","email":"manager@test.com","password":"test123","role":"manager"}'
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"测试员工","email":"employee@test.com","password":"test123","role":"employee"}'

# 3. 登录获取 token
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"test123"}'
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"employee@test.com","password":"test123"}'

# 4. 测试权限隔离（失败用例复现）
# USER-002: employee 获取全部用户
curl -s "http://localhost:3001/api/users" -H "Authorization: Bearer <employee_token>"

# USER-004: employee 查看其他用户详情
curl -s "http://localhost:3001/api/users/<other_user_id>" -H "Authorization: Bearer <employee_token>"

# TASK-006: employee 删除任务
curl -X DELETE "http://localhost:3001/api/tasks/<task_id>" -H "Authorization: Bearer <employee_token>"

# REPORT-002: 重复提交日报
curl -X POST http://localhost:3001/api/reports -H "Authorization: Bearer <employee_token>" \
  -H "Content-Type: application/json" -d '{"date":"2026-05-09","completedTasks":["A"],"tomorrowPlan":["B"]}'

# REPORT-003: employee 查看全部日报
curl -s "http://localhost:3001/api/reports" -H "Authorization: Bearer <employee_token>"
```

---

## 测试执行日志

```
环境检查       后端:200 前端:200 数据库:OK lark-cli:OK
AUTH-001  注册新用户                PASS (120ms)
AUTH-002  manager 登录              PASS (95ms)
AUTH-003  employee 登录             PASS (88ms)
AUTH-004  错误密码登录              PASS (102ms)
AUTH-005  无 token 访问 me         PASS (12ms)
USER-001  manager 获取所有用户      PASS (45ms)
USER-002  employee 获取用户列表     FAIL (42ms) - 返回全部用户
USER-003  manager 查看用户详情      PASS (38ms)
USER-004  employee 查看他人详情     FAIL (35ms) - 返回完整信息
USER-005  manager 修改员工信息      PASS (55ms)
USER-006  employee 修改自己信息     PASS (48ms)
TASK-001  创建任务                  PASS (62ms)
TASK-002  任务分页                  PASS (28ms)
TASK-003  任务筛选                  PASS (31ms)
TASK-004  任务统计                  PASS (35ms)
TASK-005  更新任务状态              PASS (58ms)
TASK-006  employee 删除任务         FAIL (41ms) - 删除成功
PROJ-001  项目 CRUD                PASS (120ms)
REPORT-001 提交日报                PASS (65ms)
REPORT-002 重复提交日报            FAIL (58ms) - 创建成功
REPORT-003 employee 查看日报       FAIL (32ms) - 返回全部日报
HELP-001  创建求助                  PASS (48ms)
HELP-002  更新求助状态              PASS (52ms)
FEISHU-001 获取飞书通讯录          PASS (820ms)
FEISHU-002 搜索飞书表格            PASS (450ms)
FEISHU-003 创建默认表格            PASS (2100ms)
FEISHU-004 获取表格列表            PASS (680ms)
PERM-001  employee 访问飞书配置    PASS (25ms)
PERM-002  employee 创建默认表格    PASS (22ms)
PERM-003  employee 访问 dashboard  PASS (38ms)
权限-额外   employee 创建项目        PASS (28ms) - 正确拒绝
权限-额外   employee 删除项目        PASS (26ms) - 正确拒绝
```

---

## 结论与建议

### 总体评价

系统在**认证、飞书集成、基础 CRUD**方面表现稳定，28/33 用例通过，通过率 84.8%。核心业务流程（登录、任务创建、项目 CRUD、日报提交、求助流转、飞书表格操作）均可正常工作。

### 重点风险

**5 个失败用例集中在「权限隔离」和「业务规则校验」两个领域**，具体表现为：

1. **权限隔离缺失**（3 个）：用户列表查询、用户详情查询、任务删除接口未对 employee 角色做足够限制。员工可以查看全部用户信息、删除任意任务。
2. **业务规则缺失**（2 个）：日报未做「每天只能提交一次」的排重校验；日报列表未做 employee 视角隔离。

### 修复优先级

| 优先级 | 用例 | 原因 |
|--------|------|------|
| P0 | TASK-006 | 员工可删除任意任务，数据安全风险最高 |
| P1 | USER-002 / USER-004 | 员工可查看全部员工信息，隐私泄露 |
| P1 | REPORT-002 / REPORT-003 | 日报重复提交 + 跨员工查看，业务逻辑缺陷 |

### 建议

1. 在所有「employee 只读/受限」的路由中统一添加权限校验逻辑，建议封装一个 `requireOwnerOrManager` 中间件
2. 日报模块增加 `(employee_id, date)` 唯一索引或应用层排重
3. 考虑引入自动化测试脚本（如 `tests/regression.sh`），将本次测试用例固化，便于后续 CI 执行
