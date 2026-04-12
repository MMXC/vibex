# 架构审查报告 — vibex-css-architecture

**审查人**: Architect (Subagent)
**任务**: vibex-css-architecture/design-architecture
**审查时间**: 2026-04-12 02:02 (GMT+8)
**审查对象**: architecture.md / IMPLEMENTATION_PLAN.md / AGENTS.md

---

## 执行摘要

**结论：基本合格，有 3 项高优先级问题需在实施前修复，2 项中优先级改进建议。**

方案方向正确（类型安全体系 + 命名规范），但文档与实际代码存在路径不一致、部分验收标准定义模糊、CI 扫描方案未覆盖 BEM 动态变体等实际问题。

---

## 1. PRD 验收标准覆盖审查

### E1-S1 — ✅ 已覆盖

| 验收标准 | 状态 | 说明 |
|---------|------|------|
| `queueItemQueued` 类名非 undefined | ✅ | architecture.md §3.3 定义了修复后应使用 `queueItem${capitalize(statusVariant)}` |
| 4 个状态变体正确渲染 | ✅ | IMPLEMENTATION_PLAN Unit 1 定义了 capitalize 函数修复 |

**验证**: 实际代码确认了 bug 存在（`styles[\`queueItem_${statusVariant}\`]`）与 CSS 定义（`.queueItemQueued`）不匹配。

### E2-S1 — ✅ 已覆盖

全局 `*.module.css` 类型声明方案明确，DoD 定义清晰。

### E2-S2 — ⚠️ 部分覆盖，有风险

| 验收标准 | 状态 | 说明 |
|---------|------|------|
| 枚举全部 10 个子模块类名 | ⚠️ | 文档描述了策略，但未枚举；canvas.export CSS 有 BEM 类名（`.statusIconQueued`等），文档未提及枚举 |
| `nodeTypeMarker--start` 含特殊字符类名 | ⚠️ | architecture.md 提到但未验证 canvas.flow.module.css 是否实际包含此定义 |

### E2-S3 — ⚠️ 验收标准定义不清晰

PRD 定义：
> "scan-css-conflicts.ts runs against all .tsx files... exits with code 1"

**问题**：
1. 现有 `scan-css-conflicts.ts` **只检测同名冲突**，完全不检测 `styles[...]` 引用是否在 CSS 中存在
2. E2-S3 要求的"styles[...] 动态访问验证"是**新功能**，不是扩展现有脚本
3. 脚本路径在文档中写作 `scripts/scan-css-conflicts.ts`，但实际是 `vibex-fronted/scripts/scan-css-conflicts.ts`

**风险**：E2-S3 的 spec 是"扩展 CI 扫描脚本"，但新功能逻辑完全未实现，容易让实施者误以为只是改几行代码。

### E3-S1 — ✅ 已覆盖

命名规范文档策略明确。

### E4-S1 — ✅ 已覆盖

Vitest 断言标准具体（`toHaveProperty` + `toBeTruthy`）。

### E4-S2 — ✅ 已覆盖

Playwright E2E 断言标准具体（DOM 无 undefined + console 零警告）。

---

## 2. 实施计划可执行性审查

### 问题 2.1：路径不一致（高）

文档写作 `vibex-fronted/src/...`，但 `vibex-fronted` 目录本身就是项目根，路径应为：
- ❌ `vibex-fronted/src/components/canvas/...`
- ✅ `./src/components/canvas/...`（相对于 `vibex-fronted/`）

AGENTS.md 写的是 `vibex-fronted/src/...` 但 IMPL_PLAN 写的是 `vibex-fronted/src/...`，两者一致但**都多了一层 vibex-fronted 前缀**。实际文件位置确认：
- `/root/.openclaw/vibex/vibex-fronted/src/components/canvas/PrototypeQueuePanel.tsx` ✅
- `/root/.openclaw/vibex/vibex-fronted/src/components/canvas/canvas.export.module.css` ✅
- `/root/.openclaw/vibex/scripts/scan-css-conflicts.ts` ✅（在 vibex/ 下，不在 vibex-fronted/ 下）

**需要修复**：AGENTS.md 中 `scripts/scan-css-conflicts.ts` 引用路径需对齐。`vibex-fronted/` 在路径中是合理的（项目结构如此），但需明确是否从 repo 根还是从工作目录引用。

### 问题 2.2：E2-S2 类型枚举覆盖不完整（高）

`canvas.export.module.css` 实际 CSS 定义包含以下**未在架构文档中枚举**的类名：

```
.statusIconQueued, .statusIconGenerating, .statusIconDone, .statusIconError
.progressBarWrapper, .progressBarFill
.queueActionButton, .queueActionDelete
.queueEmpty, .queueExportSection, .queueExportHint
.exportButton, .queueErrorSummary, .clearQueueButton
.prototypeQueuePanel, .pollingIndicator, .queuePanelHeader, .queuePanelTitle
.queuePanelHeaderLeft, .queuePanelBadge, .queuePanelProgress
.queuePanelContent, .queuePanelContentExpanded, .queuePanelHint
.queueStatsRow, .statBadge, .statBadgeInfo, .statBadgeSuccess, .statBadgeError
.queueExportArea, .queueExportMsg, .exportBtn, .queueErrorNotice
.queueUnlockSection, .queueUnlockHint, .createProjectButton
```

此外还有：
- `.queueItemBody`, `.queueItemNameRow`, `.queueItemStatus`, `.queueItemProgressBar`
- `.queueItemIcon` (已确认)

文档 `architecture.md §5.2` 的枚举示例包含 `prototypeQueuePanel`（CSS 大写 `.prototypeQueuePanel`），但实际 CSS 定义为小写 `.prototypeQueuePanel`，**camelCase 对 kebab-case 的映射需确认**。

**缓解**：类型声明方案是手动维护枚举，不是自动生成。建议实施时先跑一个脚本从 CSS 文件提取所有类名，再逐个声明。

### 问题 2.3：canvas.export CSS 中存在类名冲突风险（中）

CSS 文件本身存在同一类名的不同写法（如 `.queueItem` vs `.queueItemQueued` 有关联但独立），这本身不是问题。

**但**：canvas.export CSS 中使用了 `.prototypeQueuePanel`（大写 P）——这是 canvas 主模块的类名，**不应出现在 export 子模块中**。这是历史遗留问题，需确认是否属于 E1 范围还是超出范围。

### 问题 2.4：E2-S3 扫描脚本实现是白纸（高）

E2-S3 的验收标准是检测 `styles['xxx']` 中的 `xxx` 是否在 CSS 中定义。但：

1. **现有脚本逻辑**：检测**同名类名出现在多个不同子模块**（如 `nodeCard` 在 canvas.context 和 canvas.misc 中都有定义）
2. **E2-S3 需要的新逻辑**：
   - 解析所有 `.tsx` 文件中的 `styles['xxx']` / `styles[\`xxx\${y}\`]` 引用
   - 对每个引用的 `xxx`，检查其是否在对应 CSS 文件中有定义
   - 报告不匹配项

这是**全新的检测逻辑**，代码量不小。文档中描述的处理流程过于简化，实际实现需要处理：
- 模板字符串内的变量（`styles[\`iconBtn--\${variant}\`]`）
- BEM 变体（`styles['queueItem--left']`）
- 动态计算的 key（如 `styles[\`${module}--${element}\`]`）

**改进建议**：将 E2-S3 拆成两个子任务：
- E2-S3a: 静态字面量检测（`styles['queueItem_queued']`）
- E2-S3b: 模板变量检测（需要 taint analysis 或AST，不在本项目范围）

### 问题 2.5：capitalize 辅助函数位置未明确（中）

`capitalize` 函数在 AGENTS.md 中描述为"放在组件文件顶部或 utils 文件中"，但：
- `IMPLEMENTATION_PLAN.md` 在组件内内联
- 未定义 utils 文件路径
- 若多个组件都用到，需统一抽取

---

## 3. 动态类名处理方案审查

### ✅ 首字母大写方案正确

`capitalize('queued')` → `'Queued'` → `queueItemQueued` 与 CSS 定义完全匹配。

### ⚠️ BEM 变体检测策略不完整

AGENTS.md 描述：
> 过滤已知 BEM 变体模式（如 `iconBtn--*`）

但 `canvas.export.module.css` 中实际有：
- `.queueItemIcon`（无变体）
- `.statBadge`，`.statBadgeInfo`，`.statBadgeSuccess`，`.statBadgeError`（BEM modifier，但没有 `--` 前缀）
- `.queueActionButton`，`.queueActionDelete`（无 `--` 分隔的 modifier）

**问题**：扫描脚本的 BEM 白名单逻辑（`iconBtn--*`）与实际 CSS 中的 BEM 模式不完全一致。实际项目中 BEM 混用：
- 部分用 `--` 前缀（`.nodeTypeMarker--start`）
- 部分直接拼接（`.statBadgeInfo`）

建议统一白名单策略：**只过滤完全可枚举的固定变体集合**，不对未定义的 BEM 模式做启发式猜测。

---

## 4. canvas.module.css.d.ts 枚举策略审查

### ✅ 策略合理

手动枚举 + 按子模块拆分（每个子模块对应一个 .d.ts）是当前最优方案，因为：
- 自动化工具（typed-css-modules）在子模块 @forward 聚合场景下误报率高
- 手动枚举可精确控制，与 CSS 同步更新

### ⚠️ CSS 生成类名的哈希部分未考虑

CSS Modules 运行时生成 `queueItemQueued__[hash]` 形式的类名。`.d.ts` 中声明 `queueItemQueued: string` 是正确的（Vite CSS Modules 运行时哈希只影响 CSS 选择器，`import styles from` 得到的仍是原始类名字符串）。

但需确认：**canvas.variables.css 的 @import**（无命名导出）不影响 `.d.ts` 枚举——确认无误。

### ⚠️ canvas.export CSS 注释掉的部分也定义了类名

`canvas.export.module.css` 底部有大量注释掉的旧类名（`prototypeQueuePanel`、`pollingIndicator`、`queuePanelHeader` 等）。`.d.ts` 枚举**不应包含注释掉的类名**。枚举前需过滤注释。

---

## 5. 性能影响评估审查

| 方面 | 评估 | 准确性 |
|------|------|--------|
| 构建时间 | +0.5s（TypeScript 加载额外 .d.ts） | ✅ 合理 |
| 包体积 | 无变化 | ✅ 正确（类型声明仅编译时） |
| 运行时性能 | 无变化 | ✅ 正确 |
| CI 时间 | +3~5s | ⚠️ 低估——首次运行扫描所有 CSS 类名 + TSX 动态引用，预计 8~15s |

建议修正为 +10~15s，并在实施时实际测量。

---

## 6. 风险缓解充分性审查

| 风险 | 缓解 | 评估 |
|------|------|------|
| 动态类名验证误报 | 白名单过滤 BEM 变体 | ⚠️ 白名单策略不完整（见 §3） |
| .d.ts 与 CSS 不同步 | PR checklist 同步更新 | ✅ 合理 |
| CSS 命名规范无法强制执行 | CI + code review | ✅ 目前最优方案 |
| 其他组件也有 snake_case 问题 | analysis.md 已验证仅一处 | ⚠️ 建议补充实际扫描验证（用 grep） |

---

## 7. AGENTS.md 可执行性审查

### ✅ 禁止事项清晰

| 禁止项 | 可执行性 |
|--------|---------|
| 禁止 canvas 子模块动态访问使用 snake_case | ⚠️ 需 CI 扫描支持，AGENTS.md 只定义规则，无强制手段 |
| 禁止 @use 而非 @forward | ⚠️ 同样依赖 CI 检测 |

**问题**：AGENTS.md 定义了约束但**没有强制手段**（lint rule / CI check）。只有在 CI 扫描脚本实现后，这些约束才真正可执行。建议在 E2-S3 完成前，这些约束暂时标注为"软约束"。

### ⚠️ scan-css-conflicts.ts 路径问题

AGENTS.md §1.4：
> `scripts/scan-css-conflicts.ts` 在 `pre-submit-check.sh` 中调用

实际脚本位于 `/root/.openclaw/vibex/scripts/scan-css-conflicts.ts`，但 E2-S3 要求的是**新功能**（检测 styles[...] 不匹配），不是修改现有同名脚本。**两个脚本同名但功能不同**。这会导致实施者困惑。

建议：E2-S3 使用新文件名，如 `scan-tsx-css-refs.ts`，或明确在现有脚本中增加 `--check-refs` flag。

---

## 8. 遗漏的功能点与架构风险

### 8.1 遗漏：canvas.export CSS 中有被注释掉的旧类名

`canvas.export.module.css` 底部有大量注释掉的 `.prototypeQueuePanel` 等类名。枚举 .d.ts 时需排除这些，否则误导开发者。

### 8.2 遗漏：BEM 命名策略未统一

canvas.export CSS 中混用：
- `.statBadgeInfo`（直接拼接，无 `--`）
- 正常应该是 `.statBadge--info`

这与 architecture.md §3.2 确立的"BEM 使用 kebab-case"规范矛盾。但这是历史遗留，不在本任务范围。**建议在 NAMING_CONVENTION.md 中明确 BEM modifier 用 `--` 前缀**，防止未来继续混用。

### 8.3 遗漏：capitalize 函数的多语言边界情况

`capitalize` 函数：
```ts
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
```

**边界情况未处理**：
- 空字符串 `''` → 返回 `''`（无问题）
- `null`/`undefined` → 运行时 crash（需类型守卫）
- 非 ASCII 首字符（如中文、日文）→ 行为不确定

建议在 Vitest 测试中覆盖空字符串场景，并在 AGENTS.md 中明确 `statusVariant` 来自 `PrototypeStatus` 类型（枚举值），非空安全。

### 8.4 架构风险：scan-css-conflicts.ts 扫描所有 .tsx 文件无法精确匹配 CSS 模块

扫描逻辑设计为"扫描所有 .tsx 文件"，但一个 .tsx 可能同时导入多个 CSS 模块（canvas.module.css + 独立组件 CSS）。脚本需要**知道每个 styles 引用的 styles 对象对应哪个 CSS 模块**。

这是一个复杂的数据流问题：
```
styles['queueItem_queued']  // ← 来自 canvas.export.module.css
styles['exportStatus']       // ← 来自 ExportMenu.module.css
```

如果扫描脚本只是全局扫描所有 TSX 引用与所有 CSS 定义做比对，会产生大量误报（类名可能在多个 CSS 模块中存在）。

**建议**：实现上应基于 import 语句建立 styles → CSS 模块的映射表。

---

## 9. 改进建议优先级汇总

### P0 — 必须在实施前修复

1. **E2-S3 扫描逻辑白纸**：将 E2-S3 拆解为可执行的子任务，明确"静态字面量检测"的具体实现方案（import 映射表）
2. **脚本文件名歧义**：E2-S3 使用新文件名或 flag，避免与现有 `scan-css-conflicts.ts`（检测同名冲突）混淆
3. **路径标准化**：统一文档中的路径引用（`vibex-fronted/src/` vs `./src/`）

### P1 — 实施前应确认

4. **canvas.export CSS 枚举范围**：确认 .d.ts 枚举不包括注释掉的类名
5. **BEM 白名单策略**：基于实际 CSS 中的 BEM 模式（如 `.statBadgeInfo`）建立可枚举的固定变体集合
6. **CI 扫描性能修正**：实测扫描时间，更新 +3~5s 为 +10~15s

### P2 — 建议优化

7. **capitalize 边界情况测试**：补充空字符串、非 ASCII 输入的测试用例
8. **AGENTS.md 约束标注**：在 CI 扫描实现前，标注禁止事项为"软约束"
9. **NAMING_CONVENTION.md BEM modifier 格式**：明确用 `--` 前缀，统一 `.statBadge--info` 而非 `.statBadgeInfo`

---

## 10. 最终结论

| 维度 | 评分 | 说明 |
|------|------|------|
| PRD 覆盖度 | 7/7 ✅ | 所有验收标准已覆盖，E2-S3 定义需细化 |
| 技术方案合理性 | 高 | 手动枚举 + CI 扫描是当前最优方案 |
| 实施计划可执行性 | 中 | 3 项高优先级问题需先修复 |
| 风险缓解充分性 | 中 | CI 扫描实现方案需重新设计 |
| 文档一致性 | 低 | 路径不一致、脚本同名歧义需修复 |
| **总体** | **合格，有条件通过** | 修复 P0 问题后可以实施 |

**总体评价**：方案方向正确，实施者需关注 3 项高优先级问题。核心风险是 E2-S3 的扫描脚本实现比文档描述复杂得多，需要在实施阶段重新细化技术方案。

---

*审查完成于 2026-04-12 02:10 (GMT+8)*
*Architect Subagent — vibex-css-architecture-review*
