# Analyst Proposals — 2026-04-11

**Author**: Analyst | **Date**: 2026-04-11 | **Project**: vibex-analyst-proposals-vibex-proposals-20260411

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 来源 |
|----|------|-------------|--------|------|
| A-P0-1 | Bug | task_manager.py Slack token 仍未迁移 — 上轮提案未执行，push 仍被阻断 | P0 | 20260410 遗留 |
| A-P0-2 | Bug | ESLint `no-explicit-any` 9 文件未清理 — 类型安全倒退 | P0 | 20260410 遗留 |
| A-P0-3 | Bug | PrismaClient Workers 守卫缺失 — 8+ 路由无法在 CF Workers 部署 | P0 | 20260410 遗留 |
| A-P0-4 | Bug | `@ci-blocking` 跳过 35+ 测试 — CI 测试门禁形同虚设 | P0 | 20260410 遗留 |
| A-P1-1 | Tech Debt | Tree Toolbar 按钮样式不统一 — 4 种按钮样式并存 | P1 | dev/20260408 |
| A-P1-2 | Tech Debt | `selectedNodeIds` 状态分散 — treeStore / canvasStore 多处定义 | P1 | dev/20260408 |
| A-P1-3 | Feature | `componentStore` 批量方法缺失 — 批量操作需逐个调用 | P1 | dev/20260408 |
| A-P1-4 | Process | 提案追踪 CLI 使用率 0% — TRACKING.md 仍手动维护 | P1 | analyst |
| A-P1-5 | Bug | generate-components flowId 修复未 E2E 验证 | P1 | 20260410 遗留 |
| A-P2-1 | Tech Debt | Canvas ComponentRegistry 未版本化 — 新增组件无法热加载 | P2 | analyst |
| A-P2-2 | Process | Reviewer 任务派发重复 — 同一 PR 被多个 subagent review | P2 | analyst |

---

## 详细提案

### A-P0-1: Slack Token 硬编码仍未修复（P0 遗留）

**问题描述**:  
`scripts/task_manager.py` 包含硬编码 Slack User Token（`xoxp-...`），上轮提案已识别但未执行，GitHub secret scanning 仍阻断所有涉及该文件的 commit。

**影响**: 全团队协作阻塞，临时绕过方案（git cherry-pick）不可持续。

**建议方案**:
```python
# task_manager.py
import os
SLACK_TOKEN = os.environ.get('SLACK_TOKEN', os.environ.get('SLACK_BOT_TOKEN', ''))
# 替换所有 xoxp-xxx 为 SLACK_TOKEN
```
- `.env` 管理 tokens（`.gitignore` 排除）
- CI 从 secret manager 注入环境变量

**验收标准**:
- [ ] `task_manager.py` 中无 `xoxp-` 字符串
- [ ] `git push` 对包含该文件的 commit 不被阻断
- [ ] `.env.example` 包含 `SLACK_TOKEN=` 示例

---

### A-P0-2: ESLint `no-explicit-any` 未清理（P0 遗留）

**问题描述**:  
`tsc --noEmit` 报告 9 个 TS 文件含显式 `any`，分布在 `packages/` 和 `services/` 目录。

**影响**: TypeScript 类型安全倒退，重构风险不可评估。

**建议方案**:  
**Option A（推荐）**: 逐文件清理
```bash
grep -rn " : any\| :any" packages/ services/ --include="*.ts" --include="*.tsx"
# 分类修复：
# - 简单 any → 明确类型
# - 对象 any → Record<...> 或 interface
# - 函数 any → (arg: Type) => ReturnType
```
**Option B**: 启用 `typescript-eslint/no-explicit-any: error` + `--strict` 逐步迁移

**验收标准**:
- [ ] `tsc --noEmit` 无 `any` 相关错误
- [ ] `eslint --rule 'typescript/no-explicit-any: error'` 通过

---

### A-P0-3: PrismaClient Workers 守卫缺失（P0 遗留）

**问题描述**:  
`PrismaClient` 实例在 Cloudflare Workers 环境中被直接使用（8+ 路由），CF Workers 不支持 `require()` 同步加载，导致部署失败。

**影响**: 8+ API 路由无法部署到生产环境。

**建议方案**:
```typescript
// Option A（推荐）: 全局单例守卫
let prisma: PrismaClient;
declare const self: ServiceWorkerGlobalScope;
if (typeof self !== 'undefined') {
  prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
} else {
  prisma = new PrismaClient();
}

// Option B: 延迟初始化
const getPrisma = () => prisma ?? new PrismaClient();
```

**验收标准**:
- [ ] `wrangler deploy` 成功，无 PrismaClient 加载错误
- [ ] API 路由在 CF Workers 环境中正常响应
- [ ] 热路径延迟 < 50ms（Prisma 连接复用）

---

### A-P0-4: `@ci-blocking` 跳过 35+ 测试（P0 遗留）

**问题描述**:  
`@ci-blocking` 注释跳过 35+ 测试用例，导致 CI 测试门禁形同虚设，P0 功能无有效验证。

**影响**: 部署质量无保证，回归风险极高。

**建议方案**:
1. 批量移除 `@ci-blocking` 注释（按模块分组）
2. 失败用例立即修复，不跳过
3. 建立 CI 测试通过率基线（目标 100%）

```bash
# 列出所有跳过测试
grep -rn "@ci-blocking" --include="*.test.ts" --include="*.spec.ts"
# 按模块逐批移除并修复
```

**验收标准**:
- [ ] 所有 `@ci-blocking` 注释移除
- [ ] CI 测试套件 100% 通过
- [ ] 回归测试覆盖率 ≥ 80%

---

### A-P1-1: Tree Toolbar 按钮样式不统一

**问题描述**:  
Tree 组件 Toolbar 中存在 4 种按钮样式（`bg-blue-500`/`bg-gray-100`/`border`/裸按钮），视觉不一致。

**建议方案**:  
统一为 2 种按钮样式：
- Primary: `bg-blue-500 hover:bg-blue-600 text-white`
- Secondary: `bg-gray-100 hover:bg-gray-200 text-gray-700`

**验收标准**:
- [ ] Toolbar 按钮样式归一为 ≤ 2 种
- [ ] 截图对比审查无明显视觉差异

---

### A-P1-2: `selectedNodeIds` 状态分散

**问题描述**:  
`selectedNodeIds` 在 `treeStore` 和 `canvasStore` 中各有定义，状态同步逻辑缺失。

**建议方案**:  
统一到单一状态源 `treeStore.selectedNodeIds`，`canvasStore` 通过 computed 派生：
```typescript
// canvasStore
const selectedNodeIds = computed(() => treeStore.selectedNodeIds);
```

**验收标准**:
- [ ] 单一 `selectedNodeIds` 定义源
- [ ] 多选切换状态同步正确

---

### A-P1-3: `componentStore` 批量方法缺失

**问题描述**:  
批量添加/删除/更新组件需逐个调用 API，N+1 问题严重。

**建议方案**:  
新增批量接口：
```typescript
// services/componentStore.ts
batchAdd(components: Component[]): Promise<void>
batchDelete(ids: string[]): Promise<void>
batchUpdate(items: Partial<Component>[]): Promise<void>
```

**验收标准**:
- [ ] 批量操作 API 响应时间 < 500ms（100 组件）
- [ ] 事务回滚支持

---

### A-P1-4: 提案追踪 CLI 使用率 0%

**问题描述**:  
提案追踪 CLI (`proposal_tracker.py`) 已开发但团队无人使用，TRACKING.md 仍手动维护。

**建议方案**:
1. CI/CD 集成：PR 合并后自动更新 TRACKING.md 状态
2. 定期通知：每周一在 #coord 频道推送待处理提案
3. 文档化：AGENTS.md 中强制要求使用 CLI 更新状态

**验收标准**:
- [ ] 连续 3 个 Sprint CLI 使用率 ≥ 80%
- [ ] TRACKING.md 无需手动编辑

---

### A-P1-5: generate-components flowId 修复未 E2E 验证

**问题描述**:  
Dev 在 commit `5f3a2d` 中修复了 flowId 关联，但无 E2E 测试验证，修复有效性无法确认。

**建议方案**:  
补充 Playwright E2E 测试：
```typescript
test('generate-components 正确关联 flowId', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="generate-components-btn"]');
  const response = await page.waitForResponse('**/api/generate-components');
  const data = await response.json();
  expect(data.flowId).toBeDefined();
  expect(data.components.length).toBeGreaterThan(0);
});
```

**验收标准**:
- [ ] E2E 测试通过
- [ ] flowId 在组件元数据中正确记录

---

### A-P2-1: Canvas ComponentRegistry 未版本化

**问题描述**:  
ComponentRegistry 无版本控制，新增组件无法热加载，旧组件缓存导致 UI 错位。

**建议方案**:  
引入版本号 + 缓存失效：
```typescript
interface RegistryEntry {
  version: string;
  component: React.ComponentType;
  hash: string;
}
// 组件注册时携带 hash，hash 变更触发热更新
```

**验收标准**:
- [ ] 组件版本变更自动热更新
- [ ] 无需手动清除缓存

---

### A-P2-2: Reviewer 任务派发重复

**问题描述**:  
同一 PR 被多个 subagent 并发 review，重复工作浪费资源。

**建议方案**:  
任务派发前检查 PR 是否已有活跃 review session：
```python
# task_manager.py
def is_review_in_progress(pr_id: str) -> bool:
    # 检查是否有 review 状态的任务
    return check_active_reviews(pr_id)
```

**验收标准**:
- [ ] 同一 PR 不被并发 review
- [ ] review 任务去重率 ≥ 90%
