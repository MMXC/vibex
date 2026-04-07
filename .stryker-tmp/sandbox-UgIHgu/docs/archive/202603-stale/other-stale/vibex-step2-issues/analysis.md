# 分析文档: vibex-step2-issues

> 修复 Step 2 UI组件分析问题：恢复步骤指示器、思考过程面板、设计API、支持步骤回退
> 分析时间: 2026-03-20 18:25

---

## 1. 问题背景

当前 `/design/*` 路由下的5个步骤页面均为**占位桩页面**，仅有硬编码文本而无实际功能：

```
clarification → /design/clarification   → <div>需求澄清</div> + <p>Step 1 of 5</p>
bounded-context → /design/bounded-context → <div>限界上下文</div> + <p>Step 2 of 5</p>
domain-model → /design/domain-model   → <div>领域模型</div> + <p>Step 3 of 5</p>
business-flow → /design/business-flow → <div>业务流程</div> + <p>Step 4 of 5</p>
ui-generation → /design/ui-generation → <div>UI生成</div> + <p>Step 5 of 5</p>
```

首页（`HomePage.tsx`）的步骤流已有完整实现（`StepRequirementInput`, `StepBoundedContext`, `StepDomainModel` 等），但设计流程页面未复用这些组件。

---

## 2. 问题根因分析

### 问题1: 步骤指示器缺失
- **现状**: `ProgressIndicator.tsx` 和 `StepNavigator.tsx` 组件存在，但设计页面未使用
- **影响**: 用户无法感知当前在哪个步骤，也不知道总共有几步
- **根因**: 设计页面是桩实现，未接入 `designStore` 中的 `currentStep` 状态

### 问题2: 思考过程面板未集成
- **现状**: `ThinkingPanel.tsx` 组件存在（`@/components/ui/ThinkingPanel` 和 `@/components/homepage/ThinkingPanel` 两个版本）
- **影响**: AI 分析过程不可见，用户不知道系统在"思考"什么
- **根因**: 设计页面未接入流式响应服务 `stream-service.ts`

### 问题3: API 未设计
- **现状**: `designStore.ts` 定义了数据结构（`ClarificationRound`, `DomainEntity`, `BusinessFlow`, `UIPage`, `PrototypeData`），但没有持久化 API
- **影响**: 页面刷新数据丢失，无法保存/加载设计进度
- **根因**: `/services/api/modules/ddd.ts` 只服务首页 DDD 分析，不服务设计流程

### 问题4: 步骤回退不支持
- **现状**: `designStore.ts` 有 `currentStep`，但没有 `previousStep` 逻辑
- **影响**: 用户走错步骤无法回退，只能重新开始
- **根因**: `StepNavigator` 的 `onStepClick` 功能未在设计页面中使用

---

## 3. 技术方案

### 方案A: 复用首页步骤组件（推荐）

设计页面复用首页已有的步骤组件，通过 props 控制渲染模式：

| 设计页面 | 复用组件 | 需要修改 |
|---------|---------|---------|
| `/design/clarification` | `StepRequirementInput` | 支持"设计模式"，跳过首页特有状态 |
| `/design/bounded-context` | `StepBoundedContext` | 移除首页绑定，接入 designStore |
| `/design/domain-model` | `StepDomainModel` | 同上 |
| `/design/business-flow` | `StepBusinessFlow` | 同上 |
| `/design/ui-generation` | 待实现 | 全新实现 |

**优点**: 复用已有逻辑，代码量最少
**缺点**: 需要解耦首页特有逻辑

### 方案B: 独立实现设计流程（备选）

在 `design/` 目录下独立实现5个步骤页面，完全复用 `designStore`。

**优点**: 完全解耦
**缺点**: 代码重复，工作量大

---

## 4. 识别技术风险

| 风险 | 等级 | 描述 |
|------|------|------|
| 首页与设计流状态冲突 | 🔴 高 | 两个流程共用 `designStore`，状态可能互相覆盖 |
| 流式响应状态管理复杂 | 🟡 中 | `ThinkingPanel` 需要 `stream-service`，需处理 loading/error/complete 状态 |
| API 持久化兼容性 | 🟡 中 | 设计流程 API 需与现有 DDD API 兼容或独立实现 |
| 步骤间数据依赖 | 🟡 中 | bounded-context 依赖 clarification 结果，需严格校验 |
| SSR/CSR 水合不一致 | 🟡 中 | Next.js App Router 下 `use client` 组件与 server 组件混合 |

---

## 5. 验收标准（具体可测试）

### 5.1 步骤指示器
- [ ] 访问 `/design/bounded-context`，顶部显示5步骤导航条，当前步骤高亮
- [ ] 点击步骤导航可切换到已完成的上一步（回退）
- [ ] 未完成的下一步不可点击（disabled）

### 5.2 思考过程面板
- [ ] 在 bounded-context 页面输入内容并点击分析后，思考面板显示流式输出
- [ ] 思考面板显示 markdown 格式的分析结果
- [ ] 支持 abort（中断流式输出）

### 5.3 API 持久化
- [ ] 页面刷新后，数据从 API 恢复（不丢失）
- [ ] 保存后下次访问自动加载上次数据

### 5.4 步骤回退
- [ ] 从 Step 3 (domain-model) 可返回 Step 2 (bounded-context)
- [ ] 返回后 Step 3 数据保留（可前进恢复）
- [ ] 返回 Step 1 (clarification) 时 Step 2/3 数据清除

---

## 6. 实现方案建议

### Phase 1: 步骤指示器（最小可用）
1. 在每个设计页面顶部添加 `StepNavigator` 组件
2. 接入 `designStore.currentStep`
3. 实现 `onStepClick` 回退逻辑

### Phase 2: 思考面板集成
1. 在 bounded-context 页面集成 `ThinkingPanel`
2. 接入 `stream-service.ts` 的流式输出
3. 将结果存入 `designStore.boundedContexts`

### Phase 3: API 持久化
1. 设计 `/api/design/[step]` RESTful 接口
2. GET: 加载当前步骤数据
3. POST: 保存当前步骤数据
4. 设计 Store 持久化中间件

### Phase 4: 步骤回退完善
1. 在 `designStore` 实现双向步骤导航
2. 支持数据快照（每步保存一个快照）

---

## 7. 结论

**可行性**: ✅ 可行
- 核心组件均已存在（`StepNavigator`, `ThinkingPanel`, `designStore`）
- 方案A复用策略可将工作量控制在合理范围

**建议优先级**: 步骤指示器 > 思考面板 > API > 步骤回退

**资源估算**: 
- Phase 1: 约 2-3 小时
- Phase 2: 约 4-6 小时  
- Phase 3: 约 3-5 小时
- Phase 4: 约 2-3 小时

总计: 约 11-17 小时
