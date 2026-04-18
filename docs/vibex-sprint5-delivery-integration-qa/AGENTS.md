# AGENTS.md — vibex-sprint5-delivery-integration-qa

**项目**: vibex-sprint5-delivery-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## 开发约束

### 绝对禁止

1. **禁止在 page.tsx 中调用 `loadMockData()`** → 改用 `loadFromStores()`
2. **禁止在 PRDTab 中硬编码 "电商系统"** → 改用 `generatePRD()` 真实数据
3. **禁止在 exportItem 中保留 `TODO` 注释** → 必须有实际下载逻辑
4. **禁止在 PRDTab 中省略空状态组件** → 必须有 `hasData` 判断 + 空状态引导
5. **禁止修改 DDLGenerator 直读 DDSCanvasStore 的逻辑** → 绕过 mock 是正确设计
6. **禁止引入新依赖** → 新增功能仅使用已有依赖（Zustand, React, TypeScript）

### 约束理由

| 约束 | 原因 |
|------|------|
| #1 loadFromStores | deliveryStore 已正确实现 loadFromStores，只差调用 |
| #2 PRDGenerator | PRD Tab 当前完全不可用，硬编码是 BLOCKER |
| #3 exportItem | 导出是核心功能，stub 无法满足用户需求 |
| #4 PRDTab 空状态 | 无空状态引导时用户体验不明确（Spec E5）|
| #5 DDLGenerator | 直读 DDSCanvasStore 是 Spec E3 的正确设计，禁止倒退 |
| #6 无新依赖 | 避免引入兼容性风险 |

---

## 技术约定

### 文件路径

```
src/app/canvas/delivery/page.tsx          ← E1 修复目标
src/components/delivery/PRDTab.tsx         ← E4/E5 修复目标
src/lib/delivery/PRDGenerator.ts           ← E4 新建文件
src/stores/deliveryStore.ts               ← E1/E4 修复目标
src/lib/delivery/DDLGenerator.ts          ← 已存在，禁止修改直读 Store 逻辑
src/lib/delivery/__tests__/DDLGenerator.test.ts ← E3 测试补充目标
src/components/delivery/__tests__/DeliveryNav.test.tsx ← E2 测试补充目标
```

### 函数命名

| 函数 | 文件 | 说明 |
|------|------|------|
| `loadFromStores` | deliveryStore.ts | 从 prototypeStore + DDSCanvasStore 拉取数据 |
| `generatePRD` | PRDGenerator.ts | 生成 PRD 数据结构（新建）|
| `generatePRDMarkdown` | PRDGenerator.ts | 生成 Markdown 文本（新建）|

### 类型约束

```typescript
// PRDGenerator 输出类型（按 Spec E4）
interface PRDOutput {
  title: string;
  pages: Array<{ id: string; name: string; components: string[] }>;
  components: Array<{ id: string; name: string; type: string; description: string }>;
  apiEndpoints: Array<{ path: string; method: string; summary: string }>;
  boundedContexts: Array<{ id: string; name: string; description: string }>;
}

// BoundedContext 类型（按 Spec E1，无 relations 字段）
interface BoundedContext {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  relationCount: number;
}
```

### 测试覆盖率要求

| 文件 | 当前 tests | 目标 tests |
|------|-----------|-----------|
| DeliveryNav.test.tsx | 3 | 7 |
| DDLGenerator.test.ts | 10 | 16 |
| PRDGenerator.test.ts | 0（新建）| 8 |

### gstack 验证要求

完成修复后，必须使用 gstack 截图验证：
- G1: delivery/page.tsx 显示真实 context/flow/component 数据
- G2: PRD Tab 显示真实生成内容（非 "电商系统"）
- G3: PRD Tab 无数据时显示空状态引导
- G4: 导出点击后触发实际下载
- G5: DDL Modal 显示语法高亮

---

## 驳回条件

- E1-U1: page.tsx 仍调用 `loadMockData()` → 驳回重做
- E4-U2: PRDTab 仍含 "电商系统" → 驳回重做
- E4-U3: exportItem 仍有 `TODO` 注释 → 驳回重做
- E5-U1: PRDTab 无空状态组件 → 驳回重做
- 引入新依赖 → 驳回重做
