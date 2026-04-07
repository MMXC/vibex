# PRD: homepage-cardtree-debug — 首页卡片树修复

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-24  
**PM**: PM Agent  
**目标**: 修复首页卡片树不可用问题（输入需求后预览区无法加载）

---

## 1. 执行摘要

### 问题
用户启用 `NEXT_PUBLIC_USE_CARD_TREE=true` 后，首页输入需求，预览区卡片树无法加载。

### 根因（3个）
| # | 根因 | 等级 |
|---|------|------|
| 1 | HomePage 未传递 `projectId` 和 `useCardTree` | 🔴 阻塞 |
| 2 | `/api/flow-data` API 端点不存在 | 🔴 阻塞 |
| 3 | CardTree 数据模型与首页数据不对应 | 🟡 设计 |

### 方案
采用方案 A（最小化修复）：复用首页现有数据生成 CardTree，移除对不存在 API 的依赖。

---

## 2. Epic 拆分

### Epic 1: 数据传递修复
**目标**: HomePage 正确传递 CardTree 所需属性

| Story ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----------|--------|------|----------|----------|
| S1.1 | 传递 useCardTree | HomePage → PreviewArea → 传递 `useCardTree={true}` | ✅ `expect(screen.queryByTestId('card-tree-view')).toBeTruthy()` | 【需页面集成】 |
| S1.2 | 传递 projectId | 从 useHomePage 获取 projectId 并传递 | ✅ `expect(previewAreaProps.projectId).toBeDefined()` | 【需页面集成】 |
| S1.3 | 验证数据流 | 确认 projectId 能驱动 CardTree 加载真实数据 | ✅ `expect(cardTreeNodes.length).toBeGreaterThan(0)` | 【需页面集成】 |

**DoD**: CardTree 组件接收到正确的 `projectId` 和 `useCardTree`，PreviewArea 显示 CardTree 而非 Mermaid。

---

### Epic 2: 数据生成逻辑
**目标**: 从首页现有数据（boundedContexts/domainModels）生成 CardTreeVisualizationRaw

| Story ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----------|--------|------|----------|----------|
| S2.1 | 数据转换函数 | 实现 `boundedContexts → CardTreeVisualizationRaw` 转换 | ✅ `expect(convertToCardTree(bcs).nodes.length).toBeGreaterThan(0)` | 【无需页面集成】 |
| S2.2 | useProjectTree 适配 | useProjectTree 支持本地数据模式（无 API）| ✅ `expect(useProjectTree({localData}).data).toBeTruthy()` | 【需页面集成】 |
| S2.3 | children 数据源 | 确认 CardTree children 步骤来源（boundedContexts 子项或固定模板）| ✅ PM 决策文档已产出 | 【需页面集成】 |
| S2.4 | 状态覆盖 | CardTree 状态（done/in-progress/pending）正确映射 | ✅ `expect(node.status).toMatch(/done|in-progress|pending/)` | 【需页面集成】 |

**DoD**: 首页数据能正确转换为 CardTree 格式，无 API 依赖。

---

### Epic 3: UI 交互验证
**目标**: 确保 CardTree 组件交互正常

| Story ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----------|--------|------|----------|----------|
| S3.1 | 展开/收起 | CardTree 节点可展开/收起 | ✅ E2E: `await node.click(); expect(children.visible).toBe(true)` | 【需页面集成】 |
| S3.2 | 复选框交互 | 卡片可点击选中（复选框）| ✅ E2E: `await checkbox.click(); expect(checkbox.checked).toBe(true)` | 【需页面集成】 |
| S3.3 | 状态显示 | 节点显示正确状态图标（done/in-progress/pending）| ✅ `expect(screen.queryByTestId('status-icon')).toBeTruthy()` | 【需页面集成】 |
| S3.4 | 空状态处理 | 无数据时显示友好提示 | ✅ `expect(screen.queryByText(/无数据/i)).toBeTruthy()` | 【需页面集成】 |

**DoD**: 所有交互测试通过。 【需页面集成】

---

### Epic 4: 构建与验证
**目标**: 确保修改不影响构建和现有功能

| Story ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----------|--------|------|----------|----------|
| S4.1 | npm run build | 构建成功无报错 | ✅ `expect(exitCode).toBe(0)` | 【无需页面集成】 |
| S4.2 | 单元测试 | CardTree 相关测试全绿 | ✅ `expect(npm_test_failures).toBe(0)` | 【无需页面集成】 |
| S4.3 | Mermaid 回退 | useCardTree=false 时 Mermaid 正常显示 | ✅ `expect(mermaidView.visible).toBe(true)` | 【需页面集成】 |

**DoD**: 构建通过，测试全绿，Mermaid 回退正常。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | useCardTree=true | CardTree enabled | `expect(screen.queryByTestId('card-tree-view')).toBeTruthy()` |
| AC-2 | 输入需求后 | CardTree loaded | `expect(cardTreeNodes.length).toBeGreaterThan(0)` |
| AC-3 | 节点展开 | click node | `expect(children.visible).toBe(true)` |
| AC-4 | npm run build | after changes | `expect(exitCode).toBe(0)` |
| AC-5 | npm test | CardTree tests | `expect(failures).toBe(0)` |
| AC-6 | useCardTree=false | Mermaid mode | `expect(screen.queryByTestId('mermaid-preview')).toBeTruthy()` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | CardTree 加载 < 500ms |
| **兼容性** | useCardTree=true/false 均正常工作 |
| **可测试性** | 单元测试 + E2E 测试覆盖 |
| **向后兼容** | 不破坏现有 Mermaid 流程 |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | Epic 1 数据传递修复 | Dev |
| Phase 2 | Epic 2 数据生成逻辑 | Dev |
| Phase 3 | Epic 3 UI 交互验证 | Dev |
| Phase 4 | Epic 4 构建与验证 | Tester |
| Phase 5 | PM 验收 | PM |

---

## 6. 待澄清项（PM 决策）

| # | 问题 | 阻塞 |
|---|------|------|
| 1 | CardTree children 步骤数据来源（boundedContexts 子项 or 固定模板）| Epic 2 |

---

## 7. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| 数据转换逻辑复杂 | 中 | 中 | 先用静态 mock 验证 UI，再接入真实数据 |
| useHomePage 未暴露 projectId | 中 | 低 | 改用 store 或 localStorage |
| children 步骤来源不明确 | 中 | 中 | PM 立即决策 |

---

*PRD v1.0 — 2026-03-24*
