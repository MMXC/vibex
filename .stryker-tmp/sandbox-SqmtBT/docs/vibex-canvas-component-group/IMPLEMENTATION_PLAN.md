# 实施计划: vibex-canvas-component-group

**项目**: vibex-canvas-component-group  
**版本**: 1.0  
**日期**: 2026-03-29  
**总预计工时**: 10.5h ~ 14.5h  
**优先级排序**: E3 (P0) → E1 (P1) → E2 (P2)

---

## 1. 实施阶段概览

```
阶段 1: E3 错误提示自动消失 (0.5h)
  └─ 改动最小，立即交付价值

阶段 2: E1 组件树页面分组 (4-6h)
  ├─ F1.1: 分组渲染逻辑
  ├─ F1.2: 虚线框 SVG 叠加层
  └─ F1.3: 页面分组样式

阶段 3: E2 通用组件独立分组 (6-8h)
  ├─ F2.1: 通用组件数据模型
  └─ F2.2: 通用组件虚线框样式
```

---

## 2. 阶段一: E3 错误提示自动消失 (P0)

**预计工时**: 0.5h  
**风险**: 低  
**依赖**: 无

### 任务清单

- [ ] **E3-T1**: 修改 `Toast.tsx` 的 `defaultDuration` 三元表达式
  - 文件: `vibex-fronted/src/components/ui/Toast.tsx`
  - 改动: L55-57，将 `error` 默认 duration 从 `0` 改为 `3000`
  - 验证: `npm test -- --testPathPattern="Toast"`

### 代码变更

```typescript
// 修改前 (L55-57)
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 0;

// 修改后 (L55-57)
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 3000; // error + info 也 3s 自动消失
```

### 验收检查清单

```bash
# 单元测试
expect(getDefaultDuration('error')).toBe(3000)
expect(getDefaultDuration('info')).toBe(3000)
expect(getDefaultDuration('success')).toBe(3000)
expect(getDefaultDuration('warning')).toBe(5000)

# 集成测试: error toast 3s 后自动移除
act(() => { showToast('操作失败', 'error'); })
jest.advanceTimersByTime(3001)
expect(queryByRole('alert')).not.toBeInTheDocument()

# 边界测试: duration=0 不自动消失
act(() => { showToast('永久错误', 'error', 0); })
jest.advanceTimersByTime(10000)
expect(getByRole('alert')).toBeInTheDocument()
```

---

## 3. 阶段二: E1 组件树页面分组 (P1)

**预计工时**: 4-6h  
**风险**: 中  
**依赖**: 无

### 3.1 F1.1: 分组渲染逻辑

**预计工时**: 2h

- [ ] **E1-T1**: 新增 `isCommon` 字段到 `ComponentNode` 类型
  - 文件: `vibex-fronted/src/lib/canvas/types.ts`
  - 改动: `ComponentNode` 接口新增 `isCommon?: boolean`

- [ ] **E1-T2**: 创建分组工具函数
  - 文件: `vibex-fronted/src/lib/canvas/utils/groupComponents.ts`
  - 函数: `groupByFlowId(nodes, flowNodes) → ComponentGroupMeta[]`
  - 函数: `getPageLabel(flowId, flowNodes) → string`

- [ ] **E1-T3**: 修改 `ComponentTree.tsx` 添加分组逻辑
  - 文件: `vibex-fronted/src/components/canvas/ComponentTree.tsx`
  - 改动: 
    1. 导入 `groupByFlowId`, `getPageLabel`
    2. 渲染前调用分组函数
    3. 调用 `canvasStore.addBoundedGroup` 注册分组
    4. 按分组顺序渲染组件卡片

```typescript
// ComponentTree.tsx 新增逻辑
const flowNodes = useCanvasStore((s) => s.flowNodes);
const componentNodes = useCanvasStore((s) => s.componentNodes);

// 按 flowId 分组
const groups = groupByFlowId(componentNodes, flowNodes);

// 注册分组到 store
groups.forEach(group => {
  addBoundedGroup({
    groupId: `component-${group.type}-${group.flowId || 'common'}`,
    label: group.type === 'common' ? '🧩 通用组件' : `📄 ${group.pageName}`,
    treeType: 'component',
    nodeIds: group.nodeIds,
    color: group.type === 'common' ? '#8b5cf6' : '#10b981',
    visible: true,
  });
});

// 按分组顺序渲染
groups.forEach(group => (
  <div key={group.groupId} data-component-group={group.groupId}>
    <span data-group-label>{group.label}</span>
    {group.nodeIds.map(nodeId => (
      <ComponentCard key={nodeId} node={getNodeById(nodeId)} />
    ))}
  </div>
));
```

### 3.2 F1.2: 虚线框 SVG 叠加层

**预计工时**: 2h

- [ ] **E1-T4**: 创建 `ComponentGroupOverlay.tsx`
  - 文件: `vibex-fronted/src/components/canvas/groups/ComponentGroupOverlay.tsx`
  - 职责: 
    1. 监听 componentNodes 和 container ref
    2. 使用 `querySelectorAll('[data-component-group]')` 获取 DOM bbox
    3. 渲染 SVG 虚线框（复用 BoundedGroupOverlay 风格）
    4. 监听 resize/scroll 事件更新位置

```typescript
// ComponentGroupOverlay.tsx 核心逻辑
function ComponentGroupOverlay({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [groupRects, setGroupRects] = useState<Record<string, DOMRect>>({});

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRects = () => {
      const groups = container.querySelectorAll('[data-component-group]');
      const rects: Record<string, DOMRect> = {};
      groups.forEach((el) => {
        rects[el.getAttribute('data-component-group')!] = el.getBoundingClientRect();
      });
      setGroupRects(rects);
    };

    updateRects();
    const ro = new ResizeObserver(debounce(updateRects, 100));
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  return (
    <svg className="component-group-overlay" style={{ pointerEvents: 'none' }}>
      {Object.entries(groupRects).map(([groupId, rect]) => (
        <g key={groupId}>
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            fill="transparent"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            rx={8}
          />
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **E1-T5**: 在 `CanvasPage.tsx` 挂载 `ComponentGroupOverlay`
  - 文件: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
  - 改动: 在 ComponentTree 容器内添加 `ComponentGroupOverlay`

### 3.3 F1.3: 页面分组样式

**预计工时**: 0.5h

- [ ] **E1-T6**: 添加组件分组 CSS 样式
  - 文件: `vibex-fronted/src/components/canvas/canvas.module.css`
  - 样式: `.component-group`, `.component-group-label`

```css
/* 组件分组容器 */
.component-group {
  margin-bottom: 16px;
  border: 1px dashed #10b981;
  border-radius: 8px;
  padding: 8px;
  background: rgba(16, 185, 129, 0.03);
}

/* 组件分组标签 */
.component-group-label {
  font-size: 12px;
  font-weight: 500;
  color: #10b981;
  margin-bottom: 8px;
  padding: 2px 8px;
  border: 1px solid #10b981;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.08);
  display: inline-block;
}

/* 深色模式 */
[data-theme='dark'] .component-group {
  background: rgba(16, 185, 129, 0.05);
}

[data-theme='dark'] .component-group-label {
  background: rgba(16, 185, 129, 0.15);
}
```

### E1 验收检查清单

```bash
# 单元测试
npm test -- --testPathPattern="groupComponents"
expect(groupByFlowId(nodes, flows)['flow-1'].length).toBe(2)
expect(getPageLabel('unknown', flows)).toBe('未知页面')

# 渲染测试
npm test -- --testPathPattern="ComponentTree"
expect(container.querySelectorAll('[data-component-group]').length).toBeGreaterThan(0)
expect(container.querySelector('svg rect[stroke-dasharray="5 3"]')).not.toBeNull()

# E2E 测试
npx playwright test component-group.spec.ts
```

---

## 4. 阶段三: E2 通用组件独立分组 (P2)

**预计工时**: 6-8h  
**风险**: 中  
**依赖**: E1（F1.1 分组渲染基础设施）

### 4.1 F2.1: 通用组件数据模型

**预计工时**: 2h

- [ ] **E2-T1**: 创建通用组件推断工具
  - 文件: `vibex-fronted/src/lib/canvas/utils/inferCommon.ts`
  - 函数: `inferIsCommon(node) → boolean`

```typescript
// inferCommon.ts
const COMMON_KEYWORDS = ['header', 'footer', 'nav', 'menu', 'sidebar', 'toolbar', 'breadcrumb'] as const;

export function inferIsCommon(node: ComponentNode): boolean {
  // 1. 显式字段优先
  if (node.isCommon !== undefined) return node.isCommon;
  
  // 2. flowId === 'common' 约定
  if (node.flowId === 'common') return true;
  
  // 3. 关键词启发式推断
  const name = node.name.toLowerCase();
  return COMMON_KEYWORDS.some(k => name.includes(k));
}
```

- [ ] **E2-T2**: 修改 `ComponentTree.tsx` 分组逻辑优先处理通用组件
  - 文件: `vibex-fronted/src/components/canvas/ComponentTree.tsx`
  - 改动: 分组排序时通用组件置顶

```typescript
// 分组排序逻辑
const sortedGroups = [
  ...groups.filter(g => g.type === 'common'),  // 通用组件置顶
  ...groups.filter(g => g.type === 'page'),    // 页面分组次之
];
```

### 4.2 F2.2: 通用组件虚线框样式

**预计工时**: 0.5h

- [ ] **E2-T3**: 更新 `ComponentGroupOverlay.tsx` 支持分组颜色
  - 文件: `vibex-fronted/src/components/canvas/groups/ComponentGroupOverlay.tsx`
  - 改动: 根据 group.type 选择 stroke 颜色

```typescript
const GROUP_COLORS = {
  common: '#8b5cf6',  // purple
  page: '#10b981',     // green
};
```

### E2 验收检查清单

```bash
# 单元测试
npm test -- --testPathPattern="inferCommon"
expect(inferIsCommon({ name: 'Header', isCommon: true })).toBe(true)
expect(inferIsCommon({ name: 'Footer' })).toBe(true)
expect(inferIsCommon({ name: 'OrderList' })).toBe(false)

# 渲染测试
npm test -- --testPathPattern="ComponentTree"
expect(groups[0].label).toContain('通用组件')
expect(groups[0].color).toBe('#8b5cf6')

# E2E 测试
npx playwright test common-component.spec.ts
```

---

## 5. 测试计划

### 5.1 测试文件清单

| 测试文件 | 测试内容 | 工具 |
|----------|---------|------|
| `Toast.test.tsx` | E3: Toast duration 行为 | Jest |
| `groupComponents.test.ts` | E1: 分组逻辑 | Jest |
| `inferCommon.test.ts` | E2: 通用组件推断 | Jest |
| `ComponentTree.test.tsx` | E1+E2: 分组渲染 | Testing Library |
| `component-group.e2e.ts` | E1: 虚线框视觉 | Playwright |

### 5.2 覆盖率目标

| 模块 | 覆盖率目标 |
|------|-----------|
| `Toast.tsx` | 100% |
| `groupComponents.ts` | 95% |
| `inferCommon.ts` | 90% |
| `ComponentTree.tsx` | 80% |

---

## 6. 部署计划

### 6.1 开发顺序

```
Day 1 (0.5h): E3 — 错误提示自动消失
Day 2-3 (4-6h): E1 — 组件树页面分组
Day 4-5 (6-8h): E2 — 通用组件独立分组
```

### 6.2 验收里程碑

| 里程碑 | 内容 | 验收标准 |
|--------|------|---------|
| M1: E3 完成 | Toast 3s 自动消失 | 所有 error toast 3s 后消失 |
| M2: E1 完成 | 组件按页面分组 | 每个 flowId 对应一个虚线框 |
| M3: E2 完成 | 通用组件置顶 | isCommon=true 的组件在最前 |
| M4: 全量验收 | 所有功能集成 | 截图对比 + E2E 测试通过 |

---

## 7. 附录

### 7.1 文件变更汇总

```
新增文件:
  vibex-fronted/src/components/canvas/groups/ComponentGroupOverlay.tsx
  vibex-fronted/src/lib/canvas/utils/groupComponents.ts
  vibex-fronted/src/lib/canvas/utils/inferCommon.ts
  vibex-fronted/src/components/canvas/__tests__/groupComponents.test.ts
  vibex-fronted/src/components/canvas/__tests__/inferCommon.test.ts
  vibex-fronted/e2e/component-group.e2e.ts

修改文件:
  vibex-fronted/src/lib/canvas/types.ts
  vibex-fronted/src/lib/canvas/canvasStore.ts
  vibex-fronted/src/components/ui/Toast.tsx
  vibex-fronted/src/components/canvas/ComponentTree.tsx
  vibex-fronted/src/components/canvas/CanvasPage.tsx
  vibex-fronted/src/components/canvas/canvas.module.css
```

### 7.2 工时估算

| Epic | Feature | 工时 |
|------|---------|------|
| E3 | F3.1 Toast duration | 0.5h |
| E1 | F1.1 分组渲染逻辑 | 2h |
| E1 | F1.2 虚线框 SVG | 2h |
| E1 | F1.3 分组样式 | 0.5h |
| E2 | F2.1 通用组件推断 | 2h |
| E2 | F2.2 通用组件样式 | 0.5h |
| - | 测试 | 3h |
| - | 回归测试 | 2h |
| **总计** | | **12.5h** |
