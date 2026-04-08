# Vibex Phase 3 实施计划

**项目**: vibex-third
**阶段**: architect-review
**日期**: 2026-04-08
**总工期**: 15h
**Sprint**: 2 sprints + 1 天缓冲

---

## Sprint 总览

| Sprint | 时长 | 故事 | 工时 | 交付物 |
|--------|------|------|------|--------|
| Sprint 1 | 3 天 | E4 (3h) + E5 (1h) + E1-S1 (1h) + E1-S2 (1h) | 6h | ADR 框架 + task_manager 统一 + API Client |
| Sprint 2 | 3 天 | E1-S3/S4 (1h) + E2-S1/S2/S3 (4h) + E3-S1/S2 (3h) | 8h | Query 迁移 + 虚拟化 + Storybook |
| 缓冲 | 1 天 | 回归测试 + Code Review + 修复 | 1h | 全员可提 PR |

---

## Epic E1: TanStack Query 统一 API Client


## Sprint 1 — ADR 框架 + API Client（6h）

### E4-S1: 建立 ADR 框架与模板（0.5h）

**Owner**: Architect
**依赖**: 无
**交付物**: `docs/adr/TEMPLATE.md` + `docs/adr/INDEX.md`

**实施步骤**:

```bash
# 1. 创建目录
mkdir -p docs/adr

# 2. 创建 TEMPLATE.md
cat > docs/adr/TEMPLATE.md << 'EOF'
# ADR-XXX: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or harder because of this change?

## Alternatives Considered
### Option A: [Title]
[Description + trade-offs]

### Option B: [Title]
[Description + trade-offs]
EOF

# 3. 创建 INDEX.md
cat > docs/adr/INDEX.md << 'EOF'
# ADR Index

| ID | Title | Status | Date | Owner |
|----|-------|--------|------|-------|
| ... | ... | ... | ... | ... |

## Active ADRs
...

## Deprecated ADRs
...
EOF
```

---

### E4-S2: 撰写 6 个核心 ADR（2h）

**Owner**: Architect
**依赖**: E4-S1
**交付物**: ADR-001 ~ ADR-006

**ADR-001**: Firebase Presence vs Yjs CRDT（协作方案）
- **Decision**: Firebase Presence MVP → Yjs CRDT Epic 4 升级
- **Consequences**: MVP 快速交付，但 LWW 冲突需后续处理

**ADR-002**: TanStack Query vs Apollo Client（数据获取）
- **Decision**: TanStack Query（轻量、React 生态、无 GraphQL 迁移成本）
- **Consequences**: REST/SSE 统一缓存，GraphQL 场景未来可扩展

**ADR-003**: REST+SSE vs GraphQL（API 架构）
- **Decision**: REST 主流 + SSE 协作，暂不上 GraphQL
- **Consequences**: 简单场景效率高，复杂嵌套查询需 client 聚合

**ADR-004**: Zustand vs Redux（状态管理）
- **Decision**: Zustand（轻量、TypeScript 友好）
- **Consequences**: 全局状态简洁，SSR 需要额外处理

**ADR-005**: CF Workers vs Node.js（运行时）
- **Decision**: Cloudflare Workers 前端部署 + Node.js 后端
- **Consequences**: Edge 部署快，后端受限于 V8 兼容性

**ADR-006**: canvasSseApi 演进路径
- **Decision**: 当前 SSE 推送 → 未来考虑 WebSocket + Yjs
- **Consequences**: SSE 简单但无双向通信，Yjs 提供 CRDT

---

### E4-S3: 提案模板关联 ADR 字段（0.5h）

**Owner**: Dev
**依赖**: E4-S2
**交付物**: proposals/TEMPLATE.md 更新

**实施步骤**:

```bash
# 1. 更新 proposals/TEMPLATE.md
# 在文件末尾增加：

## 关联 ADR
- [ ] 无关联 ADR（新提案）
- [ ] 关联已有 ADR（填写 ID）: ADR-XXX, ADR-YYY

# 2. 更新 onboarding 文档引用
# 在 onboarding/SKILL.md 或相关文档中添加：
# > 重大技术决策记录在 docs/adr/，提案时需关联已有 ADR
```

---

### E5-S1: 统一到 skills 版本（0.5h）

**Owner**: Dev
**依赖**: 无
**交付物**: 删除 vibex 副本

**实施步骤**:

```bash
# 1. 确认 skills 版本存在
ls ~/.openclaw/skills/team-tasks/scripts/task_manager.py

# 2. 查找 vibex 副本
find /root/.openclaw/vibex -name "task_manager.py" 2>/dev/null

# 3. 删除副本（如存在）
rm /root/.openclaw/vibex/scripts/task_manager.py 2>/dev/null
rmdir /root/.openclaw/vibex/scripts 2>/dev/null  # 空目录也删除

# 4. 全量 grep 确认无残留引用
grep -rn "vibex/scripts/task_manager\|/vibex/.*task_manager" \
  /root/.openclaw/vibex/ --include="*.md" --include="*.py" --include="*.ts" \
  --include="*.json" | grep -v "node_modules"

# 5. 更新引用（如有残留）
# 将所有引用替换为 ~/.openclaw/skills/team-tasks/scripts/task_manager.py
```

---

### E5-S2: 添加 --version 标志（0.5h）

**Owner**: Dev
**依赖**: E5-S1
**交付物**: task_manager.py --version 可用

**实施步骤**:

```python
# 在 task_manager.py argparse 配置中添加：

# 在 add_parser 之后添加：
# 注意：skills 版本可能已有此功能，如已有则跳过

# import sys
# if '--version' in sys.argv:
#     print('task_manager.py 1.0.0')
#     sys.exit(0)
```

---

### E1-S1: 新建统一 API Client（1h）

**Owner**: Dev
**依赖**: 无
**交付物**: `src/services/api/client.ts` 实现

**状态**: ✅ 完成 (commit b22c5277)
- [x] Percentiles/ApiMetrics 接口
- [x] logRequest 配置项
- [x] metrics 属性（requests/failures/latency P50/P95/P99）
- [x] 1000条滚动窗口
- [x] npm run build 通过

**实施步骤**:

#### Step 1: 实现 client.ts（0.5h）
**文件**: `src/lib/api/client.ts`（新建）

```typescript
import type { ApiError, ApiClientConfig } from './types';

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.vibex.top',
  retry: 3,
  retryDelay: 1000,
  timeout: 10000,
};

class ApiClient {
  private config: ApiClientConfig;
  private headers: Record<string, string>;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.headers[key];
  }

  private async request<T>(
    method: string,
    url: string,
    options?: { body?: unknown; params?: Record<string, unknown> }
  ): Promise<T> {
    let fullUrl = `${this.config.baseUrl}${url}`;
    
    if (options?.params) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(options.params).filter(([, v]) => v != null))
      ).toString();
      fullUrl += `?${qs}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    let lastError: ApiError | null = null;
    
    for (let attempt = 0; attempt <= this.config.retry; attempt++) {
      try {
        const res = await fetch(fullUrl, {
          method,
          headers: this.headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          return res.json();
        }

        const data = await res.json().catch(() => ({}));
        lastError = {
          type: res.status >= 400 && res.status < 500 ? 'VALIDATION_ERROR' : 'SERVER_ERROR',
          status: res.status,
          message: (data as { message?: string }).message || `HTTP ${res.status}`,
          data,
        };

        // 4xx 不重试
        if (res.status >= 400 && res.status < 500) break;
      } catch (e) {
        if (e instanceof Error) {
          if (e.name === 'AbortError') {
            lastError = { type: 'TIMEOUT', message: 'Request timeout' };
          } else {
            lastError = { type: 'NETWORK_ERROR', message: e.message };
          }
        }
      }

      // 指数退避
      if (attempt < this.config.retry) {
        await new Promise(r => setTimeout(r, this.config.retryDelay * Math.pow(2, attempt)));
      }
    }

    throw lastError!;
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', url, { params });
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', url, { body });
  }
}

export const apiClient = new ApiClient();
export { type ApiError, type ApiClientConfig };
```

#### Step 2: 实现 types.ts（0.25h）
**文件**: `src/lib/api/types.ts`（新建）

```typescript
export type ApiErrorType = 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR' | 'VALIDATION_ERROR';

export interface ApiError {
  type: ApiErrorType;
  status?: number;
  message: string;
  data?: unknown;
}

export interface ApiClientConfig {
  baseUrl?: string;
  retry?: number;
  retryDelay?: number;
  timeout?: number;
}
```

#### Step 3: 运行已有测试（0.25h）
```bash
npm run test -- src/lib/api/client.test.ts
# 期望: 通过（测试文件已存在）
```

---

### E1-S2: 迁移 projects/components/contexts API（1h）

**Owner**: Dev
**依赖**: E1-S1
**交付物**: `useProjects.ts`, `useComponents.ts`, `useContexts.ts`

**实施步骤**:

#### Step 1: 创建 useProjects.ts（0.5h）
**文件**: `src/hooks/useProjects.ts`（新建）

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

async function fetchProjects(): Promise<Project[]> {
  return apiClient.get<Project[]>('/api/v1/projects');
}

export function useProjects(options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,  // 5 min
    enabled: options?.enabled ?? true,
  });
}
```

#### Step 2: 创建 useComponents.ts 和 useContexts.ts（0.5h）
**文件**: `src/hooks/useComponents.ts` 和 `useContexts.ts`（新建）

```typescript
// useComponents.ts
export function useComponents(projectId: string) {
  return useQuery({
    queryKey: queryKeys.components(projectId),
    queryFn: () => apiClient.get<Component[]>(`/api/v1/projects/${projectId}/components`),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}

// useContexts.ts
export function useContexts(projectId: string) {
  return useQuery({
    queryKey: queryKeys.contexts(projectId),
    queryFn: () => apiClient.get<Context[]>(`/api/v1/projects/${projectId}/contexts`),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}
```

---

## Epic E2: Canvas 虚拟化列表


## Sprint 2 — Query 迁移 + 虚拟化 + Storybook（8h）

### E1-S3: 消除散落 axios 调用（0.5h）

**Owner**: Dev
**依赖**: E1-S1
**交付物**: stores 无裸 fetch/axios

**验证**:
```bash
# 确认无裸 axios/fetch
grep -rn "axios\|fetch(" /root/.openclaw/vibex/vibex-fronted/src/stores \
  --include="*.ts" --include="*.tsx" | \
  grep -v "node_modules\|// \|import\|export\|queryClient\|setQueryData"

# 期望: 无输出
```

---

### E1-S4: SSE 数据写入 Query 缓存（0.5h）

**Owner**: Dev
**依赖**: E1-S1, E1-S2
**交付物**: `sseToQueryBridge.ts`

**实施步骤**:

```typescript
// src/lib/api/sseToQueryBridge.ts
import { produce } from 'immer';
import type { QueryClient } from '@tanstack/react-query';

interface SSEBridgeOptions {
  queryClient: QueryClient;
  mergeStrategy?: 'replace' | 'deep-merge';
}

export function createSSEBridge(options: SSEBridgeOptions) {
  const { queryClient, mergeStrategy = 'deep-merge' } = options;

  return {
    setQueryData: <T>(queryKey: unknown[], data: T) => {
      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return data;
        if (mergeStrategy === 'replace') return data;
        // deep-merge: 保留旧数据，合并新数据
        return produce(old, (draft: T) => {
          Object.assign(draft, data);
        });
      });
    },
  };
}
```

---

### E2-S1: ComponentTree 虚拟化（2h）

**Owner**: Dev
**依赖**: E1-S1（可选）
**交付物**: 虚拟化 ComponentTree

**实施步骤**:

#### Step 1: 安装依赖（已安装，跳过）
```bash
# 已有 @tanstack/react-virtual
pnpm list @tanstack/react-virtual
```

#### Step 2: 改造 ComponentTree.tsx（1.5h）
**文件**: `src/components/canvas/ComponentTree.tsx`（改造）

```typescript
// 新增导入
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// 1. 生成扁平化节点列表（包含展开路径）
const flattenedNodes = useMemo(() => 
  flattenTree(nodes, expandedIds), [nodes, expandedIds]
);

// 2. 创建虚拟化实例
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: flattenedNodes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) => flattenedNodes[index].isExpanded ? 300 : 56,
  measureElement: (element) => element.getBoundingClientRect().height,
  overscan: 5,
});

// 3. 替换渲染
<div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map((virtualItem) => (
      <div
        key={virtualItem.key}
        data-index={virtualItem.index}
        ref={virtualizer.measureElement}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualItem.start}px)`,
        }}
      >
        <TreeNodeComponent node={flattenedNodes[virtualItem.index]} />
      </div>
    ))}
  </div>
</div>
```

#### Step 3: 性能验证（0.5h）
```typescript
// Playwright 测试
it('100 节点滚动 ≥ 55fps', async () => {
  const fps = await measureFPSWith100Nodes();
  expect(fps).toBeGreaterThanOrEqual(55);
});

it('500 节点初始渲染 < 200ms', async () => {
  const ms = await measureInitialRender500Nodes();
  expect(ms).toBeLessThan(200);
});
```

---

### E2-S2: BusinessFlowTree 虚拟化（1.5h）

**Owner**: Dev
**依赖**: E2-S1
**交付物**: 虚拟化 BusinessFlowTree

**差异点**（相对 ComponentTree）:
- BusinessFlowTree 有协作模式下的滚动同步需求
- 虚拟滚动同步通过 Firebase cursor position 广播 `scrollTop`
- 需确保 overscan=5 不会导致同步延迟

---

### E2-S3: 树节点交互完整性（0.5h）

**Owner**: Dev
**依赖**: E2-S1
**交付物**: 所有交互正常工作

**关键测试**:
```typescript
// 拖拽在虚拟列表中需要额外处理
// 使用 HTML5 Drag API 的 getDragData/setDragImage
// 虚拟化列表中的 drag events 需要特殊处理：

virtualizer.getVirtualItems().forEach(item => {
  const node = flattenedNodes[item.index];
  element.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ nodeId: node.id }));
  });
});
```

---

### E3-S1: 配置 Chromatic CI（1h）

**Owner**: Dev
**依赖**: 无
**交付物**: .storybook 已有，配置 Chromatic

**实施步骤**:

```bash
# 1. 安装 chromatic（如果需要）
pnpm add -D chromatic

# 2. 创建 .storybook/main.ts 配置 chromatic
# 注意：现有 .storybook/main.ts 已存在，只需添加

# 3. 创建 .env.storybook
# STORYBOOK_CHROMATIC_PROJECT_TOKEN=your_token

# 4. 创建 GitHub Actions workflow
# .github/workflows/chromatic.yml
```

**GitHub Actions 示例**:
```yaml
- name: Publish to Chromatic
  uses: chromaui/action@latest
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    onlyChanged: true
    exitOnceUploaded: false
```

---

### E3-S2: 补全缺失 stories（2h）

**Owner**: Dev
**依赖**: E3-S1
**交付物**: 5 个缺失组件 stories

**需补全**（12 个已有: Alert/Avatar/Badge/Button/Card/Input/Loading/Modal/Select/Skeleton/Tabs/Toast）:

| 组件 | 路径 | Variants |
|------|------|----------|
| TreeNode | `src/components/canvas/TreeNode.stories.tsx` | default/selected/expanded/collapsed/dragOver |
| PresenceLayer | `src/components/canvas/PresenceLayer.stories.tsx` | 0-users/1-user/multiple-users |
| ConflictBubble | `src/components/canvas/ConflictBubble.stories.tsx` | single-conflict/multi-conflict |
| ContextMenu | `src/components/ui/ContextMenu.stories.tsx` | default/with-icons/nested |
| Tooltip | `src/components/ui/Tooltip.stories.tsx` | top/bottom/left/right |

**注意**: PresenceLayer 和 ConflictBubble 可能尚未实现（Phase 1 交付物）。如果未实现，先写 story 骨架（storybook 允许 story without implementation）。

---

## Sprint 缓冲 — 回归 + 修复（1h）

**Owner**: Dev + Reviewer
**依赖**: Sprint 1 + Sprint 2
**交付物**: 所有 PR Merge

**回归测试清单**:
- [ ] `npm run build` 通过（无 TypeScript 错误）
- [ ] `npm run lint` 无新增 warning
- [ ] TanStack Query 并发去重验证（100 并发 → 1 请求）
- [ ] 虚拟化性能验证（100 节点 ≥55fps）
- [ ] Storybook 启动成功（`npm run storybook`）
- [ ] ADR-001~006 内容完整
- [ ] task_manager.py --version 正常输出
- [ ] CHANGELOG.md 更新

---

## 风险缓解预案

| 风险 | 可能性 | 影响 | 预案 |
|------|--------|------|------|
| SSE + Query 缓存深合并冲突 | 中 | 中 | immer 深合并；如仍冲突，降级为 replace 策略 |
| 虚拟化拖拽失效 | 中 | 高 | 拖拽事件单独处理，不依赖虚拟列表渲染 |
| 虚拟化高度测量不准确 | 低 | 中 | overscan=5 + 缓存高度，预留额外空间 |
| client.test.ts 与实现不匹配 | 低 | 低 | 先实现 client.ts，再运行测试 |
| 协作组件 stories 在实现前 | 低 | 低 | 先写 story 骨架，后续填充 |

---

*Architect Agent | 2026-04-08 23:43 GMT+8*
