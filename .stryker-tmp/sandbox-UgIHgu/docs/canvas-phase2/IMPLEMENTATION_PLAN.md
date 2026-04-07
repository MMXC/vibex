# IMPLEMENTATION_PLAN — VibeX Canvas Phase2

**项目**: canvas-phase2  
**Architect**: 架构设计  
**总工时**: ~24-30h (Phase2a ~8h + Phase2b ~16h)  
**最后更新**: 2026-03-29

---

## Phase 概览

| Phase | 内容 | 工时 | 依赖 |
|-------|------|------|------|
| Phase2a | 全屏展开 + 交集高亮 | ~8h | Phase1 完成 |
| Phase2b | 完整关系可视化 | ~16h | Phase2a |
| Phase2c | 布局算法 | Phase3 | — |

---

## Phase2a: 全屏展开 + 交集高亮

### F1.1: expand-both 模式

**任务卡**:
```
任务: F1.1 expand-both 模式
文件: src/pages/CanvasPage.tsx, CanvasPage.css
负责人: dev
工时: 2h
验收: grid-template-columns 为 1fr 1fr 1fr，Vitest + Playwright 通过
```

**步骤**:
1. 在 canvasStore 添加 `expandMode: 'normal' | 'expand-both'`
2. 移除 `leftExpand/centerExpand/rightExpand` 三态
3. CanvasPage.css 添加 `.expand-both { grid-template-columns: 1fr 1fr 1fr; }`
4. 工具栏添加"全屏展开"按钮
5. Vitest + Playwright 验收测试

**检查清单**:
- [ ] `expandMode: 'expand-both'` 时 gridTemplateColumns = `1fr 1fr 1fr`
- [ ] 旧 `1.5fr` 代码已删除

---

### F1.2: maximize 模式

**任务卡**:
```
任务: F1.2 maximize 模式
文件: src/pages/CanvasPage.tsx, CanvasPage.css
负责人: dev
工时: 2h
验收: Toolbar/ProjectBar 隐藏，padding=0，Vitest 通过
```

**步骤**:
1. canvasStore 添加 `maximize: boolean`
2. `.maximize` CSS: `visibility: hidden` for Toolbar/ProjectBar, `padding: 0` for CanvasPage
3. 页面顶部添加 4px 悬浮退出条（hover 显示退出按钮）
4. 状态持久化到 localStorage

**检查清单**:
- [ ] maximize=true 时 toolbar/project-bar visibility=hidden
- [ ] maximize=true 时 CanvasPage padding=0
- [ ] localStorage 持久化正常

---

### F1.3: F11/ESC 快捷键

**任务卡**:
```
任务: F1.3 F11/ESC 快捷键
文件: src/pages/CanvasPage.tsx (useEffect)
负责人: dev
工时: 1h
验收: F11 切换全屏，ESC 仅在 maximize 模式下退出
```

**步骤**:
1. `useEffect` 监听 `keydown`
2. F11 → toggle maximize（preventDefault 阻止浏览器默认）
3. ESC → 仅在 maximize=true 时恢复正常
4. Vitest + Playwright 验收

**检查清单**:
- [ ] F11 切换 maximize
- [ ] ESC 仅在 maximize 模式下退出
- [ ] 非全屏下 ESC 不触发任何动作

---

### F1.4: 移除旧 1.5fr 逻辑

**任务卡**:
```
任务: F1.4 移除旧 expand 逻辑
文件: src/pages/CanvasPage.tsx, 相关 CSS
负责人: dev
工时: 1h
验收: grep 验证 0 结果
```

**步骤**:
1. 删除 `leftExpand/centerExpand/rightExpand` 状态
2. 删除 `grid.style.setProperty(...)` 系列代码
3. 删除 CSS 变量 `--grid-left/center/right`
4. `grep -rn "1.5fr" src/canvas/` 验证 0 结果
5. 全量测试回归验证

**检查清单**:
- [ ] `grep -rn "1.5fr" src/` → 0
- [ ] `grep -rn "leftExpand\|centerExpand\|rightExpand" src/canvas/` → 0
- [ ] 全套件测试 PASS

---

### F2.1: 虚线框交集高亮

**任务卡**:
```
任务: F2.1 交集高亮
文件: src/components/canvas/OverlapHighlightLayer.tsx, utils/rectIntersection.ts
负责人: dev
工时: 2h
验收: Vitest 相交/不相交测试通过，Playwright 高亮可见
```

**步骤**:
1. 实现 `utils/rectIntersection.ts`（rectsIntersect + getIntersectionRect）
2. 实现 `OverlapHighlightLayer.tsx`（SVG rect 渲染）
3. 集成到 CanvasPage overlay 堆叠中（z-index 20）
4. `useMemo` 缓存交集计算
5. Vitest + Playwright 验收

**文件结构**:
```
src/
├── components/canvas/
│   └── OverlapHighlightLayer.tsx    # 新增
├── utils/
│   └── rectIntersection.ts          # 新增
```

**检查清单**:
- [ ] 两个虚线框相交时交集高亮可见
- [ ] 两个虚线框不相交时无高亮
- [ ] 大量节点时无性能问题（useMemo 缓存生效）

---

## Phase2b: 完整关系可视化

### F3.1: 数据模型扩展

**任务卡**:
```
任务: F3.1 数据模型扩展
文件: lib/canvas/types.ts
负责人: dev
工时: 1h
验收: TypeScript 零错误，所有使用 boundedGroups/flowNodes 处兼容
```

**步骤**:
1. `lib/canvas/types.ts` 添加 `BoundedEdge`, `FlowEdge`, `FlowNodeType`
2. `canvasStore` 添加 `boundedEdges: BoundedEdge[]`, `flowEdges: FlowEdge[]`
3. 向后兼容：`edges: []` 作为可选字段
4. TypeScript 全面检查

**检查清单**:
- [ ] TypeScript 零错误
- [ ] 向后兼容：无 edges 时不渲染连线层
- [ ] 所有 `boundedGroups` 调用点仍正常

---

### F3.2: 限界上下文卡片连线

**任务卡**:
```
任务: F3.2 BoundedEdgeLayer
文件: src/components/canvas/BoundedEdgeLayer.tsx, utils/edgePath.ts
负责人: dev
工时: 4h
验收: SVG path 带箭头，pointer-events: none，Vitest 通过
```

**步骤**:
1. 实现 `utils/edgePath.ts`（computeBoundedEdgePath + EDGE_COLORS）
2. 实现 `BoundedEdgeLayer.tsx`（SVG + marker defs）
3. 集成到 CanvasPage（z-index 30，pointer-events: none）
4. 箭头 marker defs 正确
5. Vitest 验收

**文件结构**:
```
src/
├── components/canvas/
│   └── BoundedEdgeLayer.tsx         # 新增
├── utils/
│   └── edgePath.ts                   # 新增
```

**检查清单**:
- [ ] 有 edge 数据时渲染 SVG path（带箭头）
- [ ] 无 edge 数据时不渲染任何内容
- [ ] pointer-events: none，连线层不阻挡交互

---

### F2.2: start/end 节点标记

**任务卡**:
```
任务: F2.2 start/end 节点标记
文件: src/components/canvas/FlowNodeMarker.tsx, 相关组件
负责人: dev
工时: 2h
验收: start 绿色圆点，end 红色方块，Vitest 通过
```

**步骤**:
1. 实现 `FlowNodeMarker.tsx`
2. 集成到 `FlowNodeCard` 或相关节点组件
3. `nodeType` 从数据流传入
4. Vitest 验收

**检查清单**:
- [ ] start 节点左上角绿色圆点
- [ ] end 节点左上角红色方块
- [ ] process 节点无标记

---

### F3.3: 流程节点连线

**任务卡**:
```
任务: F3.3 FlowEdgeLayer
文件: src/components/canvas/FlowEdgeLayer.tsx, utils/flowEdgePath.ts
负责人: dev
工时: 3h
验收: sequence 实线/branch 虚线/loop 回环曲线，Vitest 通过
```

**步骤**:
1. 实现 `utils/flowEdgePath.ts`（三种路径算法）
2. 实现 `FlowEdgeLayer.tsx`
3. 集成到 CanvasPage（z-index 40）
4. 分支标签 `<text>` 渲染
5. Vitest 验收

**检查清单**:
- [ ] sequence 连线为实线
- [ ] branch 连线为虚线
- [ ] loop 连线为回环曲线
- [ ] 分支标签显示正确

---

### F3.4: 连线密度控制

**任务卡**:
```
任务: F3.4 连线密度控制
文件: utils/edgeCluster.ts
负责人: dev
工时: 2h
验收: 25 条边聚类至 <20 条，Vitest 通过
```

**步骤**:
1. 实现 `utils/edgeCluster.ts`（clusterEdges 算法）
2. 在 `BoundedEdgeLayer` / `FlowEdgeLayer` 中集成
3. `+N more` 标签渲染
4. Vitest 验收（≤20 不聚类，>20 聚类）

**检查清单**:
- [ ] ≤20 条连线正常渲染（不聚类）
- [ ] >20 条连线聚类合并至 <20
- [ ] 聚类连线有 +N 标签
- [ ] useMemo 缓存聚类结果

---

## 依赖关系图

```
F1.3 (F11/ESC快捷键)
├── F1.1 (expand-both) 基础
└── F1.2 (maximize) 基础

F1.4 (移除旧1.5fr)
└── F1.1 + F1.2 完成后再执行

F2.1 (交集高亮)
└── Phase1 BoundedGroupOverlay 已有基础

F3.2 (BoundedEdgeLayer)
└── F3.1 (数据模型) 先行

F3.3 (FlowEdgeLayer)
└── F2.2 (start/end标记) 可并行

F3.4 (密度控制)
└── F3.2 + F3.3 完成后再集成
```

---

## 资源分配

| 角色 | 任务 | 工时 |
|------|------|------|
| dev | F1.1 + F1.2 + F1.3 + F1.4 + F3.1 + F3.2 + F2.2 + F3.3 + F3.4 | ~25h |
| tester | Phase2a 验收 + Phase2b 验收 | ~3h |
| architect | F3.2/F3.3 架构指导 | ~1h |

---

## 风险缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| F1.4 移除旧逻辑导致回归 | 高 | 先实现 F1.1/F1.2，确认新模式正常后再删除旧逻辑 |
| SVG 层性能问题 | 中 | useMemo 缓存，pointer-events: none，懒加载 |
| 连线密度聚类算法误判 | 低 | Vitest 覆盖边界条件（19/20/21 条边） |

---

*Architect Agent | 2026-03-29 18:30 GMT+8*
