# PRD: simplified-flow-test-fix

**项目**: simplified-flow-test-fix  
**PM**: pm agent  
**创建时间**: 2026-03-23  
**目标**: 修复 page.test.tsx 中由 simplified-flow 迁移造成的 4 个 E2E 测试问题，确保测试套件可维护性

---

## 1. 业务背景

`vibex-simplified-flow` 项目将流程从 5 步简化为 3 步。`page.test.tsx` 中的测试需要与当前流程同步，否则：
- 测试名与断言不符 → 误导维护者
- 测试覆盖不足 → 无法有效检测回归

**当前状态**: 4 个测试全部通过 ✅（2026-03-17 已修复 ToastProvider 问题）

---

## 2. 问题分类

### 已解决 ✅

| 问题 | 状态 | 说明 |
|------|------|------|
| page.test.tsx 测试失败 | ✅ 已修复 | 2026-03-17 c327a028 |
| ToastProvider wrapper | ✅ 已修复 | c322d2be |
| React Query migration | ✅ 已修复 | 74d7ab11 |

### 遗留项 🟡

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 测试名与断言不符 | 🟡 低 | `should have five process steps` 实际不验证步数 |
| 测试覆盖不足 | 🟡 低 | 仅检查"VibeX"文本，未验证布局/流程 |

---

## 3. 功能点

### F1: 测试命名修正

| 字段 | 内容 |
|------|------|
| 功能ID | F1.1 |
| 功能点 | 测试名与断言对齐 |
| 描述 | 将 `should have five process steps` 更名为 `should render home page basic structure`，使测试名准确反映断言内容 |
| 验收标准 | `expect(screen.getByText('VibeX')).toBeInTheDocument()` 与测试名 `should render home page basic structure` 匹配 |
| 页面集成 | ❌ |

### F2: 布局验证增强

| 字段 | 内容 |
|------|------|
| 功能ID | F2.1 |
| 功能点 | 三列布局验证 |
| 描述 | 增强 `should Render three-column layout` 测试，补充实际布局元素验证（如侧边栏、主内容区、底部面板的存在性检查） |
| 验收标准 | 测试覆盖三列布局中的关键元素，验证这些元素存在 |
| 页面集成 | ❌ |

### F3: 流程步数验证

| 字段 | 内容 |
|------|------|
| 功能ID | F3.1 |
| 功能点 | 流程步数验证（可选） |
| 描述 | 新增测试用例，验证当前 3 步流程的正确显示。如有 `data-testid` 标识步数元素，则验证步数数量 |
| 验收标准 | 新增测试能验证流程步数（如存在）或跳过（如无标识） |
| 页面集成 | ❌ |

---

## 4. Epic 拆分

### Epic 1: 测试命名与覆盖修正

- F1.1 测试名修正
- F2.1 布局验证增强
- F3.1 流程步数验证（可选）

**DoD**: 所有测试通过，测试名准确反映断言内容

### Epic 2: 全量回归验证

- 运行完整 `npm test` 确认无回归
- 确认 E2E 测试通过率 ≥ 99%

**DoD**: `npm test` 通过率 100%（或明确标注已知失败）

---

## 5. 优先级矩阵（MoSCoW）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| F1.1 测试名修正 | Should | 提高可维护性 |
| F2.1 布局验证 | Should | 提高测试有效性 |
| F3.1 流程步数验证 | Could | 可选，增强覆盖 |

---

## 6. 验收标准汇总

| # | 标准 | 测试方法 |
|---|------|---------|
| V1 | `npx jest page.test.tsx` 全部通过 | `npm test -- page.test.tsx` |
| V2 | 测试名与断言一致，无误导性命名 | 代码审查 |
| V3 | 测试覆盖三列布局关键元素 | 代码审查 |
| V4 | npm test 全量通过率 ≥ 99% | `npm test` |

---

## 7. 工作量估算

| Epic | 估算 |
|------|------|
| Epic 1: 测试修正 | 1h |
| Epic 2: 回归验证 | 0.5h |
| **总计** | **1.5h** |

---

## 8. 依赖

- Jest
- React Testing Library
- 现有 `page.test.tsx` 路径: `src/app/page.test.tsx`

---

## 9. 驳回条件

- 修正后的测试导致原有通过的测试失败
- 测试覆盖率下降
- 新增断言引入 flaky 风险

---

## 10. 参考信息

### 当前测试文件位置
- 路径: `src/app/page.test.tsx`

### 当前测试用例
```
✓ should Render three-column layout
✓ should render navigation
✓ should have five process steps
✓ should Render with basic elements
```

### 历史修复记录
- 2026-03-17 c322d2be: ToastProvider wrapper 修复
- 2026-03-17 c327a028: page 测试修复
- 2026-03-18+: React Query migration 修复
