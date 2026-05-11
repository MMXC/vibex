# VibeX Sprint 36 — Implementation Plan

**Agent**: architect
**Date**: 2026-05-11
**Version**: v1.0

---

## 1. Sprint Overview

| Field | Value |
|-------|-------|
| Total Epics | 5 (E1–E5) |
| Total Stories | 8 |
| Total Estimated Effort | 7–10 person-days |
| Parallel Tracks | E1+E2 并行；E3+E4+E5 可并行开发 |

---

## 2. Implementation Order

```
Week 1 (Day 1–3)
├── E4 (0.5d) — DDSToolbar Undo/Redo (最小，快速验收)
├── E3 (0.5d) — CI Gate (独立，不影响其他 Epic)
└── E2 (2-3d) — 模板市场 MVP (backend + frontend)
    ├── S2.1: Marketplace API + 静态数据
    └── S2.2: Dashboard 模板页 Industry Filter

Week 1-2 (Day 3–7)
└── E1 (3-5d) — 多人协作 MVP
    ├── S1.1: RemoteCursor 挂载
    ├── S1.2: useRealtimeSync 集成
    └── S1.3: Presence E2E 测试

Week 2 (Day 5–7)
└── E5 (1d) — Design Review E2E 补全
    ├── S5.1: 降级路径 E2E 测试
    └── S5.2: 评审结果三 Tab E2E 验证
```

**可并行 Story**：
- E3、S2.1 可在 E4 完成前启动（无依赖）
- E5 的 S5.1/S5.2 可与 E1/E2 并行开发（无依赖）
- E2 的 S2.2 依赖 S2.1（marketplace API 需先就绪）

---

## 3. Story-by-Story Implementation Steps

### Epic E4: 撤销重做 Toolbar 补全 (0.5d)

#### S4.1: DDSToolbar Undo/Redo 按钮

**修改文件**: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`

**实施步骤**:

1. 导入 canvasHistoryStore：
   ```typescript
   import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
   ```

2. 添加 undo/redo 图标（使用 lucide-react 或内联 SVG）：
   ```tsx
   // 在现有图标函数后添加
   function UndoIcon() {
     return (
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
         <path d="M3 7v6h6M3 13c1.5-4.5 5.5-8 11-8 5.5 0 10 4.5 10 10s-4.5 10-10 10c-3.5 0-6.5-1.5-8.5-4" />
       </svg>
     );
   }
   ```

3. 在 Toolbar 组件内添加状态读取：
   ```tsx
   const canUndo = useCanvasHistoryStore((s) => s.canUndo());
   const canRedo = useCanvasHistoryStore((s) => s.canRedo());
   const undo = useCanvasHistoryStore((s) => s.undo);
   const redo = useCanvasHistoryStore((s) => s.redo);
   ```

4. 在工具按钮区域添加按钮（位于 AI 生成按钮左侧）：
   ```tsx
   <div className="toolbar-group">
     <button
       data-testid="undo-btn"
       onClick={undo}
       disabled={!canUndo}
       title="撤销 (Ctrl+Z)"
       className="toolbar-btn"
       aria-label="撤销"
     >
       <UndoIcon />
     </button>
     <button
       data-testid="redo-btn"
       onClick={redo}
       disabled={!canRedo}
       title="重做 (Ctrl+Shift+Z)"
       className="toolbar-btn"
       aria-label="重做"
     >
       <RedoIcon />
     </button>
   </div>
   ```

5. 样式调整（参考现有 toolbar-btn 样式）：
   ```css
   /* DDSToolbar.module.css */
   .toolbar-btn:disabled {
     opacity: 0.4;
     cursor: not-allowed;
   }
   ```

**验收检查点**:
- [ ] `expect(screen.getByTestId('undo-btn')).toBeInTheDocument()`
- [ ] `expect(screen.getByTestId('redo-btn')).toBeInTheDocument()`
- [ ] `expect(screen.getByTestId('undo-btn')).toHaveAttribute('disabled')` when `canUndo === false`
- [ ] Ctrl+Z / Ctrl+Shift+Z 快捷键仍正常触发 undo/redo

**回滚**: 删除按钮 JSX，移除导入。

---

### Epic E3: MCP DoD CI Gate (0.5d)

#### S3.1: Tool Index CI 验证

**修改文件**: `.github/workflows/test.yml`

**实施步骤**:

1. 在现有 `test.yml` 文件的 `jobs` 下添加新 job：

```yaml
  generate-tool-index:
    name: Generate and verify MCP tool index
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate tool index
        run: node scripts/generate-tool-index.ts

      - name: Check for index changes
        run: |
          if git diff --exit-code docs/mcp-tools/INDEX.md; then
            echo "INDEX.md is up to date"
          else
            echo "ERROR: INDEX.md is out of sync with tool definitions"
            echo "Please run 'node scripts/generate-tool-index.ts' and commit the changes"
            exit 1
          fi
```

2. 添加 trigger paths（已有 paths 配置，扩展即可）：
   ```yaml
   paths:
     - 'packages/mcp-server/src/tools/**/*.ts'
     - 'scripts/generate-tool-index.ts'
   ```

**验收检查点**:
- [ ] `grep "generate-tool-index" .github/workflows/test.yml` 返回 job name
- [ ] CI job exit code = 0（INDEX.md 同步时）
- [ ] CI job exit code = 1（INDEX.md 失步时）
- [ ] PR 提交 tool 文件变更时触发该 job

**回滚**: 从 test.yml 中删除 `generate-tool-index` job。

---

### Epic E2: 模板市场 MVP (2-3d)

#### S2.1: Marketplace API + 静态数据 (1d)

**新增文件**: 
- `vibex-backend/src/app/api/templates/marketplace/route.ts`
- `vibex-backend/public/data/marketplace-templates.json`

**实施步骤**:

1. 创建静态数据文件：
```json
{
  "templates": [
    {
      "id": "tpl_mkt_001",
      "name": "SaaS Dashboard Pro",
      "industry": "saas",
      "description": "企业级 SaaS 管理后台模板，包含数据可视化和用户管理模块",
      "tags": ["dashboard", "data-viz", "admin"],
      "icon": "📊",
      "previewUrl": "/images/templates/saas-dashboard.png",
      "usageCount": 1247,
      "createdAt": "2026-03-01"
    },
    {
      "id": "tpl_mkt_002",
      "name": "Mobile Commerce Kit",
      "industry": "mobile",
      "description": "移动电商模板，包含商品展示、购物车和订单流程",
      "tags": ["ecommerce", "mobile", "shopping"],
      "icon": "🛒",
      "previewUrl": "/images/templates/mobile-commerce.png",
      "usageCount": 892,
      "createdAt": "2026-03-15"
    },
    {
      "id": "tpl_mkt_003",
      "name": "E-commerce Starter",
      "industry": "ecommerce",
      "description": "电商落地页模板，适合快速搭建产品展示和转化页面",
      "tags": ["landing", "product", "conversion"],
      "icon": "🛍️",
      "previewUrl": "/images/templates/ecommerce-landing.png",
      "usageCount": 2103,
      "createdAt": "2026-02-20"
    }
  ],
  "meta": {
    "total": 3,
    "lastUpdated": "2026-05-01"
  }
}
```

2. 创建 API route：
```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'marketplace-templates.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}
```

**验收检查点**:
- [ ] `curl http://localhost:3000/api/templates/marketplace` 返回 200
- [ ] `body.templates.length >= 3`
- [ ] 每个模板含 `id`, `industry`, `description`, `tags`, `icon`, `previewUrl`, `usageCount`, `createdAt`

**回滚**: 删除 route.ts 和 marketplace-templates.json。

---

#### S2.2: Dashboard 模板页 Industry Filter (1.5d)

**修改文件**: `vibex-fronted/src/app/dashboard/templates/page.tsx`

**实施步骤**:

1. 添加 industry state 和 useSWR 请求：
```tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MarketplaceTemplate {
  id: string;
  name: string;
  industry: 'saas' | 'mobile' | 'ecommerce';
  description: string;
  tags: string[];
  icon: string;
  previewUrl: string;
  usageCount: number;
  createdAt: string;
}

export default function TemplatesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const { data } = useSWR<{ templates: MarketplaceTemplate[] }>('/api/templates/marketplace', fetcher);

  const industries = ['saas', 'mobile', 'ecommerce'];

  const filteredTemplates = selectedIndustry
    ? data?.templates.filter((t) => t.industry === selectedIndustry)
    : data?.templates ?? [];
```

2. 添加 industry filter tabs：
```tsx
<div role="tablist" className="industry-filter">
  <button
    role="tab"
    aria-selected={selectedIndustry === null}
    onClick={() => setSelectedIndustry(null)}
  >
    全部
  </button>
  {industries.map((ind) => (
    <button
      key={ind}
      role="tab"
      aria-selected={selectedIndustry === ind}
      onClick={() => setSelectedIndustry(ind)}
    >
      {ind.charAt(0).toUpperCase() + ind.slice(1)}
    </button>
  ))}
</div>
```

3. 渲染模板卡片网格：
```tsx
<div className="template-grid">
  {filteredTemplates.map((tpl) => (
    <div key={tpl.id} data-testid="template-card" className="template-card">
      <span className="template-icon">{tpl.icon}</span>
      <h3>{tpl.name}</h3>
      <p>{tpl.description}</p>
      <span className="usage-count">使用 {tpl.usageCount} 次</span>
    </div>
  ))}
</div>
```

4. 添加空状态容错：
```tsx
{filteredTemplates.length === 0 && selectedIndustry && (
  <p>该行业暂无模板</p>
)}
```

**验收检查点**:
- [ ] `expect(screen.getByRole('tab', { name: /saas/i })).toBeInTheDocument()`
- [ ] 点击 saas tab 后 `template-card` 数量 > 0
- [ ] 无 "no templates found" 错误文案（非空时）

**回滚**: 回退 page.tsx 到修改前版本，删除 marketplace route。

---

### Epic E1: 多人协作 MVP (3-5d)

#### S1.1: RemoteCursor 挂载 (1.5d)

**修改文件**: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`

**实施步骤**:

1. 导入 RemoteCursor 组件：
```typescript
import { RemoteCursor } from '@/components/presence/RemoteCursor';
```

2. 在 Canvas overlay 层添加 RemoteCursor（条件守卫）：
```tsx
{/* Remote cursors overlay */}
{isFirebaseConfigured() && <RemoteCursor />}
```

3. 检查 RemoteCursor 组件的 Props 接口是否需要调整：
```typescript
// RemoteCursor.tsx 预期 props：
interface RemoteCursorProps {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color?: string;
  // ...
}

// 如果 RemoteCursor 从 usePresence store 获取数据（不需要直接传入）：
// 则当前 JSX 直接挂载即可，RemoteCursor 内部订阅 store
```

**验收检查点**:
- [ ] `DDSCanvasPage.tsx` render 输出中包含 `<RemoteCursor />`
- [ ] `isFirebaseConfigured()` 为 false 时不渲染 RemoteCursor
- [ ] Firebase mock 模式下 E2E 测试中 RemoteCursor 可见

**回滚**: 删除 RemoteCursor 导入和 JSX。

---

#### S1.2: useRealtimeSync 集成 (1d)

**修改文件**: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`

**实施步骤**:

1. 导入 useRealtimeSync：
```typescript
import useRealtimeSync from '@/hooks/useRealtimeSync';
```

2. 在 DDSCanvasPage 组件内调用 hook：
```tsx
// 在 useEffect 或组件 body 中
useRealtimeSync({
  projectId,
  userId: currentUser?.uid ?? 'anonymous',
});
```

3. 确认 useRealtimeSync 已订阅的 store（contextStore, flowStore, componentStore）已在 canvas 中使用。

**验收检查点**:
- [ ] `DDSCanvasPage.tsx` 包含 `import { useRealtimeSync }` 或 `import useRealtimeSync`
- [ ] `useRealtimeSync({ projectId, userId })` 在组件中被调用
- [ ] TypeScript 编译通过（无类型错误）

**回滚**: 移除 useRealtimeSync 调用和导入。

---

#### S1.3: Presence E2E 测试 (1.5d)

**新增文件**: `vibex-fronted/tests/e2e/presence-mvp.spec.ts`

**实施步骤**:
见 architecture.md Section 5.2 E1 测试用例代码。

**验收检查点**:
- [ ] `await expect(page.locator('[data-testid="remote-cursor"]').first()).toBeVisible({ timeout: 5000 })`
- [ ] `await expect(page.locator('[data-testid="presence-avatars"]')).toContainText(userName)`

**回滚**: 删除 presence-mvp.spec.ts。

---

### Epic E5: Design Review E2E 补全 (1d)

#### S5.1: 降级路径 E2E 测试 (0.5d)

**新增文件**: `vibex-fronted/tests/e2e/design-review-degradation.spec.ts`

**实施步骤**:
见 architecture.md Section 5.2 E5a 测试用例代码。

**验收检查点**:
- [ ] MCP 503 时页面显示「AI 评审暂时不可用」文案
- [ ] 页面不崩溃，canvas 仍可操作

**回滚**: 删除 design-review-degradation.spec.ts。

---

#### S5.2: 评审结果三 Tab E2E 验证 (0.5d)

**新增文件**: `vibex-fronted/tests/e2e/design-review-tabs.spec.ts`

**实施步骤**:
见 architecture.md Section 5.2 E5b 测试用例代码。

**验收检查点**:
- [ ] compliance / accessibility / reuse 三个 tab 可切换
- [ ] Tab 切换不触发页面刷新（`navCount === 0`）
- [ ] `reuse-score` 等 `data-testid` 元素存在于对应 tab

**回滚**: 删除 design-review-tabs.spec.ts。

---

## 4. Risk Mitigation

| Epic | 主要风险 | 缓解措施 |
|------|----------|----------|
| E1 | Firebase RTDB 20 并发上限 | 监控并发数，超限时 PresenceAvatars 显示「人数已达上限」 |
| E1 | RemoteCursor 与 usePresence 数据流不匹配 | 先验证 RemoteCursor 从 store 读取 remoteCursors，再挂载 |
| E2 | 静态 JSON 数据过期 | MVP 阶段可接受，定期手动更新（计划下个 Sprint 接入动态 API）|
| E2 | industry filter 与已有模板列表 UI 冲突 | 先验证 `/dashboard/templates` 现有 UI 结构，再增量添加 filter |
| E3 | CI job 误报（INDEX.md 自动生成的注释差异） | `generate-tool-index.ts` 使用确定性输出格式（无 timestamp 差异）|
| E4 | Undo/Redo 按钮与已有快捷键冲突 | Toolbar 按钮 `onClick` 触发 `undo()/redo()`，不拦截键盘事件 |
| E5 | E2E 测试不稳定（时序依赖） | Playwright mock 响应，设置合理 timeout（5000ms），mock 优先于 real API |

---

## 5. Time Estimates

| Epic | Stories | Estimated Effort | Notes |
|------|---------|------------------|-------|
| E1 | S1.1 + S1.2 + S1.3 | 3-5 person-days | RemoteCursor 组件已存在，仅需挂载 |
| E2 | S2.1 + S2.2 | 2-3 person-days | 静态 JSON，MVP 无 DB 依赖 |
| E3 | S3.1 | 0.5 person-days | 纯 CI 配置变更 |
| E4 | S4.1 | 0.5 person-days | 快捷键已完成，仅 Toolbar 按钮 |
| E5 | S5.1 + S5.2 | 1 person-day | E2E 测试文件新增，不改生产代码 |
| **Total** | **8 Stories** | **7-10 person-days** | — |

---

## 6. Verification Checklist per Epic

### E1 Verification
- [x] DDSCanvasPage.tsx 中 `<RemoteCursor />` JSX 存在
- [x] RemoteCursor 有 `isFirebaseConfigured()` 条件守卫
- [x] `useRealtimeSync` hook 在 DDSCanvasPage 中被调用
- [ ] `presence-mvp.spec.ts` E2E 测试通过（Firebase mock）
- [ ] TypeScript 类型检查通过：`tsc --noEmit`
- [ ] ESLint 检查通过：无 error

### E2 Verification
- [ ] GET `/api/templates/marketplace` 返回 200
- [ ] 返回 ≥3 个模板，字段完整（id/industry/icon 等）
- [ ] `/dashboard/templates` 页面包含 3 个 industry tab
- [ ] Tab 切换后模板列表正确过滤
- [ ] `templates-market.spec.ts` E2E 测试通过
- [ ] TypeScript 类型检查通过

### E3 Verification
- [ ] `.github/workflows/test.yml` 包含 `generate-tool-index` job
- [ ] job 在 tool 文件变更时触发（paths 配置正确）
- [ ] `git diff --exit-code docs/mcp-tools/INDEX.md` 非空时 CI fail
- [ ] CI run 成功（INDEX.md 同步时）

### E4 Verification
- [ ] `DDSToolbar.tsx` 包含 `data-testid="undo-btn"` button
- [ ] `DDSToolbar.tsx` 包含 `data-testid="redo-btn"` button
- [ ] undo 按钮 `disabled={!canUndo}` 正确
- [ ] redo 按钮 `disabled={!canRedo}` 正确
- [ ] Ctrl+Z / Ctrl+Shift+Z 快捷键仍触发 undo/redo
- [ ] `undo-redo.spec.ts` 或 `keyboard-shortcuts.spec.ts` 测试通过

### E5 Verification
- [ ] `design-review-degradation.spec.ts` 存在且 2 个测试通过
- [ ] MCP 503 时页面显示「AI 评审暂时不可用」
- [ ] `design-review-tabs.spec.ts` 存在且 4 个测试通过
- [ ] compliance / accessibility / reuse tab 可切换
- [ ] Tab 切换不触发页面刷新

---

*本文档由 architect agent 编写。*
*生成时间: 2026-05-11 20:10 GMT+8*