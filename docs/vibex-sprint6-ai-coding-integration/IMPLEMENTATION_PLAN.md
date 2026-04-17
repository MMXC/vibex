# Implementation Plan — vibex-sprint6-ai-coding-integration

**项目**: vibex-sprint6-ai-coding-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, architecture.md

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 设计稿导入 | U1-U2 | 0/2 | U1 |
| E2: AI Coding Agent | U3-U5 | 0/3 | U3 |
| E3: 版本 Diff | U6-U7 | 0/2 | U6 |

---

## E1: 设计稿导入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | Image AI 解析 | ⬜ | — | `image-ai-import.ts` 复用 cf-image-loader 生成组件列表 |
| U2 | Figma URL 解析完善 | ⬜ | U1 (P2) | `figma-import.ts` 支持 Figma REST API 调用（P2 暂缓） |

### U1: Image AI 解析

**文件**: `src/lib/figma/image-ai-import.ts` (新建)

**实现步骤**:
1. 分析 `cf-image-loader.ts` (101L) 的 AI vision pipeline
2. 扩展为 `importFromImage(file: File): Promise<ImageImportResult>`
3. 从 AI vision 结果提取组件和布局信息
4. 返回 `components[]` 和 `layout` 供 ProtoEditor 使用

**风险**: P2 — cf-image-loader 扩展性待验证

**验收**:
- AC1: `importFromImage(file)` 返回 `components[]` 数组
- AC2: 每个 component 含 `name`/`type`/`position`
- AC3: 返回结果可被 ProtoEditor 消费

---

## E2: AI Coding Agent

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U3 | CodingAgentService | ⬜ | — | `createSession()` 调用 sessions_spawn，返回 sessionKey |
| U4 | AgentFeedbackPanel | ⬜ | U3 | 实时显示 Agent 代码反馈，支持接受/拒绝 |
| U5 | Agent 会话管理 | ⬜ | U3 | 终止会话、查看历史、状态显示 |

### U3: CodingAgentService

**文件**: `src/services/agent/coding-agent.ts` (新建)
**测试**: `src/services/agent/__tests__/coding-agent.test.ts` (新建)

**实现步骤**:
1. 验证 OpenClaw sessions_spawn 可调用（U3.1）
2. 实现 `createSession(context)` → 调用 sessions_spawn
3. 实现 `getSessionStatus(sessionKey)`
4. 实现 `terminateSession(sessionKey)`
5. Mock sessions_spawn 编写测试

**U3.1 验证任务**（必须先执行）:
```bash
# 验证 OpenClaw sessions_spawn 在 VibeX 环境中可用
# 如果不可用，降级为方案B（HTTP → 后端 AI 服务）
```

**风险**: P0 — sessions_spawn 可用性未验证

**验收**:
- AC1: `createSession({ task })` 返回 `sessionKey`
- AC2: `getSessionStatus(key)` 返回 'running'/'complete'/'error'
- AC3: `terminateSession(key)` 终止运行中的会话

---

### U4: AgentFeedbackPanel

**文件**: `src/components/agent/CodingFeedbackPanel.tsx` (新建)
**样式**: `src/components/agent/CodingFeedbackPanel.module.css` (新建)

**实现步骤**:
1. 创建面板 UI（sessionKey 作为 prop）
2. 轮询或 WebSocket 获取 Agent 输出
3. 实时显示生成的代码块（语法高亮）
4. "接受" 按钮 → 写入项目文件
5. "拒绝" 按钮 → 关闭会话
6. 四态：pending/running/complete/error

**风险**: 无

**验收**:
- AC1: 显示 Agent 生成的代码内容
- AC2: "接受" 按钮触发代码写入
- AC3: error 状态显示错误信息

---

### U5: Agent 会话管理

**文件**: `src/components/agent/AgentSessions.tsx` (新建)

**实现步骤**:
1. 会话列表（历史 + 当前）
2. 终止按钮
3. 会话状态 badge（running/complete/error）
4. 复用 `services/api/modules/agent.ts` 的 Agent CRUD

**风险**: 无

**验收**:
- AC1: 显示所有会话（历史 + 当前）
- AC2: 终止按钮生效

---

## E3: 版本 Diff

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U6 | VersionDiff 逻辑 | ⬜ | — | `diffVersions(v1, v2)` 返回 added/removed/modified |
| U7 | 版本历史 UI 集成 | ⬜ | U6 | version-history 页面显示 diff 视图 |

### U6: VersionDiff 逻辑

**文件**: `src/lib/version/VersionDiff.ts` (新建)
**测试**: `src/lib/version/__tests__/VersionDiff.test.ts` (新建)

**实现步骤**:
1. 引入 jsondiffpatch
2. 实现 `diffVersions(before, after)` 函数
3. 分类输出 added/removed/modified
4. 编写 5 个测试用例

**风险**: 无

**验收**:
- AC1: `diffVersions(v1, v2).added` 包含新增节点
- AC2: `diffVersions(v1, v2).removed` 包含删除节点
- AC3: `diffVersions(v1, v2).modified` 包含变更节点和 diff

---

### U7: 版本历史 UI 集成

**文件**: `src/app/version-history/page.tsx` (扩展)

**实现步骤**:
1. 在 version-history 页面添加 "Compare" 按钮
2. 选择两个版本 → 显示 VersionDiff 视图
3. added（绿色）/ removed（红色）/ modified（黄色）分类显示

**风险**: 无

**验收**:
- AC1: 可选择两个版本进行对比
- AC2: diff 视图正确分类显示 added/removed/modified

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration
- **执行日期**: 2026-04-18
- **备注**: E2-U3 需先验证 sessions_spawn 可用性，如不可用需降级方案
