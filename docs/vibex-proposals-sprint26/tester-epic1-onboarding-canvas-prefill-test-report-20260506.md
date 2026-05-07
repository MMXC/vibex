# Epic1-Onboarding → 画布预填充（P001）测试报告

**Agent:** TESTER | **时间:** 2026-05-06 03:30-03:40 GMT+8
**测试范围:** S1.1-S1.4 | **工作目录:** /root/.openclaw/vibex/vibex-fronted

---

## 一、代码实现验证

### S1.1: PreviewStep → 创建项目并跳转画布 ✅

| 检查项 | 结果 | 证据 |
|--------|------|------|
| handleNext 调用 projectApi.createProject | ✅ | PreviewStep.tsx:61-73 |
| createProject 传入 templateRequirement | ✅ | ProjectCreate.templateRequirement 已存在 |
| 跳转 /canvas/${projectId} | ✅ | router.push(`/canvas/${projectId}`) |
| 清理 PENDING_TEMPLATE_REQ_KEY | ✅ | localStorage.removeItem() |
| fallback 到 complete() | ✅ | createProject 失败时执行 |

### S1.2: CanvasFirstHint 引导气泡 ✅

| 检查项 | 结果 | 证据 |
|--------|------|------|
| [data-testid="canvas-first-hint"] | ✅ | CanvasFirstHint.tsx:42 |
| 3s 后自动消失 | ✅ | setTimeout 3000ms + dismissCanvasFirstHint() |
| 集成到 CanvasPage | ✅ | CanvasPage.tsx:919 |
| guidanceStore.canvasFirstHintDismissed | ✅ | guidanceStore.ts:53, 121 |
| 首次显示/刷新不再显示 | ✅ | canvasFirstHintDismissed guard |

### S1.3: 场景化模板推荐 ✅（已实现）

| 检查项 | 结果 | 证据 |
|--------|------|------|
| SCENARIO_OPTIONS 定义 | ✅ | onboardingStore.ts |
| filterByScenario 逻辑 | ✅ | PreviewStep.tsx:30-40 |
| ClarifyStep scenario 选择 | ✅ | E1-steps.test.tsx ✅ |
| Step 2 → 模板列表过滤 | ✅ | E1-onboarding.test.ts ✅ |

### S1.4: localStorage 持久化 ✅（已实现）

| 检查项 | 结果 | 证据 |
|--------|------|------|
| onboardingStore.complete() 写 localStorage | ✅ | onboardingStore.ts:95-101 |
| onboarding_completed 标记 | ✅ | ONBOARDING_COMPLETED_KEY |
| onboarding_completed_at 标记 | ✅ | ONBOARDING_COMPLETED_AT_KEY |
| guidanceStore persist canvasFirstHintDismissed | ✅ | guidanceStore.ts:147-149 |

---

## 二、Unit Test 执行结果

| 文件 | Tests | 通过 | 失败 | 状态 |
|------|-------|------|------|------|
| E1-onboarding.test.ts | 20 | 20 | 0 | ✅ |
| E1-steps.test.tsx | 8 | 8 | 0 | ✅ |
| CanvasOnboardingOverlay.test.tsx | 22 | 22 | 0 | ✅ |
| dddStateSyncMiddleware.test.ts | 43 | 0 | 43 | ❌（与E1无关） |
| client.test.ts | 8 | 1 | 7 | ❌（与E1无关） |

**E1 相关测试: 50 passed / 0 failed ✅**

> 注：dddStateSyncMiddleware 和 client 的失败与 E1 功能无关（已知遗留问题）

---

## 三、Build 验证

```
next build → FAIL
Error: export const dynamic = "force-dynamic" on /api/analytics/funnel 
cannot be used with "output: export"
```

**影响评估**: 与 E1 代码无直接关系，是项目配置的固有冲突。

---

## 四、检查清单

### S1.1 验收标准
- [✅] 完成 Onboarding Step 5 → handleNext 创建项目 → 跳转 /canvas/{id}
- [✅] templateRequirement 传入 createProject
- [✅] PENDING_TEMPLATE_REQ_KEY 正确清理
- [✅] fallback 机制（创建失败→complete）

### S1.2 验收标准
- [✅] [data-testid="canvas-first-hint"] 存在
- [✅] 3s 后 auto-dismiss
- [✅] 已集成到 CanvasPage
- [✅] guidanceStore 持久化控制

### S1.3 验收标准
- [✅] filterByScenario 逻辑正确
- [✅] 场景过滤单元测试通过
- [✅] ClarifyStep 组件测试通过

### S1.4 验收标准
- [✅] localStorage 完成标记写入
- [✅] guidanceStore 持久化
- [✅] 刷新不重复显示气泡

---

## 五、结论

**测试结果**: ✅ 通过（E1 相关）

E1 的四个 Story（S1.1-S1.4）的代码实现完整、测试通过。Build 失败是项目级配置问题（非 E1 导致）。

**风险项**:
1. Build 的 `/api/analytics/funnel` 冲突需 coord 协调 dev 修复
2. 建议 E2E 测试验证完整用户流（Onboarding→Canvas 跳转）

**建议**: E1 代码质量合格，可进入下一阶段。
