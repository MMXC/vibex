# Phase1 需求分析报告：vibex json-render 组件页面预览空白问题

**项目**: vibex-json-render-fix
**阶段**: analyze-requirements
**产出时间**: 2026-04-11 16:22 GMT+8
**Analyst**: analyst

---

## 1. Research 成果

### 1.1 历史经验搜索

**高关联文档**（通过子代理 + 直接 grep）：
- `docs/canvas-jsonrender-preview/analysis.md`（2026-04-05）— 完整记录了 json-render 集成的架构设计、Option B 混合方案推荐、E4.1/E4.2/E4.3 实现计划
- `docs/canvas-jsonrender-preview/IMPLEMENTATION_PLAN.md` — E1/E2/E3 Sprint 全部标记 done
- `docs/vibex-proposals-20260411-page-structure/` — JsonRenderPreview 作为组件预览层

**关键历史经验**：
- E1 Sprint: catalog + registry + JsonRenderPreview 实现，5 个单元测试通过
- E2 Sprint: CanvasPreviewModal 集成，E2E 测试通过（3 tests in `json-render-preview.spec.ts`）
- E3 Sprint: canvasPreviewStore 联动，13+10 测试通过
- **注意**：没有发现"预览空白"相关的历史 learnings 文档，说明这是新问题或之前未被捕获

### 1.2 Git History 分析

```
e75641c4 docs(frontend): ESLINT 豁免清单 (E3-S2)  2026-04-08
cf578266 chore: update flaky-tests.json timestamp 2026-04-07
```

**JsonRenderPreview.tsx 和 CanvasPreviewModal.tsx 自 4 月 7-8 日后无变更**，说明问题不是代码回归引入，而是某个特定数据条件触发的。

### 1.3 代码结构分析（关键发现）

#### 数据流

```
fetchComponentTree()  [canvasApi.ts]
  ↓ (transforms AI response to ComponentNode[])
  ↓ ComponentNode { name, type, props: {}, children: [], ... }
  ↓
useComponentStore.componentNodes
  ↓
CanvasPreviewModal → JsonRenderPreview
  ↓ nodesToSpec(nodes)
  ↓ Spec { root: string, elements: {...} }
  ↓
Renderer { spec, registry: vibexCanvasRegistry }
```

#### 根因定位：`fetchComponentTree` 产生空 props

```typescript
// canvasApi.ts:fetchComponentTree() 第 302-318 行
return result.components.map((comp) => ({
  flowId: (comp.flowId && comp.flowId !== 'unknown') ? comp.flowId : '',
  name: comp.name,
  type: comp.type as ComponentType,
  props: {},  // ← 始终为空对象！
  api: comp.api ?? { ... },
  nodeId: `comp-${Date.now()}-${...}`,
  confirmed: false,
  status: 'pending' as const,
  children: [],  // ← 始终为空数组（平面列表，无嵌套）
}));
```

**根因**: AI 返回的组件描述（`name`、`type`）被提取了，但 `props` 被硬编码为空对象 `{}`。当 `nodesToSpec` 将这些传给 json-render 时：

```typescript
// JsonRenderPreview.tsx:55-62
const element = {
  type: registryType,
  props: {
    ...node.props,    // 展开 {} → 无任何属性
    title: node.name, // 仅 title 有值
  },
  children: node.children ?? [], // [] 空数组
};
```

json-render Spec 中所有组件的 props 都只有 `{ title: "组件名" }`：
- **Form**: `{} + { title: "xxx" }` → 渲染空表单（无字段）
- **DataTable**: `{} + { title: "xxx" }` → 渲染空表格（无列）
- **Page**: `{} + { title: "xxx" }` → 渲染空页面容器

**这就是"空白"的直接原因**：视觉上组件存在（div 结构正确），但内容为空，看起来就是空白。

---

## 2. 业务场景分析

### 2.1 问题背景

Canvas 的"预览"功能（CanvasPreviewModal → JsonRenderPreview）打开后显示空白：
- 组件已生成（有节点数据）
- 但预览区域无渲染内容
- ErrorBoundary 未触发（因为没有 JS 错误）

### 2.2 目标用户

- Canvas 用户（设计师/产品经理）需要预览 AI 生成的组件树
- 影响：无法验证生成结果，功能可信度下降

### 2.3 核心 JTBD

1. **JTBD-1**: 预览已生成组件的真实渲染效果
2. **JTBD-2**: 在预览中点击组件，选中对应节点（E3 联动）
3. **JTBD-3**: 导出生成的组件代码

---

## 3. 技术方案选项

### 方案 A：最小修复 — 补充 props 填充（推荐）

**改动范围**: 仅 `canvasApi.ts` 的 `fetchComponentTree` 函数，从 AI 返回数据中提取 props。

```typescript
// 修复: canvasApi.ts
return result.components.map((comp) => {
  // AI 返回的 ComponentResponse 包含 type 和 name
  // 根据 type 生成合理的默认 props
  const defaultProps = generateDefaultProps(comp.type, comp.name);
  return {
    flowId: ...,
    name: comp.name,
    type: comp.type as ComponentType,
    props: defaultProps,  // ← 不再是 {}
    children: [],
  };
});

// 新增辅助函数
function generateDefaultProps(type: string, name: string): Record<string, unknown> {
  switch (type) {
    case 'page':
      return { title: name, layout: 'topnav' };
    case 'form':
      return {
        title: name,
        fields: [
          { name: 'email', label: '邮箱', type: 'text', placeholder: '请输入邮箱', required: true },
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
        ],
        rows: 10,
        searchable: true,
      };
    case 'detail':
      return {
        title: name,
        fields: [
          { label: '状态', value: '待处理' },
          { label: '创建时间', value: '2026-04-11' },
        ],
      };
    case 'modal':
      return { title: name, size: 'md' };
    default:
      return { title: name };
  }
}
```

**优点**: 最小改动（~30 行），直接解决根因，不破坏现有测试
**缺点**: 默认 props 是硬编码的示例数据，不是真正从 AI 提取

### 方案 B：改进 JsonRenderPreview 空状态体验

不修根因，修表现层 — 当 props 内容不足以渲染有意义 UI 时，显示说明而非空白。

```typescript
// JsonRenderPreview.tsx - nodesToSpec 后检查
const hasContent = nodes.some(n => {
  const props = { ...n.props, title: n.name };
  return Object.keys(props).length > 1; // 仅 title 不算有内容
});

if (!hasContent) {
  return (
    <div className="flex items-center justify-center h-full bg-amber-50 border border-amber-200 rounded-lg">
      <div className="text-center py-8 px-6">
        <span className="text-2xl">⚠️</span>
        <h3 className="mt-2 text-sm font-medium text-amber-900">组件结构已生成，但缺少渲染属性</h3>
        <p className="mt-1 text-xs text-amber-600">请在组件详情中编辑属性，或重新生成</p>
      </div>
    </div>
  );
}
```

**优点**: 用户看到友好提示而非空白
**缺点**: 掩盖根因，长期看应修根因

### 方案 C：后端改造 — AI 返回结构化 props

改造 `/api/v1/canvas/generate-components` 后端逻辑，让 AI 返回符合 Catalog schema 的 props。

**优点**: 从源头解决，AI 生成的就是可渲染 Spec
**缺点**: 需要改后端 prompt + 重测 AI 输出格式，工时大
**风险**: AI 输出格式不稳定，可能破坏现有测试

---

## 4. 可行性评估

| 维度 | 方案 A（最小修复） | 方案 B（空状态） | 方案 C（后端改造） |
|------|------------------|----------------|------------------|
| 技术难度 | **极低** | **低** | **高** |
| 工期 | **30 分钟** | **20 分钟** | **2-3 天** |
| 回滚成本 | **零** | **零** | 中等 |
| 测试成本 | **低** | **低** | 高 |
| 解决问题 | 根治 | 缓解 | 根治 |

**结论**: 方案 A 是最优选择。30 分钟能解决根因，无需改 PRD/架构流程。

---

## 5. 风险矩阵

| 风险 | 可能性 | 影响 | 评级 | 缓解 |
|------|--------|------|------|------|
| 默认 props 与实际 AI 生成意图不符 | 中 | 低 | 🟡 中 | 验收时验证 5 种组件类型的默认渲染效果 |
| 改 canvasApi.ts 影响其他调用方 | 低 | 高 | 🟡 中 | 只改 `fetchComponentTree`，不影响 `generateComponents` |
| 新 props 结构与 Catalog schema 不匹配 | 低 | 中 | 🟢 低 | Props 严格按 catalog.ts 中的 Zod schema 生成 |
| 预览空白由其他原因（如 registry 注册失败） | 低 | 高 | 🟢 低 | gstack browse 验证 |

---

## 6. 验收标准（具体可测试）

- [ ] Canvas 页面生成组件后，点击预览按钮 → 预览区域显示有内容的组件（非空白）
  - Page 类型 → 显示带标题的页面容器
  - Form 类型 → 显示带字段的表单（含邮箱/密码示例字段）
  - List 类型 → 显示带列名的表格
  - Detail 类型 → 显示带字段的详情页
  - Modal 类型 → 显示带标题的弹窗
- [ ] E2E 测试 `json-render-preview.spec.ts` 仍然全部通过（3 个测试）
- [ ] 单元测试 `JsonRenderPreview.test.tsx` 仍然全部通过（5 个测试）
- [ ] `npm run build` 无 TypeScript 错误
- [ ] **gstack browse 验证**：在 `dev.vibex.top/canvas` 上实际触发预览，截图确认非空白

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-json-render-fix
- **执行日期**: 2026-04-11

**建议**: 该任务属于 P0 Bug Fix，工期极短（30 分钟），建议跳过 PRD/Architecture 评审，直接由 Dev 执行方案 A 后进入 Reviewer 验证。

---

## 附录：关键文件索引

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | ❌ 需修复 | `fetchComponentTree` props 硬编码为空 |
| `vibex-fronted/src/components/canvas/json-render/JsonRenderPreview.tsx` | ✅ 正常 | 转换逻辑正确，props 填充后即可 |
| `vibex-fronted/src/lib/canvas-renderer/catalog.ts` | ✅ 正常 | Zod schema 定义了 5 Canvas 类型 |
| `vibex-fronted/src/lib/canvas-renderer/registry.tsx` | ✅ 正常 | 组件实现完整 |
| `vibex-fronted/src/components/canvas/json-render/CanvasPreviewModal.tsx` | ✅ 正常 | ErrorBoundary 就绪 |
| `vibex-fronted/e2e/json-render-preview.spec.ts` | ✅ 正常 | 3 个 E2E 测试覆盖主要场景 |
| `vibex-fronted/tests/unit/components/canvas/json-render/JsonRenderPreview.test.tsx` | ✅ 正常 | 5 个单元测试通过 |

## 附录：根因代码定位

```typescript
// 文件: vibex-fronted/src/lib/canvas/api/canvasApi.ts
// 位置: fetchComponentTree() 返回的 map 函数
// 问题: props: {} 硬编码
// 修复: props: generateDefaultProps(comp.type, comp.name)
```
