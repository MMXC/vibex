# AGENTS.md — VibeX Canvas Phase2 开发约束

**项目**: canvas-phase2  
**版本**: 1.0  
**最后更新**: 2026-03-29

---

## Dev 开发约束

### 通用约束

1. **强制使用 gstack 技能**：`/browse` 验证问题真实性后再开始修复
2. **CI 绿色原则**：`npm test` 全套件通过后再提交 PR
3. **小步提交**：每个功能点（F1.1/F1.2/F1.3...）单独 commit
4. **overlay 层原则**：所有 SVG overlay 层的 `style` 必须包含 `pointerEvents: 'none'`，禁止遗漏

### F1.1 & F1.2 — expand-both + maximize 模式

**约束**:
- 布局状态统一使用 `expandMode` + `maximize`，**禁止**新增 `leftExpand/centerExpand/rightExpand` 相关代码
- 状态持久化使用 `localStorage`，key 统一为 `canvas-maximize`
- 全屏模式 CSS 使用 class 切换（`.expand-both`, `.maximize`），**禁止**直接操作 `grid.style.setProperty`

**代码规范**:
```typescript
// ✅ 正确
const [maximize, setMaximize] = useState(
  localStorage.getItem('canvas-maximize') === 'true'
);

// ❌ 禁止
grid.style.setProperty('--grid-left', '1.5fr');
// ❌ 禁止: leftExpand/centerExpand/rightExpand 三态
```

### F1.4 — 移除旧 1.5fr 逻辑

**约束**:
- **必须先**确认 F1.1/F1.2 功能正常后再删除旧代码
- 删除前：`grep -rn "1.5fr" src/canvas/` 记录现有结果
- 删除后：`grep -rn "1.5fr" src/` 必须为 0
- 全套件测试验证无回归

**禁止**:
- ❌ 禁止注释掉旧代码（必须真正删除）
- ❌ 禁止只删除一行但不清理相关状态逻辑

### F2.1 — 交集高亮

**约束**:
- 交集计算使用 `useMemo` 缓存，依赖为 `groups` 数组
- 交集矩形数量为 O(n²)，但 n 通常 ≤ 20，评估后无需额外优化
- SVG `<rect>` 必须设置 `fillOpacity` 而非 `opacity`（避免遮挡底层内容）

**代码规范**:
```tsx
// ✅ 正确
const overlaps = useMemo(() => {
  const result = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const rect = getIntersectionRect(groups[i], groups[j]);
      if (rect) result.push(rect);
    }
  }
  return result;
}, [groups]);

// ❌ 禁止: 无 useMemo，频繁重算
// ❌ 禁止: fillOpacity 误写为 opacity
```

### F3.2 — BoundedEdgeLayer

**约束**:
- SVG `<marker>` 定义放在 `<defs>` 中，每个 type 对应一个 marker id
- `marker-end` 使用 `url(#arrow-xxx)` 引用
- 所有 path 的 `stroke-dasharray` 和 `stroke-width` 按 type 区分
- **必须设置** `style={{ pointerEvents: 'none' }}`

**代码规范**:
```tsx
// ✅ 正确
<svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
  <defs>
    <marker id="arrow-dependency" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
    </marker>
  </defs>
  {edges.map(edge => (
    <path d={d} stroke={color} markerEnd={`url(#arrow-${type})`} />
  ))}
</svg>

// ❌ 禁止: pointerEvents 未设置
// ❌ 禁止: marker id 重复
```

### F3.3 — FlowEdgeLayer

**约束**:
- `sequence`: `stroke-dasharray: 0`（实线）
- `branch`: `stroke-dasharray: 5,3`（虚线）
- `loop`: 使用贝塞尔曲线绕回，非直线
- 三种类型各自独立渲染，互不干扰

### F3.4 — 连线密度控制

**约束**:
- `MAX_EDGES_VISIBLE = 20` 作为常量，**禁止**硬编码魔法数字
- 聚类算法必须 `useMemo` 缓存
- `+N more` 标签使用 `<text>` 渲染在聚类线中点

**代码规范**:
```typescript
// ✅ 正确
const MAX_EDGES_VISIBLE = 20;
const result = useMemo(() => clusterEdges(edges), [edges]);

// ❌ 禁止: MAX_EDGES_VISIBLE = 硬编码数字
```

---

## Tester 检查清单

### Phase2a 验收

- [ ] `npm test -- --testPathPattern="canvas"` 全套件 PASS
- [ ] F1.1: expand-both 模式下 `gridTemplateColumns = '1fr 1fr 1fr'`
- [ ] F1.2: maximize 模式下 toolbar/project-bar `visibility: hidden`
- [ ] F1.3: F11 切换全屏，ESC 仅在 maximize 模式下退出
- [ ] F1.4: `grep -rn "1.5fr" src/canvas/` → 0
- [ ] F2.1: 两个虚线框相交时交集高亮可见
- [ ] Playwright: 全屏展开按钮可点击，样式切换正常

### Phase2b 验收

- [ ] F3.1: TypeScript 零错误
- [ ] F3.2: BoundedEdgeLayer SVG path 带箭头，无数据时不渲染
- [ ] F3.2: pointer-events: none，连线层不阻挡交互
- [ ] F2.2: start 节点绿色圆点，end 节点红色方块
- [ ] F3.3: sequence 实线/branch 虚线/loop 回环曲线
- [ ] F3.4: 25 条边聚类至 <20，显示 +N 标签
- [ ] 全套件测试 PASS，Phase1 样式统一成果无回归

---

## Code Review 清单

### 通用审查项
- [ ] TypeScript 零错误（`npx tsc --noEmit`）
- [ ] ESLint 零警告（`npm run lint`）
- [ ] 无 `console.log` / `console.error`
- [ ] 组件使用 `React.memo` 包裹（性能关键组件）

### overlay 层专项
- [ ] 所有 SVG overlay 层的 `style={{ pointerEvents: 'none' }}` 已设置
- [ ] overlay 层 z-index 正确（10→20→30→40→50→60）
- [ ] overlay 层 `position: absolute, inset: 0` 覆盖整个画布

### F1.4 专项
- [ ] `grep -rn "1.5fr" src/` → 0
- [ ] `grep -rn "leftExpand\|centerExpand\|rightExpand" src/canvas/` → 0
- [ ] 全套件测试 PASS（回归验证）

---

## 禁止事项（红线）

1. ❌ 禁止新增 `leftExpand/centerExpand/rightExpand` 相关代码
2. ❌ 禁止在 overlay 层省略 `pointerEvents: 'none'`
3. ❌ 禁止使用 `grid.style.setProperty` 操作布局（改用 CSS class）
4. ❌ 禁止注释掉旧 1.5fr 代码（必须真正删除）
5. ❌ 禁止在连线数据为空时渲染空白 SVG（必须条件渲染 `if (!edges.length) return null`）

---

*Architect Agent | 2026-03-29 18:30 GMT+8*
