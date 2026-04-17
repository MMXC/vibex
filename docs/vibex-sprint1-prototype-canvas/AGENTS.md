# AGENTS.md — vibex-sprint1-prototype-canvas

**项目**: vibex-sprint1-prototype-canvas
**角色**: Architect
**日期**: 2026-04-17

---

## 技术栈约束

| 技术 | 约束 |
|------|------|
| 拖拽引擎 | 强制使用 `@xyflow/react`（React Flow v12），不得引入其他拖拽库 |
| 状态管理 | 强制使用 Zustand，新建 `stores/prototypeStore.ts`，不得与 DDSCanvasStore 混用 |
| 数据模型 | 强制复用 `lib/prototypes/ui-schema.ts` 的 UIComponent/UIPage 类型 |
| 样式 | 强制使用 CSS Modules（`.module.css`），不得使用 Tailwind 或内联样式 |
| 测试 | 强制使用 Vitest + React Testing Library |

---

## 文件路径规范

| 类型 | 路径 | 规范 |
|------|------|------|
| 新建组件 | `components/prototype/Proto*.tsx` | 前缀 `Proto` |
| Store | `stores/prototypeStore.ts` | 单文件，不拆分 |
| 样式 | `components/prototype/Proto*.module.css` | 与组件同名 |
| 测试 | `components/prototype/__tests__/Proto*.test.tsx` | 组件目录内 |
| Store 测试 | `stores/__tests__/prototypeStore.test.ts` | stores 目录内 |

---

## 代码规范

### ProtoNode 自定义节点

```typescript
// ✅ 正确：使用 UIComponent renderer
import { renderUIComponent } from '@/lib/prototypes/ui-schema';

const ProtoNode = memo(({ data }: NodeProps) => {
  const { component, mockData } = data as ProtoNodeData;
  return (
    <div data-testid={`proto-node-${component.type}`}>
      {renderUIComponent(component, mockData?.data)}
    </div>
  );
});

// ❌ 错误：硬编码 UI，不复用 ui-schema
// const ProtoNode = () => <div style={{ background: 'blue' }}>Button</div>;
```

### Mock 数据存储

```typescript
// ✅ 正确：组件内嵌 Mock，存储在节点数据中
interface ProtoNodeData {
  id: string;
  component: UIComponent;
  mockData?: {
    data: Record<string, any>;
    source: 'inline';
  };
}

// ❌ 错误：全局 Mock Store（方案 B/C，MVP 不做）
```

### React Flow 拖拽接收

```typescript
// ✅ 正确：onDragOver 必须 preventDefault，否则 drop 不触发
const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);

// ❌ 错误：忘记 preventDefault
// const onDragOver = (e) => { e.dataTransfer.dropEffect = 'move'; };
```

---

## 不可违背的设计决策

1. **不新建 UIComponent 类型**：复用 `lib/prototypes/ui-schema.ts` 中已有的 10 个默认组件
2. **不修改 DDSCanvasStore**：Prototype Canvas 使用独立的 prototypeStore，与 DDS 完全隔离
3. **不引入 UI Schema 破坏性变更**：导出的 v2.0 JSON 必须向后兼容 v1.0（忽略额外字段）
4. **MVP 不做自动布局**：节点位置由用户手动拖拽，暂不引入 dagre/elk

---

## 性能红线

- 100 节点以内：帧率 ≥ 30fps（Playwright 性能测试验证）
- JSON 导出：≤ 5MB（Canvas 上限），超限提示用户精简 Mock 数据
- localStorage 写入：≤ 50ms，超时异步处理

## MVP 限制声明

⚠️ **localStorage 是临时方案**：Sprint 1 MVP 使用 localStorage 持久化，后续 Sprint 2 或 Sprint 3 需迁移到 D1。prototypeStore 的 `getExportData()` 和 `loadFromExport()` 接口设计必须与 D1 schema 对齐，为后续迁移预留字段。

⚠️ **Round-trip 验证依赖已有数据**：首次访问时 localStorage 为空，round-trip 测试需要先手动创建一些节点。
