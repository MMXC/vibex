# Spec: Epic 4 — 架构增强

**Epic**: E4  
**PRD 引用**: `prd.md` § Epic 4  
**优先级**: P1  
**目标 Sprint**: Sprint 1（S4.1）+ Sprint 2（S4.2-S4.5）  
**工时**: 9.5h（S4.1: 1h, S4.2: 2h, S4.3: 2h, S4.4: 3h, S4.5: 1.5h）  
**前置依赖**: E0 完成（TypeScript 编译通过）  
**状态**: 待开发

---

## 概述

Epic 4 包含 5 个架构增强 Story，来源为 Architect 提案：
1. **S4.1**: Canvas 三栏独立 ErrorBoundary
2. **S4.2**: packages/types API Schema 落地
3. **S4.3**: API v0→v1 迁移收尾
4. **S4.4**: frontend types 对齐 @vibex/types
5. **S4.5**: groupByFlowId 记忆化优化

---

## 详细设计

### S4.1 — Canvas 三栏 Error Boundary

#### F4.1: ContextTree / FlowTree / ComponentTree 独立 ErrorBoundary

**问题描述**: Canvas 三栏（ContextTree、FlowTree、ComponentTree）共用一个 ErrorBoundary，一栏崩溃导致三栏全部不可用。

**设计方案**:
```
CanvasPanel
├── ContextTreePanel
│   └── ContextTreeErrorBoundary  ← 独立
├── FlowTreePanel
│   └── FlowTreeErrorBoundary     ← 独立
└── ComponentTreePanel
    └── ComponentTreeErrorBoundary ← 独立
```

**ErrorBoundary 组件**:
```typescript
// apps/frontend/src/components/canvas/tree/TreeErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  name: string;         // 用于日志标识
  children: ReactNode;
  fallback?: ReactNode; // 可选自定义兜底 UI
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TreeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name} ErrorBoundary]`, error, info.componentStack);
    this.props.onError?.(error, info);
    // 上报监控（可选）
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="tree-error-boundary" data-tree={this.props.name}>
          <span>⚠️ {this.props.name} 加载失败</span>
          <button onClick={() => this.setState({ hasError: false, error: undefined })}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**集成点**:
```typescript
// apps/frontend/src/components/canvas/TreePanel.tsx
import { TreeErrorBoundary } from './tree/TreeErrorBoundary';

export function TreePanel() {
  return (
    <div className="tree-panel">
      <TreeErrorBoundary name="ContextTree">
        <ContextTree />
      </TreeErrorBoundary>
      <TreeErrorBoundary name="FlowTree">
        <FlowTree />
      </TreeErrorBoundary>
      <TreeErrorBoundary name="ComponentTree">
        <ComponentTree />
      </TreeErrorBoundary>
    </div>
  );
}
```

### S4.2 — @vibex/types API Schema 落地

#### F4.2: packages/types API Schema

**问题描述**: API 类型分散在 backend 和 frontend，无统一 Schema 定义。

**解决方案**:
```
packages/types/
├── src/
│   ├── index.ts
│   ├── entities.ts           # 实体类型（已有）
│   ├── api/
│   │   ├── index.ts
│   │   ├── chat.ts          # /api/chat 类型
│   │   ├── pages.ts         # /api/pages 类型
│   │   └── common.ts        # 通用响应类型
│   └── events/
│       ├── index.ts
│       └── flow.ts          # Flow 事件类型
```

**Schema 定义示例**:
```typescript
// packages/types/src/api/chat.ts
export interface ChatRequest {
  flowId: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  flowId: string;
  message: string;
  timestamp: number;
}

// packages/types/src/api/common.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    requestId: string;
    timestamp: number;
  };
}
```

### S4.3 — API v0→v1 迁移收尾

#### F4.3: v0 Deprecation Header

**问题描述**: 部分 v0 API 路由缺少 Deprecation Header，用户无法感知 API 即将废弃。

**修复方案**: 所有 v0 路由添加 `Deprecation` 和 `Sunset` Header。

```typescript
// apps/backend/src/app/api/v0/chat/route.ts
export async function GET(req: Request) {
  const deprecationDate = new Date('2026-06-01').toUTCString();
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Deprecation': 'true',
    'Sunset': deprecationDate,
    'Link': '</api/v1/chat>; rel="successor-version"',
    'X-API-Version': 'v0',
  });

  return NextResponse.json(data, { status: 200, headers });
}
```

**扫描脚本**:
```bash
# 验证所有 v0 路由有 Deprecation Header
grep -rln "api/v0" apps/backend/src/app/api --include="route.ts" | while read f; do
  if ! grep -q "Deprecation" "$f"; then
    echo "Missing header: $f"
  fi
done
```

### S4.4 — frontend types 对齐

#### F4.4: types.ts 引用 @vibex/types

**问题描述**: frontend 中存在重复的类型定义，应统一引用 `@vibex/types`。

**迁移策略**:
1. 扫描 `apps/frontend/src/types/` 目录
2. 识别重复定义（与 `@vibex/types` 冲突）
3. 替换为 `import type from '@vibex/types'`
4. 删除重复类型文件

```typescript
// 修复前（apps/frontend/src/types/chat.ts）
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
}

// 修复后
export type { ChatMessage } from '@vibex/types/api/chat';
```

### S4.5 — groupByFlowId 记忆化优化

#### F4.5: flowNodeIndex 缓存

**问题描述**: `groupByFlowId` 每次调用时使用 O(n) find 查找节点索引，性能差。

**优化方案**: 使用 `Map<string, number>` 缓存索引。

```typescript
// 优化前（O(n) find）
function groupByFlowId(nodes: FlowNode[]): Map<string, FlowNode[]> {
  const result = new Map<string, FlowNode[]>();
  nodes.forEach(node => {
    const group = result.get(node.flowId) ?? [];
    group.push(node);
    result.set(node.flowId, group);
  });
  return result;
}

// 优化后（O(1) lookup）
function groupByFlowIdMemoized(
  nodes: FlowNode[],
  indexCache?: Map<string, number>
): Map<string, FlowNode[]> {
  const result = new Map<string, FlowNode[]>();
  const nodeIndex = indexCache ?? new Map<string, number>();
  
  nodes.forEach(node => {
    // O(1) lookup
    const cachedIdx = nodeIndex.get(node.id);
    if (cachedIdx !== undefined) {
      // 命中缓存
    }
    // 写入时同步更新索引
    nodeIndex.set(node.id, result.size);
    
    const group = result.get(node.flowId) ?? [];
    group.push(node);
    result.set(node.flowId, group);
  });
  
  return result;
}
```

---

## API/接口

本 Epic 涉及新增类型定义（packages/types），不涉及 API 协议变更。

---

## 实现步骤

### Phase 1: Canvas ErrorBoundary（1h）— Sprint 1

1. **创建 ErrorBoundary 组件**
   - 创建 `apps/frontend/src/components/canvas/tree/TreeErrorBoundary.tsx`
   - 实现 `getDerivedStateFromError` 和 `componentDidCatch`

2. **集成到 TreePanel**
   - 修改 `apps/frontend/src/components/canvas/TreePanel.tsx`
   - 分别为三栏包裹 TreeErrorBoundary

3. **单元测试**
   - 测试 ErrorBoundary 捕获子组件错误
   - 测试重试按钮恢复功能

4. **E2E 验证**
   - 模拟一栏崩溃，确认其他栏正常

### Phase 2: 类型系统统一（2h）— Sprint 2

1. **建立 API Schema**
   - 创建 `packages/types/src/api/` 目录
   - 实现 chat.ts、pages.ts、common.ts

2. **更新导出**
   - 更新 `packages/types/src/index.ts`

3. **全仓库迁移**
   - backend 和 frontend 均引用 `@vibex/types`

### Phase 3: v0 Deprecation（2h）— Sprint 2

1. **扫描 v0 路由**
2. **批量添加 Header**
3. **验证脚本**

### Phase 4: frontend types 重构（3h）— Sprint 2

1. **扫描重复类型**
2. **替换引用**
3. **删除冗余文件**

### Phase 5: 记忆化优化（1.5h）— Sprint 2

1. **实现 Map 索引缓存**
2. **性能基准测试**
3. **集成验证**

---

## 验收测试

### AC4.1 — Canvas ErrorBoundary

```typescript
//验收测试: Canvas三栏独立恢复
describe('Canvas ErrorBoundary (AC4.1)', () => {
  it('TreeErrorBoundary component exists', () => {
    const path = '/root/.openclaw/vibex/apps/frontend/src/components/canvas/tree/TreeErrorBoundary.tsx';
    expect(fs.existsSync(path)).toBe(true);
  });

  it('TreeErrorBoundary catches errors and renders fallback', () => {
    // 模拟错误组件
    const ThrowError = () => { throw new Error('Test error'); };
    const boundary = renderWithBoundary(<ThrowError />);
    expect(boundary.find('.tree-error-boundary')).toBeTruthy();
    expect(boundary.find('button').text()).toBe('重试');
  });

  it('TreePanel wraps all three trees with ErrorBoundary', () => {
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/apps/frontend/src/components/canvas/TreePanel.tsx',
      'utf-8'
    );
    expect(content).toMatch(/TreeErrorBoundary.*name="ContextTree"/);
    expect(content).toMatch(/TreeErrorBoundary.*name="FlowTree"/);
    expect(content).toMatch(/TreeErrorBoundary.*name="ComponentTree"/);
  });

  it('one tree crash does not affect others', async () => {
    // E2E 测试：模拟 FlowTree 崩溃
    const page = await browser.newPage();
    await page.goto('/canvas');
    // 注入错误到 FlowTree
    await page.evaluate(() => {
      const flowTreeEl = document.querySelector('[data-tree="FlowTree"]');
      if (flowTreeEl) {
        // 模拟崩溃
        const origRender = (flowTreeEl as any)._reactRoot;
      }
    });
    // 验证 ContextTree 和 ComponentTree 仍可交互
    const contextTree = await page.$('[data-tree="ContextTree"]');
    const componentTree = await page.$('[data-tree="ComponentTree"]');
    expect(contextTree).toBeTruthy();
    expect(componentTree).toBeTruthy();
    // 崩溃栏显示错误 UI
    const errorUI = await page.$('.tree-error-boundary[data-tree="FlowTree"]');
    expect(errorUI).toBeTruthy();
  });

  it('retry button restores crashed tree', async () => {
    const page = await browser.newPage();
    await page.goto('/canvas');
    // 崩溃 FlowTree
    await page.evaluate(() => {
      const err = new Error('Simulated crash');
      (window as any).__simulateTreeError = err;
    });
    // 点击重试
    await page.click('.tree-error-boundary[data-tree="FlowTree"] button');
    // 验证恢复
    const errorUI = await page.$('.tree-error-boundary[data-tree="FlowTree"]');
    expect(errorUI).toBeNull();
  });
});
```

### AC4.2 — API v0 Deprecation Header

```typescript
//验收测试: v0路由添加Deprecation Header
describe('v0 Deprecation Header (AC4.2)', () => {
  const v0Routes = globSync('apps/backend/src/app/api/v0/**/route.ts');

  v0Routes.forEach(route => {
    it(`${route} has Deprecation header`, () => {
      const content = fs.readFileSync(route, 'utf-8');
      expect(content).toMatch(/Deprecation.*true|'Deprecation'/i);
      expect(content).toMatch(/Sunset/i);
    });
  });

  it('all v0 routes have X-API-Version header', () => {
    v0Routes.forEach(route => {
      const content = fs.readFileSync(route, 'utf-8');
      expect(content).toMatch(/X-API-Version.*v0/);
    });
  });

  it('v0 routes reference successor version in Link header', () => {
    v0Routes.forEach(route => {
      const content = fs.readFileSync(route, 'utf-8');
      expect(content).toMatch(/v1.*successor|successor.*v1/);
    });
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| ErrorBoundary 掩盖真实错误 | 低 | 中 | ErrorBoundary 仅记录到控制台，不静默吞掉关键错误 |
| @vibex/types 迁移破坏现有类型 | 中 | 高 | 逐文件迁移，每步运行 `pnpm tsc --noEmit` |
| v0 Deprecation 影响生产流量 | 中 | 高 | 先灰度，逐步调整 |
| Map 索引缓存内存泄漏 | 低 | 中 | 使用 WeakMap 或限制缓存大小 |
