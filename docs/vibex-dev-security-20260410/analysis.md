# 安全修复需求分析
**项目**: vibex-dev-security-20260410  
**产出时间**: 2026-04-10  
**分析者**: analyst

---

## 📋 问题概览

| # | 问题 | 严重度 | 影响范围 |
|---|------|--------|---------|
| 1 | API 认证缺失 | P0 | /api/feedback, /api/quality/metrics, MCP server |
| 2 | 空 catch 块 | P0 | 20+ 文件，services/ 和 stores/ |
| 3 | 输入校验缺失 | P0 | /api/feedback (title/content 无长度/内容限制) |
| 4 | TypeScript as any 清理 | P1 | 14 个源文件 |
| 5 | CanvasPage 组件拆分 | P2 | 1 个 981 行巨型组件 |

---

## 问题 1: API 认证缺失 (P0)

### 问题定义
项目中存在 3 类无认证的 API 接口：

| 接口 | 类型 | 问题 |
|------|------|------|
| `/api/feedback` (POST) | Next.js Route | 任何人可提交反馈到 Slack，无身份验证 |
| `/api/quality/metrics` (GET) | Next.js Route | 公开暴露 CI 质量指标，无认证 |
| MCP Server (`packages/mcp-server`) | stdio | 无 auth token 验证，任何本地进程可调用工具 |

### 风险
- **反馈接口滥用**: 攻击者可批量 POST 垃圾反馈淹没 Slack 频道
- **指标泄露**: CI 构建状态、测试通过率等敏感运营数据暴露
- **MCP 工具滥用**: 恶意本地进程可调用 `execute` 工具执行任意操作

### 技术方案

**方案 A: Middleware 统一守卫 (推荐)**
```
Next.js middleware.ts 拦截 /api/* 路径
→ 校验 session cookie / Authorization header
→ 未授权返回 401
MCP server 添加 --auth-token 参数，启动时验证
```
- ✅ 集中管理，漏检率低
- ✅ 对现有 route handler 无侵入
- ⚠️ 需要 sessions 系统支持

**方案 B: 各 Route Handler 独立守卫**
```
每个 route.ts 添加 auth 校验代码
```
- ✅ 简单直接
- ⚠️ 分散管理，容易遗漏
- ⚠️ 20+ 文件需要改写

---

## 问题 2: 空 catch 块 (P0)

### 问题定义
20+ 个文件中存在静默吞掉异常的空 catch 块，分布在：

| 文件 | 位置 | 风险等级 |
|------|------|---------|
| `services/ai-client.ts` | 行 423, 434, 747 | 🔴 高 - AI 调用失败被忽略 |
| `stores/authStore.ts` | 行 112, 152 | 🔴 高 - 认证状态变更失败静默 |
| `services/plan/plan-service.ts` | 行 107 | 🟡 中 - JSON 解析失败忽略 |
| `services/themeStorage.ts` | 行 23, 36, 48 | 🟡 中 - localStorage 访问失败 |
| `services/dedup/index.ts` | 行 48 | 🟢 低 - 去重缓存失败 |
| `services/oauth/oauth.ts` | 行 214, 234 | 🟡 中 - OAuth 回调解析失败 |
| `services/export/ZipExporter.ts` | 行 152 | 🟡 中 - 导出异常忽略 |
| `services/github/github-import.ts` | 行 134 | 🟡 中 - GitHub 导入失败 |

### 风险
- **故障隐藏**: AI 调用失败时用户体验 "无反应"，无法排查问题
- **状态不一致**: authStore 写失败但继续执行，session 可能损坏
- **数据丢失**: GitHub 导入失败但用户不知道

### 技术方案

**方案 A: 统一 Error 包装 + 日志 (推荐)**
```typescript
// 定义统一错误类型
class SilentError extends Error {
  silent: true;
  context: string;
}

// 替换空 catch
catch (err) {
  silentErrorHandler(err, { context: 'aiClient.generate', severity: 'warn' });
  return fallbackValue;
}
```
- ✅ 有结构化日志可查
- ✅ 可配置静默阈值
- ⚠️ 需要 error-handler 库

**方案 B: 逐个修复 + console.warn**
```typescript
catch (err) {
  console.warn('[ai-client] generate failed, using fallback:', err);
}
```
- ✅ 快速见效
- ⚠️ console.warn 不结构化，难以聚合
- ⚠️ 分散修改 20+ 文件

---

## 问题 3: 输入校验缺失 (P0)

### 问题定义
`/api/feedback` 的 POST body 只检查非空，无长度/内容限制：

```typescript
// 当前校验 (不足)
if (!title?.trim() || !content?.trim()) {
  return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
}
```

**缺失的校验**:
- `title`: 无最大长度限制 → Slack message 可能超限
- `content`: 无最大长度限制 → 内容过大导致 webhook 超时
- `timestamp`: 无范围校验 → 负数或未来时间
- 无 XSS 过滤 → content 中的 HTML 会被 Slack 渲染

### 风险
- **Webhook 超时/失败**: 超长内容导致 fetch 超时
- **Slack 消息被截断**: 单 block 超过 3000 字符限制
- **恶意注入**: HTML/Slack markdown 注入

### 技术方案

**方案 A: Zod Schema 校验 (推荐)**
```typescript
import { z } from 'zod';

const FeedbackSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  content: z.string().min(1).max(2000).trim(),
  timestamp: z.number().int().positive().max(Date.now() + 60000),
});

const result = FeedbackSchema.safeParse(body);
if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
```
- ✅ 类型安全，与现有 zod@4 一致
- ✅ 可复用其他 endpoint
- ⚠️ 需要处理 zod 错误格式

**方案 B: 手动校验 + 长度截断**
```typescript
const title = String(body.title ?? '').slice(0, 100).trim();
const content = String(body.content ?? '').slice(0, 2000).trim();
```
- ✅ 无新依赖
- ⚠️ 类型不安全，无法表达复杂规则

---

## 问题 4: TypeScript as any 清理 (P1)

### 问题定义
14 个源文件中有 `as any` 类型断言，绕过 TypeScript 类型安全：

| 文件 | 行数 | 原因 |
|------|------|------|
| `components/visualization/CardTreeRenderer/CardTreeRenderer.tsx` | 92, 101 | React Flow 库类型定义缺失 |
| `components/visualization/CardTreeNode/CardTreeNode.tsx` | 157 | 同上 |
| `components/page-tree-diagram/nodes/PageNode.tsx` | 22 | 同上 |
| `components/ui/FlowNodes.tsx` | 32 | 同上 |
| `components/canvas/edges/RelationshipEdge.tsx` | 5, 36 | 同上，注释明确标注为库问题 |
| `components/homepage/steps/StepProjectCreate.tsx` | 121 | `AnyBusinessFlow` 类型 |
| `components/homepage/steps/StepBusinessFlow.tsx` | 66, 69 | 同上 |
| `lib/canvas-renderer/catalog.ts` | 101 | `ReturnType<typeof defineCatalog>` |
| `lib/canvas-renderer/registry.tsx` | 208 | 动态注册表类型 |
| `hooks/ddd/useDDDStateRestore.ts` | 41-43 | store hook 类型断言 |

### 技术方案

**方案 A: 扩展 @types/react-flow (推荐)**
```typescript
// types/react-flow-extensions.d.ts
declare module 'reactflow' {
  interface NodeProps<T> {
    data: T;
    selected?: boolean;
  }
}
```
- ✅ 根本解决类型缺失
- ⚠️ 需要维护自定义类型文件

**方案 B: unknown + 条件类型保护**
```typescript
// 用 unknown 替代 any，再加运行时保护
const props = rawProps as unknown as FlowNodeProps;
if (!isFlowNodeProps(props)) return null;
```
- ✅ 类型安全
- ⚠️ 改动量大

---

## 问题 5: CanvasPage 组件拆分 (P2)

### 问题定义
`CanvasPage.tsx` 达到 **981 行**，违反 AGENTS.md 单一职责原则。

**组件复杂度指标**:
- 98+ 个 `const`/`use*` 声明
- 3 个 store hooks (`useContextStore`, `useFlowStore`, `useComponentStore`)
- 2 个 drawer 子组件 (`MessageDrawer`, `LeftDrawer`)
- 1 个 dialog (`SearchDialog`)
- 无单元测试覆盖（只有 1 个集成测试）

### 建议拆分方案

```
CanvasPage.tsx (981行) → 
  ├── CanvasPage.tsx (约150行) — 布局容器
  ├── CanvasHeader.tsx — 顶部标题栏/搜索
  ├── CanvasToolbar.tsx — 工具栏按钮
  ├── CanvasThreeColumns.tsx — 三列布局逻辑
  ├── MessageDrawer.tsx — 已有，可复用
  ├── LeftDrawer.tsx — 已有，可复用
  └── SearchDialog.tsx — 已有，可复用
```

### 技术方案

**方案 A: 按功能区域拆分 (推荐)**
```
src/components/canvas/
  ├── CanvasPage.tsx (布局 + 状态协调)
  ├── CanvasHeader.tsx
  ├── CanvasToolbar.tsx
  ├── CanvasThreeColumns.tsx
  └── features/
      ├── SearchDialog.tsx
      ├── MessageDrawer.tsx
      └── LeftDrawer.tsx
```
- ✅ 符合 React 组件化最佳实践
- ✅ 可独立测试

**方案 B: 按 Hook 拆分**
```
CanvasPage.tsx 保持 981 行
拆出 ~6 个 custom hooks 各自独立文件
```
- ⚠️ 治标不治本，文件数增加但主组件仍臃肿

---

## 🎯 JTBD (Jobs to be Done)

1. **阻止 API 滥用** — 确保只有认证用户能提交反馈和访问指标
2. **让故障可见** — 异常不再静默消失，开发者能在日志中追踪
3. **防止恶意输入** — 拒绝超长、格式错误的请求，保护下游服务
4. **恢复类型安全** — 消除 `as any`，让 TypeScript 真正发挥类型保护作用
5. **降低认知负荷** — 将 981 行组件拆分到可独立理解的模块

---

## ⚠️ 风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Auth middleware 破坏现有游客功能 | 中 | 高 | 反馈接口改为可选 auth；指标接口加 rate limit |
| 修复 catch 块引入新错误 | 低 | 高 | 每个修复单独 commit + e2e 测试 |
| Zod schema 导致现有合法请求被拒 | 中 | 中 | 先加日志观察，再切强制模式 |
| CanvasPage 拆分导致 props drilling | 低 | 中 | 用 Context 替代 props 传递 |
| MCP server auth 导致 CLI 工具失效 | 高 | 高 | auth token 从环境变量读取，不影响现有调用方式 |

---

## ✅ 验收标准

### P0 — 必须完成

- [ ] `/api/feedback` POST 请求带 Authorization header 校验，无 token 返回 401
- [ ] `/api/quality/metrics` GET 请求同上加认证
- [ ] 所有 3 处 `ai-client.ts` 空 catch 有 `console.warn` 或 error handler
- [ ] `authStore.ts` 2 处空 catch 同上
- [ ] `/api/feedback` 校验 `title.length <= 100`, `content.length <= 2000`, `timestamp` 在合理范围内

### P1 — 计划完成

- [ ] `CardTreeRenderer.tsx`, `CardTreeNode.tsx`, `FlowNodes.tsx`, `PageNode.tsx`, `RelationshipEdge.tsx` 的 `as any` 替换为扩展类型声明
- [ ] `StepProjectCreate.tsx`, `StepBusinessFlow.tsx` 用 `unknown` + guard 替代 `as AnyBusinessFlow`

### P2 — 长期优化

- [ ] CanvasPage 拆分到 5 个子组件，单文件不超过 200 行
- [ ] CanvasPage 单元测试覆盖率达到 80%

---

## 📅 工时估算

| 任务 | 方案 | 预估工时 |
|------|------|---------|
| API 认证守卫 (2 routes + MCP) | Middleware 方案 | 2h |
| 空 catch 块修复 (P0 高风险 5 处) | console.warn + 注释 | 1.5h |
| 空 catch 块修复 (其余 15 处) | 批量处理 | 2h |
| 反馈接口输入校验 (Zod) | Zod Schema | 1h |
| `as any` 清理 (5 个 React Flow 组件) | 类型扩展声明 | 2h |
| `as any` 清理 (3 个 homepage 组件) | unknown + guard | 1.5h |
| CanvasPage 拆分 | 按功能区域 | 4h |
| 回归测试 + e2e | 验证修复不破坏功能 | 2h |
| **合计** | | **16h (~3 人天)** |

**分阶段实施**:
- **Phase 1 (P0 紧急)**: API 认证 + 空 catch 高风险 + 输入校验 → **5h**
- **Phase 2 (P1 重要)**: `as any` 清理 → **3.5h**
- **Phase 3 (P2 优化)**: CanvasPage 拆分 + 剩余 catch 修复 → **7.5h**
