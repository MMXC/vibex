# Epic1 E1 Onboarding + 需求模板库捆绑交付 — 验收报告

**Agent**: TESTER
**时间**: 2026-05-04 13:05 GMT+8
**Epic**: vibex-proposals-sprint25 / tester-epic1-onboarding-+-需求模板库捆绑交付（p001）
**Git Commit**: `ceb6cbf73` (feat(E1): Onboarding Step5 模板推荐 + 场景化过滤 + auto-fill)

---

## 1. Git 变更文件确认

```
docs/vibex-proposals-sprint25/E1-implementation.md        |  67 +++
vibex-fronted/src/components/dds/DDSCanvasPage.tsx         |  23 +++
vibex-fronted/src/components/dds/canvas/DDSScrollContainer.tsx |  5 +-
vibex-fronted/src/components/onboarding/steps/ClarifyStep.tsx  |  53 ++++----
vibex-fronted/src/components/onboarding/steps/PreviewStep.tsx   | 147 +++++++------
vibex-fronted/src/components/onboarding/steps/StepContent.module.css | 145 +++++++++++++++++++
vibex-fronted/src/stores/onboarding/onboardingStore.ts         |  44 ++++++
vibex-fronted/src/stores/onboarding/types.ts                   |  36 ++++-
```

**结论**: 8 个文件变更，包含 TypeScript 代码 + CSS，范围明确。

---

## 2. TypeScript 类型检查

```bash
cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit
```

**状态**: 通过（无 TypeScript 错误）

---

## 3. 代码层面功能验证

### 3.1 E1-S3 场景化推荐

| 检查项 | 文件 | 状态 | 备注 |
|--------|------|------|------|
| `ScenarioType` 类型定义 | `types.ts:22` | ✅ | 5 种场景类型 |
| `SCENARIO_OPTIONS` 配置 | `types.ts:106` | ✅ | 5 个场景选项 |
| `onboardingStore.scenario` 字段 | `onboardingStore.ts:38` | ✅ | persist 持久化 |
| `setScenario` action | `onboardingStore.ts:107` | ✅ | 正确实现 |
| ClarifyStep 场景选择 UI | `ClarifyStep.tsx:23` | ✅ | 读取 scenario，调用 setScenario |
| PreviewStep 场景过滤 | `PreviewStep.tsx:28` | ✅ | SCENARIO_TAGS + filterByScenario |

**问题发现**: ClarifyStep 中 `data-testid` 错误设置为 `onboarding-step-2`，应为 `onboarding-step-clarify` 或与实际步骤一致。

### 3.2 E1-S1 模板推荐

| 检查项 | 文件 | 状态 | 备注 |
|--------|------|------|------|
| `selectedTemplateId` 字段 | `onboardingStore.ts:40` | ✅ | 持久化 |
| `setSelectedTemplateId` action | `onboardingStore.ts:116` | ✅ | 正确实现 |
| 模板卡片 UI | `PreviewStep.tsx:110` | ✅ | `data-testid="onboarding-template-card"` 存在 |
| localStorage 存储 | `PreviewStep.tsx:23` | ✅ | `vibex:pending_template_req` key 正确 |
| storePendingTemplateRequirement | `PreviewStep.tsx:45` | ✅ | 调用 localStorage.setItem |

### 3.3 E1-S2 Auto-fill 链路

| 检查项 | 文件 | 状态 | 备注 |
|--------|------|------|------|
| DDSCanvasPage `templateRequirement` prop | `DDSCanvasPage.tsx:68` | ✅ | 接口定义正确 |
| DDSCanvasPage 读取 localStorage | `DDSCanvasPage.tsx:159` | ✅ | useState 初始化时读取 |
| DDSScrollContainer 透传 | `DDSScrollContainer.tsx:71` | ✅ | templateRequirement 传递 |
| ChapterPanel auto-fill | `ChapterPanel.tsx:383` | ✅ | parseRequirementContent 解析 |

**重要 Bug 发现**: DDSCanvasPage 的 auto-fill useEffect 只清理 localStorage（removeItem）但**不触发实际填充**：

```tsx
// DDSCanvasPage.tsx ~line 190
useEffect(() => {
  if (!templateRequirement) return;
  const stored = localStorage.getItem('vibex:pending_template_req');
  if (stored) {
    localStorage.removeItem('vibex:pending_template_req'); // ← 只删除了，没有填充到 store
  }
}, [templateRequirement]);
```

**期望行为**: 应该将 `templateRequirement` 内容填充到 requirement chapter 的卡片中。
**实际行为**: 仅删除了 localStorage，但未调用任何 store action 填充数据。

### 3.4 E1-S4 完成标记

| 检查项 | 文件 | 状态 | 备注 |
|--------|------|------|------|
| localStorage 写入 | `onboardingStore.ts:145` | ✅ | `onboarding_completed=true` + timestamp |
| 写入时机 | `onboardingStore.ts:143` | ✅ | `complete()` 中写入 |

---

## 4. 测试覆盖分析

| 测试文件 | E1 覆盖情况 |
|----------|------------|
| `tests/unit/authStore.test.ts` | ❌ 无关 |
| `tests/unit/canvasPreviewStore.test.ts` | ❌ 无关 |
| `tests/unit/design-catalog.test.ts` | ❌ 无关 |
| `tests/unit/middleware-auth.test.ts` | ❌ 无关 |
| `tests/unit/templateStats.test.ts` | ❌ 无关 |
| `tests/unit/unwrappers.test.ts` | ❌ 无关 |
| `tests/unit/requirementValidator.test.ts` | ❌ 无关 |
| `tests/e2e/onboarding.spec.ts` | ⚠️ 基础流程有，但**无 E1 新增功能测试** |
| `tests/e2e/template-selector.spec.ts` | ❌ 独立模板选择，非 onboarding |

### 测试覆盖率评估

- ❌ **无** `SCENARIO_OPTIONS` 场景选择的测试
- ❌ **无** `setScenario` action 的单元测试
- ❌ **无** `selectedTemplateId` 字段的测试
- ❌ **无** `vibex:pending_template_req` localStorage 读写测试
- ❌ **无** `onboarding_completed` localStorage 写入测试
- ❌ **无** auto-fill 链路完整测试
- ❌ **无** PreviewStep 模板过滤的测试

**测试缺口**: 新增的 5 种场景选择、模板过滤、auto-fill 完整链路均**零测试覆盖**。

---

## 5. 驳回原因

### 🔴 Bug: Auto-fill 链路断裂

DDSCanvasPage 中读取了 `templateRequirement`（从 prop 或 localStorage），但 useEffect **只删除了 localStorage，未填充数据到 chapter store**。

**实际代码**:
```tsx
useEffect(() => {
  if (!templateRequirement) return;
  const stored = localStorage.getItem('vibex:pending_template_req');
  if (stored) {
    localStorage.removeItem('vibex:pending_template_req'); // 只删除，没填充
  }
}, [templateRequirement]);
```

**期望**: 应调用 `loadChapter` 或 `ddsChapterActions.addCard` 填充数据到 requirement chapter。
**影响**: Onboarding 完成后，Canvas 的 requirement chapter 不会自动填充模板内容，auto-fill 功能名存实亡。

### 🔴 测试覆盖缺口（验收失败）

E1 新增的核心功能（场景选择、模板过滤、localStorage 持久化、auto-fill）全部**无针对性测试**。现有 E2E 只覆盖了旧版 onboarding 流程（welcome → input → ...），没有覆盖：
- ClarifyStep 场景选择
- PreviewStep 模板推荐 + 过滤
- 完整 auto-fill 链路

---

## 6. 总结

| 维度 | 状态 |
|------|------|
| TypeScript 类型检查 | ✅ 通过 |
| E1-S3 场景化推荐（代码层面） | ✅ 功能完整，零测试 |
| E1-S1 模板推荐（代码层面） | ✅ 功能完整，零测试 |
| E1-S2 Auto-fill 链路 | 🔴 **断裂：只删 localStorage，未填充数据** |
| E1-S4 完成标记 | ✅ 代码完整，零测试 |
| 测试覆盖率 | 🔴 新功能 0% 覆盖 |

---

**结论**: 🔴 **REJECTED** — auto-fill 链路断裂 + E1 新功能零测试覆盖，不符合 `测试100%通过; 覆盖所有功能点` 的约束。

**建议修复**:
1. 修复 DDSCanvasPage 的 useEffect，实现真正的 auto-fill（调用 `loadChapter` 或 `ddsChapterActions.addCard`）
2. 补充 E1 新功能的测试用例（scenario 选择、模板过滤、auto-fill 端到端）