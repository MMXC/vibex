# vibex-json-render-integration — 实施计划

**项目**: vibex-json-render-integration
**任务**: design-architecture
**日期**: 2026-04-14
**作者**: Architect Agent
**基于**: architecture.md

---

## 目标

修复 VibeX Canvas json-render 集成的 4 类根因缺陷，使嵌套组件正确渲染、预览弹窗正常显示、组件交互可响应。

---

## Phase 1 实施步骤（1d） ✅ done

### Step 1: 修改 `catalog.ts` — 补全 slots 声明（R1） ✅ done

**文件**: `vibex-fronted/src/lib/canvas-renderer/catalog.ts`

**改动**: 为 5 个容器组件添加 `slots: ['default']`

```typescript
// 找到 defineCatalog 调用，在每个容器组件中添加 slots：

const rawCatalog = defineCatalog(schema, {
  components: {
    Page: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      slots: ['default'],        // ← 新增
    },
    Form: {
      props: z.object({ /* ... */ }),
      slots: ['default'],         // ← 新增
    },
    DataTable: {
      props: z.object({ /* ... */ }),
      slots: ['default'],         // ← 新增
    },
    DetailView: {
      props: z.object({ /* ... */ }),
      slots: ['default'],         // ← 新增
    },
    Modal: {
      props: z.object({ /* ... */ }),
      slots: ['default'],         // ← 新增
    },
    // Button / Card / Badge / StatCard / Empty 不需要 slots（非容器）
  },
});
```

**验证**: `pnpm tsc --noEmit` 类型检查通过

---

### Step 2: 修改 `JsonRenderPreview.tsx` — 修复 nodesToSpec parentId（R2） ✅ done

**文件**: `vibex-fronted/src/components/canvas/json-render/JsonRenderPreview.tsx`

**改动**: 重写 `nodesToSpec` 函数，使用 parentId 映射建立嵌套关系

```typescript
// 替换整个 nodesToSpec 函数：

function nodesToSpec(nodes: ComponentNode[]): Spec | null {
  if (nodes.length === 0) {
    return null;
  }

  // === Phase 1 修复: 使用 parentId 建立嵌套关系 ===
  
  // Step 1: 建立 parentId → children[] 映射
  const childrenOfParent: Record<string, string[]> = {};
  for (const node of nodes) {
    if (node.parentId) {
      if (!childrenOfParent[node.parentId]) {
        childrenOfParent[node.parentId] = [];
      }
      childrenOfParent[node.parentId].push(node.nodeId);
    }
  }

  // Step 2: 构建 elements
  const elements: Spec['elements'] = {};
  for (const node of nodes) {
    if (!node.name) continue;

    const registryType = COMPONENT_TYPE_MAP[node.type] ?? node.type;

    // 优先使用 parentId 映射的 children，fallback 到 node.children
    const children = childrenOfParent[node.nodeId] ?? node.children ?? [];

    elements[node.nodeId] = {
      type: registryType,
      props: {
        ...node.props,
        title: node.name,
      },
      children,
    };
  }

  // Step 3: 找 root
  const root = nodes.find((n) => n.type === 'page' && !n.parentId)?.nodeId
    ?? nodes.find((n) => !n.parentId)?.nodeId
    ?? nodes[0]?.nodeId;

  if (!root) return null;

  return { root, elements };
}
```

**注意**: 保持 `COMPONENT_TYPE_MAP` 中添加 `button: 'Button'` 映射（目前缺少）。

```typescript
const COMPONENT_TYPE_MAP: Record<string, string> = {
  page: 'Page',
  form: 'Form',
  list: 'DataTable',
  detail: 'DetailView',
  modal: 'Modal',
  button: 'Button',  // ← 新增
};
```

---

### Step 3: 修改 `registry.tsx` — 修复 Page 尺寸（R3） ✅ done

**文件**: `vibex-fronted/src/lib/canvas-renderer/registry.tsx`

**改动 3.1**: PageImpl 尺寸修复

```typescript
// 替换 PageImpl：
const PageImpl = ({ props, children }: RegistryComponentProps<{ title: string; description?: string }> & { children?: React.ReactNode }) => {
  const { title } = props;
  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </header>
      <main className="p-6 flex-1 overflow-auto">{children}</main>
    </div>
  );
};
```

**改动 3.2**: ModalImpl 尺寸优化

```typescript
// 替换 ModalImpl：
const ModalImpl = ({ props, children }: RegistryComponentProps<{ title: string; size?: 'sm' | 'md' | 'lg'; content?: string }> & { children?: React.ReactNode }) => {
  const { title, size = 'md' } = props;
  const sizes: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={() => {}}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

### Step 4: 验证构建 ✅ done

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm build
pnpm tsc --noEmit
```

---

## Phase 2 实施步骤（1.75d） ✅ done

### Step 5: ActionProvider handlers 实现（R4） ✅ done

**文件**: `vibex-fronted/src/components/canvas/json-render/JsonRenderPreview.tsx`

**改动 5.1**: 定义 Action 类型

```typescript
// 在文件顶部添加类型定义：
type CanvasAction =
  | { type: 'click'; nodeId: string; label?: string }
  | { type: 'submit'; nodeId: string; fields: Record<string, unknown> }
  | { type: 'navigate'; path: string };
```

**改动 5.2**: ActionProvider handlers 实现

```typescript
// 替换 ActionProvider：
<ActionProvider
  handlers={{
    click: (payload: { nodeId: string; label?: string }) => {
      canvasLogger.default.info('[JsonRenderPreview] click:', payload);
      // 可选: 记录到 messageStore
      // useMessageStore.getState().addMessage({
      //   type: 'user_action',
      //   content: `点击了 ${payload.label ?? payload.nodeId}`,
      // });
    },
    submit: (payload: { nodeId: string; fields: Record<string, unknown> }) => {
      canvasLogger.default.info('[JsonRenderPreview] submit:', payload);
    },
    navigate: (payload: { path: string }) => {
      canvasLogger.default.info('[JsonRenderPreview] navigate:', payload.path);
    },
  }}
>
```

**改动 5.3**: Button 组件 emit 事件（registry.tsx）

```typescript
// ButtonImpl 中添加 onClick 事件触发：
const ButtonImpl = ({ props, emit }: RegistryComponentProps<{ label: string; ... }> & { emit?: (action: CanvasAction) => void }) => {
  const { label, variant = 'primary', size = 'md', disabled = false } = props;
  
  const handleClick = () => {
    if (emit) {
      emit({ type: 'click', nodeId: '', label });
    }
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};
```

**注意**: 需确认 `defineRegistry` 传递的组件 props 中包含 `emit` 函数。若不包含，需在 `ActionProvider` 层面注入 context。

---

### Step 6: 新建单元测试 `nodesToSpec.test.ts` ✅ done

**文件**: `vibex-fronted/src/components/canvas/json-render/__tests__/nodesToSpec.test.ts`

测试场景：
1. 空数组 → null
2. 单节点（无嵌套）→ 正确 Spec
3. 二层嵌套（parentId 映射）→ children 正确
4. 三层嵌套（树形结构）→ 多层 children 正确
5. node.children 和 parentId 不一致 → parentId 优先级
6. 无 page 类型节点 → fallback 到第一个节点

---

### Step 7: 新建 E2E 测试

**文件**: `vibex-fronted/e2e/json-render-nested.spec.ts`

测试场景：
1. 嵌套组件渲染：Page → Form → Button 三层可见
2. Preview Modal 尺寸：Page 内容不溢出
3. 无组件状态：空组件时显示引导 UI

---

### Step 8: 最终验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm build
pnpm test
pnpm exec playwright test e2e/json-render-nested.spec.ts
```

---

## 验收清单

### Phase 1
- [x] `catalog.ts` 中 5 个容器组件声明 `slots: ['default']` ✅
- [x] `COMPONENT_TYPE_MAP` 包含 `button: 'Button'` ✅
- [x] `nodesToSpec` 使用 parentId 映射建立嵌套 children ✅
- [x] `PageImpl` 使用 `min-h-full`，无 `min-h-screen` ✅
- [x] `ModalImpl` 支持 children 内容 + close button ✅
- [x] `pnpm build` 通过 ✅

### Phase 2
- [x] `ActionProvider` handlers 包含 press handler（forward to onNodeClick）✅
- [x] Button 组件触发 emit 事件（emit('press', { nodeId, type })）✅
- [x] JsonRenderPreview.test.tsx 覆盖 5 个场景，全部通过 ✅
- [ ] E2E 嵌套渲染测试通过（Step 7，待 QA 完成）
- [x] `pnpm build` 通过 ✅
