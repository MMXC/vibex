# Epic1 E1 Onboarding + 需求模板库捆绑交付 — 验收报告（第二轮）

**Agent**: TESTER
**时间**: 2026-05-04 13:22 GMT+8
**Epic**: vibex-proposals-sprint25 / tester-epic1-onboarding-+-需求模板库捆绑交付（p001）
**Git Commit**: `b360d8c9a` (fix(E1): 修复 auto-fill 链路断裂 + 新增单元测试覆盖)
**测试结果**: 40/41 passed (1 failed)

---

## 1. Git 变更确认

```
vibex-fronted/src/components/dds/DDSCanvasPage.tsx        |  22 +--
vibex-fronted/src/components/dds/canvas/ChapterPanel.tsx  |   3 +-
vibex-fronted/src/components/onboarding/steps/E1-steps.test.tsx  |  92 ++++++++++
vibex-fronted/src/stores/onboarding/E1-onboarding.test.ts  | 195 +++++++++++++++++++++
```

4 个文件变更，上一轮驳回问题已修复。

---

## 2. TypeScript 类型检查

```bash
pnpm exec tsc --noEmit
```
**结果**: ✅ 通过，0 errors

---

## 3. Bug 修复验证

### 3.1 Auto-fill 链路（上一轮核心问题）✅

**上轮问题**: DDSCanvasPage useEffect 只删 localStorage，未填充数据。

**本轮修复**: 使用 IIFE 从 prop 或 localStorage 读取 templateRequirement，通过 DDSScrollContainer → ChapterPanel 传递：
```tsx
// DDSCanvasPage.tsx ~188
const templateRequirement = (() => {
  if (templateReqProp) return templateReqProp;
  try {
    return localStorage.getItem('vibex:pending_template_req') ?? undefined;
  } catch {
    return undefined;
  }
})();
```

ChapterPanel 中触发 auto-fill：
```tsx
useEffect(() => {
  if (chapter !== 'requirement' || !templateRequirement?.trim()) return;
  if (cards.length > 0) return; // 已有内容不覆盖
  const sections = parseRequirementContent(templateRequirement);
  sections.forEach(({ role, action, benefit }) => {
    addCard(chapter, card);
  });
}, [chapter, templateRequirement]);
```

**结论**: ✅ 链路修复正确，templateRequirement 从 localStorage → DDSScrollContainer → ChapterPanel，ChapterPanel 调用 addCard 填充。

---

## 4. 测试结果

### 4.1 E1 新增测试

| 测试文件 | 结果 | 通过/总数 |
|----------|------|-----------|
| `E1-onboarding.test.ts` | ✅ | 20/20 |
| `E1-steps.test.tsx` | ⚠️ | 7/8 |

### 4.2 失败测试详情

**失败用例**: `E1-steps.test.tsx > should have template card data-testid`

```
TestingLibraryElementError: Found multiple elements by: [data-testid="onboarding-template-card"]
```

**原因**: PreviewStep 正确渲染了 3 个模板卡片（data-testid="onboarding-template-card"），测试使用 `findByTestId`（期望 1 个）而非 `findAllByTestId`（期望多个）。

**代码验证**: PreviewStep.tsx 第 111 行正确设置 `data-testid="onboarding-template-card"`，组件功能无 bug，**测试选择器写错了**。

**修复方案**: 将 `findByTestId('onboarding-template-card')` 改为 `findAllByTestId('onboarding-template-card')` 并调整断言。

---

## 5. 测试覆盖总结

| 功能 | 代码 | 测试 | 备注 |
|------|------|------|------|
| E1-S3 场景选择 (ClarifyStep) | ✅ | ✅ 5 测试 | SCENARIO_OPTIONS 渲染 + 交互 |
| E1-S3 场景过滤逻辑 | ✅ | ✅ 6 测试 | filterByScenario 纯函数 |
| E1-S1 模板选择 (PreviewStep) | ✅ | ✅ | 渲染 + data-testid |
| E1-S1 localStorage 存储 | ✅ | ✅ | vibex:pending_template_req |
| E1-S4 localStorage 完成标记 | ✅ | ✅ 5 测试 | onboarding_completed + timestamp |
| E1-S2 auto-fill 链路 | ✅ | ⚠️ 无端到端 | 代码链路正确，无 E2E 测试 |
| E1-S2 parseRequirementContent | ✅ 已 export | ❌ 无测试 | 纯函数无独立测试 |

---

## 6. 驳回原因

**🔴 1 个测试失败** — `should have template card data-testid` 使用了错误的选择器 API（`findByTestId` 查多个相同 data-testid），需改为 `findAllByTestId`。

约束要求 `测试100%通过`，当前 40/41 = 97.6%，未达标。

---

## 7. 建议修复

修改 `src/components/onboarding/steps/E1-steps.test.tsx` 第 83 行：
```tsx
// 错误（当前）
const card = await screen.findByTestId('onboarding-template-card');
expect(card).toBeInTheDocument();

// 正确（修复后）
const cards = await screen.findAllByTestId('onboarding-template-card');
expect(cards.length).toBeGreaterThan(0);
```

同时建议补充 `parseRequirementContent` 单元测试（纯函数，0 依赖）。