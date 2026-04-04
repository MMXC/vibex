# Architect 提案 — 2026-04-04

**Agent**: architect
**日期**: 2026-04-04
**项目**: vibex-proposals-20260404
**仓库**: /root/.openclaw/vibex
**分析视角**: Architect — 系统架构、模块边界、类型安全、技术债务

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | architecture | packages/types 缺少 package.json，类型共享体系名存实亡 | monorepo 全局 | P0 |
| P002 | architecture | MCP Server 工具集不完整，与团队工作流断连 | packages/mcp-server | P1 |
| P003 | tech-debt | NotificationService 缺少 Slack 实际发送实现 | services/NotificationService.ts | P1 |

---

## 2. 提案详情

### P001: packages/types 缺少 package.json，类型共享体系名存实亡

**分析视角**: Architect — monorepo 类型共享基础设施

**问题描述**:
`packages/types/` 目录定义了共享类型（`api.ts`、`store.ts`、`events.ts`），但**没有 `package.json`**，导致：
1. 无法作为 pnpm workspace package 被其他包依赖（`@vibex/types`）
2. frontend 和 mcp-server 各自维护重复类型定义
3. 前后端契约类型无法强制共享，运行时可能不一致

**根因分析**:
`packages/types` 在 monorepo 建立初期创建，但从未配置为可发布的 workspace 包。pnpm-workspace.yaml 只声明了 `vibex-backend` 和 `vibex-frontend`，不包含 `packages/*`。

**影响范围**:
- `packages/types/` — 无法被依赖
- `packages/mcp-server/` — 重复定义 Tool 类型
- `vibex-fronted/` — API response 类型散落在各组件
- `vibex-backend/` — 与 frontend 类型无强制共享

**代码证据**:
```bash
# packages/types 无 package.json
$ ls /root/.openclaw/vibex/packages/types/
src/  tsconfig.json   # ← 缺少 package.json

# pnpm-workspace.yaml 未包含 packages/*
$ cat /root/.openclaw/vibex/pnpm-workspace.yaml
packages:
  - 'vibex-backend'
  - 'vibex-fronted'
  # 缺少: - 'packages/*'
```

**建议方案**:
1. 在 `packages/types/` 添加 `package.json`：
```json
{
  "name": "@vibex/types",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./api": "./dist/api.js",
    "./api/canvas": "./dist/api/canvas.js",
    "./store": "./dist/store.js",
    "./events": "./dist/events.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

2. 更新 `pnpm-workspace.yaml`：
```yaml
packages:
  - 'packages/*'
  - 'vibex-backend'
  - 'vibex-fronted'
```

3. 迁移前端 API 类型到 `packages/types/src/api/`，frontend 通过 `@vibex/types` 导入

**验收标准**:
- [ ] `packages/types/package.json` 存在且包含 name/version/exports
- [ ] `pnpm install` 后 `node_modules/@vibex/types` 可访问
- [ ] frontend `GetContextsResponse` 等类型从 `@vibex/types` 导入
- [ ] mcp-server 工具输入/输出类型从 `@vibex/types` 导入

---

### P002: MCP Server 工具集不完整，与团队工作流断连

**分析视角**: Architect — MCP 集成架构、工具生态

**问题描述**:
当前 MCP Server 只暴露 4 个工具（`createProject`、`getProject`、`listComponents`、`generateCode`），与 VibeX 实际工作流严重脱节：

**Dev 提案 P001** 指出的"任务完成检测"问题，核心原因是团队工具链没有集成到 MCP Server。MCP Server 本应是 Claude Desktop 与 VibeX 团队协作的桥梁，但目前：
1. **无任务管理工具** — 无法查询/更新 team-tasks 任务状态
2. **无提案管理工具** — 无法创建/读取 proposals 文件
3. **无 Slack 通知工具** — 无法触发 coord/architect 频道通知
4. **无 git 操作工具** — 无法验证 commit 与 epic 的关联

**根因分析**:
MCP Server 是早期原型，仅对接了产品生成流程（PRD → Project → Component → Code），未覆盖团队协作流程（proposal → task → review → ship）。

**影响范围**:
- `packages/mcp-server/src/tools/` — 工具数量不足
- Claude Desktop 用户 — 无法通过 MCP 与团队协作
- Dev/Coord 工作流 — 依赖外部 CLI 而非 MCP

**代码证据**:
```typescript
// packages/mcp-server/src/tools/list.ts — 当前只有 4 个工具
export function listTools(): Tool[] {
  return [
    { name: 'createProject', ... },
    { name: 'getProject', ... },
    { name: 'listComponents', ... },
    { name: 'generateCode', ... },
  ];
}
```

**建议方案**:
分阶段扩展 MCP Server 工具集：

**Phase 1（高价值，快速）**:
```
- listTeamTasks     — 查询当前 agent 的待处理任务
- getTaskStatus     — 查询单个任务状态
- updateTaskStatus  — 更新任务状态（done/rejected/blocked）
- sendSlackMessage  — 发送消息到指定频道
```

**Phase 2（中等价值）**:
```
- createProposal    — 在 proposals/YYYYMMDD/ 创建提案
- readProposal      — 读取指定提案
- commitFiles       — 验证并提交文件到 git
```

**实现建议**:
利用已有的 `task_manager.py`（CLI）和 `NotificationService.ts` 封装为 MCP 工具，避免重复造轮子。

**验收标准**:
- [ ] MCP Server 工具数 ≥ 8 个（当前 4 个）
- [ ] `listTeamTasks` 能返回当前 agent 的 ready 状态任务
- [ ] `updateTaskStatus` 能调用 task_manager.py 更新状态
- [ ] MCP Server 通过 `npm run build` 无编译错误

---

### P003: NotificationService 缺少 Slack 实际发送实现

**分析视角**: Architect — 服务可靠性、Solid Architecture 原则

**问题描述**:
`services/NotificationService.ts` 实现了去重逻辑（30min TTL deduplication），但**缺少实际的 Slack API 发送实现**：

```typescript
// 当前代码：只有注释，没有实现
async send(notification: SlackNotification): Promise<...> {
  await this.loadCache();
  if (this.isDuplicate(...)) return { skipped: true };
  // In production, this would call the Slack API.
  // For now, we record it as sent.   ← ← ← 只有注释，没有真实发送
  this.recordSent(notification.channel, notification.text);
  await this.saveCache();
  return { skipped: false, ok: true };
}
```

**根因分析**:
`NotificationService` 是 E2-T3 的输出物，当时优先实现了去重能力，Slack 发送被标记为 TODO。该服务目前只能防止重复发送，但**从未真正通知任何人**。

**影响范围**:
- `services/NotificationService.ts` — 功能不完整
- 所有依赖通知的 agent 流程 — 可能静默失败
- Slack 频道订阅者 — 收不到通知

**建议方案**:
在 `NotificationService.send()` 中实现真实的 Slack Web API 调用：

```typescript
async send(notification: SlackNotification): Promise<...> {
  await this.loadCache();
  if (this.isDuplicate(notification.channel, notification.text)) {
    return { skipped: true };
  }

  // 真实 Slack API 调用
  const token = notification.token ?? process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return { error: 'SLACK_BOT_TOKEN not configured' };
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: notification.channel,
      text: notification.text,
    }),
  });

  const result = await response.json() as { ok: boolean; error?: string };
  if (!result.ok) {
    return { error: `Slack API error: ${result.error}` };
  }

  this.recordSent(notification.channel, notification.text);
  await this.saveCache();
  return { skipped: false, ok: true };
}
```

**验收标准**:
- [ ] `NotificationService.send()` 包含真实 `fetch('https://slack.com/api/chat.postMessage')` 调用
- [ ] 发送失败时返回 `{ ok: false, error: string }`
- [ ] 发送成功时去重记录持久化到 cache 文件
- [ ] 单元测试覆盖 Slack API 错误路径

---

## 3. 技术债务分析

| 债务项 | 紧急度 | 影响 | 建议 |
|--------|--------|------|------|
| packages/types 无 package.json | P0 | 类型共享体系失效 | P001 |
| MCP Server 工具集过少 | P1 | Claude Desktop 无法参与团队协作 | P002 |
| NotificationService 缺 Slack 实现 | P1 | 通知功能名存实亡 | P003 |
| frontend/mcp-server 类型重复 | P2 | 前后端契约漂移 | P001 完成后修复 |

---

## 4. 做得好的

1. **canvasStore 已成功模块化拆分** — 从 900+ 行拆分为 5 个独立 store（context/flow/component/ui/session），业务逻辑清晰分离，测试覆盖率完整（每个 store 都有对应 test 文件）
2. **NotificationService 去重逻辑健壮** — TTL 机制、文件持久化、hash 计算完整，实现质量高
3. **packages/types 目录结构设计合理** — 按 api/store/events 模块化组织，复用时只需按需导入

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | packages/types 无法被 workspace 包依赖 | 添加 package.json + 更新 workspace 配置 |
| 2 | MCP Server 与团队工作流断连 | 扩展工具集覆盖 task/proposal/slack/git 操作 |
| 3 | NotificationService 无真实 Slack 发送 | 实现 Web API 调用，补充测试覆盖 |
| 4 | 前端测试框架混用 Jest/Vitest | 统一为 Vitest（已配置），清理 jest 残留配置 |

---

*本文档由 Architect Agent 生成于 2026-04-04 18:10 GMT+8*
