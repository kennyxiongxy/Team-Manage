# AI 团队管理助手 — 项目技术文档

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [系统架构](#3-系统架构)
4. [数据库设计](#4-数据库设计)
5. [API 设计](#5-api-设计)
6. [前端架构](#6-前端架构)
7. [飞书集成](#7-飞书集成)
8. [认证与权限](#8-认证与权限)
9. [开发环境配置](#9-开发环境配置)
10. [项目结构](#10-项目结构)
11. [部署指南](#11-部署指南)
12. [关键组件说明](#12-关键组件说明)

---

## 1. 项目概述

**项目名称**：AI 团队管理助手

**定位**：面向中小型团队的智能化任务管理与协作平台，深度集成飞书多维表格，提供 AI 驱动的任务分配、风险预警、日报生成和团队效率分析。

**核心功能模块**：

| 模块 | 功能描述 | 目标用户 |
|------|----------|----------|
| 首页仪表盘 | KPI 指标、AI 洞察、活动流、晨间简报 | 管理者 |
| 任务中心 | 看板/列表/甘特图视图、任务 CRUD、筛选搜索 | 全员 |
| 工作台 | 个人任务时间线、AI 提醒、日报提交 | 员工 |
| AI 助手 | 智能对话、决策日志、效能雷达、管理建议 | 管理者 |
| 团队分析 | 成员绩效、项目健康度、负荷分析、趋势图表 | 管理者 |
| 日报报告 | 日报提交/审批、周报汇总、AI 摘要 | 全员 |
| 飞书集成 | 配置管理、表格选择、字段映射、数据同步 | 管理员 |
| 绩效管理 | 季度评估、维度打分、目标设定、反馈回复 | 全员 |
| 员工管理 | 人员增删改查、部门管理、负荷监控 | 管理者 |
| 求助处理 | 求助发起、审批流转、状态跟踪 | 全员 |

**双角色体系**：
- **管理者（manager）**：可访问所有功能，包括 AI 分析、团队管理、飞书配置
- **员工（employee）**：只能访问工作台、任务中心、日报、求助、个人绩效

---

## 2. 技术栈

### 2.1 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | UI 框架 |
| TypeScript | ~5.9.3 | 类型系统 |
| Vite | 7.2.4 | 构建工具 / 开发服务器 |
| Tailwind CSS | 3.4.19 | 原子化 CSS |
| shadcn/ui | — | UI 组件库（Radix UI 封装） |
| React Router | 7.15.0 | 客户端路由 |
| Framer Motion | 12.38.0 | 动画引擎 |
| Recharts | 2.15.4 | 数据可视化图表 |
| Lucide React | 0.562.0 | 图标库 |
| Sonner | 2.0.7 | Toast 通知 |
| react-hook-form | 7.70.0 | 表单管理 |
| Zod | 4.3.5 | 表单校验 |
| date-fns | 4.1.0 | 日期处理 |

### 2.2 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x | 运行时 |
| Express | 4.21.0 | Web 框架 |
| TypeScript | 5.6.0 | 类型系统 |
| tsx | 4.19.0 | TypeScript 执行器 |
| sql.js | 1.14.1 | SQLite 内存数据库 |
| bcryptjs | 2.4.3 | 密码哈希 |
| jsonwebtoken | 9.0.2 | JWT 认证 |
| express-validator | 7.2.0 | 请求参数校验 |
| cors | 2.8.5 | 跨域处理 |
| uuid | 11.0.0 | 唯一 ID 生成 |

### 2.3 外部集成

| 服务 | 集成方式 | 功能 |
|------|----------|------|
| 飞书开放平台 | lark-cli | 通讯录查询、多维表格读写、字段管理 |
| 飞书机器人 | Webhook | 消息推送通知 |

---

## 3. 系统架构

```
+----------------------------------------------------------+
|                        浏览器                             |
|  React 19 + TypeScript + Tailwind + Vite (Port 3000)    |
+----------------------------------------------------------+
                            |
                            | HTTP / WebSocket
                            | Proxy: /api -> localhost:3001
                            v
+----------------------------------------------------------+
|                      Express 后端                         |
|              Node.js + TypeScript (Port 3001)            |
+----------------------------------------------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+  +----------------+  +------------------+
|  SQLite 内存   |  |   飞书 CLI     |  |   system_data    |
|   数据库       |  |  (lark-cli)    |  |   (JSON 存储)    |
|  (sql.js)      |  |                |  |                  |
+---------------+  +----------------+  +------------------+
```

### 3.1 架构特点

- **前后端分离**：前端 Vite 开发服务器（Port 3000），后端 Express API（Port 3001）
- **开发代理**：Vite 配置中将 `/api` 请求代理到后端，解决跨域
- **内存数据库**：使用 sql.js（SQLite 的 JavaScript 版本），数据持久化到 `server/data.db` 文件
- **JWT 认证**：基于 Token 的无状态认证，Token 存储于 localStorage
- **飞书 CLI 桥接**：通过系统调用 `lark-cli` 与飞书开放平台交互

---

## 4. 数据库设计

### 4.1 实体关系图

```
users (1) --< (N) tasks         (assignee)
users (1) --< (N) tasks         (created_by)
users (1) --< (N) daily_reports
users (1) --< (N) help_requests
projects (1) --< (N) tasks
```

### 4.2 表结构

#### users — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID，32 位 |
| name | TEXT | NOT NULL | 姓名 |
| email | TEXT | UNIQUE | 邮箱 |
| password | TEXT | — | bcrypt 哈希密码 |
| role | TEXT | DEFAULT 'employee' | manager / employee |
| department | TEXT | — | 部门 |
| avatar_url | TEXT | — | 头像 URL |
| feishu_open_id | TEXT | — | 飞书用户 ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### projects — 项目表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | 项目名称 |
| health_score | INTEGER | DEFAULT 100 | 健康评分 0-100 |
| progress | INTEGER | DEFAULT 0 | 进度 0-100 |
| status | TEXT | DEFAULT 'active' | active / completed / at-risk |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### tasks — 任务表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NOT NULL | 任务标题 |
| description | TEXT | — | 任务描述 |
| project_id | TEXT | FOREIGN KEY | 所属项目 |
| assignee_id | TEXT | FOREIGN KEY | 负责人 |
| priority | TEXT | DEFAULT 'medium' | urgent / high / medium / low |
| status | TEXT | DEFAULT 'not-started' | not-started / in-progress / pending-review / completed / overdue |
| progress | INTEGER | DEFAULT 0 | 完成百分比 |
| due_date | TEXT | — | 截止日期 |
| start_date | TEXT | — | 开始日期 |
| created_by | TEXT | FOREIGN KEY | 创建人 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### daily_reports — 日报表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| employee_id | TEXT | FOREIGN KEY | 汇报人 |
| date | TEXT | NOT NULL | 汇报日期 |
| completed_tasks | TEXT | DEFAULT '[]' | 今日完成任务（JSON） |
| tomorrow_plan | TEXT | DEFAULT '[]' | 明日计划（JSON） |
| blockers | TEXT | — | 遇到的阻碍 |
| support_needed | TEXT | — | 需要的支持 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### help_requests — 求助表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| employee_id | TEXT | FOREIGN KEY | 求助人 |
| task_id | TEXT | — | 关联任务 |
| reason | TEXT | — | 求助原因 |
| status | TEXT | DEFAULT 'pending' | pending / resolved |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### feishu_configs — 飞书配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| app_id | TEXT | — | 飞书应用 ID |
| app_secret | TEXT | — | 应用密钥 |
| webhook_url | TEXT | — | Webhook 地址 |
| connected | INTEGER | DEFAULT 0 | 是否已连接 |
| connected_at | DATETIME | — | 连接时间 |

#### system_data — 系统数据表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| data_key | TEXT | PRIMARY KEY | 数据键 |
| data_value | TEXT | NOT NULL | JSON 序列化值 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

---

## 5. API 设计

### 5.1 响应格式

所有 API 统一返回 JSON：

```json
{
  "success": true|false,
  "data": {},
  "message": "错误信息",
  "pagination": { "page": 1, "limit": 50, "total": 100 }
}
```

### 5.2 路由列表

| 路由 | 方法 | 说明 | 权限 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 公开 |
| `/api/auth/login` | POST | 用户登录 | 公开 |
| `/api/auth/me` | GET | 获取当前用户 | 需登录 |
| `/api/users` | GET | 用户列表 | 需登录 |
| `/api/users/:id` | GET/PUT/DELETE | 用户详情/更新/删除 | 需登录 |
| `/api/tasks` | GET/POST | 任务列表/创建 | 需登录 |
| `/api/tasks/:id` | GET/PUT/DELETE | 任务详情/更新/删除 | 需登录 |
| `/api/tasks/stats/overview` | GET | 任务统计 | 需登录 |
| `/api/projects` | GET/POST | 项目列表/创建 | 需登录 |
| `/api/projects/:id` | GET/PUT/DELETE | 项目详情/更新/删除 | 需登录 |
| `/api/reports` | GET/POST | 日报列表/创建 | 需登录 |
| `/api/help-requests` | GET/POST | 求助列表/创建 | 需登录 |
| `/api/feishu/config` | GET/POST | 飞书配置读写 | 需 manager |
| `/api/feishu/config/:id/connect` | PUT | 更新连接状态 | 需 manager |
| `/api/feishu/users` | GET | 飞书通讯录 | 需 manager |
| `/api/feishu/bases` | GET | 搜索多维表格 | 需 manager |
| `/api/feishu/base/:token/tables` | GET | 表格列表 | 需 manager |
| `/api/feishu/base/:token/table/:tableId/fields` | GET | 字段列表 | 需 manager |
| `/api/feishu/base/:token/table/:tableId/records` | GET | 记录列表 | 需 manager |
| `/api/feishu/create-default-tables` | POST | 创建标准表格 | 需 manager |
| `/api/dashboard/overview` | GET | 仪表盘概览 | 需登录 |
| `/api/dashboard/recent` | GET | 最近活动 | 需登录 |
| `/api/system-data/:key` | GET | 系统数据读取 | 需登录 |

---

## 6. 前端架构

### 6.1 路由体系（HashRouter）

| 路径 | 页面 | 角色限制 |
|------|------|----------|
| `/login` | 登录页 | 公开 |
| `/` | 首页仪表盘 | 全员（根据角色渲染不同视图） |
| `/tasks` | 任务中心 | 全员 |
| `/workspace` | 工作台 | 全员 |
| `/employees` | 员工管理 | 全员 |
| `/help-requests` | 求助管理 | 全员 |
| `/reports` | 日报报告 | 全员 |
| `/my-reports` | 我的日报 | 全员 |
| `/ai-assistant` | AI 助手 | 仅 manager |
| `/team-analysis` | 团队分析 | 仅 manager |
| `/feishu` | 飞书集成 | 全员 |
| `/feishu-mapping` | 字段映射 | 全员 |
| `/feishu-sync` | 数据同步 | 全员 |
| `/settings` | 系统设置 | 全员 |
| `/performance` | 绩效反馈 | 全员 |

### 6.2 Context 体系

| Context | 用途 | 范围 |
|---------|------|------|
| ThemeContext | 暗色/亮色主题管理 | 全局 |
| UserRoleContext | 用户认证、角色、权限 | 全局 |
| TeamStoreContext | 团队数据缓存 | 全局 |
| HelpRequestContext | 求助状态管理 | 全局 |

### 6.3 自定义 Hooks

| Hook | 用途 |
|------|------|
| `useSystemData(key)` | 获取后端 system_data 配置 |
| `useUserRole()` | 获取当前用户角色和认证状态 |
| `useTeamStore()` | 获取团队数据（成员、项目、任务） |

---

## 7. 飞书集成

### 7.1 集成架构

```
前端 FeishuIntegration.tsx
      |
      v
后端 feishu.ts 路由
      |
      v
server/src/utils/larkCli.ts
      |
      v
系统调用 lark-cli
      |
      v
飞书开放平台 API
```

### 7.2 飞书 CLI 能力映射

| 功能 | lark-cli 命令 | 后端函数 |
|------|--------------|----------|
| 搜索通讯录 | `contact +search-user` | `getFeishuUsers()` |
| 搜索文档 | `docs +search` | `searchFeishuBases()` |
| 获取表格列表 | `base +table-list` | `getBaseTables()` |
| 获取字段列表 | `base +field-list` | `getTableFields()` |
| 获取记录 | `base +record-list` | `getTableRecords()` |
| 创建 Base | `base +base-create` | `createDefaultTaskBase()` |
| 创建表格 | `base +table-create` | `createTable()` |
| 添加记录 | `base +record-upsert` | `createTable()` |

### 7.3 标准表格模板

系统可一键创建包含 4 张核心表格的「团队任务管理」Base：

1. **任务跟踪** — 任务名称、负责人、状态、优先级、截止日期、进度、描述、所属项目
2. **项目管理** — 项目名称、项目经理、状态、进度、健康评分、起止日期
3. **日报汇总** — 汇报人、日期、今日完成、明日计划、阻碍、支持
4. **求助处理** — 求助人、关联任务、求助原因、处理状态

---

## 8. 认证与权限

### 8.1 JWT 认证流程

```
1. 用户注册/登录
2. 后端生成 JWT Token（含 userId），有效期 7 天
3. 前端将 Token 存入 localStorage
4. 每次请求通过 Authorization: Bearer <token> 发送
5. 后端 middleware 校验 Token，查询 users 表验证用户存在
```

### 8.2 权限中间件

| Middleware | 功能 | 使用场景 |
|-----------|------|----------|
| `authMiddleware` | 校验 JWT Token，注入 req.user | 所有受保护路由 |
| `requireManager` | 校验 role === 'manager' | 飞书配置、AI 助手、团队分析 |

---

## 9. 开发环境配置

### 9.1 环境变量

创建 `server/.env` 文件：

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=sqlite:./data.db
JWT_SECRET=your-secret-key-here
FEISHU_APP_ID=
FEISHU_APP_SECRET=
```

### 9.2 启动方式

```bash
# 1. 安装依赖
cd app && npm install
cd server && npm install

# 2. 启动后端（会自动建表、清空业务数据、同步 system_data）
cd server && npx tsx watch src/index.ts

# 3. 启动前端（新终端）
cd app && npm run dev

# 4. 访问
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 9.3 飞书 CLI 配置

```bash
# 安装飞书 CLI
npm install -g @larksuiteoapi/lark-cli

# 登录（扫码或密码）
lark-cli auth login

# 验证身份
lark-cli auth whoami --format json
```

---

## 10. 项目结构

```
app/
├── public/                    # 静态资源（图标、图片）
├── src/
│   ├── api/
│   │   ├── client.ts          # HTTP 客户端（fetch 封装）
│   │   └── feishuClient.ts    # 飞书相关 API 封装
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件库（40+ 组件）
│   │   ├── Layout.tsx         # 页面布局（侧边栏 + 主内容）
│   │   ├── PageHeader.tsx     # 页面标题组件
│   │   ├── KpiBlock.tsx       # KPI 指标卡片
│   │   ├── TaskCard.tsx       # 任务卡片
│   │   ├── AiInsightCard.tsx  # AI 洞察卡片
│   │   ├── tasks/             # 任务相关子组件
│   │   ├── workspace/         # 工作台子组件
│   │   └── ErrorBoundary.tsx  # 错误边界
│   ├── context/
│   │   ├── ThemeContext.tsx   # 主题管理
│   │   ├── UserRoleContext.tsx # 用户认证与角色
│   │   ├── TeamStoreContext.tsx # 团队数据
│   │   └── HelpRequestContext.tsx # 求助状态
│   ├── data/
│   │   ├── mockData.ts        # 演示数据（已清空）
│   │   └── feishuMockData.ts  # 飞书模拟数据类型
│   ├── hooks/
│   │   └── useSystemData.ts   # system_data 数据 Hook
│   ├── pages/
│   │   ├── Home.tsx           # 首页仪表盘
│   │   ├── TaskCenter.tsx     # 任务中心
│   │   ├── Workspace.tsx      # 工作台
│   │   ├── AiAssistant.tsx    # AI 助手
│   │   ├── TeamAnalysis.tsx   # 团队分析
│   │   ├── Reports.tsx        # 日报报告
│   │   ├── MyReports.tsx      # 我的日报
│   │   ├── EmployeeManagement.tsx # 员工管理
│   │   ├── HelpRequestManagement.tsx # 求助管理
│   │   ├── FeishuIntegration.tsx # 飞书集成配置
│   │   ├── FeishuMapping.tsx  # 字段映射
│   │   ├── FeishuSync.tsx     # 数据同步
│   │   ├── PerformanceFeedback.tsx # 绩效反馈
│   │   ├── Settings.tsx       # 系统设置
│   │   └── Login.tsx          # 登录页
│   ├── App.tsx                # 根组件（路由配置）
│   ├── main.tsx               # 入口文件
│   └── index.css              # 全局样式（CSS 变量主题）
├── server/
│   ├── src/
│   │   ├── index.ts           # 服务端入口（Express 初始化）
│   │   ├── config/
│   │   │   └── index.ts       # 配置管理（环境变量）
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── auth.ts        # 认证路由
│   │   │   ├── users.ts       # 用户路由
│   │   │   ├── tasks.ts       # 任务路由
│   │   │   ├── projects.ts    # 项目路由
│   │   │   ├── reports.ts     # 日报路由
│   │   │   ├── helpRequests.ts # 求助路由
│   │   │   ├── feishu.ts      # 飞书集成路由
│   │   │   ├── dashboard.ts   # 仪表盘路由
│   │   │   └── systemData.ts  # 系统数据路由
│   │   └── utils/
│   │       ├── db.ts          # SQLite 数据库工具
│   │       └── larkCli.ts     # 飞书 CLI 调用封装
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma 数据模型定义
│   │   ├── migrate.ts         # 数据库迁移脚本
│   │   ├── seed.ts            # 业务数据种子（已清空）
│   │   └── seedSystem.ts      # system_data 种子
│   └── package.json
├── doc/
│   └── 飞书表格搭建规范.md     # 飞书表格字段规范文档
├── index.html                 # HTML 入口
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
├── components.json            # shadcn/ui 配置
└── package.json
```

---

## 11. 部署指南

### 11.1 生产构建

```bash
# 前端构建
cd app && npm run build
# 输出到 dist/ 目录

# 后端构建
cd server && npm run build
# 输出到 dist/ 目录
```

### 11.2 生产部署

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3001
export FRONTEND_URL=https://your-domain.com
export JWT_SECRET=your-production-secret

# 启动后端
cd server && node dist/index.js

# 前端通过 Nginx/CDN 托管 dist/ 目录
```

### 11.3 注意事项

- 生产环境建议使用 PostgreSQL 替换 sql.js（修改 `server/src/utils/db.ts`）
- 生产环境需配置 HTTPS，并更新 CORS 的 `FRONTEND_URL`
- JWT_SECRET 必须使用强随机字符串
- 飞书 App Secret 不可暴露到前端

---

## 12. 关键组件说明

### 12.1 数据库工具 `server/src/utils/db.ts`

使用 sql.js 实现 SQLite 内存数据库，关键特性：
- **持久化**：每次写入后自动导出 Buffer 保存到 `data.db` 文件
- **事务支持**：`transaction()` 封装 BEGIN/COMMIT/ROLLBACK
- **lastInsertRowid**：通过 `SELECT last_insert_rowid()` 获取真实自增 ID

### 12.2 飞书 CLI 桥接 `server/src/utils/larkCli.ts`

通过 `child_process.execSync` 调用 `lark-cli`，特性：
- **命令封装**：`execLark()` 统一添加 `--format json` 和 `--as user`
- **base 子命令**：`execLarkRaw()` 处理 base 子命令（不支持 `--format`）
- **字段类型映射**：飞书数字类型 -> 系统语义类型（1:text, 2:number, 3:singleSelect 等）
- **去重处理**：通讯录搜索多轮查询后按 open_id 去重

### 12.3 前端 API 客户端 `src/api/client.ts`

- **统一拦截**：自动从 localStorage 读取 token 添加到 Authorization Header
- **错误处理**：非 2xx 或 `success: false` 时抛出 Error
- **简洁封装**：`api.get()` / `api.post()` / `api.put()` / `api.del()`

### 12.4 主题系统 `src/context/ThemeContext.tsx`

- **暗色/亮色切换**：通过 Tailwind CSS 变量 `--background`, `--foreground` 等
- **localStorage 持久**：用户偏好保存到 `theme` 键
- **系统偏好检测**：默认跟随系统 `prefers-color-scheme`

### 12.5 角色权限系统 `src/context/UserRoleContext.tsx`

- **登录态管理**：维护 `isAuthenticated`, `user`, `isManager`, `isEmployee`
- **Token 刷新**：应用启动时调用 `/api/auth/me` 验证 Token
- **路由守卫**：`RequireAuth` 组件拦截未认证用户到登录页

---

## 附录

### A. 技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 数据库 | sql.js (SQLite) | 零配置、单文件部署、适合中小型团队 |
| 前端路由 | HashRouter | 兼容静态部署，无需服务端配置 |
| 状态管理 | Context + useState | 项目规模适中，无需 Redux/Zustand |
| 样式方案 | Tailwind CSS + shadcn/ui | 快速开发、一致性、暗色主题支持 |
| 飞书集成 | lark-cli | 官方 CLI 覆盖完整 API，无需自建 OAuth |
| 构建工具 | Vite | 快速 HMR、ESM 原生支持 |

### B. 已知限制

1. **sql.js 并发**：SQLite 单文件模式不支持高并发写入
2. **lark-cli 依赖**：必须预先安装并登录飞书 CLI
3. **seedSystem.ts 启动失败**：`execSync('npx tsx')` 在特定环境下可能找不到 `npx`
4. **无 WebSocket**：实时通知通过轮询实现
5. **无邮件服务**：通知仅通过飞书 Webhook 或 Toast

### C. 扩展建议

1. **数据库迁移**：生产环境使用 PostgreSQL + Prisma Client
2. **缓存层**：引入 Redis 缓存热点数据
3. **实时通信**：集成 WebSocket 或 SSE 实现实时通知
4. **文件存储**：接入云存储（OSS/S3）支持附件上传
5. **单元测试**：引入 Vitest + React Testing Library
6. **CI/CD**：配置 GitHub Actions 自动构建和部署

---

*文档版本：v1.0*
*最后更新：2026-05-09*
