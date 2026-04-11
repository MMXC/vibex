# Implementation Plan: vibex-json-render-fix — 组件预览空白修复

**项目**: vibex-json-render-fix
**阶段**: design-architecture (implementation plan)
**产出时间**: 2026-04-11 16:37 GMT+8
**Agent**: architect

---

## 1. 概述

### 1.1 目标

修复 `fetchComponentTree()` 返回 `props: {}` 导致预览空白的问题。

### 1.2 变更范围

| 文件 | 操作 | 行数 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 新增 `generateDefaultProps()` + 修改 `fetchComponentTree` | ~35 行 |
| `vibex-fronted/tests/unit/canvas/api/generateDefaultProps.test.ts` | 新建（建议） | ~30 行 |

### 1.3 依赖关系

```
canvasApi.ts (新增 generateDefaultProps)
    ↓
canvasApi.ts (fetchComponentTree 使用 generateDefaultProps)
    ↓
npm run build + 测试验证
```

---

## 2. 变更详情

### 2.1 新增: `generateDefaultProps()` 函数

在 `canvasApi.ts` 的导出区域或文件顶部新增：

```typescript
/**
 * 根据组件 type 生成符合 catalog Zod schema 的默认 props
 * 用于填充 fetchComponentTree 中的 props 字段，解决预览空白问题
 */
export function generateDefaultProps(
  type: string,
  name: string
): Record<string, unknown> {
  switch (type) {
    case 'page':
      return {
        title: name,
        layout: 'topnav',
      };

    case 'form':
      return {
        title: name,
        fields: [
          { name: 'email', label: '邮箱', type: 'email', placeholder: '请输入邮箱', required: true },
          { name: 'password', label: '密码', type: 'password', placeholder: '请输入密码', required: true },
        ],
        submitLabel: '提交',
      };

    case 'list':
      return {
        title: name,
        columns: [
          { key: 'id', label: 'ID', sortable: false },
          { key: 'name', label: '名称', sortable: true },
          { key: 'status', label: '状态', sortable: true },
        ],
        rows: 10,
        searchable: true,
      };

    case 'detail':
      return {
        title: name,
        fields: [
          { label: '状态', value: '待处理' },
          { label: '创建时间', value: new Date().toLocaleDateString('zh-CN') },
        ],
      };

    case 'modal':
      return {
        title: name,
        size: 'md',
      };

    default:
      return { title: name };
  }
}
```

### 2.2 修改: `fetchComponentTree` 返回值

在 `canvasApi.ts` 的 `fetchComponentTree` 函数中，将第 292 行修改：

```diff
- props: {},
+ props: generateDefaultProps(comp.type, comp.name),
```

---

## 3. 执行步骤

| 步骤 | 操作 | 命令/验证 |
|------|------|---------|
| 1 | 在 `canvasApi.ts` 顶部添加 `generateDefaultProps()` | 函数定义存在 |
| 2 | 修改 `fetchComponentTree` 返回中的 `props` 字段 | `props: generateDefaultProps(comp.type, comp.name)` |
| 3 | 运行 TypeScript 检查 | `cd vibex-fronted && npx tsc --noEmit` |
| 4 | 运行单元测试 | `pnpm test JsonRenderPreview.test.tsx` |
| 5 | 运行 E2E 测试 | `pnpm e2e json-render-preview.spec.ts` |
| 6 | 构建验证 | `npm run build` |

---

## 4. 验收标准

- [ ] `generateDefaultProps()` 对 5 种 type 均返回非空 props
- [ ] `fetchComponentTree` 返回的每个 node.props 不等于 `{}`
- [ ] E2E 测试 `json-render-preview.spec.ts` 3 个测试全部通过
- [ ] 单元测试 `JsonRenderPreview.test.tsx` 5 个测试全部通过
- [ ] `npm run build` 退出码 0

---

## 5. 回滚方案

```bash
cd /root/.openclaw/vibex/vibex-fronted
git checkout -- src/lib/canvas/api/canvasApi.ts
```

回滚耗时：< 1 秒

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-json-render-fix
- **执行日期**: 2026-04-11

---

*本文件由 Architect Agent 生成，配套 architecture.md 使用。*

---

## 实施状态

**更新时间**: 2026-04-11
**Commit**: 41f5aec4

- [x] generateDefaultProps() 实现覆盖: page, form, list, detail, modal, default
- [x] fetchComponentTree: props: {} → props: generateDefaultProps(comp.type, comp.name)
- [x] pnpm tsc --noEmit: ✅ 0 errors
