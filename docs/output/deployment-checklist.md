# VibeX 前后端联调部署检查清单

**项目**: vibex-fullstack-integration
**创建时间**: 2026-02-28 11:25

---

## 一、前置条件检查

### 1.1 环境准备
- [ ] Node.js >= 18.x 已安装
- [ ] wrangler CLI 已安装 (`npm install -g wrangler`)
- [ ] Cloudflare 账号已创建
- [ ] vibex.top 域名已托管到 Cloudflare

### 1.2 代码准备
- [ ] 后端代码已提交到 Git
- [ ] 前端代码已提交到 Git
- [ ] 敏感信息未硬编码到代码中

---

## 二、后端部署检查清单

### 2.1 Cloudflare 认证
```bash
# 检查登录状态
wrangler whoami
```
- [ ] 已登录 Cloudflare 账号

### 2.2 D1 数据库配置
```bash
# 列出现有数据库
wrangler d1 list

# 确认数据库 ID 与 wrangler.toml 中一致
wrangler d1 info vibex-db
```
- [ ] D1 数据库已创建
- [ ] database_id 与 wrangler.toml 一致

### 2.3 数据库迁移
```bash
# 本地测试迁移
wrangler d1 migrations apply vibex-db --local

# 远程执行迁移
wrangler d1 migrations apply vibex-db --remote
```
- [ ] 本地迁移成功
- [ ] 远程迁移成功
- [ ] 验证表结构
```bash
wrangler d1 execute vibex-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 2.4 Secrets 配置
```bash
# 逐一配置 Secrets
wrangler secret put JWT_SECRET
wrangler secret put MINIMAX_API_KEY
wrangler secret put MINIMAX_API_BASE
wrangler secret put MINIMAX_MODEL
```
- [ ] JWT_SECRET 已配置 (32+ 字符)
- [ ] MINIMAX_API_KEY 已配置
- [ ] MINIMAX_API_BASE 已配置
- [ ] MINIMAX_MODEL 已配置

### 2.5 Workers 部署
```bash
# 部署到 Cloudflare Workers
wrangler deploy
```
- [ ] 部署成功，无报错
- [ ] 输出显示正确的 URL

### 2.6 DNS 配置
- [ ] Cloudflare DNS 中配置 CNAME:
  - 名称: `api`
  - 目标: `<worker-name>.<account>.workers.dev`

### 2.7 后端验证
```bash
# Health Check
curl https://api.vibex.top/

# 预期响应
# {"status":"ok","message":"VibeX API is running...","timestamp":"..."}
```
- [ ] Health Check 返回 `{ status: 'ok' }`
- [ ] 响应时间 < 500ms

---

## 三、前端配置检查清单

### 3.1 环境变量配置
```bash
# 创建 .env.local
cd /root/.openclaw/workspace/vibex/vibex-fronted
echo "NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top" > .env.local
```
- [ ] `.env.local` 已创建
- [ ] `NEXT_PUBLIC_API_BASE_URL` 已设置为 `https://api.vibex.top`
- [ ] `.env.local` 已添加到 `.gitignore`

### 3.2 API 响应适配修复
检查 `src/services/api.ts` 中以下方法:

- [ ] `login()` 已适配 `{ success, data: { token, user } }` 格式
- [ ] `register()` 已适配 `{ success, data: { token, user } }` 格式
- [ ] `getMessages()` 已适配 `{ messages: [...] }` 格式

### 3.3 Token 持久化
- [ ] 登录成功后 `auth_token` 存储到 localStorage
- [ ] 登录成功后 `user_id` 存储到 localStorage
- [ ] 401 响应时清除 localStorage

### 3.4 页面对接状态

| 页面 | 文件 | 状态 | 验证点 |
|------|------|------|--------|
| 登录/注册 | `src/app/auth/page.tsx` | [ ] | 调用 apiService.login/register |
| Dashboard | `src/app/dashboard/page.tsx` | [ ] | 调用 apiService.getProjects |
| Chat | `src/app/chat/page.tsx` | [ ] | SSE 流式对话 |

---

## 四、联调测试检查清单

### 4.1 认证流程
- [ ] 注册新用户成功
- [ ] 登录成功并跳转到 Dashboard
- [ ] Token 已存储到 localStorage
- [ ] 刷新页面后保持登录状态
- [ ] 登出功能正常

### 4.2 项目管理
- [ ] Dashboard 显示项目列表
- [ ] 创建新项目成功
- [ ] 编辑项目成功
- [ ] 删除项目成功

### 4.3 AI 对话
- [ ] 发送消息到后端
- [ ] SSE 流式返回 AI 回复
- [ ] 消息正确显示在页面
- [ ] 对话历史正确加载

### 4.4 错误处理
- [ ] 401 错误自动跳转登录页
- [ ] 网络错误有友好提示
- [ ] 表单验证错误有提示

---

## 五、性能验证

### 5.1 API 响应时间
```bash
# 使用 curl 测试
curl -w "Time: %{time_total}s\n" https://api.vibex.top/api/projects?userId=test
```
- [ ] P99 < 500ms

### 5.2 SSE 连接稳定性
- [ ] 长对话不中断 (> 1 分钟)
- [ ] 网络波动后自动重连

### 5.3 前端加载性能
- [ ] 首屏加载 < 3s
- [ ] 静态资源正确缓存

---

## 六、安全检查

### 6.1 敏感信息保护
- [ ] 无 Secrets 硬编码在代码中
- [ ] `.env.local` 未提交到 Git
- [ ] `.dev.vars` 未提交到 Git

### 6.2 CORS 配置
- [ ] 后端 CORS 配置正确 (生产环境建议限制 origin)
- [ ] 预检请求正常响应

### 6.3 认证安全
- [ ] JWT Token 有效期合理
- [ ] Token 过期后正确处理

---

## 七、上线检查

### 7.1 最终验证
- [ ] 所有测试用例通过
- [ ] 无 console.error 日志
- [ ] 性能指标达标

### 7.2 监控配置
- [ ] Cloudflare Analytics 已启用
- [ ] 错误告警已配置

### 7.3 文档更新
- [ ] API 文档已更新
- [ ] 部署文档已更新

---

## 八、回滚准备

### 8.1 后端回滚命令
```bash
# 查看历史部署
wrangler deployments list

# 回滚到上一版本
wrangler rollback
```

### 8.2 前端回滚命令
```bash
git revert HEAD
npm run build
```

### 8.3 数据库回滚脚本
```sql
-- 根据实际情况准备反向迁移 SQL
-- D1 暂不支持自动回滚
```

---

## 九、联系方式

| 角色 | 负责人 | 联系方式 |
|------|--------|----------|
| 后端 | Dev Agent | - |
| 前端 | Dev Agent | - |
| 架构 | Architect Agent | - |
| PM | Coord Agent | - |

---

**检查清单版本**: 1.0
**最后更新**: 2026-02-28 11:25