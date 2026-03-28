# Reviewer 视角：需求对齐分析

**日期**: 2026-03-20  
**审查人**: reviewer  
**分析目标**: 对比总需求流程与实际代码实现，找出偏离与风险

---

## 一、总需求流程 vs 当前实现对照

```
总需求流程:
[1] 首页输入需求
[2] 对话澄清
[3] 生成核心上下文业务流程
[4] 询问通用支撑域
[5] 用户勾选流程节点
[6] 生成页面/组件节点
[7] 用户再次勾选
[8] 创建项目
[9] Dashboard
[10] 原型预览 + AI助手
```

| 步骤 | 总需求 | 当前实现 | 状态 | 风险 |
|------|--------|---------|------|------|
| 1 | 首页输入需求 | `HomePage.tsx` + InputArea | ✅ | - |
| 2 | 对话澄清 | `design/clarification/page.tsx` | ✅ | ClarifyStep API 未集成到首页流程 |
| 3 | 生成核心上下文业务流程 | `confirm/context/page.tsx` | ✅ | 依赖 bounded-context API |
| 4 | 询问通用支撑域 | `confirm/model/page.tsx` | ✅ | DomainModel 生成 |
| 5 | 用户勾选流程节点 | `confirm/flow/page.tsx` | ✅ | 用户交互已实现 |
| 6 | 生成页面/组件节点 | `design/ui-generation/page.tsx` | ✅ | DesignStepLayout 统一布局 |
| 7 | 用户再次勾选 | UI-generation 页面 | ✅ | - |
| 8 | 创建项目 | `requirements/new/page.tsx` | ✅ | - |
| 9 | Dashboard | `dashboard/page.tsx` | ✅ | - |
| 10 | 原型预览 + AI助手 | `prototype/page.tsx` + chat | ⚠️ | AI助手集成待验证 |

---

## 二、已审查通过的代码质量评估

### 2.1 符合规范的模块

| 模块 | 文件 | 质量评估 |
|------|------|---------|
| Mermaid 渲染 | `MermaidManager.ts` + `MermaidPreview.tsx` | ✅ Singleton + LRU + DOMPurify |
| Auth 安全 | `secure-storage.ts` + `auth-token.ts` | ✅ AES-256-GCM + sessionStorage |
| 日志脱敏 | `log-sanitizer.ts` | ✅ 28类敏感字段递归脱敏 |
| TypeScript | 全局 | ✅ strict mode, 0 errors |
| ESLint 性能 | `package.json` lint script | ✅ --cache, 27s |
| 测试覆盖 | 153 suites, 1751 tests | ✅ 全部通过 |

### 2.2 需关注的问题

| ID | 问题 | 位置 | 严重性 | 说明 |
|----|------|------|--------|------|
| R1 | ClarifyStep 未与首页流程联动 | `InputArea.tsx` | 🟡 | 用户输入后需手动跳转 clarification |
| R2 | Step 3 (创建项目) 入口不清晰 | `requirements/new/page.tsx` | 🟡 | 从 ui-generation 到 requirements/new 跳转路径未测试 |
| R3 | Chat AI 助手与流程未绑定 | `chat/page.tsx` | 🟡 | AI助手独立于流程，无法辅助澄清 |
| R4 | Prototype 预览依赖前端 build | `prototype/page.tsx` | 🟡 | Cloudflare Pages static export 兼容性待验证 |

---

## 三、代码偏离分析

### 3.1 确认流程 vs Design 流程分裂

**总需求**: 首页 → 连续引导流程  
**实际实现**: 首页 → `confirm/*` → `design/*` 两个独立区域

- `confirm/` (194-247 行/文件): 上下文/流程/模型确认 — 使用 MermaidPreview ✅
- `design/*` (48-328 行/文件): bounded-context/business-flow/domain-model/ui-generation — 使用 DesignStepLayout ✅

**偏离**: 总需求期望无缝的单页流程，但实现是多个独立页面。

### 3.2 Clarify 步骤缺失关键集成

`design/clarification/page.tsx` (328 行) 存在但：
- 未在首页 `InputArea` 的生成按钮之后自动触发
- API `/clarify/ask` 未与 `useDDDStream` 钩子集成
- 没有 SSE 流式返回澄清内容

### 3.3 Step 数量变化

**总需求**: 5 步引导 (onboarding)  
**实际 onboarding**: 5 步 (welcome/input/clarify/model/preview) ✅  
**实际 design 流程**: 4 个 design 页面 (bounded-context/domain-model/business-flow/ui-generation)  
**实际主页流程**: 3 步 (STEPS constant)

---

## 四、审查记录摘要

| 日期 | 项目 | 结论 | 关键修复 |
|------|------|------|---------|
| 03-20 05:36 | vibex-onboarding-redesign | ✅ | 5步引导 + Zustand 状态 |
| 03-20 05:57 | vibex-ts-strict | ✅ | strict mode, 0 errors |
| 03-20 11:14 | vibex-p1-security-fix | ✅ | AES-GCM + sessionStorage |
| 03-20 11:14 | vibex-auth-e2e-fix | ✅ | OAuth async 改造 |
| 03-20 11:14 | vibex-console-log-sanitize | ✅ | 28类敏感字段脱敏 |
| 03-20 12:44 | vibex-zustand-missing | ✅ | zustand@4.5.7 显式声明 |
| 03-20 16:24 | vibex-mermaid-regression-fix | ✅ | MermaidManager singleton |
| 03-20 16:50 | vibex-mermaid-render-fix | ✅ | MermaidPreview 重构 |
| 03-20 20:59 | vibex-ddd-api-fix | ✅ | DesignStepLayout + StepNavigator |
| 03-20 21:35 | vibex-eslint-perf-fix | ✅ | ESLint --cache |
| 03-20 21:35 | vibex-homepage-mermaid-fix | ✅ | PreviewArea 订阅 flowMermaidCode |
| 03-20 21:35 | vibex-secure-storage-fix | ✅ | 空 catch 添加 error logging |
| 03-20 21:35 | vibex-step2-issues | ✅ | DesignStepLayout |

**累计**: 13 个审查项目，100% PASSED

---

## 五、建议

### 高优先级
1. **Clarify 集成到首页流程**: 在 `InputArea` 生成按钮之后添加 clarification 阶段自动跳转
2. **Step 3 入口测试**: `design/ui-generation` → `requirements/new` 跳转链路测试覆盖

### 中优先级
3. **Chat AI 助手绑定流程**: AI 助手应能感知当前流程阶段，提供上下文相关辅助
4. **Prototype 静态导出验证**: Cloudflare Pages static export 与 prototype 预览的兼容性测试

### 低优先级
5. **代码重复清理**: `confirm/*` 和 `design/*` 页面有相似结构，可提取共享 Layout 组件
6. **测试覆盖补充**: `design/clarification/page.tsx` 目前无单元测试

---

## 六、结论

总体来看，代码实现基本覆盖了总需求流程，核心模块（Mermaid、Auth、日志、类型）质量良好。

**主要风险**: Clarify 步骤与首页流程的集成缺失，以及 Step 3 创建项目入口的跳转路径需要补充端到端测试。

**已审查代码安全性**: 无注入、XSS 或凭证泄露风险。
