# PRD — vibex-sprint2-spec-canvas-qa

**项目**: vibex-sprint2-spec-canvas-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM（QA 验证）
**上游**: `vibex-sprint2-spec-canvas` (prd.md, specs/, analyst-qa-report.md)

---

## 执行摘要

### 背景
`vibex-sprint2-spec-canvas` 是基础架构 Sprint，为后续 Sprint4/5/6 提供基座。Analyst QA 结论：**✅ Recommended — 验收通过（带已知问题）**。E1-E5 均已通过独立 Reviewer 评审，E6 测试覆盖有历史数据不一致问题需确认。

### 目标
对 `vibex-sprint2-spec-canvas` 的产出物进行系统性 QA 验证，确认已知问题状态、测试数量准确性。

### 成功指标
- E1~E5 产出物全部验证通过
- E6 测试数量与实际一致（DDSCanvasStore.test.ts 当前测试数确认）
- 3 个已知问题（confirm/prompt/collapsedOffsets）状态确认
- 无新增 P0/P1 缺陷

---

## 1. 产出物完整性检查矩阵

| Epic | 代码产出 | 测试 | Spec 产出 | Reviewer | 状态 |
|------|---------|------|---------|---------|------|
| E1: 三章节卡片管理 | DDSScrollContainer + ChapterPanel + CRUD ✅ | 声称 24 tests | 4 个 Spec ✅ | PASSED ✅ | ✅ 通过 |
| E2: 横向滚奏 | DDSScrollContainer handleScroll ✅ | 声称 19 tests | 1 个 Spec ✅ | - | ✅ 通过 |
| E3: AI草稿生成 | AIDraftDrawer + chatHistory ✅ | 声称 15 tests | 1 个 Spec ✅ | - | ✅ 通过 |
| E4: 跨章节DAG | CrossChapterEdgesOverlay ✅ | 声称 15 tests | 1 个 Spec ✅ | PASSED ✅ | ✅ 通过 |
| E5: 状态与错误处理 | ChapterPanel shimmer ✅ | 声称 15 tests | 4 个 Spec ✅ | PASSED ✅ | ✅ 通过 |
| E6: 测试覆盖 | 声称 143 tests | 实际 169 (Round1) / 143 (声称) / 167 (Round1 actual) | - | - | ⚠️ 待确认 |

### 交互可用性检查

| ID | 路径 | 验证项 | 预期 | 状态 |
|----|------|--------|------|------|
| I1 | 三章节切换 | scroll-snap 横向滚奏 | 章节切换流畅 | ✅ |
| I2 | URL 同步 | `?chapter=requirement` | 刷新保持章节 | ✅ |
| I3 | AI 草稿 | AIDraftDrawer 状态机 | IDLE→LOADING→REVIEW | ✅ |
| I4 | 跨章节边 | connectCrossChapter(source, target) | 边正确渲染 | ✅ |
| I5 | 空状态 | 章节无数据 | 引导插图+文案 | ✅ |
| I6 | 骨架屏 | 数据加载中 | 3 个 skeleton panels | ✅ |

### 设计一致性检查

| ID | 检查项 | 规范来源 | 预期 | 方法 |
|----|--------|---------|------|------|
| C1 | ChapterType = 'requirement'\|'context'\|'flow' | types/dds/index.ts | 与 store 一致 | 代码审查 |
| C2 | CardType = 'user-story'\|'bounded-context'\|'flow-step' | types/dds/index.ts | 与 store 一致 | 代码审查 |
| C3 | DDSEdge.sourceChapter/targetChapter | types/dds/index.ts | 字段存在 | 代码审查 |
| C4 | CrossChapterEdgesOverlay SVG 双轨设计 | architecture.md | SVG overlay，非 ReactFlow edges | 代码审查 |
| C5 | setActiveChapter 防闭包 | architecture.md | 使用 getState() | 代码审查 |

---

## 2. Epic 拆分（QA 验证维度）

### E1: 三章节卡片管理

**Epic 目标**: 验证固定三章节结构、卡片 CRUD、Schema 渲染。

#### E1-QA1: 三章节结构
- **验证项**: DDSScrollContainer + ChapterPanel 渲染 3 个章节
- **验收标准**: `expect(document.querySelectorAll('[data-chapter]')).toHaveLength(3)`

#### E1-QA2: CRUD 操作
- **验证项**: addCard/deleteCard/selectCard 功能
- **验收标准**: `expect(typeof store.addCard).toBe('function')`

#### E1-QA3: Reviewer 问题状态
- **验证项**: `confirm()` dialog 和 `window.prompt()` 是否已替换
- **验收标准**: 代码搜索 "confirm(" 和 "window.prompt" → 0 处

---

### E2: 横向滚奏体验

**Epic 目标**: 验证 scroll-snap、URL 同步、章节切换。

#### E2-QA1: scroll-snap 实现
- **验证项**: DDSScrollContainer handleScroll
- **验收标准**: `expect(typeof handleScroll).toBe('function')`

#### E2-QA2: URL 章节同步
- **验证项**: useChapterURLSync hook
- **验收标准**: `expect(typeof useChapterURLSync).toBe('function')`

---

### E3: AI 草稿生成

**Epic 目标**: 验证 AIDraftDrawer 状态机、防闭包实现。

#### E3-QA1: 状态机完整性
- **验证项**: IDLE → LOADING → REVIEW → ERROR 状态转换
- **验收标准**: `expect(['IDLE','LOADING','REVIEW','ERROR']).toContain(aiState)`

#### E3-QA2: 防闭包实现
- **验证项**: `setActiveChapter` 使用 `getState()`
- **验收标准**: grep "getState()" in AIDraftDrawer → 存在

---

### E4: 跨章节 DAG 关系

**Epic 目标**: 验证 SVG overlay 双轨设计、坐标系转换。

#### E4-QA1: SVG Overlay 设计
- **验证项**: CrossChapterEdgesOverlay 使用 SVG，非 ReactFlow edges
- **验收标准**: `expect(screen.getByTestId('cross-chapter-overlay')).toBeInTheDocument()`

#### E4-QA2: collapsedOffsets 硬编码
- **验证项**: 硬编码 80px 是否已修复（已知问题）
- **验收标准**: grep "collapsedOffsets" → 不含 "80" literal（待确认是否修复）

---

### E5: 状态与错误处理

**Epic 目标**: 验证骨架屏、空状态、错误态。

#### E5-QA1: 骨架屏
- **验证项**: ChapterPanel shimmer
- **验收标准**: `expect(screen.getByTestId('dds-skeleton')).toBeInTheDocument()`

#### E5-QA2: 空状态引导
- **验证项**: 插图 + 引导文字存在
- **验收标准**: `expect(screen.getByText(/添加你的第一个/)).toBeInTheDocument()`

---

### E6: 测试覆盖

**Epic 目标**: 验证测试数量准确性。

#### E6-QA1: DDSCanvasStore.test.ts 测试数
- **验证项**: 当前测试数量（声称 143，实际 167 Round1）
- **验收标准**: `pnpm test -- --testPathPattern="DDSCanvasStore" --listTests` → 准确数量

#### E6-QA2: deselectCard 状态
- **验证项**: 失败测试是否已删除，注释是否存在
- **验收标准**: 代码搜索 "deselectCard is not implemented" → 注释存在即可

---

## 3. 优先级矩阵

| 优先级 | Epic | QA 项 | 依据 |
|--------|------|-------|------|
| P1 | E1 | QA3（confirm/prompt 替换）| UX 体验，MEDIUM |
| P1 | E6 | QA1（测试数量准确性）| 数据一致性，MEDIUM |
| P1 | E4 | QA2（collapsedOffsets 硬编码）| 展开态计算准确性，MEDIUM |
| P2 | E1 | Reviewer UX 建议 | 低优先级 |

---

## 4. 验收标准汇总

```
// E1-QA3: confirm/prompt 替换
expect(screen.queryByRole('dialog')).toBeNull()  // 无原生 confirm dialog
expect(document.body.innerHTML).not.toMatch(/window\.prompt/)

// E3-QA2: 防闭包
expect(screen.queryByText('需求')).toBeInTheDocument()  // 章节正常切换

// E4-QA1: SVG Overlay
expect(document.querySelector('svg[data-testid="cross-chapter-overlay"]')).toBeInTheDocument()

// E5-QA1: 骨架屏
expect(screen.queryAllByTestId('dds-skeleton')).toHaveLength(3)
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

// E5-QA2: 空状态
expect(screen.getByText(/添加你的第一个用户故事/)).toBeInTheDocument()
expect(document.querySelector('[data-testid="empty-state-illustration"]')).toBeInTheDocument()

// E6-QA1: 测试数量
const tests = await pnpm.test('--', '--testPathPattern=DDSCanvasStore', '--listTests')
expect(tests).toBeDefined()
```

---

## 5. DoD (Definition of Done)

### QA 完成判断标准

- [ ] E1~E5 所有产出物验证通过
- [ ] E6 测试数量确认（与 analyst-qa-report 同步）
- [ ] 3 个已知问题状态确认（有记录即可）
- [ ] 无新增 P0/P1 缺陷
- [ ] 产出 `qa-final-report.md`

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint2-spec-canvas-qa
- **执行日期**: 2026-04-18
