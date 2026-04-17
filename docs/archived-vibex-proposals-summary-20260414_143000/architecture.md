# Architecture: VibeX 提案汇总 — Sprint 1 合并架构

> **类型**: Multi-Project Sprint Synthesis  
> **日期**: 2026-04-14  
> **依据**: vibex-pm-proposals (E1/E3/E4/E5), vibex-architect-proposals (P0/P1)  
> **工作目录**: /root/.openclaw/vibex

---

## 执行决策

- **决策**: 待评审
- **执行项目**: vibex-pm-proposals-20260414_143000 + vibex-dev-proposals-20260414_143000
- **执行日期**: 待定

---

## 1. Problem Frame

本项目是 VibeX Sprint 1 的合并架构，整合 PM 提案和 Architect 提案中 Sprint 1 范围内的条目。避免重复实现，确保跨提案的技术决策一致。

**Sprint 1 合并 Scope**:

| 合并项 | 来源 | 优先级 | 合并理由 |
|--------|------|--------|---------|
| Brand Consistency | PM E1 + Architect P0-1 | P0 | 同一页面，多源重复 |
| Error Experience | PM E5 + Architect P1-3 | P0 | 统一 API 错误格式是基础设施 |
| Dashboard Search | PM E3 | P1 | 独立功能，无重叠 |
| Canvas Nav | PM E4 | P1 | 独立功能，无重叠 |
| Bundle Dynamic Import | PM E1 Bundle + Architect P1-1 | P1 | 同一优化目标 |

---

## 2. Sprint 1 Architecture

### 2.1 Architecture Diagram

```mermaid
graph TB
    subgraph Sprint1["Sprint 1 Scope"]
        BRAND[Brand Consistency<br/>E1: Auth CSS]
        ERR[Error Experience<br/>E5: Unified API Errors]
        SEARCH[Dashboard Search<br/>E3: Fuzzy Search]
        CANVAS[Canvas Nav<br/>E4: TabBar Symmetry]
        BUNDLE[Bundle Optimization<br/>Dynamic Import]
    end

    subgraph Refs["引用项目"]
        PM["vibex-pm-proposals<br/>architecture.md"]
        ARCH["vibex-architect-proposals<br/>proposals/impact"]
    end

    BRAND --> PM
    ERR --> PM
    ERR --> ARCH
    SEARCH --> PM
    CANVAS --> PM
    BUNDLE --> ARCH

    ERR --> E5_API[apiError()<br/>lib/api-error.ts]
    ERR --> E5_BE[61 backend routes<br/>统一错误格式]
    ERR --> E5_FE[API error<br/>hooks]

    BRAND --> E1_AUTH[app/auth/<br/>CSS Module迁移]
    E1_AUTH --> DESIGN[design-tokens.css<br/>统一设计变量]

    BUNDLE --> B1_DYN[dynamic()<br/>重组件按需加载]
    B1_DYN --> B1_CONF[next.config.js<br/>重写规则]
```

### 2.2 合并 Epic 清单

| Epic | 来源 | 对应源文档 | 状态 |
|------|------|-----------|------|
| E1 Brand | PM E1 + Arch P0-1 | `vibex-pm-proposals/architecture.md` §3.1 | 引用 |
| E2 AI Clarification | PM E2 | — | 范围外 (Sprint 2) |
| E3 Search | PM E3 | `vibex-pm-proposals/architecture.md` §3.3 | 引用 |
| E4 Canvas | PM E4 | `vibex-pm-proposals/architecture.md` §3.4 | 引用 |
| E5 Errors | PM E5 + Arch P1-3 | 见 §3 | 本文档统一 |
| E6 Teams | PM E6 | — | 范围外 (Sprint 2+) |
| E7 Version | PM E7 | — | 范围外 (Sprint 2+) |
| E8 Import/Export | PM E8 | — | 范围外 (Sprint 2+) |
| Bundle Opt | Arch P1-1 + PM E1 Bundle | `vibex-architect-proposals/proposals/` | 见 §3.6 |

---

## 3. 跨项目技术决策

### 3.1 E5 Error Experience — 统一 API 错误格式 (合并 P-010 + A-P1-3)

**合并决策**: PM 的 P-010 错误体验统一 和 Architect 的 P1-3 API 错误格式统一是同一件事。

**统一实现方案**:

```typescript
// vibex-backend/src/lib/api-error.ts
export function apiError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: unknown
) {
  const status = ERROR_CODES[code];
  return new Response(JSON.stringify({
    error: { code, message, details }
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;
```

**涉及路由**: 全部 61 个后端路由文件。PM 负责替换，Architect 提供规范。

**trade-off**: 61 个文件替换是 4h 工作量，在 PM Sprint 1 预算内。

### 3.2 E1 Brand Consistency — Auth CSS + 统一设计变量

**合并决策**: PM 的 Auth CSS 迁移 (E1) 和 Architect 的设计系统完善 (P0-1) 合并。

**分工**: PM 负责 Auth 页面迁移，Architect 负责 design-tokens.css 完善。

**Auth 迁移检查点**:
```bash
# 验证迁移完成
grep -rn "style={{" vibex-fronted/src/app/auth/page.tsx
# 应仅剩 validateReturnTo 安全相关样式
```

### 3.3 Bundle Dynamic Import — 合并 PM + Architect

**合并决策**: PM 的 E1 Bundle 优化 和 Architect 的 P1-1 组件重复优化有重叠。

**候选文件** (重复组件，去重后按需加载):
| 文件 | 当前状态 | 优化方式 |
|------|---------|---------|
| `MermaidRenderer` × 3 | 全部同步加载 | `dynamic()` 按需 |
| `TemplateSelector` × 3 | 全部同步加载 | `dynamic()` 按需 |
| `ThinkingPanel` × 2 | 全部同步加载 | `dynamic()` 按需 |

**实现方式**:
```typescript
// 在需要使用的组件中
import dynamic from 'next/dynamic';

const MermaidRenderer = dynamic(
  () => import('@/components/mermaid/MermaidRenderer'),
  { loading: () => <Skeleton /> }
);
```

**trade-off**: dynamic() 会增加首屏渲染的异步开销，需要对这三个高频组件保留同步加载，其余按需。

---

## 4. Sprint 1 文件变更清单

### 4.1 新增文件

```
vibex-backend/src/lib/api-error.ts          # E5 统一错误函数
vibex-backend/migrations/001_add_teams.sql # E6 (Sprint 2 预留)
```

### 4.2 修改文件

| 文件 | 变更 | Epic |
|------|------|------|
| `vibex-fronted/src/app/auth/page.tsx` | CSS 迁移 | E1 |
| `vibex-fronted/src/app/auth/auth.module.css` | 扩展样式 | E1 |
| `vibex-backend/src/routes/*.ts` | 61个文件统一错误格式 | E5 |
| `vibex-fronted/src/app/dashboard/page.tsx` | 搜索组件集成 | E3 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | Phase 对齐 | E4 |
| `vibex-fronted/src/next.config.js` | dynamic import 配置 | Bundle |

### 4.3 Sprint 1 不涉及的文件

以下 PM Epic 移到 Sprint 2+:
- E2 AI Clarification (AI prompt 调优)
- E6 Teams API (需要 D1 schema)
- E7 Version History (依赖 Teams)
- E8 Import/Export (需要 schema 定义)

---

## 5. Performance Impact

| 变更 | 性能影响 | 缓解 |
|------|---------|------|
| E5 统一错误格式 | 无 | — |
| E1 Auth CSS | 无 | — |
| E3 Dashboard Search | debounce 300ms 减少查询 | 前端节流 |
| E4 Canvas Tab | 无 | — |
| Bundle dynamic import | 首屏渲染 +100-200ms (异步) | 仅重组件使用 |

---

## 6. Dependencies & Sequencing

```
Sprint 1 依赖链:
  E5 (apiError) ── 前置 ── 所有其他 Epic (都需要统一错误格式)

  E5 后端实现 (2h)
      ↓
  E5 路由替换 (2h) ── 并行 ── E1 Auth 迁移 (2h)
      ↓
  E3 Search 实现 (2h) ── 并行 ── E4 TabBar (1h)
      ↓
  Bundle Dynamic Import (3h)
```

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| E5 61个路由替换遗漏 | 🟡 中 | 🔴 高 | grep 检查 `new Response` 未替换 |
| Bundle dynamic 影响首屏 | 🟡 中 | 🟡 中 | 仅对 MermaidRenderer 等重组件使用 |
| E3 搜索性能 (10k+ data) | 🟡 中 | 🟡 中 | debounce + 未来迁移 Search |

---

## 8. Open Questions

| 问题 | 状态 | 决定 |
|------|------|------|
| E3 搜索是否需要权限过滤 | 待定 | 与 Auth 层配合 |
| Bundle dynamic 对 SSR 的影响 | 待评估 | Next.js dynamic 文档确认 |
| E5 错误码映射完整性 | PM 实施时验证 | 61个路由逐一确认 |

---

## 9. Reference Documents

- PM Architecture: `docs/vibex-pm-proposals-20260414_143000/architecture.md`
- Architect Proposals: `docs/vibex-architect-proposals-20260414_143000/proposals/architect-proposals.md`
- Architect Impact: `docs/vibex-architect-proposals-20260414_143000/proposals/architect-impact.md`

---

*Architect Agent | 2026-04-14*
