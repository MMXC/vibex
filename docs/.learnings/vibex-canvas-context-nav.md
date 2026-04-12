# 项目经验沉淀：vibex-canvas-context-nav

> 项目完成时间：2026-04-13
> 项目目标：修复 TabBar 无 prototype tab、PhaseIndicator 在 prototype phase 隐藏，导致无法从 prototype phase 切回的问题
> 核心教训：组件间的联动修改（多文件修改同一行为）容易被静默遗漏，必须在设计阶段明确标注

---

## 1. 核心根因

**问题链路**：
```
TabBar: 只有 context/flow/component 三 Tab，无 prototype Tab
PhaseIndicator: phase === 'prototype' 时 return null（不渲染）
用户：进入 prototype phase 后无法切回
```

**根因分类**：UI 状态暴露缺失（State Exposure Gap）—— `setPhase('prototype')` 已存在于 contextStore，但 TabBar 和 PhaseIndicator 都没有提供 UI 入口。

---

## 2. coord-decision 捕获的问题

### 4 个 Blocker 在设计审查中被发现

| 缺陷 | 发现视角 | 严重性 |
|------|---------|---------|
| PRD 用 `queuedPages`（不存在），实际是 `prototypeQueue` | CEO + 工程审查 | 🔴 编译通过但运行时 undefined |
| PhaseIndicator `getCurrentPhaseMeta` + `SWITCHABLE_PHASES` 均不含 prototype → 下拉永远无 prototype 选项，静默失败 | 设计审查 | 🔴 静默失败，编译通过但功能不 work |
| TabBar prototype phase 下 `isActive` 永远 false（`activeTree` 不随 phase 变）| 设计审查 | 🔴 逻辑错误 |
| 测试 mock 用 `id` 而非 `pageId`（TS 类型错误）| 工程 + 设计审查 | 🔴 编译失败 |

### 静默失败是最危险的缺陷类型

**PhaseIndicator 的问题是典型静默失败**：只改 `return null` 但不改 `SWITCHABLE_PHASES`，编译完全通过，代码看似正确，但下拉菜单永远不出现 prototype 选项。没有任何报错，dev 和 reviewer 都容易漏掉。

**下次如何避免**：
- DoD 检查清单必须包含"下拉菜单有 prototype 选项且 active 状态正确"的具体断言
- 组件联动修改必须在同一 Epic 中明确列出所有需要改动的文件

---

## 3. 架构设计经验

### 经验 1：Phase 作为 Phase，TreeType 作为 TreeType，职责必须清晰

`prototype` 是 Phase 不是 TreeType——这在类型层面是正确的，但实现中需要两处处理：
1. TabBar：`TABS` 类型 `{ id: TreeType | 'prototype' }`，`handleTabClick` 中对 `'prototype'` 特殊处理
2. PhaseIndicator：`SWITCHABLE_PHASES` 和 `getCurrentPhaseMeta` 都需要对 `'prototype'` 特殊处理

**下次如何避免**：当新增一个"既不是 A 也不是 B"的类型时，必须检查所有使用该类型的组件，为每处写明特殊处理。

### 经验 2：多文件联动修改的文档要求

这个项目的核心改动分布在 TabBar.tsx 和 PhaseIndicator.tsx，两个组件的修改相互独立但目标一致。Architecture 中必须明确：
1. 哪些文件需要改
2. 每处改动的验收断言是什么
3. 组件联动时，哪些改动是"缺一不可"的（静默失败的陷阱）

### 经验 3：状态字段名称必须在代码审查前验证

`queuedPages` vs `prototypeQueue` 的混淆是文档错误，在代码审查阶段没有被发现。字段名必须对照实际代码验证，不能只看文档。

---

## 4. 审查流程经验

### 三个视角互补

| 视角 | 关键发现 |
|------|---------|
| CEO | `queuedPages` 字段不存在（业务影响）|
| 设计 | PhaseIndicator 静默失败、`isActive` 逻辑错误 |
| 工程 | `pageId` vs `id` TS 错误、setPhase 导入缺失 |

### 静默失败的 DoD 检查清单模板

对每个有多个联动文件的 Epic，DoD 必须包含：

```
[ ] 文件 A 中 X 改动存在
[ ] 文件 B 中 Y 改动存在
[ ] 文件 B 的 Y 改动在文件 A 的 X 改动缺失时编译失败（验证依赖关系）
[ ] 功能测试：触发条件 → 预期行为，实际验证
```

---

## 5. 快速参考

### TabBar 增加新 Tab 检查清单

- [ ] `TABS` 数组增加 entry，类型包含新 id
- [ ] `handleTabClick` 处理新 id 的逻辑
- [ ] `isActive` 逻辑对新 id 的处理（是 `activeTree` 判断还是 `phase` 判断？）
- [ ] `isLocked` 对新 id 是否适用（prototype tab 无 phase guard）
- [ ] 计数徽章的来源（哪个 store 的哪个字段？）
- [ ] 新 id 对应的 CSS 样式是否存在

### PhaseIndicator 增加新 Phase 选项检查清单

- [ ] `SWITCHABLE_PHASES` 数组增加 entry
- [ ] `getCurrentPhaseMeta` 对新 phase 有 fallback 或直接支持
- [ ] `return null` 条件是否需要调整（`phase === 'prototype'` 不再 return null）
- [ ] 新 entry 的 CSS 颜色变量是否存在（`--tree-prototype-color` 等）
- [ ] 下拉菜单的 active check 正确显示
