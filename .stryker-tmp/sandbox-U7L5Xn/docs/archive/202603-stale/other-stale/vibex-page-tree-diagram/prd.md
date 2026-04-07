# PRD: 页面树节点组件图

**项目**: vibex-page-tree-diagram  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: VibeX 已有 PageTree 组件但未集成，且缺乏可视化节点图展示。

**解决方案**: 基于 ReactFlow 开发页面树节点组件图，集成到首页左侧流程指示器区域。

**工时**: 2 人日

---

## 2. 功能需求矩阵

### F1: 节点图组件

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | ReactFlow 节点渲染 | `expect(render(nodes)).toShowNodeCount(n)` | P0 |
| F1.2 | 节点位置计算 | `expect(calcPosition()).toHave(x, y)` | P0 |
| F1.3 | 节点样式 | `expect(node.style).toMatchObject({backgroundColor})` | P0 |
| F1.4 | 节点类型区分 | `expect(getType('page')).toBe('pageNode')` | P0 |

---

### F2: 节点交互

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | 点击事件回调 | `expect(onNodeClick).toHaveBeenCalledWith(id)` | P0 |
| F2.2 | 节点高亮 | `expect(highlight(selectedId)).toChangeStyle()` | P1 |
| F2.3 | 悬停效果 | `expect(hover).toShowTooltip()` | P1 |

---

### F3: 视图控制

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 缩放功能 | `expect(zoomIn).toIncreaseScale()` | P0 |
| F3.2 | 平移功能 | `expect(pan).toMovePosition()` | P0 |
| F3.3 | 自动适应视图 | `expect(fitView).toCenterNodes()` | P0 |
| F3.4 | Controls 控件 | `expect(controls).toBeVisible()` | P0 |

---

### F4: 节点连线

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 父子关系连线 | `expect(edge.source).toBe(parentId)` | P0 |
| F4.2 | 连线类型区分 | `expect(edge.type).toBe('parent' | 'reference')` | P0 |
| F4.3 | 连线样式 | `expect(edge.style).toMatchObject({stroke})` | P0 |

---

### F5: 首页集成

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F5.1 | 左侧栏集成 | `expect(sidebar).toContain(Diagram)` | P0 |
| F5.2 | 数据源绑定 | `expect(bindData(PageTree)).toWork()` | P0 |
| F5.3 | 响应式适配 | `expect(mobile).toHideDiagram()` | P1 |

---

### F6: 布局算法

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F6.1 | 树形布局计算 | `expect(layout).toMatchTreeStructure()` | P0 |
| F6.2 | 自动层级 | `expect(level).toBe(parentLevel + 1)` | P0 |
| F6.3 | 间距计算 | `expect(spacing).toBe(horizontal: 200, vertical: 80)` | P0 |

---

## 3. Epic 拆分

### Epic 1: 节点图组件

| Story | 验收 |
|-------|------|
| S1.1 ReactFlow 基础 | `expect(render).toShowNodes()` |
| S1.2 节点样式 | `expect(style).toMatchObject()` |
| S1.3 类型区分 | `expect(type).toBe('page'|'component'|'section')` |

**DoD**: 节点图可正常渲染

---

### Epic 2: 交互功能

| Story | 验收 |
|-------|------|
| S2.1 点击回调 | `expect(click).toCall(onNodeClick)` |
| S2.2 缩放平移 | `expect(zoom/pan).toWork()` |
| S2.3 Controls | `expect(controls).toBeVisible()` |

**DoD**: 用户可交互操作

---

### Epic 3: 连线关系

| Story | 验收 |
|-------|------|
| S3.1 父子连线 | `expect(edge).toConnect(parent, child)` |
| S3.2 引用连线 | `expect(edge).toConnect(source, target)` |

**DoD**: 节点关系可视化

---

### Epic 4: 首页集成

| Story | 验收 |
|-------|------|
| S4.1 左侧栏嵌入 | `expect(sidebar).toContain()` |
| S4.2 数据绑定 | `expect(bind).toSync(PageTree)` |

**DoD**: 集成到首页可用

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | 节点渲染 | `expect(render).toShowNodes()` |
| AC2 | 点击回调 | `expect(click).toHaveBeenCalledWith(id)` |
| AC3 | 缩放功能 | `expect(zoom).toWork()` |
| AC4 | 平移功能 | `expect(pan).toWork()` |
| AC5 | 连线显示 | `expect(edges).toHaveLength(n)` |
| AC6 | 首页集成 | `expect(page).toContain(Diagram)` |
| AC7 | 布局正确 | `expect(layout).toMatchTree()` |

---

## 5. 技术约束

- **ReactFlow**: v11.11.4 (已安装)
- **数据源**: PageTree 组件
- **集成位置**: 首页左侧流程指示器

---

## 6. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 节点图组件 | 1d |
| 2 | 布局算法 | 0.5d |
| 3 | 首页集成 | 0.5d |

**总计**: 2 人日
