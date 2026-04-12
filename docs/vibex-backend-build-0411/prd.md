# PRD: vibex-backend-build-0411 — 前端构建修复

**项目**: vibex-backend-build-0411
**阶段**: create-prd
**产出时间**: 2026-04-11 15:25 GMT+8
**PM**: pm
**依据**: analysis.md, feature-list.md

---

## 1. 执行摘要

### 背景

VibeX 前端（vibex-fronted）部署在 Cloudflare Pages，通过 `wrangler.toml` + `next.config.ts` 构建。当前前端构建失败，TypeScript 编译报错，导致新代码无法部署到 `dev.vibex.top` / `vibex.top`，Canvas 功能（含 AI 生成、SSE 流）无法上线。

### 根因

`src/hooks/canvas/useAIController.ts` 第21行导入不存在的命名空间对象 `canvasSseApi`：
```typescript
// 错误写法
import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi';
await canvasSseApi.canvasSseAnalyze(requirementInput, {...});
```

`canvasSseApi.ts` 仅导出具名函数 `canvasSseAnalyze`，无 `canvasSseApi` 命名空间对象：
```typescript
// 正确写法
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
await canvasSseAnalyze(requirementInput, {...});
```

### 目标

修复 `useAIController.ts` 中的导入和调用语句，恢复前端构建。

### 成功指标

- [ ] `cd vibex-fronted && npm run build` 退出码为 0，无 TypeScript 错误
- [ ] Canvas 页面在 dev 模式下正常加载（`npm run dev`）
- [ ] 无 Unicode 弯引号残留（`grep -rn "'" src/` 应无 JS/TS 文件匹配）

---

## 2. Epic 拆分

### Epic 1: 修复前端构建阻断

**目标**: 修复 `useAIController.ts` 的导入错误，使前端构建恢复正常。

#### Story 1.1: 修复导入语句

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.1 |
| **描述** | 将 `useAIController.ts` 第21行的 `import { canvasSseApi }` 改为 `import { canvasSseAnalyze }` |
| **工时** | 5 min |
| **依赖** | 无 |
| **验收标准** | `import { canvasSseAnalyze }` 可正常导入，无 TS2306 错误 |

#### Story 1.2: 替换函数调用

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.2 |
| **描述** | 将 `useAIController.ts` 第143行的 `canvasSseApi.canvasSseAnalyze(...)` 改为 `canvasSseAnalyze(...)` |
| **工时** | 2 min |
| **依赖** | S1.1 |
| **验收标准** | 函数调用参数与原调用一致，运行时无 `canvasSseApi is not defined` 错误 |

#### Story 1.3: 验证构建通过

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.3 |
| **描述** | 运行 `npm run build` 验证构建通过，无 TypeScript 错误 |
| **工时** | 5 min |
| **依赖** | S1.1, S1.2 |
| **验收标准** | `cd vibex-fronted && npm run build` 退出码为 0 |

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 修复导入语句 | 将 `import { canvasSseApi }` 改为 `import { canvasSseAnalyze }` | expect(import statement).toContain('canvasSseAnalyze') | 否 |
| F1.2 | 替换函数调用 | 将 `canvasSseApi.canvasSseAnalyze(...)` 改为 `canvasSseAnalyze(...)` | expect(build exitCode).toBe(0) | 否 |
| F1.3 | 验证构建通过 | 运行 `npm run build` 验证构建成功 | expect(build exitCode).toBe(0) | 否 |

---

## 4. 验收标准（可写 expect() 断言）

### S1.1 — 修复导入语句

```typescript
// expect(import statement).toContain('canvasSseAnalyze')
expect(source).toMatch(/import\s+\{\s*canvasSseAnalyze\s*\}/);
expect(source).not.toMatch(/import\s+\{\s*canvasSseApi\s*\}/);
```

### S1.2 — 替换函数调用

```typescript
// expect(function call).toMatch(/canvasSseAnalyze\(/)
expect(source).toMatch(/await\s+canvasSseAnalyze\(/);
expect(source).not.toMatch(/canvasSseApi\./);
```

### S1.3 — 验证构建通过

```typescript
// expect(build exitCode).toBe(0)
const result = execSync('cd vibex-fronted && npm run build');
expect(result.status).toBe(0);
```

---

## 5. DoD (Definition of Done)

以下条件**全部满足**时，视为研发完成：

- [ ] `useAIController.ts` 第21行导入语句已修改为 `import { canvasSseAnalyze }`
- [ ] 第143行调用已修改为 `await canvasSseAnalyze(...)`，参数与原调用一致
- [ ] `cd vibex-fronted && npm run build` 退出码为 0，无 TypeScript 错误输出
- [ ] Canvas 页面在 `npm run dev` 模式下正常加载，无运行时错误
- [ ] `grep -rn "'" vibex-fronted/src/` 无 JS/TS 文件匹配（无 Unicode 弯引号残留）

---

## 6. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 修复后仍有其他 TS 类型错误 | 低 | 高 | 修复后立即运行 `npm run build` 验证 |
| 其他文件存在相同 `canvasSseApi` 导入 | 低 | 中 | 全局搜索确认无遗漏 |
| Unicode 弯引号在其他文件复发 | 中 | 高 | 建议后续添加 ESLint 规则 `no-irregular-whitespace` |

---

## 7. 相关文档

- 分析报告: `docs/vibex-backend-build-0411/analysis.md`
- Feature List: `docs/vibex-backend-build-0411/feature-list.md`
- 关键文件: `vibex-fronted/src/hooks/canvas/useAIController.ts` (待修复)
- 导出文件: `vibex-fronted/src/lib/canvas/api/canvasSseApi.ts` (正常)

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-backend-build-0411
- **执行日期**: 2026-04-11
