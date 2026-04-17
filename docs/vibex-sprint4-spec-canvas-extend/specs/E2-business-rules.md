# Spec: E2 — 业务规则章节

**对应 Epic**: E2 业务规则章节 + E4-D2 状态规范
**文件**: `vibex-fronted/src/components/dds/cards/StateMachineCard.tsx`（新建）
**相关**: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`, `vibex-fronted/src/components/flow-container/flowMachine.ts`

---

## 1. DDSPanel 状态机组件面板

### 理想态
- 3 个组件卡片：State（方块图标）/ Transition（箭头图标）/ Choice（菱形图标）
- 每个显示：图标 + 名称 + 简短描述
- 拖拽开始时卡片半透明

### 空状态
- 不可能出现（永远 3 种组件固定存在）

### 加载态
- 骨架屏占位（3 个灰色块）

### 错误态
- 加载失败：错误卡片 + 重试

---

## 2. StateMachineCard 节点

### 理想态
- 宽度 140px，高度 60px
- 顶部：状态类型图标
  - initial：实心圆点（绿色）
  - final：双圆（边框圆+内部圆，灰色）
  - normal：直角矩形（蓝色）
  - choice：菱形（黄色）
  - join：倒三角（紫色）
  - fork：正三角（橙色）
- 底部：stateId 文案
- 选中时：蓝色边框
- 转移连线：边上显示 guard 条件文本（JSON 文本，不做复杂面板）

### 空状态
- 不可能发生

### 加载态
- 骨架屏占位

### 错误态
- 渲染异常：灰色占位框 + "状态节点渲染失败"

---

## 3. DDSPanel 状态属性面板

### 理想态
- stateId input（必填）
- stateType select（initial/final/normal/choice/join/fork）
- events list（字符串数组，添加/删除）
- transitions 简要列表（只读，查看已有的转移）

### 空状态（无选中节点）
- 引导文案："双击状态节点以编辑属性"
- 禁止只留白

### 加载态
- 骨架屏

### 错误态
- stateId 重复：红色边框 + 错误提示
- 保存失败：toast 提示，不丢失数据

---

## 4. 业务规则章节空状态

### 场景：章节内无任何状态
- 引导插图（状态机流程图 SVG）
- 文案："从左侧拖拽 State 开始设计业务规则"
- 禁止只留白

---

## 5. StateMachine JSON 导出 Modal

### 理想态
- 点击导出 → Modal 显示 JSON 预览
- JSON 格式：
```json
{
  "initial": "Idle",
  "states": {
    "Idle": { "on": { "START": "Active" } },
    "Active": { "on": { "STOP": "Idle" } }
  }
}
```

### 空状态
- Modal 显示空 JSON `{}`

### 加载态
- JSON 预览区骨架屏

### 错误态
- 导出失败：Modal 显示错误文案 + 重试

---

## 样式约束

- 状态图标颜色：`var(--color-sm-initial)` / `var(--color-sm-final)` / `var(--color-sm-normal)` / `var(--color-sm-choice)` / `var(--color-sm-join)` / `var(--color-sm-fork)`
- 间距：8 的倍数
- 禁止硬编码颜色值
- 节点宽度：140px（固定）
