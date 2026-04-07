# Architecture: canvas-bc-checkbox-fix — confirmContextNode 类型错误修复

**Agent**: architect
**Date**: 2026-04-02
**Project**: canvas-bc-checkbox-fix
**Status**: ✅ 完成

---

## 1. 问题概述

`BoundedContextTree.tsx:434` 的 `handleGenerate` 函数在创建新节点时使用了不存在的 `confirmed` 字段，导致 TypeScript 类型错误。

**根因**: 遗留代码残留。`confirmed` 字段在 Migration 2→3 中已迁移为 `isActive`，但 `handleGenerate` 中的 mock 生成代码仍使用旧字段名。

**修复**: 删除 `confirmed: false` 赋值。

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | React 18.x | 现有 |
| 语言 | TypeScript 5.x | 编译检查 |
| 状态管理 | Zustand | 现有 |
| 测试 | Vitest + Playwright | 现有 |

**无新增依赖** — 单行删除。

---

## 3. 问题定位

### 3.1 错误代码

**文件**: `src/components/canvas/BoundedContextTree.tsx`
**行号**: 434

```typescript
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  confirmed: false,   // ❌ TypeScript 错误：BoundedContextNode 没有 confirmed 字段
  status: 'pending' as const,
  children: [],
}));
```

### 3.2 类型定义

**`BoundedContextNode`**（`src/lib/canvas/types.ts:34`）:

```typescript
export interface BoundedContextNode {
  nodeId: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  isActive?: boolean;           // ✅ 确认状态字段
  status: NodeStatus;            // 'pending' | 'confirmed' | 'error'
  parentId?: string;
  children: string[];
  relationships?: ContextRelationship[];
  // ❌ 无 confirmed 字段
}
```

### 3.3 状态字段映射

| 旧字段 | 新字段 | 用途 |
|--------|--------|------|
| `confirmed: false` | `isActive: false` | 是否激活参与生成 |
| `confirmed: true` | `isActive: true` | 同上 |

Migration 代码（`canvasStore.ts`）已处理 `confirmed` → `isActive` 迁移（持久化数据），但 mock 生成代码未同步。

---

## 4. 架构决策

### 方案 A：删除 `confirmed: false`（推荐）

直接删除 `confirmed: false` 行，新节点 `isActive` 默认为 `undefined`（真值）。

**等价行为**: `isActive: undefined` = 激活状态（绿色高亮），与产品期望一致。

**工时**: < 5 分钟
**风险**: 无

### 方案 B：替换为 `isActive: false`

如果期望 mock 生成后节点默认为"未激活"状态：

```typescript
isActive: false,  // 显式未激活
```

**工时**: < 5 分钟
**风险**: 低，但改变默认行为，需产品确认。

---

## 5. 推荐方案

**方案 A**：删除 `confirmed: false`

**理由**:
1. TypeScript 直接报错，必须修复
2. `BoundedContextNode` 无 `confirmed` 字段
3. Migration 已将 `confirmed` → `isActive`，代码应与之一致
4. 默认 `isActive: undefined` = 激活状态，与产品期望一致

---

## 6. 文件变更清单

| 文件 | 变更类型 | 行号 | 变更 |
|------|----------|------|------|
| `src/components/canvas/BoundedContextTree.tsx` | 修改 | 434 | 删除 `confirmed: false,` |

---

## 7. 测试策略

### 7.1 TypeScript 编译验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit 2>&1 | grep -i "BoundedContextTree"
# 预期: 无输出（0 错误）
```

### 7.2 代码检查

```bash
grep -n "confirmed:" /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx
# 预期: 仅匹配 migration 代码（行号 < 100）
```

### 7.3 Playwright 回归测试

```typescript
test('Generate button creates context node with correct checkbox state', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[aria-label="展开上下文树"]');
  await page.click('[aria-label="生成上下文"]');
  await page.waitForSelector('[role="checkbox"]');
  // 新节点默认激活（isActive = undefined → 激活）
  const checkbox = page.locator('[role="checkbox"]').first();
  await expect(checkbox).toBeChecked();
});
```

### 7.4 gstack UI 验证（强制）

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

$B goto http://localhost:3000/canvas
$B wait 2000
$B click "[aria-label='展开上下文树']"
$B wait 1000
$B click "[aria-label='生成上下文']"
$B wait 2000
$B screenshot /tmp/checkbox-generate-after.png
$B eval "
  const checkbox = document.querySelector('[role=\"checkbox\"]');
  checkbox ? 'PASS: checkbox exists' : 'FAIL: no checkbox';
"
```

---

## 8. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 误删其他 `confirmed` | 极低 | 高 | 仅删除第 434 行一行 |
| 行为改变 | 无 | - | 删除后 `isActive: undefined` = 激活，行为不变 |

---

## 9. 验收标准

- [ ] TypeScript 编译 0 error
- [ ] `confirmed: false` 已从 `handleGenerate` 中删除
- [ ] `grep "confirmed:" BoundedContextTree.tsx` 仅匹配 migration 代码
- [ ] gstack 截图：生成节点后 checkbox 默认激活
- [ ] Playwright E2E 回归测试通过

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-bc-checkbox-fix
- **执行日期**: 2026-04-02
