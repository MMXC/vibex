# Implementation Plan — vibex-sprint2-qa / design-architecture

**项目**: vibex-sprint2-qa
**角色**: Architect（实施计划）
**日期**: 2026-04-25
**上游**: architecture.md
**状态**: ✅ 设计完成

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 阻塞性 API 清理 | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |
| E2: 横向滚动体验 | E2-U1 | 0/1 | E2-U1 |
| E3: AI 草稿生成 | E3-U1 | 0/1 | E3-U1 |
| E4: 跨章节边与布局 | E4-U1 ~ E4-U2 | 0/2 | E4-U1 |
| E5: 四态规格 | E5-U1 | 0/1 | E5-U1 |
| E6: 测试覆盖 | E6-U1 | 0/1 | E6-U1 |

---

## E1: 阻塞性 API 清理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | confirm()/prompt() 源码 grep 验证 | ⬜ | — | grep 结果为空；DDSToolbar.tsx 无同步阻塞调用 |
| E1-U2 | ConfirmDialog 四态 Playwright 验证 | ⬜ | E1-U1 | 理想态/空状态/加载态/错误态各有 expect() 断言 |

### E1-U1 详细说明

**目标**: 验证 DDSToolbar 中无 `confirm()` 调用，无 `window.prompt()` 调用。

**测试文件**: `tests/unit/grep/e1-confirm-cleanup.test.ts`

**Test scenarios**:
- `grep -r "confirm(" src/components/dds/toolbar/` → 结果为空
- `grep -r "window.prompt" src/components/dds/` → 结果为空
- ConfirmDialog 组件名允许出现在 grep 结果中（不是调用）

**Verification**: `pnpm vitest run tests/unit/grep/e1-confirm-cleanup.test.ts` → 0 failures

---

### E1-U2 详细说明

**目标**: 验证 ConfirmDialog 组件四态。

**测试文件**: `tests/e2e/sprint2-qa/E1-confirm-dialog.spec.ts`

**Test scenarios**:
- Ideal state: 删除按钮可点击 → ConfirmDialog 打开 → 确认/取消按钮存在
- Empty state: 无选中节点时删除按钮 disabled 或隐藏
- Loading state: 确认后显示进度（如果异步）
- Error state: 确认失败显示错误信息

**Verification**: `pnpm playwright test tests/e2e/sprint2-qa/E1-confirm-dialog.spec.ts` → 0 failures

---

## E2: 横向滚动体验

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | DDSCanvas 横向溢出滚动验证 | ⬜ | — | `overflow-x: auto` 样式存在；内容溢出时可滚动 |

### E2-U1 详细说明

**目标**: 验证 DDSCanvas 横向内容溢出时滚动流畅。

**测试文件**: `tests/e2e/sprint2-qa/E2-horizontal-scroll.spec.ts`

**Test scenarios**:
- Ideal state: 容器有 `overflow-x: auto` 或 `overflow-x: scroll`
- Interaction: 添加大量章节后，水平滚动条出现
- 滚动条样式符合设计规范

**Verification**: `pnpm playwright test tests/e2e/sprint2-qa/E2-horizontal-scroll.spec.ts` → 0 failures

---

## E3: AI 草稿生成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | AI 草稿生成按钮 Playwright 验证 | ⬜ | — | 生成按钮存在且 enabled；点击后有反馈 |

### E3-U1 详细说明

**目标**: 验证 DDSToolbar 中 AI 草稿生成按钮存在且可交互。

**测试文件**: `tests/e2e/sprint2-qa/E3-ai-draft.spec.ts`

**Test scenarios**:
- Ideal state: 工具栏有「生成草稿」或类似按钮（name 含 generate/AI）
- Loading state: 点击后按钮变为 loading 状态
- Error state: 生成失败显示错误提示
- Success state: 生成结果出现在画布或面板中

**Verification**: `pnpm playwright test tests/e2e/sprint2-qa/E3-ai-draft.spec.ts` → 0 failures

---

## E4: 跨章节边与布局

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | 80px 硬编码源码 grep 验证 | ⬜ | — | collapsedOffsets 无 80px 硬编码 |
| E4-U2 | 跨章节边 Playwright 渲染验证 | ⬜ | E4-U1 | cross-chapter-edge 元素可见 |

### E4-U1 详细说明

**目标**: 验证 DDSCanvasStore 中无 `80px` 硬编码。

**测试文件**: `tests/unit/grep/e4-hardcode-cleanup.test.ts`

**Test scenarios**:
- `grep -rn "80" src/stores/dds/` → collapsedOffset 相关行数为 0

**Verification**: `pnpm vitest run tests/unit/grep/e4-hardcode-cleanup.test.ts` → 0 failures

---

### E4-U2 详细说明

**目标**: 验证跨章节边（sourceChapter !== targetChapter）正确渲染。

**测试文件**: `tests/e2e/sprint2-qa/E4-cross-chapter.spec.ts`

**Test scenarios**:
- Ideal state: 存在跨章节边时，SVG 渲染不同样式（颜色/虚线）区分
- Empty state: 无跨章节边时，显示正常（同章节边）
- 跨章节边 hover 时显示 source/target 标签

**Verification**: `pnpm playwright test tests/e2e/sprint2-qa/E4-cross-chapter.spec.ts` → 0 failures

---

## E5: 四态规格

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | 四态规格覆盖验证 | ⬜ | — | E1/E4/E5 specs 含四态定义；E2/E3/E6 标注缺失 |

### E5-U1 详细说明

**目标**: 验证 specs/ 目录中四态定义覆盖情况。

**测试文件**: `tests/unit/docs/coverage-map.test.ts`

**Test scenarios**:
- E1 coverage: specs/E1-api-cleanup.md 含四态定义 → E1-U1/U2 覆盖
- E4 coverage: specs/E4-cross-chapter.md 含四态定义 → E4-U1/U2 覆盖
- E5 coverage: specs/E5-four-states.md 定义四态原则 → 规格检查基准
- E2/E3/E6: 无对应 spec 文件 → 标注为缺失项（不阻断）

**Verification**: `pnpm vitest run tests/unit/docs/coverage-map.test.ts` → 0 failures

---

## E6: 测试覆盖

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E6-U1 | 现有 143 tests 执行验证 | ⬜ | — | `pnpm test -- --run` → 全部通过 |

### E6-U1 详细说明

**目标**: 验证 Sprint2 已有 143 tests 仍然全部通过。

**测试文件**: 复用现有测试文件（无需新建）

**Test scenarios**:
- `pnpm test -- --run` → 全部通过，0 failures
- 143 vs 167 差异标注为记录性缺陷，不阻断

**Verification**: `pnpm test -- --run` → ✅ all pass

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint2-qa
- **执行日期**: 2026-04-25
- **备注**: 历史 Sprint 复验，总工时约 7h。E1-U1/E4-U1 使用 grep 静态验证；E2/E3/E4-U2 使用 Playwright UI 验证；E6 直接复用现有测试。Unit 执行顺序：E1-U1 → E4-U1 → E6-U1（可并行），然后 E1-U2 → E2-U1 → E3-U1 → E4-U2 → E5-U1。

---

*计划时间: 2026-04-25 13:05 GMT+8*
