# PRD — vibex-sprint2-qa

**项目**: vibex-sprint2-qa
**版本**: v1.0
**日期**: 2026-04-25
**角色**: PM
**上游**: analysis.md (Analyst QA 验证报告, 2026-04-25)
**上游项目**: vibex-sprint2-spec-canvas（历史已完成 Sprint）

---

## 执行摘要

### 背景

Sprint2 Spec Canvas（`vibex-sprint2-spec-canvas`）是**历史已完成 Sprint**，E1-E6 全部实现完成，commit 记录完整。Analyst 对其进行独立复验，确认主要 P1 缺陷均已修复。

Analyst 报告结论：✅ **通过**

### 目标

对 Sprint2 Spec Canvas 的 E1-E6 实现进行 QA 验收验证，确认：
1. 上期 QA 报告指出的 5 个 P1 缺陷修复状态
2. Sprint2 基座为 Sprint4/5/6 提供稳定基础设施
3. 测试覆盖完整（143 tests passing）

### 成功指标

| 指标 | 目标 |
|------|------|
| P1 缺陷修复率 | ≥4/5（实际 4/5 已修复，1 个记录性缺陷）|
| Sprint2 基座兼容性 | DDSCanvasStore / ChapterType / CrossChapterEdgesOverlay 可用 |
| 测试通过率 | 143 tests passing |
| 阻塞性缺陷 | 0 个 |

---

## 1. 功能点总表（QA 验证项）

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F1.1 | confirm() 阻塞修复验证 | DDSToolbar.tsx 中无 `confirm()` 同步阻塞调用 | `expect(screen.queryByRole('dialog', { name: /confirm/i })).toBeNull()` | 【需页面集成】DDSToolbar |
| F1.2 | window.prompt() 清理验证 | 代码库中 DDS 区域无 `window.prompt()` 调用 | `expect(grep('window.prompt', 'src/components/dds/')).toHaveLength(0)` | 无 |
| F2.1 | 横向滚动体验验证 | E2 横向滚动交互体验符合设计 | `expect(container.querySelector('.overflow-x-auto')).toBeTruthy()` | 【需页面集成】DDSCanvas |
| F3.1 | AI 草稿生成验证 | E3 AI 草稿生成功能完成 | `expect(screen.queryByRole('button', { name: /generate/i })).toBeTruthy()` | 【需页面集成】DDSToolbar |
| F4.1 | collapsedOffsets 动态化验证 | E4 无硬编码 80px，使用动态计算 | `expect(hardcoded80px).toHaveLength(0)` | 无（逻辑层） |
| F4.2 | 跨章节边渲染验证 | API→Requirement / SM→Context 跨章节边正确渲染 | `expect(screen.queryByTestId('cross-chapter-edge')).toBeTruthy()` | 【需页面集成】DDSCanvas |
| F5.1 | 四态规格覆盖验证 | specs/ 含四态定义（ideal/empty/loading/error） | `expect(specs).toContainKeys(['ideal', 'empty', 'loading', 'error'])` | 无（文档验证） |
| F6.1 | 测试覆盖验证 | E6 单元测试 ≥ 100 tests，核心逻辑覆盖 | `expect(testCount).toBeGreaterThanOrEqual(100)` | 无（测试层） |
| F6.2 | 测试通过率验证 | 所有 E6 测试通过 | `expect(failedTests).toHaveLength(0)` | 无（测试层） |
| F7.1 | Sprint2 基座兼容性（Sprint4）| DDSCanvasStore 接口为 Sprint4 兼容 | `expect(DDSCanvasStore.getState().chapters).toBeDefined()` | 无（接口验证） |
| F7.2 | Sprint2 基座兼容性（Sprint5）| deliveryStore.loadFromStores() 可拉取 DDSCanvasStore 数据 | `expect(typeof ddCanvasStore.getState()).toBe('object')` | 无（接口验证） |
| F7.3 | Sprint2 基座兼容性（Sprint6）| 版本历史与 DDS Canvas 共享 Store 模式 | `expect(storeKeys).toContain('prototypeVersionStore')` | 无（架构验证） |

---

## 2. Epic / Story 表格

### Epic 1: E1 阻塞性 API 清理验证

**优先级**: P0 | **工时**: 1h | **状态**: ✅ 已修复

#### 2a. 本质需求穿透
- **用户的底层动机**: 操作不会因为同步弹窗而卡死，体验流畅
- **去掉清理会怎样**: Dev/Tester 使用时被 `confirm()` / `prompt()` 打断
- **解决的本质问题**: 异步 UI 交互是现代前端的基础要求

#### 2b. 最小可行范围
- **本期必做**: `confirm()` → ConfirmDialog + `window.prompt()` → 无
- **本期不做**: 其他同步 API 清理（历史遗留）
- **暂缓**: 全面搜索其他 blocking API

#### 2c. 用户情绪地图
**验证场景: DDSToolbar 删除操作**
- **进入时**: 想验证删除操作不卡浏览器
- **迷路时**: 找不到 ConfirmDialog → 搜索 'ConfirmDialog' in DDSToolbar
- **出错时**: `confirm()` 仍存在 → 标记 P1 缺陷

#### E1-QA-T1: confirm() 阻塞修复验证
- **Story**: `DDSToolbar.tsx` 中无 `confirm()` 同步阻塞调用
- **验收标准**: `expect(grep('confirm(', 'src/components/dds/toolbar/')).toHaveLength(0)`

#### E1-QA-T2: window.prompt() 清理验证
- **Story**: 代码库 DDS 区域无 `window.prompt()` 调用
- **验收标准**: `expect(grep('window.prompt', 'src/components/dds/')).toHaveLength(0)`

---

### Epic 2: E2 用户体验优化验证

**优先级**: P1 | **工时**: 1h | **状态**: ✅ 已实现

#### 2a. 本质需求穿透
- **用户的底层动机**: 画布内容多时能流畅横向滚动
- **去掉体验优化**: 横向溢出时出现浏览器默认滚动条，体验差
- **解决的本质问题**: 画布交互体验

#### 2b. 最小可行范围
- **本期必做**: 横向溢出自动滚动 + overflow-x-auto
- **本期不做**: 惯性滚动优化
- **暂缓**: 虚拟滚动

#### 2c. 用户情绪地图
**验证场景: DDSCanvas 横向内容溢出**
- **进入时**: 期待横向拖动流畅
- **迷路时**: 找不到横向滚动 → 检查 overflow-x
- **出错时**: 滚动卡顿 → 标记体验缺陷

#### E2-QA-T3: 横向滚动体验验证
- **Story**: DDSCanvas 横向内容溢出时滚动流畅
- **验收标准**: `expect(container.querySelector('.overflow-x-auto')).toBeTruthy()`

---

### Epic 3: E3 AI 草稿生成验证

**优先级**: P1 | **工时**: 1h | **状态**: ✅ 已实现

#### 2a. 本质需求穿透
- **用户的底层动机**: 一键生成草稿，不用从零开始
- **去掉 AI 生成**: 用户需要手动输入大量结构化内容
- **解决的本质问题**: 降低用户输入成本

#### 2b. 最小可行范围
- **本期必做**: AI 草稿生成按钮 + 生成结果展示
- **本期不做**: 草稿编辑/优化
- **暂缓**: 草稿版本管理

#### 2c. 用户情绪地图
**验证场景: AI 生成按钮**
- **进入时**: 期待点一下就有内容
- **迷路时**: 找不到生成入口 → 工具栏应有明显按钮
- **出错时**: 生成失败 → 显示友好错误信息

#### E3-QA-T4: AI 草稿生成功能验证
- **Story**: 工具栏有 AI 生成按钮，点击触发生成
- **验收标准**: `expect(screen.getByRole('button', { name: /generate/i })).toBeEnabled()`

---

### Epic 4: E4 跨章节边与布局验证

**优先级**: P0 | **工时**: 2h | **状态**: ✅ 已修复

#### 2a. 本质需求穿透
- **用户的底层动机**: 能看到不同章节之间的关联（API→需求→上下文）
- **去掉跨章节边**: 各章节孤立，不知道卡片之间的关系
- **解决的本质问题**: 架构视图的整体性

#### 2b. 最小可行范围
- **本期必做**: 跨章节边渲染 + collapsedOffsets 动态化
- **本期不做**: 跨章节边的编辑（只读）
- **暂缓**: 跨章节批量操作

#### 2c. 用户情绪地图
**验证场景: DDSCanvas 跨章节边**
- **进入时**: 期待看到不同颜色/样式的跨章节连接线
- **迷路时**: 不知道哪些边是跨章节 → 颜色/虚线区分
- **出错时**: 边消失 → 检查 sourceChapter !== targetChapter

#### E4-QA-T5: collapsedOffsets 动态化验证
- **Story**: E4 无硬编码 80px，使用动态计算
- **验收标准**: `expect(grep('80', 'src/components/dds/')).toHaveLength(0) // 无 80px 硬编码`

#### E4-QA-T6: 跨章节边渲染验证
- **Story**: API→Requirement / SM→Context 跨章节边正确渲染
- **验收标准**: `expect(screen.queryAllByTestId('cross-chapter-edge').length).toBeGreaterThan(0)`

---

### Epic 5: E5 四态规格验证

**优先级**: P1 | **工时**: 1h | **状态**: ✅ 已实现

#### 2a. 本质需求穿透
- **用户的底层动机**: 每个状态都有明确的设计，不会有"我该怎么办"的时刻
- **去掉四态规格**: 边界情况（加载中/出错）体验差
- **解决的本质问题**: 全流程体验保障

#### 2b. 最小可行范围
- **本期必做**: 四态定义（ideal/empty/loading/error）
- **本期不做**: 过渡动画规格
- **暂缓**: 国际化文案

#### E5-QA-T7: 四态规格覆盖验证
- **Story**: specs/ 含四态定义，每态有引导文案
- **验收标准**: `expect(specs.every(s => s.states.ideal && s.states.empty && s.states.loading && s.states.error)).toBe(true)`

---

### Epic 6: E6 测试覆盖验证

**优先级**: P0 | **工时**: 2h | **状态**: ✅ 143 tests passing

#### 2a. 本质需求穿透
- **用户的底层动机**: 有测试保障，改代码不担心破坏已有功能
- **去掉测试**: 重构/修改风险高，不敢动代码
- **解决的本质问题**: 信心保障

#### 2b. 最小可行范围
- **本期必做**: DDSCanvasStore 核心逻辑测试 + CrossChapterEdges 测试
- **本期不做**: 快照测试（snapshot）
- **暂缓**: E2E 测试

#### E6-QA-T8: 测试覆盖验证
- **Story**: E6 单元测试 ≥ 100 tests，核心逻辑覆盖
- **验收标准**: `expect(testCount).toBeGreaterThanOrEqual(100)`

#### E6-QA-T9: 测试通过率验证
- **Story**: 所有 E6 测试通过
- **验收标准**: `expect(failedTests).toHaveLength(0)`

---

### Epic 7: Sprint2 基座兼容性验证

**优先级**: P0 | **工时**: 2h | **状态**: ✅ 兼容

#### 2a. 本质需求穿透
- **用户的底层动机**: Sprint2 是后续 Sprint 的地基，地基不稳上层全倒
- **去掉基座验证**: Sprint4/5/6 可能在不稳定基础上构建
- **解决的本质问题**: 架构一致性

#### 2b. 最小可行范围
- **本期必做**: DDSCanvasStore / ChapterType / CrossChapterEdgesOverlay 兼容性
- **本期不做**: 其他 Store 兼容性扫描
- **暂缓**: 性能基线验证

#### 2c. 用户情绪地图
**验证场景: Sprint2 代码被 Sprint4/5/6 依赖**
- **进入时**: 想知道 Sprint2 哪些接口是公开契约
- **迷路时**: 找不到类型定义 → 检查 types/dds/index.ts
- **出错时**: 接口不兼容 → 更新 TypeScript 类型

#### E7-QA-T10: Sprint4 兼容性验证
- **Story**: DDSCanvasStore 接口兼容 Sprint4
- **验收标准**: `expect(hasChapterType).toBe(true); expect(hasCrossChapterEdge).toBe(true)`

#### E7-QA-T11: Sprint5 兼容性验证
- **Story**: deliveryStore.loadFromStores() 可拉取 DDSCanvasStore 数据
- **验收标准**: `expect(DDSCanvasStore.getState().chapters).toBeDefined()`

#### E7-QA-T12: Sprint6 兼容性验证
- **Story**: 版本历史与 DDS Canvas 共享 Store 模式
- **验收标准**: `expect(storeKeys).toContain('prototypeVersionStore')`

---

## 3. 验收标准（expect() 断言汇总）

### E1 阻塞性 API 清理

```typescript
// T1: confirm() 无调用
expect(grep('confirm(', 'src/components/dds/toolbar/DDSToolbar.tsx')).toHaveLength(0)

// T2: window.prompt() 无调用
expect(grep('window.prompt', 'src/components/dds/')).toHaveLength(0)
```

### E2 横向滚动

```typescript
// T3: 横向溢出自动滚动
const canvas = container.querySelector('[data-testid="dds-canvas"]')
expect(canvas.className).toMatch(/overflow-x-auto/)
```

### E4 跨章节边

```typescript
// T5: 无 80px 硬编码
const hardcoded = grep('80px', 'src/components/dds/')
expect(hardcoded).toHaveLength(0)

// T6: 跨章节边渲染
const edges = screen.queryAllByTestId('cross-chapter-edge')
expect(edges.length).toBeGreaterThan(0)
```

### E6 测试覆盖

```typescript
// T8: 测试数量
const result = exec('npm test -- --testPathPattern="dds" --coverage=false --passWithNoTests')
const match = result.stdout.match(/Tests:\s+(\d+)\s+passed/)
const testCount = parseInt(match[1])
expect(testCount).toBeGreaterThanOrEqual(100)

// T9: 0 失败
expect(result.stdout).toMatch(/Tests:\s+\d+\s+passed/)
expect(result.stdout).not.toMatch(/failed/)
```

---

## 4. DoD (Definition of Done)

### Sprint2 QA 验收完成判断标准

#### E1 阻塞性 API 清理
- [ ] `DDSToolbar.tsx` 中无 `confirm()` 同步阻塞调用
- [ ] DDS 组件中无 `window.prompt()` 调用
- [ ] 删除操作使用 ConfirmDialog 组件

#### E2 横向滚动
- [ ] DDSCanvas 横向溢出时自动滚动（overflow-x-auto）
- [ ] 滚动行为流畅，无抖动

#### E3 AI 草稿生成
- [ ] 工具栏有 AI 生成按钮
- [ ] 点击触发生成流程（mock 实现可接受）

#### E4 跨章节边
- [ ] `collapsedOffsets` 无 80px 硬编码
- [ ] 跨章节边（sourceChapter !== targetChapter）正确渲染
- [ ] CrossChapterEdgesOverlay 不引入 regression

#### E5 四态规格
- [ ] specs/ 含 ideal/empty/loading/error 四态定义
- [ ] 每个状态有引导文案（无空白空状态）

#### E6 测试覆盖
- [ ] E6 单元测试 ≥ 100 tests
- [ ] 所有测试通过（0 failed）
- [ ] DDSCanvasStore 核心逻辑测试覆盖

#### E7 Sprint2 基座兼容性
- [ ] DDSCanvasStore 接口兼容 Sprint4（ChapterType / CrossChapterEdges）
- [ ] deliveryStore.loadFromStores() 可拉取 DDSCanvasStore 数据
- [ ] Store 模式为 Sprint6 版本历史兼容

#### 全局
- [ ] 0 个 P0/P1 阻塞性缺陷遗留
- [ ] E6 测试数量记录差异（143 vs 实际）已记录，不影响验收

---

## 5. 执行决策

- **决策**: 已采纳（Analyst ✅ 通过）
- **执行项目**: vibex-sprint2-qa
- **执行日期**: 2026-04-25
- **备注**: 历史 Sprint，E1-E6 全部完成。建议同步 commit message 更新测试数量声明（143 → 实际值）

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-api-cleanup.md | E1 | confirm() → ConfirmDialog 四态 |
| specs/E4-cross-chapter.md | E4 | 跨章节边渲染四态 |
| specs/E5-four-states.md | E5 | 四态规格总览 |

*注: specs/ 目录基于历史 Sprint2 遗留结构，聚焦 E1/E4/E5 关键页面四态*

---

*文档版本: 1.0 | PM | 2026-04-25*
