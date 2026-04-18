# Spec: E1 — 数据层集成规格

**对应 Epic**: E1 数据层集成
**目标文件**: `vibex-fronted/src/stores/deliveryStore.ts`, `vibex-fronted/src/lib/delivery/`（新建）
**相关**: `vibex-fronted/src/stores/prototypeStore.ts`, `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`

---

## 1. 数据转换函数规格

### 1.1 toComponent()

```typescript
// 文件: src/lib/delivery/toComponent.ts
interface ProtoNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface DeliveryComponent {
  id: string;
  name: string;
  type: string;
  props: Record<string, unknown>;
}

function toComponent(protoNode: ProtoNode): DeliveryComponent {
  return {
    id: protoNode.id,
    name: protoNode.type,       // ProtoNode.type 作为组件名
    type: 'component',          // 固定为 component
    props: protoNode.props,
  };
}
```

### 1.2 toBoundedContext()

```typescript
// 文件: src/lib/delivery/toBoundedContext.ts
interface BoundedContextCard {
  id: string;
  name: string;
  description?: string;
}

interface DeliveryContext {
  id: string;
  name: string;
  description: string;
}

function toBoundedContext(card: BoundedContextCard): DeliveryContext {
  return {
    id: card.id,
    name: card.name,
    description: card.description || '',
  };
}
```

### 1.3 toBusinessFlow()

```typescript
// 文件: src/lib/delivery/toBusinessFlow.ts
interface BusinessFlow {
  id: string;
  name: string;
  steps: string[];
}

function toBusinessFlow(card: any): BusinessFlow {
  return {
    id: card.id,
    name: card.name,
    steps: card.steps || [],
  };
}
```

---

## 2. deliveryStore.loadMockData() 重构

### 当前（mock）

```typescript
// src/stores/deliveryStore.ts
loadMockData: () => {
  set({
    contexts: MOCK_CONTEXTS,
    flows: MOCK_FLOWS,
    components: MOCK_COMPONENTS,
    prd: MOCK_PRD,
  });
},
```

### Sprint5（真实数据）

```typescript
loadMockData: () => {
  set({ loading: true, error: null });
  try {
    // 从 prototypeStore 拉取组件数据
    const prototypeData = usePrototypeStore.getState().getExportData();
    // 从 DDSCanvasStore 拉取上下文和流程数据
    const ddsData = useDDSCanvasStore.getState();
    
    set({
      contexts: ddsData.chapters.context?.cards.map(toBoundedContext) || [],
      flows: ddsData.chapters.flow?.cards.map(toBusinessFlow) || [],
      components: prototypeData.nodes.map(toComponent),
      loading: false,
    });
  } catch (error) {
    set({ loading: false, error: '数据加载失败' });
  }
},
```

---

## 3. UI 状态规范

### DeliveryTabs 整体加载态

### 理想态
- 数据已加载，各 Tab 显示真实数据
- Tab 标题显示数据量（如 "组件 (12)"）

### 空状态（无数据）
- **文案**: "还没有任何交付物"
- **副文案**: "请先去原型画布或详设画布创建内容"
- **按钮**: "去编辑" → router.push 到 /prototype/editor
- **插图**: 文件夹图标 SVG
- **禁止**: 只留白

### 加载态
- Tab 区域显示骨架屏（多个灰色占位块）
- 禁止使用转圈
- 骨架屏使用 `var(--color-skeleton)` token

### 错误态
- toast 提示错误信息
- 显示重试按钮
- 错误信息：网络错误 / 数据解析失败 / Store 未初始化

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
