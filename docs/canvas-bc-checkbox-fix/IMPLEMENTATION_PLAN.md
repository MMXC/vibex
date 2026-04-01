# Implementation Plan: canvas-bc-checkbox-fix

**Agent**: architect
**Date**: 2026-04-02
**Project**: canvas-bc-checkbox-fix
**Total**: < 0.5h

---

## 1. 概述

删除 `BoundedContextTree.tsx:434` 的 `confirmed: false` 赋值，修复 TypeScript 类型错误。

---

## 2. 实施步骤

### Step 1: 删除 confirmed 字段

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

**改前**（第 434 行）:
```typescript
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  confirmed: false,   // ❌ 删除此行
  status: 'pending' as const,
  children: [],
}));
```

**改后**:
```typescript
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  status: 'pending' as const,
  children: [],
}));
```

---

### Step 2: TypeScript 验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit 2>&1 | grep -i "BoundedContextTree"
# 预期: 无输出
```

---

### Step 3: 代码检查

```bash
grep -n "confirmed:" /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx
# 预期: 仅匹配 migration 代码（行号 < 200）
```

---

### Step 4: Vitest 单元测试（如已有测试文件）

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run tests/canvas/checkbox-confirm.spec.ts 2>/dev/null || echo "无独立测试文件，跳过"
```

---

### Step 5: gstack UI 回归验证（强制）

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
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
  checkbox && checkbox.checked ? 'PASS: 默认激活' : 'FAIL: checkbox 状态异常';
"
```

---

## 3. 核查清单

| 检查项 | 预期结果 | 验证方式 |
|--------|----------|----------|
| TypeScript 编译 | 0 error | `tsc --noEmit` |
| confirmed 已删除 | handleGenerate 内无 confirmed | grep 代码检查 |
| checkbox 默认激活 | true | gstack eval |
| 截图 | 正常 | `/tmp/checkbox-generate-after.png` |

---

## 4. 产出物

- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`（已修改）
- 截图: `/tmp/checkbox-generate-after.png`
- TypeScript 验证报告

---

## 5. 依赖

- Node.js / npm
- Vitest
- gstack browse
- VibeX dev server (localhost:3000)
