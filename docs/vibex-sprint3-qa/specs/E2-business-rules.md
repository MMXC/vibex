# Spec — E2: 组件属性面板

**文件**: `specs/E2-business-rules.md`
**Epic**: E2 组件属性面板
**基于**: PRD vibex-sprint3-qa § Epic/Story 表格 E2
**状态**: Draft

---

## 组件描述

PropertyPanel 组件（右侧 drawer，宽度 320px）。双击画布节点后展开，显示节点 ID + 类型标签，提供四个配置 Tab：Style（样式）、Data（数据）、Navigation（跳转）、Responsive（响应式）。字段失焦即生效，无需保存按钮。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 用户双击画布节点，节点选中，PropertyPanel drawer 从右侧滑入展开

**视觉表现**:
- Drawer 宽度 `320px`（`width: var(--drawer-width-property)`），右侧滑入（`transform: translateX(0)`，动画 `300ms var(--ease-out)`）
- 面板头部：节点 ID 文字（`var(--font-size-base)`, `var(--color-text-primary)`）+ 类型标签 badge（背景 `var(--color-accent-subtle)`，文字 `var(--color-accent-primary)`）
- Tab 栏：四个 Tab 等宽排列（`flex: 1`），当前激活 Tab 下边框 `2px solid var(--color-accent-primary)`，文字 `var(--color-text-primary)`；非激活 Tab 文字 `var(--color-text-tertiary)`
- Tab 内容区 padding: `var(--space-16)`
- 表单控件：label `var(--font-size-sm)`，`var(--color-text-secondary)`；input/select `var(--space-8)` padding，`var(--radius-md)` 圆角，`var(--color-border)` 边框

**Tab 内容**:

| Tab | 配置项 |
|-----|--------|
| Style | 宽度、高度、背景色、圆角 |
| Data | 文字内容、placeholder、内联值 |
| Navigation | 跳转目标页面（下拉选择，生成/更新 edge） |
| Responsive | mobile/tablet/desktop 可见性开关（toggle） |

**交互行为**:
- Tab 切换即时生效（无 loading）
- 字段失焦（`blur`）→ store 节点数据实时更新
- Navigation Tab 选择跳转页面 → 自动生成/更新 `prototypeStore.edges` 中对应 edge

**情绪引导**: ➕ 愉悦 — Data Tab 修改文字，画布节点实时同步，用户感受到「配置立即生效，无需保存」的流畅。Navigation Tab 设置跳转后立即在画布看到连线，满足「原型有导航逻辑」的心理预期。

---

### 2. 空状态（Empty）

**触发条件**: 无节点选中（未双击任何节点，或已取消选中）

**视觉表现**:
- Drawer 关闭（`transform: translateX(100%)`，`pointer-events: none`）
- 或显示空面板占位：居中图标（`var(--icon-empty-panel)`）+ 文字「双击画布节点以编辑属性」（`var(--color-text-tertiary)`, `var(--font-size-sm)`）
- 空面板 padding: `var(--space-24)`，内容垂直居中

**交互行为**:
- 空状态下无 Tab、无表单
- 双击节点 → drawer 滑入展开

**情绪引导**: 😕 困惑预防 — 空面板明确告知「双击画布节点以编辑属性」，解决「属性面板怎么打开」的困惑，而非显示空白抽屉让用户不知所措。

---

### 3. 加载态（Loading）

**触发条件**: 节点数据需要异步获取（如从远程加载组件模板详情）

**视觉表现**:
- Tab 区域替换为 skeleton loader（3 个 Tab shimmer + 内容区多个 shimmer 块）
- Skeleton 块高度 `var(--space-24)`，宽度 60%/40%/50% 三块，间距 `var(--space-8)`
- 面板头部也显示 ID skeleton（宽度 `120px`）
- 整个面板不可编辑（`pointer-events: none`）

**交互行为**:
- 加载期间所有表单控件 `disabled`，Tab 不可点击
- 加载完成 → skeleton 消失，内容渲染

**情绪引导**: 中性过渡 — 骨架屏占位比 spinner 更友好，保持面板结构可见，让用户知道「内容正在来的路上」。

---

### 4. 错误态（Error）

**触发条件**: 节点数据更新失败（属性写入 API 错误或 store 更新异常）

**视觉表现**:
- 失败的字段边框变为 `2px solid var(--color-error)`（而非默认 `var(--color-border)`）
- 失败字段下方显示错误提示文字（`var(--color-error)`, `var(--font-size-xs)`），如「更新失败，请重试」
- 面板其他正常字段保持可交互（错误隔离，不全盘禁用）

**交互行为**:
- 出错字段重新聚焦后可再次提交
- 出错字段上方显示红色警告 icon

**情绪引导**: ➖ 挫败缓解 — 错误局部化（只标红出错字段）而非全盘锁定，避免「一个字段失败整个面板废了」的崩溃感。错误提示明确告知下一步。

---

## 验收标准（expect() 断言）

```typescript
// E2-AC1: 面板展开 + 节点信息显示
test('E2-AC1: 双击节点后 PropertyPanel 展开，显示节点 ID + 类型标签', () => {
  fireEvent.dblClick(screen.getByTestId('node-NODE_001'));
  expect(screen.getByText('NODE_001')).toBeInTheDocument();
  expect(screen.getByText('Button')).toBeInTheDocument();
  expect(panel).toHaveClass('property-panel-drawer-open');
});

// E2-AC2 Style: 样式修改
test('E2-AC2 Style: 修改宽度字段，失焦后 store 节点样式更新', () => {
  fireEvent.change(screen.getByLabelText('宽度'), { target: { value: '200' } });
  fireEvent.blur(screen.getByLabelText('宽度'));
  const node = store.nodes.find((n) => n.id === 'NODE_001');
  expect(node.data.component.styles.width).toBe('200px');
});

// E2-AC2 Data: 数据修改
test('E2-AC2 Data: 修改文字字段，失焦后 store 节点 label 更新', () => {
  fireEvent.change(screen.getByLabelText('文字'), { target: { value: '提交' } });
  fireEvent.blur(screen.getByLabelText('文字'));
  const node = store.nodes.find((n) => n.id === 'NODE_001');
  expect(node.data.component.label).toBe('提交');
});

// E2-AC3 Navigation: 跳转设置
test('E2-AC3: Navigation Tab 设置跳转页面，自动生成对应 edge', () => {
  fireEvent.change(screen.getByLabelText('跳转页面'), { target: { value: 'page-2' } });
  expect(store.edges.some((e) => e.source === 'NODE_001' && e.target === 'page-2')).toBe(true);
});

// E2-AC4 Responsive: 断点规则
test('E2-AC4: Responsive Tab 切换仅手机可见，节点 breakpoints 正确更新', () => {
  fireEvent.click(screen.getByLabelText('仅手机'));
  const node = store.nodes.find((n) => n.id === 'NODE_001');
  expect(node.data.breakpoints.mobile).toBe(true);
  expect(node.data.breakpoints.tablet).toBe(false);
  expect(node.data.breakpoints.desktop).toBe(false);
});
```

---

## Tab 规格细分

### Style Tab
| 字段 | 类型 | 默认值 | 单位 |
|------|------|--------|------|
| 宽度 | number + unit selector | 节点当前宽度 | px/% |
| 高度 | number + unit selector | 节点当前高度 | px/% |
| 背景色 | color picker | 节点当前色 | hex |
| 圆角 | number | 0 | px |

### Data Tab
| 字段 | 类型 | 默认值 |
|------|------|--------|
| 文字内容 | text input | 节点 label |
| placeholder | text input | — |
| 内联值 | text input | — |

### Navigation Tab
| 字段 | 类型 | 行为 |
|------|------|------|
| 跳转页面 | select (页面列表) | 选择后生成/更新 edge |
| 跳转条件 | text input (可选) | edge label 显示 |

### Responsive Tab
| 字段 | 类型 | 默认 |
|------|------|------|
| 手机可见 | toggle | true |
| 平板可见 | toggle | true |
| 桌面可见 | toggle | true |

---

## 相关组件

- `PropertyPanel` — 主容器 (drawer)
- `PropertyPanelHeader` — 节点 ID + 类型标签
- `PropertyPanelTabs` — 四 Tab 切换
- `StyleTab / DataTab / NavigationTab / ResponsiveTab` — 各 Tab 内容
- `prototypeStore.nodes` — 节点状态管理

---

## 依赖关系

```
E2 依赖:
  └── prototypeStore.nodes
  └── E1 prototypeStore.edges (Navigation Tab 依赖)
上游: PRD E2 Epic
下游: E3 Responsive Tab (共享 breakpoints 状态)
```
