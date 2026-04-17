# Architecture — vibex-sprint6-ai-coding-integration

**项目**: vibex-sprint6-ai-coding-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, specs/E1-E4, analysis.md

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration
- **执行日期**: 2026-04-18

---

## 0. Sprint6 上下文

```
Sprint6 三个功能域：
  1. 设计稿导入完善（Figma URL + Image AI 解析）
  2. AI Coding Agent 反馈回路（核心新功能）
  3. 画布版本 diff + 对比（version history 扩展）
```

---

## 1. Tech Stack

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|---------|
| 前端框架 | Next.js | 16 | 项目基准 |
| 语言 | TypeScript | 5.x | 类型安全 |
| AI 集成 | OpenClaw sessions_spawn | 内置 | 复用现有 agent 能力，无需新增 API |
| 版本 diff | jsondiffpatch | 已有 | analysis 确认已在 version-history 使用 |
| 图片 AI | cf-image-loader.ts | 已有 101L | AI vision pipeline 已存在 |
| 测试 | Vitest + Testing Library | — | 项目基准 |

**无新增核心依赖** — 所有功能基于现有资产 + OpenClaw 内置能力。

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph FigmaImport["E1: 设计稿导入"]
        FUI[FigmaImport.tsx<br/>189行 已有]
        FIP[figma-import.ts<br/>URL解析 + Figma API]
        IML[cf-image-loader.ts<br/>101行 已有]
        IAV[ImageAIViewer<br/>AI vision → Component]
    end

    subgraph CodingAgent["E2: AI Coding Agent"]
        AAPI[services/api/modules/agent.ts<br/>101行 已有]
        ACS[AgentCodingSession<br/>OpenClaw sessions_spawn]
        AFE[AgentFeedbackPanel<br/>代码反馈 UI]
        AS[AgentStatus<br/>running/complete/error]
    end

    subgraph VersionHistory["E3: 版本 Diff"]
        VHS[version-history/page.tsx<br/>162行 已有]
        VDP[VersionDiffPanel<br/>jsondiffpatch diff]
        VSP[VersionSnapshot[]<br/>prototype-snapshots API]
    end

    AAPI -->|spawn coding session| ACS
    ACS -->|feedback| AFE
    FIP -->|parsed nodes| ACS
    VSP -->|snapshots| VHS
    VHS -->|diff view| VDP
```

---

## 3. E2 核心：AI Coding Agent 集成

### 3.1 集成方案分析

**核心问题**: 如何将 AI Coding Agent 能力（OpenClaw）与 VibeX 的设计稿/原型数据连接。

**方案对比**:

| 方案 | 描述 | 优点 | 缺点 | 决策 |
|------|------|------|------|------|
| A | OpenClaw MCP Harness (`runtime: "acp"`) | OpenClaw 原生，能力最强 | 需要单独 agent 运行时 | ✅ **已采纳** |
| B | 直接 HTTP → 后端 AI 服务 | 简单 | 需要后端部署 AI 服务 | 过度设计 |
| C | Claude Code CLI | 用户本地运行 | 需要用户安装 CLI | 体验差 |

### 3.2 OpenClaw 集成架构

```typescript
// src/services/agent/coding-agent.ts (新建)

import type { sessions_spawn } from '@/services/openclaw'; // 或直接使用 OpenClaw API

export interface CodingAgentSession {
  sessionKey: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  context: {
    designDoc?: string;      // 设计稿内容（Figma 解析结果）
    prototypeData?: object;  // 原型数据（prototypeStore export）
    task?: string;          // 用户指定任务
  };
}

/**
 * 创建 AI Coding Agent 会话
 * 复用 OpenClaw sessions_spawn 能力
 */
export async function createCodingSession(params: {
  context: CodingAgentSession['context'];
}): Promise<CodingAgentSession> {
  const sessionKey = await sessions_spawn({
    task: buildCodingTask(params.context),
    runtime: 'acp',
    mode: 'session',
  });

  return {
    sessionKey,
    status: 'running',
    context: params.context,
  };
}

/**
 * 构建 Coding Agent 任务描述
 */
function buildCodingTask(context: CodingAgentSession['context']): string {
  let task = 'You are a coding agent. Based on the following design specification, implement the code:\n\n';

  if (context.designDoc) {
    task += `## Design Specification\n${context.designDoc}\n\n`;
  }
  if (context.prototypeData) {
    task += `## Prototype Data\n${JSON.stringify(context.prototypeData, null, 2)}\n\n`;
  }
  if (context.task) {
    task += `## Task\n${context.task}`;
  }

  return task;
}

/**
 * 获取 Agent 会话状态
 */
export async function getSessionStatus(sessionKey: string): Promise<'running' | 'complete' | 'error'> {
  // 通过 OpenClaw API 查询状态
  // 或通过 WebSocket 推送
  // MVP: 轮询 sessions_list
}
```

### 3.3 反馈面板 UI

```typescript
// src/components/agent/CodingFeedbackPanel.tsx (新建)

interface CodingFeedbackPanelProps {
  sessionKey: string;
  onComplete?: (code: string) => void;
  onError?: (error: string) => void;
}

// 状态：pending → running → complete/error
// 实时显示 Agent 生成的代码片段
// 支持用户接受/拒绝代码
// onAccept → 写入项目文件
```

---

## 4. E1: 设计稿导入完善

### 4.1 Figma Import 架构

**当前状态**: `FigmaImport.tsx` (189L) 已有 URL 解析 UI，缺少真实 Figma API 调用。

**需要新增**:

```typescript
// src/lib/figma/figma-import.ts (新建)

export interface FigmaImportResult {
  nodes: FigmaNode[];
  edges: FigmaEdge[];
  metadata: {
    fileName: string;
    pageName: string;
    lastModified: string;
  };
}

export async function importFromFigmaUrl(url: string): Promise<FigmaImportResult> {
  // 1. 解析 Figma URL 提取 fileId 和 nodeId
  const { fileId, nodeId } = parseFigmaUrl(url);

  // 2. 调用 Figma REST API 获取节点数据
  // GET https://api.figma.com/v1/files/{fileId}/nodes?ids={nodeId}
  const response = await fetch(`https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}`, {
    headers: { 'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN! },
  });

  // 3. 转换为 VibeX 原型节点
  return convertFigmaToPrototype(await response.json());
}
```

**⚠️ 依赖**: Figma API Token（环境变量 `FIGMA_ACCESS_TOKEN`）。MVP 可以跳过 Figma API，聚焦 Image AI 解析。

### 4.2 Image AI 解析（优先实现）

**当前状态**: `cf-image-loader.ts` (101L) AI vision pipeline 已存在。

**方案**: 扩展 `cf-image-loader.ts` 支持设计稿解析：

```typescript
// src/lib/figma/image-ai-import.ts (新建, 复用 cf-image-loader.ts 逻辑)

export interface ImageImportResult {
  components: DetectedComponent[];
  layout: LayoutSuggestion;
}

export async function importFromImage(file: File): Promise<ImageImportResult> {
  // 复用 cf-image-loader.ts 的 AI vision 管道
  const visionResult = await analyzeDesignImage(file);

  // 从 vision 结果提取组件和布局
  return {
    components: extractComponents(visionResult),
    layout: extractLayout(visionResult),
  };
}
```

---

## 5. E3: 版本 Diff

### 5.1 现有资产

- `version-history/page.tsx` (162L): 版本历史 UI 已有
- `prototype-snapshots` API: GET/POST endpoints 已存在
- `VersionDiff.tsx` (190L): 可能存在 diff 组件

### 5.2 版本 Diff 架构

```typescript
// src/lib/version/VersionDiff.ts (新建)

import * as jsondiffpatch from 'jsondiffpatch';

export interface VersionDiff {
  added: object[];
  removed: object[];
  modified: Array<{ before: object; after: object; diff: object }>;
}

export function diffVersions(
  before: PrototypeSnapshot,
  after: PrototypeSnapshot
): VersionDiff {
  const delta = jsondiffpatch.diff(before, after);
  return interpretDelta(delta);
}
```

---

## 6. API Definitions

### 6.1 Coding Agent Service

```typescript
// src/services/agent/coding-agent.ts (新建)

export interface CodingAgentSession {
  sessionKey: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  createdAt: string;
  context: {
    designDoc?: string;
    prototypeData?: object;
    task?: string;
  };
}

export interface CodingAgentService {
  createSession(context: CodingAgentSession['context']): Promise<CodingAgentSession>;
  getSessionStatus(sessionKey: string): Promise<CodingAgentSession['status']>;
  getSessionHistory(sessionKey: string): Promise<ChatMessage[]>;
  terminateSession(sessionKey: string): Promise<void>;
}
```

### 6.2 Figma Import API

```typescript
// src/lib/figma/figma-import.ts (新建)

export interface FigmaImportOptions {
  fileId: string;
  nodeId?: string;
  token: string;
}

export async function importFromFigma(options: FigmaImportOptions): Promise<FigmaImportResult>;
export function parseFigmaUrl(url: string): { fileId: string; nodeId?: string };
export function convertFigmaToPrototype(data: FigmaFileData): FigmaImportResult;
```

---

## 7. Risk Assessment

| 风险 | 等级 | 描述 | 缓解 |
|------|------|------|------|
| Figma API Token 管理 | P1 | 需要用户配置 Figma Token | MVP 跳过 Figma API，聚焦 Image AI |
| OpenClaw sessions_spawn 可用性 | P0 | 需确认 OpenClaw API 在 VibeX 环境中可用 | E2-U1 先验证 sessions_spawn 可调用 |
| AI Coding Agent 生成代码质量 | P1 | Agent 生成的代码可能有误 | 提供用户接受/拒绝机制 |
| 版本 diff 性能 | P1 | 大型画布快照 diff 可能慢 | 懒加载 diff，仅比较相邻版本 |
| cf-image-loader 扩展性 | P2 | 复用现有 pipeline 是否足够 | 先评估再决定是否新建 |

---

## 8. Testing Strategy

### 8.1 测试框架

- **Vitest + Testing Library**
- **E2 重点**: CodingAgentService 集成测试（Mock OpenClaw sessions_spawn）

### 8.2 核心测试用例

```typescript
// coding-agent.test.ts
test('createSession: 调用 sessions_spawn 并返回 sessionKey', async () => {
  mockSessionsSpawn.mockResolvedValue('session-abc');
  const session = await createCodingSession({ task: 'build a button' });
  expect(session.sessionKey).toBe('session-abc');
  expect(session.status).toBe('running');
});

test('parseFigmaUrl: 正确提取 fileId', () => {
  const result = parseFigmaUrl('https://figma.com/file/abc123/MyFile');
  expect(result.fileId).toBe('abc123');
});

// figma-import.test.ts
test('importFromFigmaUrl: 返回 FigmaImportResult', async () => {
  mockFigmaApi.mockResolvedValue(mockFigmaData);
  const result = await importFromFigmaUrl('https://figma.com/file/abc123');
  expect(result.nodes).toBeInstanceOf(Array);
});

// version-diff.test.ts
test('diffVersions: added/removed/modified 分类正确', () => {
  const diff = diffVersions(snapshotV1, snapshotV2);
  expect(diff.added).toBeInstanceOf(Array);
  expect(diff.removed).toBeInstanceOf(Array);
  expect(diff.modified).toBeInstanceOf(Array);
});
```

---

## 9. Epic 依赖关系

```
E1: 设计稿导入
  E1-U1: figma-import.ts → P2（MVP 跳过）
  E1-U2: Image AI 解析 → P1（优先实现）

E2: AI Coding Agent ← 核心（P0）
  E2-U1: CodingAgentService → 验证 sessions_spawn 可用性
  E2-U2: CodingFeedbackPanel → 依赖 E2-U1
  E2-U3: Agent 会话管理 → 依赖 E2-U1

E3: 版本 Diff
  E3-U1: VersionDiff → 无外部依赖
  E3-U2: 版本历史 UI 集成 → 依赖 E3-U1
```

---

## 10. Out of Scope

- Figma API 完整实现（需要 Figma Token 配置）
- XState 格式导出
- 跨画布状态双向同步
- AI Coding Agent 的自动化测试覆盖（需要实际 OpenClaw 环境）
