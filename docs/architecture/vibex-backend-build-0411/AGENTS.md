# 开发约束 (AGENTS.md): vibex-backend-build-0411

**项目**: vibex-backend-build-0411
**阶段**: design-architecture (开发约束)
**产出时间**: 2026-04-11 15:33 GMT+8
**Agent**: architect

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **前端框架** | Next.js 15 (App Router) + TypeScript |
| **部署** | Cloudflare Pages (`output: 'export'`) |
| **状态管理** | Zustand（已有 store，禁止引入新状态管理） |
| **测试** | Vitest + `npm run build` 构建验证 |
| **API 通信** | SSE via `canvasSseAnalyze`（函数式调用） |

---

## 2. 文件操作约束

### ✅ 允许修改

| 文件 | 约束 |
|------|------|
| `src/hooks/canvas/useAIController.ts` | 仅修改第 21 行导入 + 第 143 行调用 |
| `eslint.config.mjs`（可选） | 添加 `no-irregular-whitespace` 规则 |

### ❌ 禁止操作

- **不要** 修改 `canvasSseApi.ts`（导出正确，无需改动）
- **不要** 修改 `wrangler.toml`（配置已正确）
- **不要** 修改 `next.config.ts`（输出配置正确）
- **不要** 修改 `canvasSseAnalyze` 的参数签名（回调对象结构不变）
- **不要** 修改其他 `import { canvasSseApi }` 以外的导入（已通过全局搜索确认仅此一处）

---

## 3. 代码规范

### 3.1 SSE 调用规范

```typescript
// ✅ 正确：函数式直接调用
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';

await canvasSseAnalyze(requirementInput, {
  onThinking: (content, delta) => { ... },
  onStepContext: (content, mermaidCode, confidence, boundedContexts) => { ... },
  onDone: (projectId, summary) => { ... },
  onError: (message, code) => { ... },
});
```

### 3.2 禁止的模式

```typescript
// ❌ 禁止：命名空间对象调用（TS2306）
import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi';
await canvasSseApi.canvasSseAnalyze(...);  // canvasSseApi 不存在
```

### 3.3 Unicode 引号规范

```typescript
// ❌ 禁止：Unicode 弯引号（历史 build error 根因）
const msg = '你好';   // U+2018 U+2019 — ❌
const msg = '你好';   // U+201C U+201D — ❌

// ✅ 正确：ASCII 直引号
const msg = "你好";   // ASCII " — ✅
const msg = 'Hello'; // ASCII ' — ✅
```

---

## 4. 提交规范

```bash
# 分支命名
git checkout -b fix/canvas-sse-import

# 提交格式
git commit -m "fix(frontend): correct canvasSseApi → canvasSseAnalyze import

TS2306: canvasSseApi does not exist in canvasSseApi.ts
Only canvasSseAnalyze named export exists.

Closes: vibex-backend-build-0411"

# 推送
git push origin fix/canvas-sse-import
```

---

## 5. 构建验证规范

修复后**必须**通过以下验证：

```bash
# 1. TypeScript 类型检查
cd vibex-fronted && npx tsc --noEmit
# 期望：无错误输出

# 2. 构建验证（主要验证）
cd vibex-fronted && npm run build
# 期望：退出码 0，无 TS\d+ 错误

# 3. Unicode 引号检测
grep -rn "['\"]" vibex-fronted/src/hooks/canvas/useAIController.ts
# 期望：无 Unicode 弯引号（仅 ASCII 直/双引号）
```

---

## 6. 测试约束

- Vitest 测试可选（本次改动极小，代码审查可替代）
- **必须**完成构建验证测试
- **建议**添加 Unicode 引号检测测试（非阻断）

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-backend-build-0411
- **执行日期**: 2026-04-11

---

*本文件由 Architect Agent 生成，Dev Agent 须严格遵循约束进行开发。*
