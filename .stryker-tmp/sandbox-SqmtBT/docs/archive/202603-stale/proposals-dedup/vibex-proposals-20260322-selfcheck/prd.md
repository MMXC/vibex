# PRD: Analyst 每日自检 — 2026-03-22 改进提案

**项目名称**: vibex-proposals-20260322-selfcheck  
**版本**: 1.0  
**创建日期**: 2026-03-22  
**类型**: 流程改进 / 自检落地  
**负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Analyst Agent 每日自检报告，识别 4 个改进提案，涵盖首页 ActionBar 绑定、API Stub 替换、API 验证工具、Task Manager 增强。

### 目标
将 4 个提案转化为可执行的 Epic/Story，建立验收标准，确保改进落地。

### 成功指标
- V1: ActionBar 至少 2 个按钮绑定（onCreateProject + onSave）
- V2: useHomeGeneration generateContexts 调用真实 API
- V3: verify-api-endpoints.sh 可运行
- V4: Task Manager agent 字段校验

---

## 2. Epic 拆分

### Epic 1: ActionBar 完整绑定
**目标**: 修复首页 ActionBar 7 个按钮事件绑定

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S1.1 | 绑定 onCreateProject | `expect(router.push).toHaveBeenCalledWith(expect.stringContaining('/projects'))` | 【需页面集成】 |
| S1.2 | 绑定 onSave | `expect(localStorage.setItem).toHaveBeenCalledWith(expect.stringContaining('vibex-snapshot'))` | 【需页面集成】 |
| S1.3 | 绑定 onDiagnose | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/diagnosis'))` | 【需页面集成】 |
| S1.4 | 绑定 onOptimize | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/optimize'))` | 【需页面集成】 |
| S1.5 | 绑定 onHistory | `expect(setHistoryDrawerOpen).toHaveBeenCalledWith(true)` | 【需页面集成】 |
| S1.6 | 绑定 onRegenerate | `expect(retryCurrentStep).toHaveBeenCalled()` | 【需页面集成】 |
| S1.7 | 绑定 onAIAsk | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/chat'))` | 【需页面集成】 |

### Epic 2: useHomeGeneration Stub 替换
**目标**: 将 useHomeGeneration.ts 中的空 stub 替换为真实 API 调用

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S2.1 | generateContexts 替换 | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/bounded-context'))` | 【需页面集成】 |
| S2.2 | createProject 替换 | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/projects'))` | 【需页面集成】 |

### Epic 3: API 验证工具
**目标**: 创建 verify-api-endpoints.sh 批量验证 API 可用性

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S3.1 | 创建验证脚本 | `expect(test -f scripts/verify-api-endpoints.sh).toBe(true)` | ❌ |
| S3.2 | DDD API 验证 | `expect(bash scripts/verify-api-endpoints.sh | grep -q 'bounded-context.*200')` | ❌ |
| S3.3 | SSE API 验证 | `expect(bash scripts/verify-api-endpoints.sh | grep -q 'stream.*200')` | ❌ |

### Epic 4: Task Manager Agent 校验
**目标**: 在 task_manager claim 时校验 agent 字段匹配

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S4.1 | Agent 字段校验 | `expect(claim with wrong agent).toThrow(PermissionError)` | ❌ |
| S4.2 | 领取规则文档 | `expect(test -f docs/task-claim-rules.md).toBe(true)` | ❌ |

---

## 3. 验收标准汇总

### P0（必须完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P0-1 | onCreateProject 绑定 | `expect(router.push).toHaveBeenCalled()` |
| AC-P0-2 | onSave 绑定 | `expect(localStorage.setItem).toHaveBeenCalled()` |
| AC-P0-3 | generateContexts 真实调用 | `expect(fetch).toHaveBeenCalled()` |
| AC-P0-4 | verify-api-endpoints.sh 可执行 | `expect(bash scripts/verify-api-endpoints.sh; echo $?)` → 0 |

### P1（建议完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P1-1 | onDiagnose / onOptimize 绑定 | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/'))` |
| AC-P1-2 | Task Manager agent 校验 | claim with wrong agent → error |

---

## 4. 实施计划

| 阶段 | 任务 | 预计工时 |
|------|------|---------|
| Phase1 | ActionBar 最关键 2 按钮（onCreateProject + onSave） | 2h |
| Phase2 | ActionBar 剩余 5 按钮 | 4h |
| Phase3 | useHomeGeneration Stub 替换 | 4h |
| Phase4 | API 验证工具 | 2h |
| Phase5 | Task Manager 增强 | 1h |

---

## 5. 非功能需求

| 类型 | 描述 |
|------|------|
| **可测试性** | 每个绑定有 cypress E2E 或 jest mock 验证 |
| **兼容性** | API 验证脚本兼容 bash + curl |
| **防退化** | Task Manager 领取前校验 agent 字段 |

---

*PRD 版本: 1.0 | 编写: PM Agent | 2026-03-22*
