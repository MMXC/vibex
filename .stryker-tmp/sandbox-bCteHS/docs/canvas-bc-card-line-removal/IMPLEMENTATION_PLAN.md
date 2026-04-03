# Implementation Plan: canvas-bc-card-line-removal

**Agent**: architect
**Date**: 2026-04-02
**Project**: canvas-bc-card-line-removal
**Based on**: architecture.md

---

## 1. 概述

注释掉 `BoundedContextTree.tsx` 中的 `RelationshipConnector` 组件引用，移除上下文树卡片间的 SVG 连线。

**总工时**: 0.5h

---

## 2. 实施步骤

### Step 1: 静态代码修改

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

#### 2.1 注释 import（第 15 行）

**改前**:
```typescript
import { RelationshipConnector } from './edges/RelationshipConnector';
```

**改后**:
```typescript
// [E1] 注释 RelationshipConnector — 简化 UI，移除卡片间连线
// import { RelationshipConnector } from './edges/RelationshipConnector';
```

#### 2.2 注释 JSX 组件引用（约第 600 行）

**改前**:
```tsx
{/* E3-F13: SVG overlay for context relationships */}
<RelationshipConnector
  nodes={contextNodes}
  containerRef={containerRef as React.RefObject<HTMLElement | null>}
/>
```

**改后**:
```tsx
{/* [E1] RelationshipConnector 已注释 — 移除卡片间连线
{/* E3-F13: SVG overlay for context relationships 
<RelationshipConnector
  nodes={contextNodes}
  containerRef={containerRef as React.RefObject<HTMLElement | null>}
/>
*/}
```

> **注意**: JSX 注释语法使用 `{/* ... */}` 包裹整块 JSX

---

### Step 2: 类型检查

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit 2>&1 | grep -i "RelationshipConnector" || echo "✅ 无 RelationshipConnector 相关错误"
```

---

### Step 3: Vitest 静态检查

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run tests/canvas/bc-card-line-removal.spec.ts
```

预期: 2/2 通过

---

### Step 4: gstack UI 验证（强制）

**前置**: 启动 dev server `cd /root/.openclaw/vibex/vibex-fronted && npm run dev`

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

$B goto http://localhost:3000/canvas
$B wait 2000
$B screenshot /tmp/bc-before.png
$B click "[aria-label='展开上下文树']"
$B wait 1500
$B screenshot /tmp/bc-after-no-lines.png
# 验证: 截图应无 SVG 贝塞尔曲线
$B eval "
  const paths = document.querySelectorAll('svg path[d]');
  paths.length === 0 ? 'PASS: 无连线' : 'FAIL: 发现 ' + paths.length + ' 条线';
"
```

---

### Step 5: gstack 回归测试（卡片拖拽）

```bash
$B click "[role='list'] [role='listitem']:first-child"
$B wait 500
$B screenshot /tmp/bc-drag-select.png
# 验证卡片选中高亮
$B eval "
  const selected = document.querySelector('[class*=\"selected\"]');
  selected ? 'PASS: 卡片选中正常' : 'FAIL: 卡片未选中';
"
```

---

## 3. 核查清单

| 检查项 | 预期结果 | 验证方式 |
|--------|----------|----------|
| TypeScript 编译 | 无错误 | `tsc --noEmit` |
| RelationshipConnector 未出现在有效 JSX | true | Vitest 静态检查 |
| contextNodes 状态仍存在 | true | Vitest 静态检查 |
| UI 无 SVG 连线 | true | gstack 截图 |
| 卡片拖拽正常 | true | gstack 回归测试 |
| 控制台无错误 | true | gstack eval |

---

## 4. 产出物

- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`（已修改）
- Vitest 测试文件: `vibex-fronted/tests/canvas/bc-card-line-removal.spec.ts`
- gstack 验证截图: `/tmp/bc-after-no-lines.png`
- 验收报告

---

## 5. 依赖

- Node.js / npm
- Vitest
- gstack browse
- VibeX dev server (localhost:3000)
