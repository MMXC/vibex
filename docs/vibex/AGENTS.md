# VibeX TabBar 无障碍化 — 开发约束

**项目**: vibex
**阶段**: development
**日期**: 2026-04-13

---

## 1. 变更范围

### ✅ 允许修改的文件

| 文件 | 改动范围 |
|------|----------|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 删除 isLocked/disabled/aria-disabled/phase guard |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | 移动端内联 TabBar 添加 prototype tab，与 desktop 保持一致 |
| `vibex-fronted/src/components/canvas/TreePanel.tsx` | 空状态文案替换（第157-159行区域） |
| `vibex-fronted/tests/unit/components/canvas/TabBar.unittest.tsx` | 新建单元测试 |
| `vibex-fronted/tests/e2e/tab-switching.spec.ts` | 新建 E2E 测试 |

### ❌ 禁止修改的文件

| 文件 | 禁止原因 |
|------|----------|
| `vibex-fronted/src/lib/canvas/stores/*.ts` | Zustand store 不需要改动 |
| `vibex-fronted/src/components/canvas/PhaseIndicator.tsx` | PhaseIndicator 职责不变，不改动 |
| `vibex-fronted/src/components/canvas/ContextTreePanel.tsx` | 复用 TreePanel，空状态在 TreePanel 统一处理 |
| `vibex-fronted/src/components/canvas/FlowTreePanel.tsx` | 同上 |
| `vibex-fronted/src/components/canvas/ComponentTreePanel.tsx` | 同上 |

---

## 2. 代码规范

### 2.1 TabBar.tsx — 删除项清单

**以下代码必须删除（精确位置）**:

```typescript
// ❌ 删除：第37-42行区域
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;

// ❌ 删除：button 元素中的 disabled 属性
disabled={isLocked}

// ❌ 删除：button 元素中的 aria-disabled 属性
aria-disabled={isLocked}

// ❌ 删除：className 中的 isLocked 条件
${isLocked ? styles.tabLocked : ''}

// ❌ 删除：handleTabClick 中的 phase 守卫
const tabIdx = PHASE_ORDER.indexOf(tabId as Phase);
if (tabIdx > phaseIdx) {
  return;
}

// ❌ 删除：title 中的 isLocked 三元表达式
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}
```

**保留项（不要删除）**:

```typescript
// ✅ 保留：isActive 判断逻辑（phase === 'prototype' 分支）
const isActive =
  tab.id === 'prototype'
    ? phase === 'prototype'
    : activeTree === tab.id || (activeTree === null && tab.id === 'context');

// ✅ 保留：badge 渲染
if (tab.id !== 'prototype' && counts[tab.id as TreeType] > 0) {
  badge = <span className={styles.tabCount}>{counts[tab.id as TreeType]}</span>;
}

// ✅ 保留：role="tab" / role="tablist"
role="tab"
role="tablist"
aria-label="三树切换"

// ✅ 保留：onTabChange callback
onTabChange?.(tabId as TreeType);
```

**修改后的 button 结构**:

```typescript
<button
  key={tab.id}
  role="tab"
  aria-selected={isActive}
  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
  onClick={() => handleTabClick(tab.id)}
  title={`切换到 ${tab.label} 树`}
>
  <span className={styles.tabEmoji}>{tab.emoji}</span>
  <span className={styles.tabLabel}>{tab.label}</span>
  {badge}
</button>
```

### 2.2 TreePanel.tsx — 空状态文案规范

**文案必须精确匹配以下字符串**:

| 树类型 | 文案 | 对应 tree 值 |
|--------|------|--------------|
| 上下文 | `请先在需求录入阶段输入需求` | `tree === 'context'` |
| 流程 | `请先确认上下文节点，流程将自动生成` | `tree === 'flow'` |
| 组件 | `请先完成流程树，组件将自动生成` | `tree === 'component'` |

**空状态组件结构不变**:
```typescript
{safeNodes.length === 0 && (
  <div className={styles.treePanelEmpty}>
    <span style={{ color: treeColor }}>{treeIcon}</span>
    <p>暂无节点</p>
    <p className={styles.treePanelEmptyHint}>
      {/* 仅修改此处文案 */}
    </p>
  </div>
)}
```

### 2.3 CanvasPage.tsx — 移动端 TabBar

**移动端内联 tab bar 必须包含 4 个 tab，与 desktop TabBar 的 TABS 数组一致**:

```typescript
{/* 必须包含：context / flow / component / prototype */}
{[
  { id: 'context', emoji: '◇', label: '上下文' },
  { id: 'flow', emoji: '→', label: '流程' },
  { id: 'component', emoji: '▣', label: '组件' },
  { id: 'prototype', emoji: '🚀', label: '原型' },
].map((t) => (
  <button
    key={t.id}
    role="tab"
    aria-selected={...}
    // ❌ 禁止添加 disabled 属性
    onClick={() => handleMobileTabClick(t.id)}
  >
    {`${t.emoji} ${t.label}`}
  </button>
))}
```

**禁止事项**:
- ❌ 禁止在移动端 tab button 上添加 `disabled` 属性
- ❌ 禁止在移动端 tab button 上添加 phase 检查
- ❌ 禁止移除 prototype tab

---

## 3. 安全红线

| 红线 | 描述 | 违规后果 |
|------|------|----------|
| **不要改动 PhaseIndicator** | PhaseIndicator 承担阶段告知职责，不允许删除或隐藏 | 破坏 UX 引导 |
| **不要改动 Zustand store** | 三树 store 的数据不因 TabBar 改动而变化 | 数据丢失风险 |
| **不要改动 PHASE_ORDER** | `['input', 'context', 'flow', 'component', 'prototype']` 常量不改动 | 影响 phase 顺序推进 |
| **不要改动 API 层** | TabBar 移除 disabled 是纯前端 UX 改动，不改变后端权限校验 | 安全风险 |
| **不要引入新依赖** | 禁止 `npm install` / `pnpm add` 任何新包 | 构建污染 |
| **不要删除 `role="tab"` / `aria-selected`** | 无障碍属性必须保留 | a11y 退化 |

---

## 4. Git 提交规范

### 4.1 提交信息格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 4.2 推荐 commit 结构

**Epic 1 完成后**:
```bash
git add src/components/canvas/TabBar.tsx src/components/canvas/CanvasPage.tsx
git commit -m "feat(canvas): remove disabled/lock logic from TabBar for a11y

- Remove isLocked, disabled, aria-disabled from TabBar button
- Remove phase guard from handleTabClick
- Add prototype tab to mobile inline TabBar (CanvasPage.tsx)
- Preserve isActive, badge, and ARIA role attributes

AC-1, AC-5, AC-6 satisfied
refs: vibex/tab-bar-unified"
```

**Epic 2 完成后**:
```bash
git add src/components/canvas/TreePanel.tsx
git commit -m "feat(canvas): add guidance text for empty tree panels

- context: '请先在需求录入阶段输入需求'
- flow: '请先确认上下文节点，流程将自动生成'
- component: '请先完成流程树，组件将自动生成'

AC-3 satisfied
refs: vibex/tab-bar-unified"
```

**Epic 3 完成后**:
```bash
git add tests/
git commit -m "test: add tab-switching.spec.ts covering AC-1~AC-8

- TabBar.unittest.tsx: unit tests for disabled removal
- tab-switching.spec.ts: Playwright E2E full coverage
refs: vibex/tab-bar-unified"
```

### 4.3 禁止行为

- ❌ 禁止 `git commit -m "fix"` / `"update"` / `"WIP"`
- ❌ 禁止在一个 commit 中混合 Epic 1 和 Epic 2 的改动
- ❌ 禁止 force push 到 main 分支

---

## 5. Code Review 清单

### 5.1 TabBar.tsx 审查要点

- [ ] `isLocked` 变量已完全删除（全局搜索 `isLocked` 无结果）
- [ ] `disabled={isLocked}` 已删除（搜索 `disabled=` 在 TabBar.tsx 内无结果）
- [ ] `aria-disabled` 已删除
- [ ] `handleTabClick` 中无 `if (tabIdx > phaseIdx)` 守卫
- [ ] `isActive` 判断逻辑未改动
- [ ] `role="tab"` 和 `aria-selected` 属性仍存在
- [ ] `title` 已简化为 `切换到 ${tab.label} 树`
- [ ] `className` 中无 `styles.tabLocked` 引用

### 5.2 CanvasPage.tsx 审查要点

- [ ] 移动端内联 TabBar 包含 4 个 tab
- [ ] 移动端 tab button 无 `disabled` 属性
- [ ] prototype tab 点击行为与 desktop TabBar 一致（`setPhase('prototype')` + `setActiveTree(null)`）

### 5.3 TreePanel.tsx 审查要点

- [ ] 三处空状态文案与 PRD 精确匹配
- [ ] `{safeNodes.length === 0 && ...}` 逻辑未改动
- [ ] `styles.treePanelEmpty` 样式未改动

### 5.4 测试审查要点

- [ ] `TabBar.unittest.tsx` 覆盖 AC-1, AC-6, AC-7
- [ ] `tab-switching.spec.ts` 覆盖 AC-1 ~ AC-8 全部 8 条
- [ ] 所有 `expect()` 断言有清晰的错误信息
- [ ] E2E 测试在 CI 环境可运行（无硬编码 localhost 之外的域名）

### 5.5 构建审查要点

- [ ] `pnpm build` 成功，无 TypeScript 错误
- [ ] `pnpm lint` 无警告
- [ ] `pnpm test:unit` 全部通过
- [ ] `pnpm test:e2e:ci` 全部通过

---

## 6. 依赖关系约束

```
TabBar.tsx (S1.1)
  ↓ 仅修改组件逻辑，不依赖新依赖

CanvasPage.tsx (S1.2)
  ↓ 依赖 TabBar.tsx 改动后验证行为一致

TreePanel.tsx (Epic 2)
  ↓ 独立改动，不依赖 Epic 1

Epic 3 测试
  ↓ 依赖 Epic 1 + Epic 2 完成后编写
```

**执行顺序**: S1.1 → S1.2 → Epic 2（三 Story 可并行）→ Epic 3
