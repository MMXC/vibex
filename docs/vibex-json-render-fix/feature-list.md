# Feature List: vibex-json-render-fix

**项目**: vibex-json-render-fix
**Planning 依据**: analysis.md
**产出时间**: 2026-04-11 16:30 GMT+8
**Planner**: pm

---

## 1. Feature List 表格

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 实现 generateDefaultProps() | 在 canvasApi.ts 新增辅助函数，根据 type 返回合理默认 props | `fetchComponentTree` props 硬编码为 `{}`，导致 json-render 渲染空白 | 15 min |
| F1.2 | 替换 fetchComponentTree 中的 props 填充 | 将 `props: {}` 替换为 `props: generateDefaultProps(comp.type, comp.name)` | 同上 | 5 min |
| F1.3 | 验证预览渲染非空白 | 5 种组件类型在预览中均有内容渲染 | 验证修复有效 | 10 min |

---

## 2. Epic / Story 划分

### Epic 1: 修复组件预览空白（根因修复）

**问题根因**: `fetchComponentTree()` 的 `props` 字段硬编码为空对象 `{}`，导致 JsonRenderPreview 无法渲染有意义内容。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 实现 `generateDefaultProps()` 辅助函数 | 15 min | 5 种组件类型返回符合 catalog schema 的默认 props |
| S1.2 | 替换 `fetchComponentTree` 中的 props 填充逻辑 | 5 min | `props` 字段不再为 `{}` |
| S1.3 | 验证预览渲染效果（非空白） | 10 min | Page/Form/List/Detail/Modal 五种类型预览均有内容 |

---

## 3. 依赖关系

- 无外部依赖
- 前置条件: analysis.md 已完成，catalog.ts schema 已确认

---

## 4. 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 默认 props 与 catalog schema 不匹配 | 低 | 中 | Props 严格按 catalog.ts Zod schema 生成 |
| 影响其他调用 fetchComponentTree 的地方 | 低 | 中 | 仅改 fetchComponentTree，不影响 generateComponents |
| E2E 测试因新 props 失败 | 低 | 中 | 修复后运行 `pnpm e2e json-render-preview.spec.ts` 验证 |
