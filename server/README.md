# 团队管理后端 API

基于 Node.js + Express + TypeScript + PostgreSQL 构建的团队管理后端服务。

## 技术栈

- **Runtime**: Node.js + TypeScript (tsx 热重载)
- **Framework**: Express 4
- **Database**: PostgreSQL (node-postgres / pg)
- **Auth**: JWT + bcryptjs
- **Validation**: express-validator

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL 和 JWT_SECRET
```

示例 `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/team_management"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV=development
```

### 3. 初始化数据库

确保 PostgreSQL 已安装并运行，然后创建数据库：

```bash
createdb team_management
```

执行迁移创建表结构：

```bash
npm run db:migrate
```

填充初始数据：

```bash
npm run db:seed
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务默认运行在 `http://localhost:3001`

## API 接口文档

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |

### 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表（管理员）|
| GET | /api/users/:id | 用户详情 |
| PUT | /api/users/:id | 更新用户 |
| DELETE | /api/users/:id | 删除用户（管理员）|

### 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 任务列表（支持筛选/分页）|
| GET | /api/tasks/:id | 任务详情 |
| POST | /api/tasks | 创建任务 |
| PUT | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| GET | /api/tasks/stats/overview | 任务统计 |

### 项目

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects | 项目列表 |
| GET | /api/projects/:id | 项目详情 |
| POST | /api/projects | 创建项目（管理员）|
| PUT | /api/projects/:id | 更新项目（管理员）|
| DELETE | /api/projects/:id | 删除项目（管理员）|

### 日报

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reports | 日报列表 |
| GET | /api/reports/:id | 日报详情 |
| POST | /api/reports | 创建日报 |
| PUT | /api/reports/:id | 更新日报 |
| DELETE | /api/reports/:id | 删除日报 |

### 求助

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/help-requests | 求助列表 |
| GET | /api/help-requests/:id | 求助详情 |
| POST | /api/help-requests | 创建求助 |
| PUT | /api/help-requests/:id | 更新求助状态 |
| DELETE | /api/help-requests/:id | 删除求助 |

### 飞书配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/feishu/config | 获取配置 |
| POST | /api/feishu/config | 保存配置 |
| PUT | /api/feishu/config/:id/connect | 连接/断开 |

### 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard/overview | 概览数据 |
| GET | /api/dashboard/my-tasks | 我的任务统计 |
| GET | /api/dashboard/team-stats | 团队统计（管理员）|

## 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | manager@example.com | admin123 |
| 员工 | wangfang@example.com | 123456 |
| 员工 | liuyang@example.com | 123456 |
| 员工 | chenming@example.com | 123456 |
| 员工 | zhaoqiang@example.com | 123456 |
| 员工 | liming@example.com | 123456 |

## 项目结构

```
server/
├── src/
│   ├── index.ts              # 入口
│   ├── config/
│   │   └── index.ts          # 配置
│   ├── middleware/
│   │   └── auth.ts           # JWT 认证
│   ├── routes/
│   │   ├── auth.ts           # 认证
│   │   ├── users.ts          # 用户
│   │   ├── tasks.ts          # 任务
│   │   ├── projects.ts       # 项目
│   │   ├── reports.ts        # 日报
│   │   ├── helpRequests.ts   # 求助
│   │   ├── feishu.ts         # 飞书配置
│   │   └── dashboard.ts      # 仪表盘
│   └── utils/
│       └── db.ts             # 数据库连接
├── prisma/
│   ├── migrate.ts            # 数据库迁移
│   └── seed.ts               # 初始数据
├── .env.example
├── package.json
└── tsconfig.json
```
