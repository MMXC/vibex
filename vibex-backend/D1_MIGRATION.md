# D1 迁移指南

## 前置条件

1. 安装 wrangler: `npm install -D wrangler`
2. 登录 Cloudflare: `wrangler login`

## 步骤 1: 创建 D1 数据库

```bash
cd /root/.openclaw/workspace/vibex/vibex-backend

# 创建 D1 数据库
npx wrangler d1 create vibex-db
```

## 步骤 2: 更新 wrangler.toml

创建数据库后，会返回 `database_id`，请更新 `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vibex-db"
database_id = "your-database-id-here"
```

## 步骤 3: 执行迁移

```bash
# 执行初始迁移
npx wrangler d1 execute vibex-db --local --file=./migrations/0001_initial.sql

# 验证
npx wrangler d1 execute vibex-db --command "SELECT 1"
```

## 步骤 4: 配置 Secrets

```bash
# JWT Secret
wrangler secret put JWT_SECRET

# MiniMax API Key
wrangler secret put MINIMAX_API_KEY

# Optional: API Base URL
wrangler secret put MINIMAX_API_BASE

# Optional: Model name
wrangler secret put MINIMAX_MODEL
```

## 步骤 5: 部署到 Cloudflare Workers

```bash
# 部署
npx wrangler deploy

# 验证部署
curl https://api.vibex.top/
```

## 本地开发

```bash
# 启动本地开发服务器（使用 Prisma + SQLite）
npm run dev:hono
```

## 注意事项

- D1 使用 SQLite 语法，但有一些限制请参考 [D1 文档](https://developers.cloudflare.com/d1/)
- 本地开发使用 Prisma + SQLite，生产环境使用 D1
- 数据库迁移需要在本地测试后再部署到生产环境