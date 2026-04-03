# PRD: 首页流程修复

**项目**: vibex-homepage-flow-fix
**产品经理**: PM Agent
**日期**: 2026-03-17
**版本**: 1.0
**状态**: Done (v2 - 补充完整验收标准)
**优先级**: P1

---

## 1. 执行摘要

### 1.1 背景

首页五步协作式设计流程的状态流转不完整，步骤 4-5 无法正常切换。

### 1.2 目标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 步骤完成率 | 60% | 100% |
| 流程中断 | 存在 | 0 中断 |
| 数据传递 | 部分丢失 | 0 丢失 |

### 1.3 预估工时

1.5 天

---

## 2. 功能需求

### F1: completedStep 状态修复

**描述**: 修复 useHomePage hook 中 completedStep 更新逻辑【需页面集成】

**正向用例**:
- [ ] F1.1: SSE 流完成时正确更新 completedStep (expect(completedStep updated on stream complete))
- [ ] F1.2: currentStep 自动推进到下一步 (expect(currentStep advances))
- [ ] F1.3: 步骤状态与 UI 同步 (expect(UI syncs with step state))

**反向用例**:
- [ ] F1.4: 点击已完成步骤可回退 (expect(click completed step → navigate back))
- [ ] F1.5: 回退后数据保留 (expect(data preserved after back navigation))

**边界条件**:
- [ ] F1.6: currentStep 为 null 时 UI 正常显示 (expect(UI renders when currentStep is null))
- [ ] F1.7: completedStep 超出范围(>5)时自动修正 (expect(completedStep clamped to max 5))

### F2: 步骤数据依赖建立

**描述**: 确保步骤间数据正确传递

**正向用例**:
- [ ] F2.1: 需求 → 限界上下文数据传递 (expect(data passes step 1→2))
- [ ] F2.2: 限界上下文 → 领域模型数据传递 (expect(data passes step 2→3))
- [ ] F2.3: 领域模型 → 业务流程数据传递 (expect(data passes step 3→4))

**反向用例**:
- [ ] F2.4: 回退时数据保留 (expect(data retained when going back from 2→1))
- [ ] F2.5: 前进时重新加载数据 (expect(data reloaded when going forward 1→2))

**边界条件**:
- [ ] F2.6: 步骤2数据为空时步骤3能否生成默认值 (expect(default value when step2 data empty))
- [ ] F2.7: 步骤数据为 undefined 时不崩溃 (expect(no crash when data undefined))

### F3: 错误恢复机制

**描述**: 添加 SSE 流错误后的重试机制【需页面集成】

**正向用例**:
- [ ] F3.1: 错误时显示重试按钮 (expect(retry button shown on error))
- [ ] F3.2: 重试功能正常工作 (expect(retry works correctly))
- [ ] F3.3: 错误状态正确显示 (expect(error state displayed))

**反向用例**:
- [ ] F3.4: 重试成功后恢复正常流程 (expect(flow resumes after successful retry))
- [ ] F3.5: 取消重试可返回上一步 (expect(cancel retry → navigate back))

**边界条件**:
- [ ] F3.6: SSE timeout > 30s 视为超时错误 (expect(timeout error after 30s))
- [ ] F3.7: 连续重试3次失败后给出明确提示 (expect提示 after 3 failed retries))
- [ ] F3.8: 网络断开时立即显示错误 (expect(immediate error on network disconnect))

### F4: 步骤导航增强

**描述**: 允许用户点击已完成的步骤和下一步

**正向用例**:
- [ ] F4.1: 已完成步骤可点击 (expect(completed steps clickable))
- [ ] F4.2: 下一步可点击 (expect(next step clickable))
- [ ] F4.3: 未完成步骤不可点击 (expect(future steps disabled))

**反向用例**:
- [ ] F4.4: 点击当前步骤不触发跳转 (expect(click current step → no action))
- [ ] F4.5: 快速连续点击不产生重复请求 (expect(no duplicate requests on rapid clicks))

**边界条件**:
- [ ] F4.6: 并发请求时只处理最新请求 (expect(only latest request processed on concurrent clicks))
- [ ] F4.7: 步骤跳转时取消进行中的请求 (expect(pending request cancelled on step change))

---

## 3. Epic 拆分

| Epic ID | 名称 | 工作量 | 负责人 |
|---------|------|--------|--------|
| E-001 | 步骤状态修复 | 3h | Dev |
| E-002 | 数据传递修复 | 2h | Dev |
| E-003 | 错误恢复实现 | 3h | Dev |
| E-004 | 测试验证 | 2h | Tester |

**总工作量**: 10 小时

---

## 4. 验收标准

### 4.1 成功标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC-001 | 步骤 1→5 完整流转 | E2E 测试 |
| AC-002 | 步骤可前进后退 | 手动测试 |
| AC-003 | 错误可恢复 | 模拟错误测试 |

### 4.2 DoD

- [ ] 所有步骤流程测试通过
- [ ] 错误恢复测试通过
- [ ] 代码审查通过
