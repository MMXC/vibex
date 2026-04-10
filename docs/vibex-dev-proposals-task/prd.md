# VibeX 技术债清理 — PRD

**项目**: vibex-dev-proposals-task
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-dev-proposals-task/prd.md`

---

## 1. 执行摘要

### 背景
VibeX 项目存在多项技术债，主要集中在三个方面：
1. **设计系统未完全落地**：Auth/Preview 页面大量内联样式，与 CLAUDE.md 规范冲突
2. **单文件过度膨胀**：renderer.ts（2175行）、CanvasPage.tsx（723行）维护困难
3. **架构边界不清**：双 Store 体系（根 stores + canvas/stores）职责混乱

这些技术债如果不清理，将持续拖慢后续迭代速度，增加 bug 引入风险。

### 目标
通过系统化技术债清理，实现：
- Auth/Preview 页面 100% CSS Module 化，无内联 style 属性
- renderer.ts 拆分为 ≤5 个可测试模块
- CanvasPage.tsx 缩减至 ≤150 行
- Store 分层规范文档化

### 成功指标
- `grep -rn "style={{" src/app/auth/` → 空
- `grep -rn "style={{" src/app/preview/` → 空
- renderer.ts 行数减少 ≥ 70%（拆分后）
- CanvasPage.tsx ≤ 150 行
- Store 架构文档存在且包含职责矩阵

---

## 2. Epic 拆分

### Epic 1: 设计系统统一（Auth）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | Auth 页面内联样式迁移至 CSS Module | 3-5 天 | - `grep -rn "style={{" src/app/auth/` 返回空<br>- `auth.module.css` 存在<br>- `expect(inlineStyleCount).toBe(0)` |
| **1.2** | Auth hover 修复 + 设计变量补充 | 1h | - 注册按钮 hover 有视觉反馈（背景色变化）<br>- `--color-primary-hover: #00e5e5` 已定义<br>- `expect(hasHoverEffect).toBe(true)` |

**Epic 1 总工时**: 3-5 天

---

### Epic 2: 设计系统统一（Preview）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | Preview 页面内联样式迁移 | 2-3 天 | - `grep -rn "style={{" src/app/preview/` 返回空<br>- `preview.module.css` 存在 |
| **2.2** | Preview 硬编码颜色清理 | 1 天 | - `grep "'#fff'\|'#94a3b8'" src/app/preview/` 返回空<br>- 所有颜色使用 CSS 变量<br>- `expect(hardcodedColorCount).toBe(0)` |

**Epic 2 总工时**: 3-4 天

---

### Epic 3: 渲染引擎重构

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **3.1** | renderer.ts 模块拆分 | 2 天 | - 拆分为 ≤5 个子模块：`types.ts`、`style-utils.ts`、`component-renderers.ts`、`theme-resolver.ts`、`main-renderer.ts`<br>- `expect(moduleCount).toBeLessThanOrEqual(5)`<br>- `expect(exists('renderer.ts')).toBe(true)`<br>- 每个模块有独立导出 |
| **3.2** | renderer 错误 fallback 使用 CSS 变量 | 1h | - 错误背景色使用 `var(--color-error-bg)`<br>- 错误文字使用 `var(--color-error)`<br>- `expect(hardcodedErrorColor).toBe(false)` |
| **3.3** | renderer Vitest 测试覆盖 | 1 天 | - 每个子模块有独立 `.test.ts` 文件<br>- 核心渲染路径测试覆盖<br>- `expect(testCoverage).toBeGreaterThanOrEqual(70)` |

**Epic 3 总工时**: 3 天

---

### Epic 4: Canvas 组件拆分

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **4.1** | CanvasPage.tsx 职责拆分 | 1-2 天 | - 提取 `CanvasLayout.tsx`（布局逻辑）<br>- 提取 `CanvasHeader.tsx`（工具栏）<br>- 提取 `CanvasPanels.tsx`（面板管理）<br>- CanvasPage.tsx ≤ 150 行<br>- `expect(lineCount('CanvasPage.tsx')).toBeLessThanOrEqual(150)`<br>- 每个子组件有独立 `.module.css` |

**Epic 4 总工时**: 1-2 天

---

### Epic 5: Store 体系规范化

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **5.1** | Store 分层文档 | 0.5 天 | - `docs/architecture/store-architecture.md` 存在<br>- 包含职责矩阵（哪些用根 stores，哪些用 canvas/stores）<br>- 包含边界规则 |
| **5.2** | 重复 Store 清理 | 1 天 | - `simplifiedFlowStore` 和 `flowStore` 合并或明确差异化<br>- `expect(duplicateStoreCount).toBe(0)` |
| **5.3** | crossStoreSync 测试 | 0.5 天 | - `crossStoreSync.test.ts` 存在<br>- 同步逻辑有单元测试 |

**Epic 5 总工时**: 2 天

---

### Epic 6: 文档与豁免治理

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **6.1** | Firebase 协作状态标注 | 1h | - README.md 中"多人协作"标注为"规划中"<br>- `expect(readmeCollabStatus).toContain('规划中')` |
| **6.2** | ESLint 豁免季度 review 机制 | 0.5 天 | - `ESLINT_EXEMPTIONS.md` 包含 quarterly review 机制说明<br>- exhaustive-deps 豁免数量 ≤ 2<br>- 新增豁免必须带 MEMO 注释 |

**Epic 6 总工时**: 1h

---

**总工时汇总**: (3-5天) + (3-4天) + 3天 + (1-2天) + 2天 + 1h = **12-18 天**

---

## 3. 验收标准

### Story 1.1 — Auth 内联样式迁移

```
expect(exec('grep -rn "style={{" vibex-fronted/src/app/auth/ --include="*.tsx"').exitCode).toBe(1)
expect(exists('vibex-fronted/src/app/auth/auth.module.css')).toBe(true)
expect(exec('grep "style={{" vibex-fronted/src/app/auth/page.tsx').exitCode).toBe(1)
```

### Story 2.1 — Preview 内联样式迁移

```
expect(exec('grep -rn "style={{" vibex-fronted/src/app/preview/ --include="*.tsx"').exitCode).toBe(1)
expect(exists('vibex-fronted/src/app/preview/preview.module.css')).toBe(true)
```

### Story 2.2 — Preview 硬编码颜色

```
expect(exec('grep -rn "\\'#fff\\'\\|\\'#94a3b8\\'" vibex-fronted/src/app/preview/').exitCode).toBe(1)
```

### Story 3.1 — renderer.ts 拆分

```
expect(exists('vibex-fronted/src/lib/prototypes/renderer/types.ts')).toBe(true)
expect(exists('vibex-fronted/src/lib/prototypes/renderer/style-utils.ts')).toBe(true)
expect(exists('vibex-fronted/src/lib/prototypes/renderer/component-renderers.ts')).toBe(true)
expect(exists('vibex-fronted/src/lib/prototypes/renderer/theme-resolver.ts')).toBe(true)
expect(exists('vibex-fronted/src/lib/prototypes/renderer/main-renderer.ts')).toBe(true)
expect(lineCount('vibex-fronted/src/lib/prototypes/renderer.ts')).toBeLessThan(600)
```

### Story 4.1 — CanvasPage 拆分

```
expect(exists('vibex-fronted/src/components/canvas/CanvasLayout.tsx')).toBe(true)
expect(exists('vibex-fronted/src/components/canvas/CanvasHeader.tsx')).toBe(true)
expect(exists('vibex-fronted/src/components/canvas/CanvasPanels.tsx')).toBe(true)
expect(lineCount('vibex-fronted/src/components/canvas/CanvasPage.tsx')).toBeLessThanOrEqual(150)
```

### Story 5.1 — Store 分层文档

```
expect(exists('vibex-fronted/docs/architecture/store-architecture.md')).toBe(true)
// 文档包含职责矩阵
expect(content).toContain('canvas/stores')
expect(content).toContain('stores')
expect(content).toContain('职责矩阵')
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `grep "style={{" src/app/auth/` 返回空
- [ ] Auth 页面视觉与 Dashboard 一致
- [ ] hover 效果正常工作

Epic 2 完成条件：
- [ ] `grep "style={{" src/app/preview/` 返回空
- [ ] 无硬编码颜色残留
- [ ] 主题切换时 Preview 正常响应

Epic 3 完成条件：
- [ ] renderer.ts 拆分后渲染功能正常（E2E 测试通过）
- [ ] 每个子模块 Vitest 测试通过
- [ ] 原型预览页面加载正常

Epic 4 完成条件：
- [ ] CanvasPage.tsx ≤ 150 行
- [ ] 三列布局、工具栏、面板功能正常
- [ ] 无新功能直接加到 CanvasPage.tsx

Epic 5 完成条件：
- [ ] Store 架构文档完整
- [ ] 重复 Store 已清理
- [ ] crossStoreSync 有测试覆盖

Epic 6 完成条件：
- [ ] README.md 状态已更新
- [ ] ESLint 豁免机制文档化

项目整体 DoD：
- [ ] P0 问题全部解决（Auth/Preview 内联样式）
- [ ] P1 问题 100% 完成（renderer 拆分 + Store 文档）
- [ ] `pnpm build` + `pnpm test` 均通过
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Auth 内联迁移 | ~15个内联style→CSS Module | `grep "style={{" src/app/auth/` → 空 | ✅ /auth |
| F1.2 | Auth hover修复 | CSS变量fallback修复+--color-primary-hover | hover有反馈 | ✅ /auth |
| F2.1 | Preview内联迁移 | ~362处内联style→CSS Module | `grep "style={{" src/app/preview/` → 空 | ✅ /preview |
| F2.2 | Preview颜色清理 | 硬编码颜色→CSS变量 | 无'#fff'/'#94a3b8' | ✅ /preview |
| F3.1 | renderer拆分 | 2175行→5个子模块 | ≤5模块，行数减少70% | 无 |
| F3.2 | renderer错误修复 | 硬编码错误颜色→CSS变量 | 无硬编码颜色 | 无 |
| F3.3 | renderer测试 | 每个子模块Vitest测试 | 覆盖率≥70% | 无 |
| F4.1 | CanvasPage拆分 | 提取Layout/Header/Panels | ≤150行 | ✅ /canvas |
| F5.1 | Store文档 | store-architecture.md | 文档存在+职责矩阵 | 无 |
| F5.2 | 重复Store清理 | simplifiedFlowStore vs flowStore | 无重复功能 | 无 |
| F5.3 | crossStoreSync测试 | 同步逻辑Vitest测试 | 测试存在且通过 | 无 |
| F6.1 | Firebase状态标注 | README.md协作状态更新 | 标注"规划中" | 无 |
| F7.1 | ESLint治理 | quarterly review机制 | 豁免≤2条+MEMO | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 内联样式迁移后视觉回归 | 中 | 中 | 每步完成后截图对比 |
| renderer 拆分引入运行时错误 | 中 | 高 | 保留原文件作为备份，逐步迁移 |
| Store 合并后状态丢失 | 低 | 高 | 先加新 store，验证后再删旧 |
| Epic 间并行导致冲突 | 低 | 中 | Epic 1/2/5/6 可并行，Epic 3/4 独立 |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确（ID/描述/验收标准/页面集成）
- [x] 已执行 Planning（Feature List 已产出）

---

*Planning 输出: `plan/feature-list.md`*  
*基于 Analyst 报告: `analysis.md`（8个问题，13个功能点，12-18天工时）*
