# Analyst Proposals 2026-04-10

**Author**: Analyst | **Date**: 2026-04-10 | **Project**: vibex-analyst-proposals-vibex-proposals-20260410

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 来源 |
|----|------|-------------|--------|------|
| A-P0-1 | Bug | GitHub secret scanning 阻止 push — Slack token 硬编码在 task_manager.py | P0 | dev/20260407 |
| A-P0-2 | Bug | ESLint `no-explicit-any` 未清理 — 9 个 TS 文件含显式 any | P0 | dev/20260408 |
| A-P0-3 | Feature | generate-components flowId 关联修复仍未验证 | P0 | analyst/20260406 |
| A-P1-1 | Tech Debt | Tree 组件按钮不统一 — Toolbar 按钮样式不一致 | P1 | dev/20260408 |
| A-P1-2 | Tech Debt | `selectedNodeIds` 类型分散 — treeStore / canvasStore 多处定义 | P1 | dev/20260408 |
| A-P1-3 | Feature | `componentStore` 批量方法缺失 — 批量添加/删除/更新需逐个调用 | P1 | dev/20260408 |
| A-P1-4 | Process | 提案追踪 CLI (E6) 使用率低 — TRACKING.md 仍手动维护 | P1 | analyst/20260410 |
| A-P2-1 | Tech Debt | Canvas ComponentRegistry 未版本化 — 新增组件无法热加载 | P2 | analyst/20260410 |
| A-P2-2 | Process | Reviewer 任务派发重复 — 同一 PR 被多个 subagent review | P2 | analyst/20260407 |

---

## 详细提案

### A-P0-1: GitHub Secret Scanning 阻止 Push

**问题描述**:  
`scripts/task_manager.py` 包含硬编码 Slack User Token（`xoxp-...`），GitHub secret scanning 触发后，任何修改该文件的 commit 无法 push。

**影响**: 全团队阻塞 — 修改 task_manager.py 时必须绕过，严重影响协作效率。

**建议方案**:
```python
# task_manager.py
import os
SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
# 所有 xoxp-xxx 替换为 SLACK_TOKEN
```
- `.env` 文件管理 tokens（不提交到 git）
- CI/CD 从 secret manager 注入环境变量

**验收标准**:
- [ ] `task_manager.py` 中无 `xoxp-` 字符串
- [ ] 修改该文件后 `git push` 成功（secret scanning 不阻断）
- [ ] `.env.example` 包含 `SLACK_TOKEN=` 示例

---

### A-P0-2: ESLint `no-explicit-any` 未清理

**问题描述**:  
`tsc --noEmit` 报告 9 个 TS 文件含 `any` 类型声明，分布在 packages/ 和 services/ 目录。

**影响**: TypeScript 类型安全倒退，隐性 any 使重构风险不可评估。

**建议方案**:  
**Option A（推荐）**: 逐文件清理
```bash
# 1. 列出所有显式 any
grep -rn " : any\| :any" packages/ services/ --include="*.ts" --include="*.tsx"
# 2. 分类修复
# - 简单 any → 明确类型
# - 对象 any → Record<...> 或 interface
# - 函数 any → (arg: Type) => ReturnType
```

**Option B**: 增量清理 + 严格 lint
- 启用 `typescript-eslint` 的 `no-explicit-any` 规则
- 设置 `--strict` 逐步迁移

**验收标准**:
- [ ] `tsc --noEmit` 无 `any` 相关错误
- [ ] `eslint --rule 'typescript/no-explicit-any: error'` 通过

---

### A-P0-3: generate-components flowId 关联修复仍未验证

**问题描述**:  
Analyst 在 2026-04-06 已识别此 Bug，Dev 修复 commit `5f3a2d` 已合并。但 **至今无 E2E 验证**，无法确认 AI 生成组件与 flow 正确关联。

**影响**: AI 生成组件落入 `unknown` flow，导致版本历史和协作功能数据错乱。

**建议方案**:  
补充 E2E 测试覆盖：
```typescript
// tests/e2e/generate-components-flowid.test.ts
test('AI generates components with correct flowId', async ({ page }) => {
  await page.goto('/canvas/project/test-id');
  await page.click('[data-testid="generate-components"]');
  const response = await canvasApi.generateComponents({ flowId: 'flow-123' });
  expect(response.components.every(c => c.flowId === 'flow-123')).toBe(true);
});
```

**验收标准**:
- [ ] E2E 测试通过，`flowId` 字段 100% 正确
- [ ] Canvas 组件面板显示的组件归属正确的 Flow 节点

---

### A-P1-1: Tree 组件按钮不统一

**问题描述**:  
`BoundedContextTree`、`FlowTree`、`ComponentTree` 的 Toolbar 按钮（add/delete/edit）样式各异，图标不一致。

**来源**: Dev/20260408 P003

**验收标准**:
- [ ] 三种 Tree 组件共用统一 Button 组件
- [ ] 图标库统一（无混用 Heroicons / Lucide / 自定义 SVG）

---

### A-P1-2: `selectedNodeIds` 类型分散

**问题描述**:  
`selectedNodeIds` 在 `treeStore.ts` 和 `canvasStore.ts` 均有定义，类型不一致（`Set<string>` vs `string[]`），导致切换 store 时需转换。

**来源**: Dev/20260408 P004

**验收标准**:
- [ ] `selectedNodeIds` 只在一处定义（建议 treeStore）
- [ ] 使用 TypeScript `Set<string>` 统一（去重 + O(1) 查询）

---

### A-P1-3: `componentStore` 批量方法缺失

**问题描述**:  
批量导入组件时需逐个调用 `addComponent()`，100+ 组件时性能极差。

**来源**: Dev/20260408 P005

**验收标准**:
- [ ] `componentStore.addComponents(components[])` 批量方法存在
- [ ] `componentStore.removeComponents(ids[])` 批量方法存在
- [ ] 100 组件批量操作 < 100ms

---

### A-P1-4: 提案追踪 CLI 使用率低

**问题描述**:  
`scripts/proposal-tracker.py`（E6 产出）已创建，但 TRACKING.md 仍手动维护，CLI 使用率为 0。

**根因**: CLI 缺少 `update` 子命令，无法闭环更新状态。

**验收标准**:
- [ ] `proposal-tracker.py update <id> <status>` 可用
- [ ] 2026-04-10 后 TRACKING.md 所有更新走 CLI

---

### A-P2-1: Canvas ComponentRegistry 未版本化

**问题描述**:  
`@json-render/core` + `@json-render/react` 已集成（E1），但 `vibexCanvasCatalog` 无版本机制，新增组件后需重启 Dev Server。

**验收标准**:
- [ ] ComponentRegistry 支持 HMR（热模块替换）新增组件
- [ ] 新增组件无需重启 Dev Server 即可在 JsonRenderPreview 可见

---

### A-P2-2: Reviewer 任务派发重复

**问题描述**:  
同一 PR 被多个 reviewer subagent 领取，重复评审，浪费算力。

**来源**: Analyst/20260407

**验收标准**:
- [ ] team-tasks 中同一 PR 的 review 任务不重复派发
- [ ] Coord 扫描 reviewer 任务时检查 `status=pending` 的 PR ID 去重

---

## 执行追踪

基于 `docs/proposals/TRACKING.md`（截至 2026-04-10）：

| ID | 优先级 | 状态 | 备注 |
|----|--------|------|------|
| A-20260406-01 | P0 | proposed | E2E 测试修复 |
| A-20260406-02 | P0 | proposed | generate-components 合并 |
| A-20260407-01 | P1 | proposed | reviewer 任务去重 |
| A-20260407-02 | P1 | proposed | TypeScript any 清理 |
| A-20260407-03 | P1 | proposed | 测试命令统一 |
| A-20260408-01 | P0 | ✅ done | vitest 根级配置 |
| A-20260408-02 | P0 | **pending** | ESLint no-explicit-any |
| A-20260408-03 | P1 | pending | Tree 按钮统一 |
| A-20260408-04 | P1 | pending | selectedNodeIds 类型 |
| A-20260408-05 | P1 | pending | componentStore 批量方法 |
| A-20260409-E1~E6 | P0 | ✅ done | Backend 数据完整性 + KV 迁移等 6 Epic |

**结论**: P0 待落地 2 项（A-20260406-01、A-20260406-02、A-20260408-02）共 2 个 Sprint 积压，建议本周集中清理。

---

*Analyst — 2026-04-10*
