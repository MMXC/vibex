# Spec — E1: delivery/page.tsx 数据流四态

**文件**: `specs/E1-data-flow.md`
**Epic**: E1 数据流修复验证
**基于**: PRD vibex-sprint5-qa § E1
**状态**: P0 验证目标

---

## 组件描述

delivery/page.tsx 交付页面主组件。包含 5 个 Tab（Contexts/Flows/Components/PRD/DDL），展示从 prototypeStore + DDSCanvasStore 聚合的交付数据。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: loadFromStores() 成功返回，5 个 Tab 正常显示真实 store 数据

**视觉表现**:
- 页面标题「交付物」+ 面包屑导航
- TabBar 显示 5 个标签（Contexts/Flows/Components/PRD/DDL）
- 当前激活 Tab 内容区显示真实数据
- 数据以卡片/列表形式呈现

**数据流**:
```
prototypeStore + DDSCanvasStore
         ↓
    deliveryStore.loadFromStores()
         ↓
    toComponent/toBoundedContext/toFlow/toSM
         ↓
    TabContent 渲染真实数据
```

**情绪引导**: ✅ 看到真实设计数据 → 信任交付物

---

### 2. 空状态（Empty）

**触发条件**: store 中无数据（原型未创建 / Canvas 空白）

**视觉表现**:
- Tab 内容区显示空态插画
- 文案「暂无交付数据」+ 「请先在编辑器中添加组件和页面」
- Tab 区域仍可切换（显示空态而非报错）

**情绪引导**: 「暂无交付数据」+ 引导文案 → 不吓唬用户，告诉他下一步

---

### 3. 加载态（Loading）

**触发条件**: loadFromStores() 异步执行中

**视觉表现**:
- 骨架屏占位（卡片/列表形状，灰色背景）
- 骨架屏动画（opacity 0.6 → 1 循环）
- 禁止 Tab 切换交互（`pointer-events: none`）

**情绪引导**: 骨架屏给出内容形状预期 → 不焦虑

---

### 4. 错误态（Error）

**触发条件**: loadFromStores() 失败（store 未初始化 / 数据格式错误）

**视觉表现**:
- Tab 内容区显示错误插画 + 文案
- 文案根据错误类型区分：
  - 「数据加载失败，请刷新重试」（网络/服务错误）
  - 「原型未创建，请在编辑器中添加内容」（无数据）
- 「重试」按钮

**情绪引导**: 错误信息明确 + 重试按钮 → 可修复，有希望

---

## 数据流图

```
┌─────────────────────────────────────────────────┐
│                delivery/page.tsx                 │
│  useDeliveryStore.getState()                      │
│        ↓                                          │
│  ┌─────┴─────┐                                   │
│  │ loadFromStores() │ ← 🔴 关键修复点             │
│  │  prototypeStore  │                            │
│  │  DDSCanvasStore  │                            │
│  └─────┬─────┘                                   │
│        ↓                                          │
│  toComponent / toBoundedContext / toFlow / toSM  │
│        ↓                                          │
│  TabContent: Contexts / Flows / Components / ...  │
└─────────────────────────────────────────────────┘
```

---

## 技术约束

- **禁止**: `loadMockData()` 调用
- **必须**: `loadFromStores()` 作为唯一数据源
- **状态标识**: store.dataSource === 'stores'
- **禁止硬编码**: 颜色/间距使用 Token
