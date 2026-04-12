# 开发约束 (AGENTS.md): vibex-json-render-fix

**项目**: vibex-json-render-fix
**阶段**: design-architecture (开发约束)
**产出时间**: 2026-04-11 16:37 GMT+8
**Agent**: architect

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **前端框架** | React 19 + TypeScript + Next.js 15 |
| **部署** | Cloudflare Pages (`output: 'export'`) |
| **状态管理** | Zustand（已有 store，禁止引入新状态管理） |
| **测试** | Vitest (单元) + Playwright (E2E) |
| **类型验证** | Zod schemas（参考 `catalog.ts`） |

---

## 2. 文件操作约束

### ✅ 允许修改

| 文件 | 约束 |
|------|------|
| `src/lib/canvas/api/canvasApi.ts` | 仅新增 `generateDefaultProps()` 函数 + 修改 1 行 `props:` 赋值 |
| `tests/unit/canvas/api/generateDefaultProps.test.ts` | 新建（建议，非强制） |

### ❌ 禁止操作

- **不要** 修改 `JsonRenderPreview.tsx`（转换逻辑正确）
- **不要** 修改 `catalog.ts`（schema 定义正确）
- **不要** 修改 `CanvasPreviewModal.tsx`
- **不要** 修改 `fetchComponentTree` 的其他返回值字段（flowId、name、type、api、nodeId 等保持不变）
- **不要** 删除现有 E2E/单元测试

---

## 3. 代码规范

### 3.1 generateDefaultProps 规范

```typescript
// ✅ 正确：每个 type 必须有 switch case
export function generateDefaultProps(type: string, name: string): Record<string, unknown> {
  switch (type) {
    case 'page': return { title: name, layout: 'topnav' };
    case 'form': return { title: name, fields: [...] };
    // ...
    default: return { title: name };
  }
}

// ❌ 禁止：缺少 default case
// ❌ 禁止：返回空对象 {}（这是根因，禁止复现）
```

### 3.2 Props 引用规范

```typescript
// ✅ 正确：使用辅助函数
props: generateDefaultProps(comp.type, comp.name),

// ❌ 禁止：硬编码空对象（根因）
props: {},
```

---

## 4. 提交规范

```bash
git checkout -b fix/json-render-props
git add src/lib/canvas/api/canvasApi.ts
git commit -m "fix(frontend): generate default props for component preview

Root cause: fetchComponentTree returned props: {} causing blank preview.
Fix: add generateDefaultProps(type, name) returning catalog-compliant default props.

E4.2 fix for vibex-json-render-fix"
git push origin fix/json-render-props
```

---

## 5. 验证规范

修复后**必须**通过：

```bash
# 1. TypeScript 类型检查
cd vibex-fronted && npx tsc --noEmit

# 2. 单元测试
pnpm test JsonRenderPreview.test.tsx

# 3. E2E 测试
pnpm e2e json-render-preview.spec.ts

# 4. 生产构建
npm run build
```

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-json-render-fix
- **执行日期**: 2026-04-11

---

*本文件由 Architect Agent 生成，Dev Agent 须严格遵循约束进行开发。*
