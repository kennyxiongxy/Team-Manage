
## 第一部分：自动化回归测试规范（面向人类与 AI）

### 1. 被测系统元数据（必须提供）
yaml
```
SystemUnderTest:
  name: <系统名称>
  entry_points:
    - type: cli | service | api | gui
      command_template: "<可执行文件路径> {{args}}"
      working_directory: "<绝对路径或相对规则>"
  environment:
    os: windows | macos | linux
    required_services: [service_name1, service_name2]
    env_vars:
      KEY: VALUE_OR_PLACEHOLDER
  data_dependencies:
    - path: "<输入数据目录>"
      read_only: true
    - path: "<输出数据目录>"
      clean_before_run: true
  expected_behavior:
    exit_code_success: 0
    exit_code_failure: non-zero
    required_output_files: ["<路径模式>"]
    log_must_contain: ["<子串>"]
    log_must_not_contain: ["<错误模式>"]
```

### 2. 回归测试触发条件

- **触发类型**：提交前 / PR 合并前 / 每日定时 / 手动指定
- **变更检测**（增量回归）：列出变更的文件/模块，AI 应推导受影响的测试用例


### 3. 测试用例格式
每个用例包含：

yaml
```
Test:
  id: TC-001
  name: "基本功能验证"
  depends_on: []   # 如 ["start_service"]
  setup:
    - command: "copy /Y testdata\\input1.json data\\input.json"
      platform: windows
    - command: "cp testdata/input1.json data/input.json"
      platform: unix
  run:
    command: "{{entry_point}} --input data/input.json --output results/out.json"
    timeout_seconds: 30
  assert:
    type: process
    exit_code: 0
    stdout_contains: ["Processing complete"]
    stderr_contains: []
    stderr_empty: true
    file_exists: ["results/out.json"]
    file_contains_json_schema: "path/to/schema.json"
  teardown:
    - command: "rm -f results/out.json"
```

### 4. 平台适配自动规则
AI 必须遵守：


| 差异点 | Windows | macOS / Linux |
| --- | --- | --- |
| 路径 | C:\foo\bar，大小写不敏感 | /foo/bar，大小写敏感 |
| 换行符 | \r\n | \n |
| 服务 | sc query / net start | launchctl / systemctl |
| 进程杀死 | taskkill /F /PID | kill -9 |
| 权限检查 | icacls | ls -l / getfacl |

### 5. 回归测试报告模板
markdown
```
## Regression Report: <系统名> @ <commit>

**OS**: Windows 11 / 22H2
**Run ID**: reg-20260509-1430

### Summary
- Total : 24
- Passed: 20
- Failed: 4
- Skipped: 0

### Failed Tests
- TC-003 (config loading): exit code 1, stderr shows "cannot open registry key"
- TC-011 (file write with long path): AccessDenied

### Environment Notes
- Registry path `HKLM\SOFTWARE\MyApp` missing (expected after install)
- Temp disk at 98% usage

### Re-run Command
`./run_regression.py --failed-only --keep-artifacts`
```

## 第二部分：给 AI 的提示词模板
你可以直接将下面的提示词发给一个具备代码执行或命令生成能力的 AI（如 GPT + Code Interpreter、Claude + MCP、DevOps Agent）。

text
```
# Role
你是一位自动化测试回归工程师，需要严格按照以下规范执行测试回归。

# Input
我会提供：
1. 被测系统的元数据 YAML（见规范中的 SystemUnderTest）
2. 测试用例列表（YAML 数组，每个用例包含 setup/run/assert/teardown）
3. 当前运行平台（windows / macos / linux）
4. 本次回归的类型（full / incremental）
5. （若增量）变更的文件列表

# Steps
1. 根据运行平台，将每个测试用例中的通用命令转换为平台具体命令：
   - 路径：使用当前 OS 的路径格式
   - 环境变量：POSIX 用 $VAR，Windows 用 %VAR%
   - 服务检查：用 sc / launchctl / systemctl
2. 按依赖顺序执行测试用例（depends_on 关系）
3. 每个用例：
   - 执行 setup（若失败，标记 error 并跳过）
   - 执行 run，捕获 stdout/stderr/exit_code
   - 执行 assert：
     * 检查退出码
     * 检查输出字符串包含/不包含
     * 检查文件存在/不存在
     * 若提供 JSON schema，验证文件符合 schema
   - 执行 teardown（即使 assert 失败也要尝试）
4. 生成回归报告（Markdown 格式），包含：
   - 总体统计
   - 失败用例的详细断言失败信息
   - 环境异常提示（如磁盘满、服务未运行、权限错误）
   - 建议的排查命令
5. 不要执行危险命令（如 rm -rf /、del /F /S C:\），除非明确在 setup/teardown 中写出。

# Output Format
首先输出：当前环境摘要（OS 版本、路径是否大小写敏感、临时目录空间）
然后输出：逐步执行日志（简洁，每用例一行状态）
最后输出：完整的回归测试报告（Markdown）

# Constraint
- 如果某个断言条件不满足，标记失败，但继续执行后续不依赖它的用例。
- 不确定的 API 行为（如 Windows 长路径是否启用）需要在报告中标注 “需要实际验证”。
- 不对商业软件或闭源组件提出破解方案。
```

## 第三部分：使用示例（精简）
你只需要把类似下面的 YAML 发给 AI + 上述提示词：

yaml
```
SystemUnderTest:
  entry_points:
    cli: "build/myapp.exe"
  environment:
    os: windows
TestCases:
  - id: TC-001
    run: "myapp.exe --version"
    assert:
      exit_code: 0
      stdout_contains: ["2.0.0"]
```
AI 就会在 Windows 上执行 `myapp.exe --version`，检查退出码和输出，然后返回报告。

如果你愿意，我可以帮你把上述规范 + 提示词**合成一份可以直接放入 `prompts/regression_ai.md` 的文件**，并附上一个最小可测试的示例项目结构（含假的被测程序、测试数据、CI 调用脚本）。

你只需要告诉我：


- 你当前主要运行平台（Windows / macOS / Linux）以及是否混用。
- 你的系统是 CLI、服务，还是带 GUI 的（会影响断言方式）。

---

## 🙋 用户

PROJECT_DOCUMENTATION.md
MD 21.96KB

---

## 🤖 DeepSeek

好的，我已经仔细阅读了你的项目文档。这是一个前后端分离的团队管理助手，深度集成飞书多维表格，有完整的认证、任务、日报、求助、绩效、飞书配置等模块。

你现在需要的是：**基于这套系统，生成一份自动化回归测试规范 + 给 AI 的提示词**，让 AI 能够自动执行回归测试。

我会基于你项目的实际技术栈和架构特点来定制，而不是泛泛的通用规范。


## 第一部分：自动化回归测试规范（定制版）

### 1. 被测系统元数据
yaml
```
SystemUnderTest:
  name: "AI 团队管理助手"
  version: "v1.0"
  
  entry_points:
    - type: api
      base_url: "http://localhost:3001/api"
      health_check: "GET /auth/me"  # 需要 token，但可验证服务是否运行
    - type: frontend
      url: "http://localhost:3000"
      login_url: "http://localhost:3000/#/login"
  
  environment:
    os: windows | macos | linux  # 跨平台，根据运行环境自动适配
    required_services:
      - name: "backend"
        port: 3001
        check_command: "curl -s http://localhost:3001/api/auth/me 2>&1 | grep -q 'Unauthorized' || echo 'OK'"
      - name: "lark-cli"
        check_command: "lark-cli --version"
        required_for: ["feishu_tests"]
    env_vars:
      JWT_SECRET: "test-secret-key"
      PORT: "3001"
      NODE_ENV: "test"
  
  data_dependencies:
    - path: "server/data.db"
      description: "SQLite 数据库文件"
      clean_before_regression: true  # 回归测试前清空业务数据
    - path: "server/system_data_backup.json"
      description: "system_data 备份（保留飞书配置等）"
      clean_before_regression: false
  
  database:
    type: "sqlite"
    path: "server/data.db"
    schema_file: "server/prisma/schema.prisma"
    seed_script: "server/prisma/seed.ts"
    
  authentication:
    type: "jwt"
    token_storage: "localStorage"
    test_credentials:
      manager:
        email: "manager@test.com"
        password: "test123"
      employee:
        email: "employee@test.com"
        password: "test123"
```

### 2. 回归测试类型

| 类型 | 触发条件 | 说明 |
| --- | --- | --- |
| 全量回归 | 每日定时、发布前 | 执行所有核心 API + 关键 UI 功能 |
| 增量回归 | PR 合并前 | 基于变更文件自动推导受影响的 API 和页面 |
| 飞书集成回归 | 飞书配置变更后 | 测试 lark-cli 调用、表格读写 |

### 3. 测试用例定义格式
yaml
```
TestSuite:
  name: "认证模块"
  depends_on: []
  setup:
    - action: "reset_database"
      script: "cd server && npx tsx prisma/migrate.ts --reset"
    - action: "seed_test_users"
      script: "cd server && npx tsx prisma/seed.ts"
  
  cases:
    - id: "AUTH-001"
      name: "用户登录成功"
      type: "api"
      request:
        method: POST
        url: "/api/auth/login"
        body:
          email: "manager@test.com"
          password: "test123"
      assert:
        status: 200
        json_path:
          "success": true
          "data.token": "exists"
          "data.user.role": "manager"
          
    - id: "AUTH-002"
      name: "用户登录失败 - 错误密码"
      request:
        method: POST
        url: "/api/auth/login"
        body:
          email: "manager@test.com"
          password: "wrong"
      assert:
        status: 200
        json_path:
          "success": false
          "message": "contains:密码错误"

    - id: "AUTH-003"
      name: "获取当前用户信息（需认证）"
      request:
        method: GET
        url: "/api/auth/me"
        headers:
          Authorization: "Bearer {{token}}"
      assert:
        status: 200
        json_path:
          "success": true
          "data.email": "manager@test.com"
```

### 4. API 回归测试（优先覆盖）
基于你的路由设计，核心 API 测试清单：


| 模块 | API | 关键断言点 |
| --- | --- | --- |
| 认证 | POST /api/auth/register | 返回 userId，密码被 bcrypt 哈希 |
| 认证 | POST /api/auth/login | 返回 JWT token，有效期 7 天 |
| 用户 | GET /api/users | 分页参数生效，manager 能看到所有人 |
| 用户 | GET /api/users/:id | employee 只能看自己 |
| 任务 | POST /api/tasks | 任务创建后数据库有记录 |
| 任务 | GET /api/tasks/stats/overview | 统计数据与实际情况一致 |
| 项目 | CRUD | manager 可增删改，employee 只读 |
| 日报 | POST /api/reports | 同一天只能提交一次 |
| 求助 | POST /api/help-requests | 状态流转 pending → resolved |
| 飞书 | GET /api/feishu/users | 需要 manager 权限 |
| 飞书 | POST /api/feishu/create-default-tables | lark-cli 调用成功 |

### 5. 前端 UI 回归测试（可选，适用于带 UI 的 AI）
对于支持浏览器自动化的 AI（如 Playwright MCP），定义：

yaml
```
UITest:
  - id: "UI-001"
    name: "登录流程"
    steps:
      - action: navigate
        url: "http://localhost:3000/#/login"
      - action: fill
        selector: "input[type=email]"
        value: "employee@test.com"
      - action: fill
        selector: "input[type=password]"
        value: "test123"
      - action: click
        selector: "button[type=submit]"
      - action: wait_for_navigation
        timeout: 5000
    assert:
      - url_contains: "/#/"
      - element_exists: ".sidebar"
      - element_contains: "[data-testid=user-name]", "employee@test.com"

  - id: "UI-002"
    name: "角色权限隔离 - 员工看不到 AI 助手"
    depends_on: ["UI-001"]
    steps:
      - action: navigate
        url: "http://localhost:3000/#/ai-assistant"
    assert:
      - element_exists: "[data-testid=access-denied]"
      - OR: "自动重定向到首页"
```

### 6. 平台适配规则
AI 执行时必须遵守：


| 操作 | Windows | macOS / Linux |
| --- | --- | --- |
| 启动后端 | cd server && npx tsx watch src/index.ts | 同左 |
| 检查端口 | netstat -ano | findstr :3001 | lsof -i:3001 |
| 杀死进程 | taskkill /F /PID {pid} | kill -9 {pid} |
| 路径分隔 | server\data.db | server/data.db |
| lark-cli 检查 | where lark-cli | which lark-cli |

### 7. 回归报告模板
markdown
```
## 回归测试报告 - AI 团队管理助手

**执行时间**: 2026-05-09 14:30:00
**分支**: main
**Commit**: abc1234
**运行平台**: macOS 14.5 / Node.js 20.11.0

### 测试环境状态
- 后端服务: ✅ 运行中 (PID: 12345, Port: 3001)
- 前端服务: ✅ 运行中 (Port: 3000)
- 数据库: ✅ data.db 存在，大小 256KB
- lark-cli: ✅ 已登录 (用户: test@company.com)

### 测试结果汇总
| 类别 | 总数 | 通过 | 失败 | 跳过 |
|------|------|------|------|------|
| API 认证 | 4 | 4 | 0 | 0 |
| API 用户 | 6 | 5 | 1 | 0 |
| API 任务 | 8 | 8 | 0 | 0 |
| API 飞书 | 5 | 3 | 2 | 0 |
| UI 功能 | 4 | 3 | 1 | 0 |
| **总计** | **27** | **23** | **4** | **0** |

### 失败详情

#### API-USER-003: 员工不能查看其他用户详情
- **预期**: 返回 403 Forbidden
- **实际**: 返回 200 OK，暴露了其他用户信息
- **请求**: `GET /api/users/another-user-id`
- **错误日志**: 后端未在 `users/:id` 路由做角色权限校验

#### API-FEISHU-001: 获取飞书通讯录超时
- **预期**: 返回用户列表
- **实际**: 超时 30 秒后返回 504
- **原因**: lark-cli 未登录或 token 过期
- **建议**: 执行 `lark-cli auth login` 重新登录

### 性能指标
- 平均 API 响应时间: 87ms
- 最慢 API: `/api/feishu/base/*/tables` (2300ms，依赖外部调用)
- 数据库查询时间: 大部分 < 5ms

### 环境异常提示
- ⚠️ 飞书配置表中 `app_id` 为空，部分飞书测试跳过
- ⚠️ 系统内存剩余 1.2GB，低于建议值（2GB）

### 可复现命令
```bash
# 重新运行失败用例
npm run test:regression -- --failed-only --filter "API-USER-003,API-FEISHU-001"

# 生成详细日志
npm run test:regression -- --verbose --log-level debug
```

### 附件

- 完整测试日志: `logs/regression-20260509-1430.log`
- 数据库快照: `snapshots/data.db.20260509-1430`

text
```

---

## 第二部分：给 AI 的提示词（可直接使用）

```text
# 角色
你是一位自动化测试回归工程师，专精于全栈 Web 应用测试。你需要严格按照以下规范，对「AI 团队管理助手」项目执行回归测试。

# 项目上下文
- 项目名称: AI 团队管理助手
- 技术栈: React 19 + TypeScript (前端) + Express + SQLite (后端)
- API 基础路径: http://localhost:3001/api
- 前端地址: http://localhost:3000
- 认证方式: JWT Token 存储在 localStorage
- 特殊依赖: lark-cli (飞书命令行工具) 必须已登录

# 你被提供的输入
我会提供以下信息之一：
1. 测试类型: "full" (全量回归) 或 "incremental" (增量回归)
2. (若增量) 变更的文件列表，例如: ["server/src/routes/users.ts", "app/src/pages/EmployeeManagement.tsx"]
3. (可选) 需要跳过的测试用例 ID

# 你的执行步骤

## Step 0: 环境检查
在开始任何测试前，执行以下检查并报告结果：

```bash
# 检查后端服务
curl -s http://localhost:3001/api/auth/me 2>&1

# 检查前端服务
curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"

# 检查数据库
ls -la server/data.db 2>&1

# 检查 lark-cli (仅当测试涉及飞书时)
lark-cli --version 2>&1
lark-cli auth whoami --format json 2>&1
```
如果任何检查失败，**终止测试**并报告环境问题。


## Step 1: 准备测试环境
bash
```
# 重置数据库到干净状态（清空业务数据，保留飞书配置）
cd server && npx tsx prisma/migrate.ts --reset

# 重新播种测试数据
cd server && npx tsx prisma/seed.ts

# 可选：备份当前数据库
cp server/data.db server/data.db.regression-backup
```

## Step 2: 推导测试范围

- 如果是 **full**: 执行下面「核心测试清单」中的所有测试用例
- 如果是 **incremental**: 基于变更文件，执行「变更影响映射表」中对应的测试用例


### 变更影响映射表

| 变更文件模式 | 需执行的测试 |
| --- | --- |
| server/src/routes/auth.ts | 认证模块全量 |
| server/src/routes/users.ts | 用户 CRUD、权限隔离测试 |
| server/src/routes/tasks.ts | 任务 CRUD、统计、筛选 |
| server/src/routes/feishu.ts | 飞书集成全量 |
| server/src/middleware/auth.ts | 所有需要认证的 API |
| app/src/pages/*.tsx | 对应页面的 UI 测试 + 相关 API |
| server/src/utils/db.ts | 数据库事务、CRUD 基础测试 |
| server/prisma/schema.prisma | 全量回归（模型变更影响大） |

## Step 3: 执行测试用例
按照以下顺序执行，每个用例严格按照格式执行：

yaml
```
用例格式:
  id: 唯一标识
  name: 用例名称
  type: api | ui | db | cli
  depends_on: [前置用例ID]
  setup: 可选的前置命令
  request: (api类型) 请求详情
  steps: (ui类型) 操作步骤
  assert: 断言条件列表
  teardown: 可选的清理命令
```

### 核心测试清单

#### 认证模块

- [AUTH-001] 注册新用户 → 验证返回 userId，密码被哈希
- [AUTH-002] 登录 (manager) → 验证返回 token，role=manager
- [AUTH-003] 登录 (employee) → 验证返回 token，role=employee
- [AUTH-004] 错误密码 → 验证 success=false，message 包含错误
- [AUTH-005] 获取当前用户 (无 token) → 验证 401 Unauthorized


#### 用户模块

- [USER-001] GET /api/users (manager) → 返回所有用户
- [USER-002] GET /api/users (employee) → 只返回自己或受限列表
- [USER-003] GET /api/users/:id (manager 看别人) → 返回完整信息
- [USER-004] GET /api/users/:id (employee 看别人) → 应返回 403 或隐藏敏感字段
- [USER-005] PUT /api/users/:id (manager 修改员工) → 成功
- [USER-006] PUT /api/users/:id (员工修改自己) → 部分字段可改


#### 任务模块

- [TASK-001] POST /api/tasks → 创建成功，返回任务对象
- [TASK-002] GET /api/tasks → 支持分页 (page, limit)
- [TASK-003] GET /api/tasks → 支持筛选 (?status=in-progress&priority=high)
- [TASK-004] GET /api/tasks/stats/overview → 统计数据与实际一致
- [TASK-005] PUT /api/tasks/:id → 更新任务状态，progress 自动计算
- [TASK-006] DELETE /api/tasks/:id → manager 可删除，employee 不可


#### 项目模块

- [PROJ-001] CRUD 完整流程 → 创建→读取→更新→删除
- [PROJ-002] 项目健康分自动计算 → 基于任务完成率


#### 日报模块

- [REPORT-001] POST /api/reports → 当天第一次提交成功
- [REPORT-002] POST /api/reports → 当天第二次提交失败（返回错误）
- [REPORT-003] GET /api/reports → manager 看团队，employee 只看自己


#### 求助模块

- [HELP-001] 创建求助 → pending 状态
- [HELP-002] 更新求助状态 → pending → resolved


#### 飞书模块 (仅当 lark-cli 可用)

- [FEISHU-001] GET /api/feishu/users → 返回数组，每个包含 open_id/name
- [FEISHU-002] GET /api/feishu/bases?search=xxx → 返回搜索结果
- [FEISHU-003] POST /api/feishu/create-default-tables → 成功创建 4 张表
- [FEISHU-004] GET /api/feishu/base/:token/tables → 返回表格列表


#### 权限隔离测试 (关键)

- [PERM-001] employee 访问 /api/feishu/config (GET) → 403
- [PERM-002] employee 访问 /api/feishu/create-default-tables → 403
- [PERM-003] employee 访问 /api/dashboard/overview → 200 (可看) 但 AI 洞察部分为空


## Step 4: 断言执行规则
对于每个断言，你必须：


- 明确记录预期值 vs 实际值
- 对于 JSON 响应，使用 JSON path 提取并比较
- 对于字符串包含，使用精确匹配或正则（标注使用哪种）
- 如果断言失败，收集尽可能多的上下文（请求体、响应体、堆栈、数据库状态）

示例断言检查：

javascript
```
// API 断言伪代码
assertEqual(response.status, 200, "HTTP 状态码应为 200")
assertTrue(response.data.success === true, "success 字段应为 true")
assertExists(response.data.token, "token 字段应存在")
assertMatches(response.data.message, /密码错误|invalid password/i, "错误信息应包含密码错误")
```

## Step 5: 生成报告
使用项目定义的报告模板（见规范第 7 节），必须包含：


1. 环境摘要（每项服务状态）
2. 测试结果表格（按模块分组）
3. 失败用例的详细分析（至少包含：预期/实际差异、定位线索、建议修复方向）
4. 性能数据（最慢 3 个 API、平均响应时间）
5. 可复现命令


# 约束与禁止

1. **禁止**在未确认的情况下执行 `rm -rf`、`del /F /S` 等危险命令
2. **禁止**在生产环境执行测试（默认视为开发/测试环境）
3. **禁止**尝试破解或绕过 JWT 认证
4. **禁止**对飞书 API 进行写入操作（create/update/delete），除非显式指定的测试用例（如 create-default-tables）
5. 如果 lark-cli 未登录或 token 过期，**跳过**飞书相关测试并在报告中标注
6. 对于不确定的 API 行为（如 employee 看别人用户详情的具体返回值），**先调用实际 API 验证**，并在报告中说明“实际行为与文档差异”


# 输出格式
你的输出必须按以下顺序：

markdown
```
## 环境检查结果
（列出 Step 0 的每项检查结果）

## 测试准备
（列出 Step 1 执行的操作和输出）

## 测试执行日志
（每个用例一行，包含 ID、状态、耗时）
示例：✅ AUTH-001 注册新用户 (120ms)

## 回归测试报告
（完整的 Markdown 报告，按模板）

## 建议
（基于失败用例，给出具体的修复建议或进一步排查方向）
```

# 开始
请回复 "READY"，然后我会提供本次回归测试的类型和额外信息。

text
```

---

## 第三部分：使用说明

### 如何使用这段提示词

**方式一：直接复制给 AI Agent**
将上面的「第二部分：给 AI 的提示词」完整复制，然后告诉 AI：
> “请按照以上规范，对 AI 团队管理助手项目执行全量回归测试”

**方式二：集成到 CI/CD**
将提示词内容写入 `.github/workflows/regression-prompt.md`，在 GitHub Action 中调用 AI API（如 Claude / GPT-4）并传入测试指令。

**方式三：配合 Playwright MCP**
如果你使用支持浏览器自动化的 AI（如 Cursor + Playwright MCP），提示词中的 UI 测试部分会通过 MCP 工具自动执行。

### 快速验证命令

在让 AI 执行之前，建议先手动验证环境：

```bash
# 1. 启动后端
cd server && npx tsx watch src/index.ts

# 2. 另开终端启动前端
cd app && npm run dev

# 3. 验证后端健康
curl http://localhost:3001/api/auth/me
# 预期返回 {"success":false,"message":"未提供认证令牌"}

# 4. 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"test123"}'
```

### 额外建议

1. **优先跑 API 回归**：你的项目前后端分离，API 层测试覆盖率高、执行快、AI 容易断言。UI 测试依赖浏览器自动化，可选。
2. **把测试用例写进种子数据**：在 `seed.ts` 中预置固定的测试用户、任务、项目，避免每次测试前动态创建。
3. **增加 `/api/test/reset` 接口**（仅开发环境）：一键重置数据库，方便 AI 反复测试。

需要我帮你生成配套的 `test-reset` API 代码，或者把上面的提示词精简成适合 Cursor/Claude Dev 的版本吗？

---
