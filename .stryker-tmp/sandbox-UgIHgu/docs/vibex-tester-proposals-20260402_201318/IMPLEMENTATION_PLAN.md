# VibeX 测试流程改进 — 实施计划

**文档版本**: v1.0  
**编写日期**: 2026-04-02  
**编写角色**: Architect  
**项目**: vibex-tester-proposals-20260402_201318  
**总工时**: 6.5 人天

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-tester-proposals-20260402_201318
- **执行日期**: 2026-04-02

---

## 2. Sprint 排期

### 2.1 Sprint 划分

```
Sprint 1: 2026-04-03（0.5天）
├── Epic 1 (DoD 约束) — 0.5d
└── Epic 6 (状态同步) — 0.5d（coord 侧）
    └── 并行执行

Sprint 2: 2026-04-04（1天）
└── Epic 2 (遗留驳回项) — 1d

Sprint 3: 2026-04-07 ~ 2026-04-08（2天）
└── Epic 3 (Store 覆盖率) — 2d

Sprint 4: 2026-04-09 ~ 2026-04-10（2天）
└── Epic 4 (Canvas E2E) — 2d

Sprint 5: 2026-04-11（0.5天）
├── Epic 5 (tester 早期介入) — 0.5d
└── 整体验收与回归测试
```

### 2.2 Phase 排期甘特图

```
2026-04-03   2026-04-04   2026-04-07   2026-04-08   2026-04-09   2026-04-10   2026-04-11
    |            |            |            |            |            |            |
E1  |████████████|            |            |            |            |            |
E2  |            |████████████|            |            |            |            |
E3  |            |            |████████████████████████|            |            |
E4  |            |            |            |            |████████████████████████|    |
E5  |            |            |            |            |            |            |████|
E6  |████████████|            |            |            |            |            |
```

---

## 3. 各 Epic 详细步骤

### Sprint 1 — Epic 1: 强制测试同步机制（DoD 约束）

**工时**: 0.5d | **负责人**: dev lead

#### 步骤 1.1: 定位 AGENTS.md（0.05d）

```bash
# 查找 AGENTS.md 文件位置
find /root/.openclaw/vibex -name "AGENTS.md" -not -path "*/node_modules/*" | head -10
```

**验收**: 文件路径确认

#### 步骤 1.2: 更新 AGENTS.md DoD 章节（0.15d）

在 AGENTS.md 的 `Definition of Done` 章节添加：

```markdown
## Definition of Done（扩展）

### Dev Agent DoD 扩展
- [ ] 代码实现完成
- [ ] 测试文件同步更新（新增 Epic 必须同时提交 `.test.ts` 文件）
- [ ] `npx jest <file> --no-coverage` 在本地通过
- [ ] 测试文件与实现文件在同一 PR 中提交
```

**验收**: AGENTS.md 文件包含 DoD 测试要求

#### 步骤 1.3: 文档化 tester 前置检查流程（0.1d）

创建 tester 工作流程文档，路径：`docs/tester-workflow.md`

```markdown
# Tester 工作流程

## 收到任务后（前置检查）
1. 读取任务描述，确认 Epic 范围
2. 执行: `npx jest <EpicName> --no-coverage --passWithNoTests`
3. 若测试失败或测试文件缺失 → 直接驳回（不执行完整测试）
4. 若测试通过 → 执行完整测试用例
```

**验收**: `docs/tester-workflow.md` 存在且内容完整

#### 步骤 1.4: dev lead 审核（0.1d）

- dev lead review AGENTS.md 变更
- 确认 DoD 约束清晰可执行

**验收**: dev lead 评论确认

---

### Sprint 1 — Epic 6: 状态同步机制（coord 侧）

**工时**: 0.5d | **负责人**: coord

#### 步骤 6.1: 定位 coord 派发逻辑（0.1d）

```bash
# 查找 team-tasks 派发相关代码
find /root/.openclaw -name "*.py" -o -name "*.ts" -o -name "*.js" | \
  xargs grep -l "dispatch\|派发\|update.*status" 2>/dev/null | \
  grep -v node_modules | head -10
```

**验收**: 派发逻辑文件确认

#### 步骤 6.2: 实现状态校验（0.25d）

在 coord 派发函数中添加：

```python
# 伪代码示例
def dispatch_task(project_id, task_id):
    status = read_task_status(project_id, task_id)
    if status != "ready":
        raise ValueError(f"任务 {task_id} 状态为 {status}，拒绝派发")
    # 继续派发逻辑
```

**验收**: coord 不再派发非 ready 状态任务

#### 步骤 6.3: Slack 消息格式化（0.1d）

更新 dev 修复通知模板：

```markdown
✅ 已修复，请重新测试
- Epic: <name>
- 修复内容: <description>
- 测试验证: 请先运行 `npx jest <file> --no-coverage`
```

**验收**: Slack 通知包含重测标注

#### 步骤 6.4: 验证（0.05d）

测试状态校验逻辑，拒绝派发一个已完成的任务。

**验收**: coord 拒绝派发非 ready 任务

---

### Sprint 2 — Epic 2: 遗留驳回项修复

**工时**: 1d | **负责人**: dev

#### 步骤 2.1: 确认 sessionStore 路径（0.1d）

```bash
find /root/.openclaw/vibex -name "*session*" -not -path "*/node_modules/*" | grep -E "\.ts$"
```

**验收**: sessionStore 源文件确认

#### 步骤 2.2: 创建 sessionStore 测试文件（0.3d）

路径: `vibex-fronted/src/stores/__tests__/sessionStore.test.ts`

```typescript
// 基础模板（需根据实际 sessionStore 实现填充）
import { renderHook, act } from '@testing-library/react';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    act(() => {
      useSessionStore.getState().reset();
    });
  });

  // 基础状态测试
  it('should have initial state', () => {
    const state = useSessionStore.getState();
    // 填充具体断言
  });

  // Action 测试（根据实际 actions 填充）
  it('should update session', () => {
    act(() => {
      useSessionStore.getState().setSession({ ... });
    });
    // 断言
  });

  // 覆盖率: 115 行代码全覆盖
  // 目标: ≥70%
});
```

**验收**: `npx jest sessionStore --coverage` 通过，覆盖率 ≥70%

#### 步骤 2.3: 确认 checkbox-persist dev commit（0.2d）

```bash
cd /root/.openclaw/vibex
git log --oneline --all --grep="checkbox-persist" -n 5
git log --oneline --all --grep="E1" --grep="persist" --all-match -n 5
```

**验收**: 有 checkbox-persist 相关 commit

#### 步骤 2.4: PR 创建与 tester 重测（0.4d）

1. 创建 PR（如未创建）
2. tester 执行完整测试
3. tester 报告通过

**验收**: PR merge 或 tester ✅

---

### Sprint 3 — Epic 3: Store 覆盖率

**工时**: 2d | **负责人**: dev + tester

#### 步骤 3.1: 盘点所有 store 和现有测试（0.1d）

```bash
# 列出所有 store
ls /root/.openclaw/vibex/vibex-fronted/src/stores/*.ts | grep -v test

# 列出已有测试
ls /root/.openclaw/vibex/vibex-fronted/src/stores/__tests__/
ls /root/.openclaw/vibex/vibex-fronted/src/stores/*.test.ts
```

**交付**: Store 盘点表（覆盖/缺失/待确认）

#### 步骤 3.2: 确认 uiStore 和 componentStore 是否存在（0.1d）

```bash
find /root/.openclaw/vibex -name "*uiStore*" -o -name "*componentStore*" -not -path "*/node_modules/*"
```

**验收**: 文件存在性确认

#### 步骤 3.3: contextStore 覆盖率补充（0.5d）

路径: `vibex-fronted/src/stores/__tests__/contextStore.test.ts` 或 `contextSlice.test.ts`

```bash
# 先运行现有测试，确认覆盖率基线
npx jest contextSlice --coverage --coverageReporters=text
```

**测试场景**:
- reducer 每个 action 的状态转换
- 边界条件：空数组、undefined fields
- 异步 action mock（如有）

**验收**: 行覆盖率 ≥80%

#### 步骤 3.4: uiStore 覆盖率补充（0.5d）

路径: 新建 `vibex-fronted/src/stores/__tests__/uiStore.test.ts`

**测试场景**:
- UI 状态初始化
- 主题/布局切换 action
- 模态框/抽屉状态管理

**验收**: 行覆盖率 ≥80%

#### 步骤 3.5: flowStore 覆盖率补充（0.25d）

路径: 新建或更新 `vibex-fronted/src/stores/__tests__/flowStore.test.ts`（对应 `simplifiedFlowStore.ts`）

**测试场景**:
- Flow 节点增删改
- Flow 树结构状态

**验收**: 行覆盖率 ≥80%

#### 步骤 3.6: componentStore 覆盖率补充（0.25d）

路径: 新建 `vibex-fronted/src/stores/__tests__/componentStore.test.ts`

**测试场景**:
- 组件选中状态
- 组件树结构

**验收**: 行覆盖率 ≥80%

#### 步骤 3.7: sessionStore 覆盖率验收（0.1d）

```bash
npx jest sessionStore --coverage --coverageReporters=text
```

**验收**: 行覆盖率 ≥70%

#### 步骤 3.8: tester 覆盖率报告截图（0.2d）

```bash
npx jest stores --coverage --coverageReporters=lcov --coverageReporters=text
```

保存覆盖率报告，tester 截图留存。

**验收**: 覆盖率报告截图保存

---

### Sprint 4 — Epic 4: Canvas E2E 测试

**工时**: 2d | **负责人**: dev + tester

#### 步骤 4.1: 确认 Playwright 环境（0.05d）

```bash
# 检查 playwright 安装
npx playwright --version

# 检查浏览器
ls ~/.cache/ms-playwright/

# 检查现有 e2e 配置
cat /root/.openclaw/vibex/vibex-fronted/playwright.test.config.ts
```

**验收**: Playwright 可运行

#### 步骤 4.2: 分析 Canvas 三树组件结构（0.1d）

```bash
# 查找 Canvas 相关组件
find /root/.openclaw/vibex/vibex-fronted/src -name "*.tsx" | xargs grep -l "ContextTree\|FlowTree\|ComponentTree" | head -10

# 查找 canvasStore
find /root/.openclaw/vibex/vibex-fronted/src -name "canvasStore*" | head -5
```

**验收**: Canvas 组件结构确认

#### 步骤 4.3: 三树切换 E2E 测试（0.75d）

文件: `vibex-fronted/tests/e2e/canvas/context-tree-switch.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas 三树切换', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas'); // 确认实际路径
    await page.waitForLoadState('networkidle');
  });

  test('F4.1: ContextTree → FlowTree → ComponentTree 切换', async ({ page }) => {
    // 1. 确认 ContextTree 默认显示
    const contextTree = page.locator('[data-testid="context-tree"]');
    await expect(contextTree).toBeVisible();
    const contextCheckboxes = page.locator('[data-testid="context-tree"] input[type="checkbox"]');
    const initialCount = await contextCheckboxes.count();

    // 2. 切换到 FlowTree
    await page.click('[data-testid="tree-tab-flow"]');
    await expect(page.locator('[data-testid="flow-tree"]')).toBeVisible();
    const flowCheckboxes = page.locator('[data-testid="flow-tree"] input[type="checkbox"]');
    await expect(flowCheckboxes).not.toHaveCount(initialCount);

    // 3. 切换到 ComponentTree
    await page.click('[data-testid="tree-tab-component"]');
    await expect(page.locator('[data-testid="component-tree"]')).toBeVisible();
    const componentCheckboxes = page.locator('[data-testid="component-tree"] input[type="checkbox"]');
    await expect(componentCheckboxes).not.toHaveCount(initialCount);

    // 4. 切回 ContextTree（状态保持）
    await page.click('[data-testid="tree-tab-context"]');
    await expect(contextCheckboxes).toHaveCount(initialCount);
  });

  test('F4.2: 切换时保留选中状态', async ({ page }) => {
    // 选中一个节点
    await page.click('[data-testid="tree-tab-context"]');
    await page.locator('[data-testid="context-tree"] input[type="checkbox"]').first().check();
    
    // 切换树
    await page.click('[data-testid="tree-tab-flow"]');
    
    // 切回，状态应保持
    await page.click('[data-testid="tree-tab-context"]');
    await expect(page.locator('[data-testid="context-tree"] input[type="checkbox"]').first()).toBeChecked();
  });
});
```

**注意**: `data-testid` 需要 dev 在实现时添加。如遇选择器不稳定，使用 `page.waitForSelector` 等待元素。

**验收**: 测试存在，`npx playwright test context-tree-switch.spec.ts` 通过

#### 步骤 4.4: 节点选择 E2E 测试（0.5d）

文件: `vibex-fronted/tests/e2e/canvas/node-selection.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas 节点选择', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
  });

  test('F4.3: 点击节点 → checkbox 选中 → 右侧面板更新', async ({ page }) => {
    // 1. 点击一个节点
    const firstNode = page.locator('[data-testid="context-tree"] [data-testid="tree-node"]').first();
    await firstNode.click();
    
    // 2. checkbox 选中
    const checkbox = firstNode.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
    
    // 3. 右侧面板显示节点详情
    await expect(page.locator('[data-testid="node-detail-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-detail-name"]')).toHaveText(firstNode.getAttribute('data-node-name'));
  });

  test('F4.4: 选中多个节点', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="context-tree"] input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    
    // 选中计数
    await expect(page.locator('[data-testid="selected-count"]')).toHaveText('2');
  });
});
```

**验收**: 测试存在，`npx playwright test node-selection.spec.ts` 通过

#### 步骤 4.5: 确认反馈 E2E 测试（0.5d）

文件: `vibex-fronted/tests/e2e/canvas/confirm-feedback.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas 确认反馈', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
  });

  test('F4.5: 选中节点 → 确认 → 反馈显示', async ({ page }) => {
    // 1. 选中节点
    await page.locator('[data-testid="context-tree"] input[type="checkbox"]').first().check();
    
    // 2. 点击确认按钮
    await page.click('[data-testid="confirm-button"]');
    
    // 3. 确认反馈显示（根据实际 UI）
    await expect(page.locator('[data-testid="confirm-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-toast"]')).toContainText('确认成功');
  });

  test('F4.6: 确认后节点状态变化', async ({ page }) => {
    // 选中并确认
    await page.locator('[data-testid="context-tree"] input[type="checkbox"]').first().check();
    await page.click('[data-testid="confirm-button"]');
    
    // 节点显示 confirmed 状态
    await expect(page.locator('[data-testid="context-tree"] [data-testid="tree-node"]').first()
      .locator('[data-node-status]')).toHaveAttribute('data-node-status', 'confirmed');
  });
});
```

**验收**: 测试存在，`npx playwright test confirm-feedback.spec.ts` 通过

#### 步骤 4.6: E2E 测试稳定率验证（0.1d）

```bash
# 连续运行 3 次
for i in 1 2 3; do
  echo "=== Run $i ==="
  npx playwright test canvas/ --reporter=list || exit 1
done
```

**验收**: 3 次全部通过

#### 步骤 4.7: 添加 data-testid（如需要）（0.0d，dev 侧）

如测试发现选择器不稳定，dev 需在对应组件中添加 `data-testid`。

**验收**: 所有 E2E 选择器稳定

---

### Sprint 5 — Epic 5: tester 早期介入机制

**工时**: 0.5d | **负责人**: tester + analyst + pm

#### 步骤 5.1: 文档化 tester 介入流程（0.15d）

创建 `docs/tester-early-involvement.md`:

```markdown
# Tester 早期介入流程

## 触发条件
- 功能优先级 ≥ P2
- 新增 Epic（非常规迭代）

## 介入时机
- plan-eng-review 阶段
- 设计 review 完成后、dev 开始实现前

## 介入内容
1. Review Epic 需求文档
2. 设计测试用例初稿
3. 提出测试覆盖建议
4. 记录在 Epic 文档的 Testing Strategy 章节

## 派发机制
- PM 在派发 P2+ 任务时，在 Slack @tester 并说明需求
- Coord 在派发时同步 CC tester agent
```

**验收**: `docs/tester-early-involvement.md` 存在

#### 步骤 5.2: Coord CC 机制配置（0.2d）

确认 coord 派发任务时支持 CC tester。

```bash
# 检查 coord 派发逻辑是否支持 CC
grep -r "CC\|cc\|mention" /root/.openclaw --include="*.py" --include="*.ts" | grep -i "tester" | head -10
```

**验收**: coord 支持在派发时 CC tester

#### 步骤 5.3: 验证流程（0.15d）

选择一个 P2+ 新 Epic 测试介入流程。

**验收**: tester 介入记录存在

---

## 4. 验收清单

### 4.1 Epic 1 验收清单

- [ ] `AGENTS.md` 中 Definition of Done 章节包含测试准备要求
- [ ] `docs/tester-workflow.md` 存在且描述清晰
- [ ] 新增 Epic 的测试文件与实现文件同时提交（规则确认）
- [ ] tester 发现测试文件未更新时可直接驳回（流程确认）

### 4.2 Epic 2 验收清单

- [ ] `vibex-fronted/src/stores/__tests__/sessionStore.test.ts` 存在
- [ ] `npx jest sessionStore --coverage` 通过
- [ ] sessionStore 覆盖率 ≥70%
- [ ] checkbox-persist-bug 有 dev commit/PR
- [ ] tester 重测通过（Slack 消息留存）

### 4.3 Epic 3 验收清单

| Store | 测试文件 | 覆盖率目标 | 实际覆盖率 |
|-------|---------|-----------|-----------|
| contextStore | `contextSlice.test.ts` | ≥80% | ⬜ |
| uiStore | `__tests__/uiStore.test.ts` | ≥80% | ⬜ |
| flowStore | `__tests__/flowStore.test.ts` | ≥80% | ⬜ |
| componentStore | `__tests__/componentStore.test.ts` | ≥80% | ⬜ |
| sessionStore | `__tests__/sessionStore.test.ts` | ≥70% | ⬜ |
| authStore | `__tests__/authStore.test.ts` | ≥80% | ⬜ |

### 4.4 Epic 4 验收清单

| 测试文件 | 描述 | 稳定运行 |
|---------|------|---------|
| `context-tree-switch.spec.ts` | 三树切换 | ⬜ |
| `node-selection.spec.ts` | 节点选择 | ⬜ |
| `confirm-feedback.spec.ts` | 确认反馈 | ⬜ |

- [ ] 3 次连续运行均通过（flaky rate <5%）
- [ ] 失败时截图保存到 `test-results/`

### 4.5 Epic 5 验收清单

- [ ] `docs/tester-early-involvement.md` 存在
- [ ] P2+ 功能的 plan-eng-review 阶段有 tester 参与记录
- [ ] tester 可在 design review 阶段提出测试覆盖建议

### 4.6 Epic 6 验收清单

- [ ] coord 派发前读取 team-tasks JSON 检查任务状态
- [ ] coord 拒绝派发非 ready 状态的任务（有日志）
- [ ] dev 修复 Slack 消息包含 "✅ 已修复，请重新测试" 标注

### 4.7 整体验收清单

- [ ] Epic 驳回率 <5%（下一测试日验证）
- [ ] 无遗留驳回项
- [ ] 所有 AGENTS.md 更新已通知所有 agent

---

## 5. 关键里程碑

| 里程碑 | 日期 | 条件 |
|-------|------|------|
| M1: DoD 约束生效 | 2026-04-03 | Epic 1 + Epic 6 完成 |
| M2: 遗留项清零 | 2026-04-04 | Epic 2 完成 |
| M3: Store 覆盖达标 | 2026-04-08 | Epic 3 完成，覆盖率全部达标 |
| M4: E2E 稳定 | 2026-04-10 | Epic 4 完成，3 次连续通过 |
| M5: 整体完成 | 2026-04-11 | Epic 5 + 整体验收 |

---

## 6. 风险缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|-----|---------|
| dev 不接受 DoD 约束 | 低 | 高 | PM 明确说明目标，dev lead 支持 |
| E2E 测试 flaky | 中 | 中 | 连续 3 次通过才合入，添加 `data-testid` |
| tester 早期介入增加沟通成本 | 低 | 低 | 仅 P2+ 功能，控制范围 |
| sessionStore 路径不明 | 中 | 低 | Sprint 2 第一步先确认文件路径 |
| uiStore/componentStore 不存在 | 中 | 低 | Sprint 3 第一步盘点确认 |
