# VibeX 实施计划

> **项目**: vibex-architect-proposals-vibex-proposals-20260406  
> **版本**: v1.0  
> **日期**: 2026-04-06  
> **作者**: architect agent

---

## 概述

本实施计划基于架构文档，将所有改进任务分解为可执行的步骤，配合部署清单与回滚方案，确保安全、可控地落地。

**总工时估算**: ~20h（P0-P3，不含 P3 长期规划）

| 阶段 | 优先级 | 工时 | 目标 |
|------|--------|------|------|
| Phase 0 | P0 | 1.1h | 阻塞性 Bug 修复 |
| Phase 1 | P1 | 4h | 稳定性改进 |
| Phase 2 | P1 | ~2d | 架构改进 |
| Phase 3 | P2 | ~1w | 中期改进 |
| Phase 4 | P3 | 长期 | 基础设施 |

---

## Phase 0: P0 修复（立即执行）

### P0-1: OPTIONS 预检路由修复

**文件**: `vibex-backend/src/gateway.ts`

**步骤**:

```bash
# Step 1: 确认当前路由注册顺序
cat src/gateway.ts | grep -A 5 "options"

# Step 2: 调整 OPTIONS handler 注册顺序
# 在 authMiddleware 之前注册 protected_.options

# Step 3: 验证
curl -X OPTIONS -I https://api.vibex.top/v1/projects
# 期望: HTTP/2 204, headers 含 Access-Control-Allow-*
```

**改动范围**:
- `gateway.ts`: OPTIONS handler 移动到 `authMiddleware` 之前

**验收标准**:
- [ ] `OPTIONS /v1/projects` 返回 204
- [ ] CORS headers 正确返回
- [ ] GET/POST 请求不受影响

---

### P0-2: Canvas Context 多选修复

**文件**: `vibex-frontend/src/lib/canvas/components/BoundedContextTree.tsx`

**步骤**:

```bash
# Step 1: 定位 checkbox onChange
grep -n "onChange" src/lib/canvas/components/BoundedContextTree.tsx

# Step 2: 确认当前调用的是 toggleContextNode
# 期望: 应该调用 onToggleSelect

# Step 3: 修改
# 修改前: onChange={() => toggleContextNode(node.id)}
# 修改后: onChange={() => onToggleSelect(node.id)}
```

**改动范围**:
- `BoundedContextTree.tsx`: checkbox onChange handler

**验收标准**:
- [ ] checkbox 点击 → `onToggleSelect` 被调用
- [ ] `selectedNodeIds` 状态正确更新
- [ ] `toggleContextNode` 不再被 checkbox 触发

---

### P0-3: generate-components flowId 修复

**文件**: 
- `vibex-backend/src/routes/canvas/generate-components.ts`
- AI prompt 模板

**步骤**:

```bash
# Step 1: 定位 AI schema 定义
grep -n "flowId" src/routes/canvas/generate-components.ts

# Step 2: 确认 schema 中缺少 flowId 字段

# Step 3: 在 schema 中添加
flowId: z.string().describe('Flow identifier')

# Step 4: 确认 prompt 模板要求输出 flowId
grep -n "flowId" src/lib/prompts/*.ts
```

**改动范围**:
- AI schema 定义
- Prompt 模板

**验收标准**:
- [ ] schema 定义包含 `flowId: string`
- [ ] prompt 明确要求 AI 输出 flowId
- [ ] 测试: `flowId` 不再是 "unknown"

---

## Phase 1: P1 稳定性改进（1 个月内）

### P1-1: SSE 超时 + 连接清理

**文件**:
- `vibex-backend/src/lib/sse-stream-lib/index.ts`
- `vibex-backend/src/routes/canvas/stream.ts`

**步骤**:

```bash
# Step 1: 引入 AbortController.timeout
# 修改 aiService.chat 调用
const controller = AbortSignal.timeout(10000);
const response = await aiService.chat({ ...options, signal: controller });

# Step 2: 实现 ReadableStream.cancel() 清理 timers
const stream = new ReadableStream({
  cancel(reason) {
    clearTimeout(timeoutId);
    clearInterval(heartbeatInterval);
    // ... 清理所有 timers
  }
});

# Step 3: 添加 jest 测试
# tests/services/stream.test.ts
```

**改动范围**:
- `sse-stream-lib/index.ts`
- `routes/canvas/stream.ts`
- 新增 `tests/services/stream.test.ts`

**验收标准**:
- [ ] 10s 无响应时流自动关闭
- [ ] `stream.cancel()` 调用所有 `clearTimeout`
- [ ] jest 测试覆盖超时和清理逻辑

---

### P1-2: 分布式限流（Cache API）

**文件**: `vibex-backend/src/lib/rateLimit.ts`

**步骤**:

```bash
# Step 1: 确认当前实现使用内存 Map
grep -n "new Map" src/lib/rateLimit.ts

# Step 2: 替换为 Cache API
const cacheKey = `ratelimit:${identifier}`;
const cached = await caches.default.match(cacheKey);

if (cached) {
  const { count, timestamp } = await cached.json();
  // 限流逻辑
} else {
  // 创建新记录
  await caches.default.put(cacheKey, new Response(JSON.stringify({...})));
}

# Step 3: 验证 wrangler.toml 配置 Cache API
# 确认 wrangler.toml 中 comatibility_flags 包含 "nodejs_compat"
```

**改动范围**:
- `lib/rateLimit.ts`
- `wrangler.toml`（如需要）

**验收标准**:
- [ ] 限流使用 `caches.default`
- [ ] 接口不变（向后兼容）
- [ ] 并发 100 请求 → 限流一致

---

### P1-3: test-notify 去重

**文件**:
- `vibex-backend/scripts/dedup.js`
- `vibex-backend/scripts/test-notify.js`

**步骤**:

```bash
# Step 1: 创建 dedup.js
# 实现 checkDedup(key) 和 recordSend(key)
# 使用 .dedup-cache.json 持久化

# Step 2: 集成到 test-notify.js
const dedup = checkDedup(notifyKey);
if (dedup.skipped) {
  console.log('Duplicate, skipping');
  return;
}
recordSend(notifyKey);
// 发送通知逻辑

# Step 3: 添加 jest 测试
# tests/scripts/dedup.test.ts
```

**改动范围**:
- 新增 `scripts/dedup.js`
- 修改 `scripts/test-notify.js`

**验收标准**:
- [ ] 5 分钟内相同 key 只发送一次
- [ ] 状态持久化到 `.dedup-cache.json`
- [ ] jest 测试覆盖

---

## Phase 2: P1 架构改进（1-3 个月）

### P2-1: E2E 测试可运行化

**关联项目**: `vibex-e2e-test-fix`

**步骤**:

```bash
# Step 1: 修复 Jest + Playwright 配置
# 修改 jest.config.js
testEnvironment: 'jsdom',  // 移除或修改

# 配置 Playwright runner
transform: {
  '^.+\\.test\\.ts$': '@playwright/test/reporter'
}

# Step 2: 修复 pre-existing 测试失败
# 逐个分析失败测试，修复或标记 skip

# Step 3: 建立 CI gate
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npx playwright test --reporter=junit
  # 允许失败但要求覆盖率报告
```

**改动范围**:
- `jest.config.js`
- `playwright.config.ts`
- 测试文件修复

**验收标准**:
- [ ] E2E 测试可在 CI 中运行
- [ ] 无 pre-existing 测试污染
- [ ] CI gate 阻止 flaky 测试合并

---

### P2-2: generate-components 合并

**关联项目**: `vibex-generate-components-consolidation`

**步骤**:

```bash
# Step 1: 对比两个实现
diff src/routes/canvas/route.ts src/routes/v1/canvas/generate-components/index.ts

# Step 2: 确定保留哪个实现（推荐 /v1/*）
# 迁移 /api/* 调用到 /v1/*

# Step 3: 删除冗余文件
rm src/routes/canvas/route.ts
# 或重定向到新路由

# Step 4: 统一 prompt 模板
# 确保两处 prompt 一致
```

**改动范围**:
- `routes/canvas/route.ts`
- `routes/v1/canvas/generate-components/`

**验收标准**:
- [ ] 只有一个 generate-components 实现
- [ ] prompt 模板统一
- [ ] 所有调用方迁移到新路由

---

### P2-3: 统一 API 响应格式

**步骤**:

```bash
# Step 1: 定义统一响应类型
# src/types/api-response.ts
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

# Step 2: 创建中间件
# src/middleware/responseFormatter.ts

# Step 3: 应用到所有 /v1/* 端点
# 逐个审查 endpoint 返回格式

# Step 4: 更新 openapi.json
```

**改动范围**:
- 新增 `types/api-response.ts`
- 新增 `middleware/responseFormatter.ts`
- 修改所有 `/v1/*` endpoint

**验收标准**:
- [ ] 所有 /v1/* 端点返回统一格式
- [ ] openapi.json 同步更新
- [ ] 客户端能统一处理响应

---

### P2-4: Store 治理规范

**关联项目**: `vibex-store-governance`

**步骤**:

```bash
# Step 1: 制定 ADR-ARCH-001
# 创建 docs/adr/ADR-ARCH-001-canvas-store-governance.md

# Step 2: 合并冗余 store
# simplifiedFlowStore + flowStore → flowStore
# 使用 grep 确定调用方
grep -rn "simplifiedFlowStore" src/

# Step 3: 建立 selector 导出规范
# 每个 store 必须导出
export const selectXxx = (state: StoreState) => state.xxx;

# Step 4: 引入事件总线替代直接 getState()
# src/lib/events/index.ts
```

**改动范围**:
- 新增 ADR 文档
- 合并 `simplifiedFlowStore.ts`
- 新增事件总线

**验收标准**:
- [ ] ADR-ARCH-001 审批通过
- [ ] 冗余 store 合并
- [ ] 新 store 必须符合规范

---

### P2-5: Prompt 注入防护增强

**步骤**:

```bash
# Step 1: 定义检测模式
# src/lib/security/prompt-injection.ts
const INJECTION_PATTERNS = [
  /ignore (previous|above|all) (instructions?|commands?|rules?)/i,
  /you (are now|should act as) (?:a|an) (?:different|new|another)/i,
  /\b(instead|rather|actually|rather than)\b.*\b(ignore|forget|disregard)\b/i,
  // ... 更多模式
];

# Step 2: 应用到用户输入点
# schemas/security.ts 或专门的 middleware

# Step 3: 添加日志和监控
# 记录检测到的注入尝试
```

**改动范围**:
- 新增 `lib/security/prompt-injection.ts`
- 修改用户输入处理逻辑

**验收标准**:
- [ ] 主流注入模式被检测
- [ ] 检测到时记录日志
- [ ] 不影响正常请求

---

## Phase 3: P2 中期改进（3-6 个月）

### P3-1: SSE 流服务统一抽象

**步骤**:

```bash
# Step 1: 定义 StreamService 接口
# src/lib/stream/StreamService.ts

# Step 2: 重构现有 SSE 端点
# routes/canvas/stream.ts
# routes/v1/canvas/stream.ts

# Step 3: 统一超时、限流、清理逻辑
```

**验收标准**:
- [ ] 统一的 StreamService 接口
- [ ] 所有 SSE 端点使用统一服务
- [ ] 可测试性提升

---

### P3-2: Prompt 模板分层

**步骤**:

```bash
# Step 1: 拆分 templates
mkdir -p src/lib/prompts/{templates,renderers,validators}

# Step 2: 迁移现有模板
mv src/lib/prompts/*.ts src/lib/prompts/templates/

# Step 3: 创建渲染引擎
# src/lib/prompts/renderers/index.ts

# Step 4: 添加 Golden test
```

**验收标准**:
- [ ] templates/renderers/validators 分离
- [ ] 现有模板迁移完成
- [ ] Golden test 覆盖

---

### P3-3: D1 Repository 层统一

**步骤**:

```bash
# Step 1: 定义 Repository 接口
# src/lib/db/Repository.ts

# Step 2: 创建基础实现
# src/lib/db/BaseRepository.ts

# Step 3: 迁移现有 DB 访问
# grep -rn "env.DB.prepare" src/routes/
```

**验收标准**:
- [ ] 统一 Repository 模式
- [ ] 事务边界清晰
- [ ] 可 Mock 测试

---

### P3-4: wrangler 环境配置

**步骤**:

```bash
# Step 1: 修改 wrangler.toml
# [env.staging]
# [env.production]

# Step 2: 配置 secrets
# wrangler secret put API_KEY --env staging

# Step 3: 部署脚本
# scripts/deploy.sh
```

**验收标准**:
- [ ] 三个环境配置完成
- [ ] secrets 管理规范
- [ ] 部署脚本可用

---

### P3-5: CanvasPage 分解

**步骤**:

```bash
# Step 1: 创建目录结构
mkdir -p src/pages/canvas/{components,hooks}

# Step 2: 拆分组件
# CanvasToolbar.tsx
# CanvasHeader.tsx
# CanvasBody.tsx

# Step 3: 提取 hooks
# useCanvasInit.ts
# useCanvasEvents.ts
# useCanvasAI.ts

# Step 4: 组合到 index.tsx
```

**验收标准**:
- [ ] CanvasPage 分解为多个文件
- [ ] 每个文件 < 300 行
- [ ] 功能无损失

---

### P3-6: 内联 style 检测

**步骤**:

```bash
# Step 1: 创建 CI 检测脚本
# scripts/check-inline-styles.sh
#!/bin/bash
count=$(grep -rn "style={{" src/ --include="*.tsx" \
  | grep -v node_modules \
  | grep -v ".test." \
  | grep -v "white-list.txt" \
  | wc -l)

if [ $count -gt 0 ]; then
  echo "ERROR: Found $count inline styles"
  grep -rn "style={{" src/ --include="*.tsx" \
    | grep -v node_modules \
    | grep -v ".test." \
    | grep -v "white-list.txt"
  exit 1
fi

# Step 2: 加入 CI
# .github/workflows/lint.yml
- name: Check inline styles
  run: ./scripts/check-inline-styles.sh
```

**验收标准**:
- [ ] CI 检测脚本可用
- [ ] 白名单机制建立
- [ ] 新增内联 style 阻止合并

---

## 部署清单

### 通用部署流程

```bash
# 1. 本地测试
pnpm test
pnpm test:e2e

# 2. 构建
pnpm build

# 3. TypeScript 类型检查
pnpm typecheck

# 4. Lint 检查
pnpm lint

# 5. 部署 (Staging)
wrangler deploy --env staging

# 6. Staging 验证
curl -X OPTIONS -I https://staging-api.vibex.top/v1/projects

# 7. 部署 (Production)
wrangler deploy --env production

# 8. Production 验证
curl -X OPTIONS -I https://api.vibex.top/v1/projects
```

### P0 修复部署清单

| 检查项 | 命令/验证方式 |
|--------|--------------|
| OPTIONS 返回 204 | `curl -X OPTIONS -I https://api.vibex.top/v1/projects` |
| Canvas checkbox 可用 | 手动测试 checkbox 选择 |
| flowId 不再 unknown | API 响应检查 |

### P1 修复部署清单

| 检查项 | 命令/验证方式 |
|--------|--------------|
| SSE 10s 超时 | `curl` 模拟慢响应，计时验证 |
| 限流跨 Worker 一致 | 并发测试脚本 |
| test-notify 去重 | 5 分钟内重复调用验证 |

### P2 修复部署清单

| 检查项 | 命令/验证方式 |
|--------|--------------|
| E2E 测试通过 | `pnpm test:e2e` |
| API 响应格式统一 | 审查所有 /v1/* 响应 |
| Store 治理规范 | 代码审查 |

---

## 回滚方案

### P0 修复回滚

**OPTIONS 修复回滚**:

```bash
# 立即回滚
git revert HEAD --no-commit
git checkout src/gateway.ts

# 或使用备份
cp src/gateway.ts.backup src/gateway.ts

# 验证
curl -X OPTIONS -I https://api.vibex.top/v1/projects
# 期望: 恢复 401 状态
```

**Canvas checkbox 修复回滚**:

```bash
# 回滚
git checkout HEAD~1 src/lib/canvas/components/BoundedContextTree.tsx

# 验证
# checkbox 应恢复原状
```

**flowId 修复回滚**:

```bash
# 回滚 schema 和 prompt
git checkout HEAD~1 src/routes/canvas/generate-components.ts

# 验证
# AI 输出 flowId 应恢复 "unknown"
```

### P1 修复回滚

**SSE 超时回滚**:

```bash
# 移除 AbortController.timeout
# 恢复原有 aiService.chat 调用

# 验证
# SSE 流应不再有 10s 超时
```

**限流回滚**:

```bash
# 恢复内存 Map
# 移除 Cache API 调用

# 验证
# 限流应恢复单 Worker 模式
```

**test-notify 去重回滚**:

```bash
# 移除 dedup.js 集成
# 恢复原有发送逻辑

# 验证
# 重复调用应正常发送
```

### 紧急回滚流程

```bash
# 1. 识别问题
# - 监控报警
# - 用户反馈
# - CI 失败

# 2. 立即回滚到上一个稳定版本
wrangler rollback

# 3. 通知团队
# Slack: #incidents

# 4. 分析根因
# 查看 wrangler logs
wrangler tail

# 5. 修复后重新部署
```

### 版本标签管理

```bash
# 每次部署打标签
git tag -a v2026-04-06-p0 -m "P0 fixes deployed"
git push origin v2026-04-06-p0

# 回滚到指定标签
wrangler rollback --version-id <version-id>
```

---

## 时间线

```
2026-04-06 ────────────────────────────────────────────────────►
              │
              ├─ Phase 0: P0 修复 (1.1h)
              │   ├─ P0-1: OPTIONS 预检路由 (0.5h)
              │   ├─ P0-2: Canvas checkbox (0.3h)
              │   └─ P0-3: flowId 修复 (0.3h)
              │
              ├─ Phase 1: P1 稳定性 (4h)
              │   ├─ P1-1: SSE 超时 (1.5h)
              │   ├─ P1-2: 分布式限流 (1.5h)
              │   └─ P1-3: test-notify 去重 (1h)
              │
              ├─ Phase 2: P1 架构改进 (~2d)
              │   ├─ P2-1: E2E 测试可运行化 (2h)
              │   ├─ P2-2: generate-components 合并 (1h)
              │   ├─ P2-3: API 响应格式统一 (2h)
              │   ├─ P2-4: Store 治理规范 (1d)
              │   └─ P2-5: Prompt 注入防护 (2h)
              │
              ├─ Phase 3: P2 中期改进 (~1w)
              │   ├─ P3-1: SSE 流服务统一 (1d)
              │   ├─ P3-2: Prompt 模板分层 (2d)
              │   ├─ P3-3: D1 Repository (1d)
              │   ├─ P3-4: wrangler 环境 (4h)
              │   ├─ P3-5: CanvasPage 分解 (1d)
              │   └─ P3-6: 内联 style 检测 (2h)
              │
              └─ Phase 4: P3 长期规划 (长期)
                  ├─ AI Service 测试基础设施 (3d)
                  ├─ E2E 稳定性治理 (1d)
                  └─ GraphQL/Durable Objects 评估 (长期)
```

---

*文档版本: v1.0 | Architect | 2026-04-06*
