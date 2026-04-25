# Spec — E3: 响应式断点预览

**文件**: `specs/E3-cross-chapter.md`
**Epic**: E3 响应式断点预览
**基于**: PRD vibex-sprint3-qa § Epic/Story 表格 E3
**状态**: Draft

---

## 组件描述

ProtoEditor 工具栏右侧设备切换按钮组 + 画布容器断点缩放联动。用户点击设备按钮（📱手机 375px / 📱平板 768px / 🖥️桌面 1024px），画布容器宽度缩放至目标断点，`prototypeStore.breakpoint` 状态同步更新。在特定断点下新增节点，自动标记该断点可见性。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 用户正常使用工具栏设备切换功能，breakpoint 状态正常

**视觉表现**:
- 工具栏右侧显示三个设备切换按钮，等宽排列（`flex: 1` each），间距 `var(--space-4)`
  - 📱 手机 (375px) — 按钮文字 + 图标
  - 📱 平板 (768px) — 按钮文字 + 图标
  - 🖥️ 桌面 (1024px) — 按钮文字 + 图标
- 当前选中按钮：`aria-pressed="true"`，背景 `var(--color-accent-primary)`，文字 `var(--color-on-accent)`
- 非选中按钮：`aria-pressed="false"`，背景 `var(--color-surface-secondary)`，文字 `var(--color-text-secondary)`
- 画布容器宽度平滑缩放（`transition: width 300ms var(--ease-out)`）至目标断点
- 节点应用对应断点样式（缩放或隐藏）

**交互行为**:
- 点击设备按钮 → `store.setBreakpoint(value)` → 画布宽度变化
- 选中态按钮 `aria-pressed` 属性与 `store.breakpoint` 同步
- 断点切换不触发页面刷新

**情绪引导**: ➕ 愉悦 — 工具栏设备切换随手点，画布缩放手感流畅，用户快速验证「这个原型在手机上什么样子」，满足「开发前预览」的效率需求。

---

### 2. 空状态（Empty）

**触发条件**: `prototypeStore.breakpoint` 未初始化（`undefined`）

**视觉表现**:
- 默认桌面按钮高亮（`aria-pressed="true"`，背景 `var(--color-accent-primary)`）
- 其他两个按钮正常可点击
- 画布容器宽度保持桌面默认（1024px）

**交互行为**:
- 三个按钮均可点击，无禁用态
- 首次切换即完成初始化

**情绪引导**: 无负面 — 默认桌面态给用户「正常进入了桌面预览」的安心感，无需额外引导。

---

### 3. 加载态（Loading）

**触发条件**: 断点切换中涉及远程样式计算（非常规场景，MVP 阶段可能不触发）

**视觉表现**:
- 当前点击的按钮内显示 spinner（`width: 16px; height: 16px`，居中于按钮）
- 按钮文案隐藏或变为「切换中...」
- 画布容器宽度暂时保持原值（`transition: none`）
- `aria-pressed` 状态暂时不变

**交互行为**:
- 其他按钮 `disabled`（`pointer-events: none`），防止竞态
- 加载完成 → spinner 消失，按钮状态更新，画布宽度过渡变化

**情绪引导**: 中性过渡 — spinner 在按钮内而非全屏，让用户感知「正在切换」而非「界面卡死」。

---

### 4. 错误态（Error）

**触发条件**: 断点切换失败（不支持的断点值、store 更新异常）

**视觉表现**:
- 工具栏回退到上一有效状态（`aria-pressed` 恢复原值）
- 按钮状态回滚（不显示错误态按钮外观，避免误导）
- Toast 提示：「断点切换失败，已回退」（位置：工具栏下方，`var(--space-8)` 间距，背景 `var(--color-error-subtle)`，文字 `var(--color-error)`, `var(--font-size-sm)`）
- 画布宽度保持上一有效状态

**交互行为**:
- Toast 显示 3s 后自动消失
- 用户可再次点击有效断点

**情绪引导**: ➖ 挫败缓解 — 静默回退 + toast 告知，而非界面卡在错误态。让用户知道「系统已自我修复，但仍有问题」，提供重新尝试的机会。

---

## 验收标准（expect() 断言）

```typescript
// E3-AC1: 工具栏三按钮存在且默认桌面高亮
test('E3-AC1: 工具栏显示三个设备按钮，默认桌面按钮 aria-pressed=true', () => {
  expect(screen.getByLabelText(/手机/)).toBeInTheDocument();
  expect(screen.getByLabelText(/平板/)).toBeInTheDocument();
  expect(screen.getByLabelText(/桌面/)).toBeInTheDocument();
  expect(screen.getByLabelText(/桌面/)).toHaveAttribute('aria-pressed', 'true');
});

// E3-AC2: 点击手机断点，画布宽度 + store 状态同步
test('E3-AC2: 点击手机按钮，store.breakpoint=375，画布宽度=375px', () => {
  fireEvent.click(screen.getByLabelText(/手机/));
  expect(store.breakpoint).toBe('375');
  expect(canvasContainer).toHaveStyle({ width: '375px' });
});

// E3-AC3: 特定断点下新增节点，自动标记断点属性
test('E3-AC3: 设置断点为手机后新增节点，节点 breakpoints.mobile=true，其余 false', () => {
  store.setBreakpoint('375');
  const newNodeId = store.addNode(sampleButtonComponent, { x: 0, y: 0 });
  const newNode = store.nodes.find((n) => n.id === newNodeId);
  expect(newNode.data.breakpoints.mobile).toBe(true);
  expect(newNode.data.breakpoints.tablet).toBe(false);
  expect(newNode.data.breakpoints.desktop).toBe(false);
});
```

---

## 断点规格

| 断点 | 宽度 | 对应设备 | Tooltip |
|------|------|---------|---------|
| 375 | 375px | 手机 | `var(--tooltip-mobile)` |
| 768 | 768px | 平板 | `var(--tooltip-tablet)` |
| 1024 | 1024px | 桌面 | `var(--tooltip-desktop)` |

---

## 相关组件

- `DeviceSwitcher` — 工具栏设备切换按钮组
- `ProtoEditor` — 主编辑器容器（包含 toolbar + canvas）
- `CanvasContainer` — 画布容器（响应 breakpoint width）
- `prototypeStore.breakpoint` — 断点状态管理

---

## 依赖关系

```
E3 依赖:
  └── prototypeStore.breakpoint
  └── CanvasContainer width scaling
上游: PRD E3 Epic
关联: E2 PropertyPanel Responsive Tab（共享 breakpoints 状态）
      E4 AI Import（新增节点可能依赖当前断点）
```
