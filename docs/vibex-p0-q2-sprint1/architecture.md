# Architecture: VibeX Q2 Sprint 1 — P0清理 + 核心体验

> **类型**: Sprint Implementation  
> **日期**: 2026-04-14  
> **依据**: prd.md (vibex-p0-q2-sprint1)

---

## 1. Problem Frame

Q2 Sprint 1 的核心任务：清理 P0 级问题（Auth 样式）+ 提升 4 个核心产品体验。总工时 27h，6 个 Epic。

---

## 2. System Architecture

```mermaid
graph TB
    subgraph E1["E1: Auth CSS"]
        AUTH[auth/page.tsx<br/>CSS Module迁移]
        TOKENS[design-tokens.css<br/>统一变量]
    end

    subgraph E2["E2: Dashboard Search"]
        SEARCH[Dashboard Fuzzy<br/>Search"]
        API[API projects<br/>LIKE查询"]
    end

    subgraph E3["E3: Canvas Nav"]
        TAB[TabBar.tsx<br/>Phase对齐]
        NAV[PhaseNavigator<br/>行为同步]
    end

    subgraph E4["E4: Error Format"]
        ERR[lib/api-error.ts<br/>统一错误"]
        ROUTES[61 routes<br/>错误替换"]
        HANDLER[前端错误<br/>hooks/toast"]
    end

    subgraph E5["E5: AI Clarification"]
        CARD[ClarificationCard<br/>澄清卡片"]
        PROMPT[AI Prompt<br/>追问设计"]
        STATE[ClarificationState<br/>多轮状态"]
    end

    subgraph E6["E6: Bundle"]
        AUDIT[bundle audit<br/>分析报告"]
        DYN[dynamic()<br/>lazy import"]
    end

    AUTH --> TOKENS
    SEARCH --> API
    TAB --> NAV
    ERR --> ROUTES
    ERR --> HANDLER
    CARD --> PROMPT
    DYN --> AUDIT
```

---

## 3. Technical Decisions

### 3.1 E1: Auth CSS 迁移

**当前问题**: `pagelist/page.tsx` 整页浅色主题，`auth/page.tsx` 已基本迁移（仅有 validateReturnTo 安全相关内联样式保留）。

**真实 scope**: 审计 `app/auth/` 下所有文件，确保无其他浅色残留。

```bash
# 验证命令
grep -rn "style={{" vibex-fronted/src/app/auth/ \
  --include="*.tsx" | grep -v validateReturnTo
```

### 3.2 E4: 统一 API 错误格式

**问题**: 61 个后端路由错误格式不一致。

**方案**: E5 统一错误格式（lib/api-error.ts）参照 architect-proposals 规范，**本 Sprint 自行实现**。

```typescript
// vibex-backend/src/lib/api-error.ts
export function apiError(code: string, message: string, details?: unknown) {
  return new Response(JSON.stringify({
    error: { code, message, details }
  }), { status: STATUS_MAP[code], headers: { 'Content-Type': 'application/json' } });
}

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};
```

**trade-off**: 61 个文件替换是 4h 工时，不是"复用"。实施时需逐文件验证。

### 3.3 E5: AI Clarification 卡片

**关键设计点**:

1. **澄清问题数量**: 每轮 ≤3 个问题，最多 3 轮追问
2. **自动结束条件**: 连续 2 轮无新信息（LLM 判断）
3. **Skip 行为**: 用户可随时跳过，进入生成流程

**ClarificationCard 组件**:
```typescript
interface ClarificationCardProps {
  question: string;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  index: number;    // 1-based
  total: number;
}
```

**组件设计**: 新建 `ClarificationCard.tsx`，从 `ClarificationDialog.tsx` 提取。

**追问 Prompt**: 见 specs/E5-ai-clarification.md §E5.2，核心是结构化 JSON 输出。

### 3.4 E6: Bundle Dynamic Import

**候选组件** (重复，已在 architect-proposals 中识别):
| 组件 | 位置 | 节省估计 |
|------|------|---------|
| MermaidRenderer | × 3 | ~150KB each |
| TemplateSelector | × 3 | ~80KB each |

**注意**: Q2 Sprint 1 范围仅包含 bundle audit 工具和 dynamic import 框架，**MermaidRenderer 合并**是 Architect 提案 P0-2 的范围，Sprint 1 只需提供 dynamic import 脚手架。

### 3.5 E3: Canvas TabBar

**当前问题**: TabBar 和 PhaseNavigator 行为不对称。

**方案**: 添加 phase 参数到 TabBar，Phase1 仅显示"输入/澄清"步骤。

---

## 4. API Design

### 4.1 E2 Search API

```
GET /api/projects?q={query}
```

```typescript
// Response
{ projects: Project[], total: number }
// 先获取所有 projects，再内存过滤（D1 不支持动态 LIKE 参数预编译）
```

### 4.2 E4 Error Format (全局)

```typescript
// 所有错误响应
{ error: { code: string, message: string, details?: unknown } }

// 前端错误处理
const handleApiError = (response: Response) => {
  const { error } = await response.json();
  toast.error(`${error.code}: ${error.message}`);
};
```

---

## 5. Performance & Scale

| Epic | 关注点 | 缓解 |
|------|--------|------|
| E2 | D1 LIKE 查询 10k+ data | debounce 300ms + 未来迁移 Workers Search |
| E5 | AI 追问延迟 | 流式返回 + 前端乐观更新 |
| E6 | 首屏 bundle 增大 | dynamic import 减少初始加载 |

---

## 6. Security

| Epic | 安全 | 措施 |
|------|------|------|
| E4 | 错误信息泄露 | 仅返回 code + message，不暴露 stack trace |
| E1 | validateReturnTo | 保留内联样式（安全验证逻辑） |

---

## 7. Open Questions

| 问题 | 状态 | 决定 |
|------|------|------|
| E5 自动结束判断由 LLM 还是规则 | 待定 | 第一版用规则（连续 2 轮无新字段）|
| E5 追问内容缓存 | 待定 | 第一版不缓存，每次重新生成 |

---

## 8. Verification

- [ ] E1: `grep -rn "style={{" app/auth/page.tsx` 仅剩 validateReturnTo
- [ ] E2: 搜索返回正确结果，debounce 300ms
- [ ] E3: TabBar Phase1 仅显示相关 tabs
- [ ] E4: 所有 API 错误格式一致 `{ error: { code, message } }`
- [ ] E5: ClarificationCard 显示问题、接受回答、Skip 工作正常
- [ ] E6: bundle audit 报告生成，dynamic import 脚手架就位

---

*Architect Agent | 2026-04-14*
