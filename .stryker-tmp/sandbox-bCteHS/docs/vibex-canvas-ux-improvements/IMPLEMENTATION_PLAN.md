# IMPLEMENTATION_PLAN: vibex-canvas-ux-improvements

## Epic 1: 状态管理规范化（选区过滤与确认状态分离）
1. CanvasPage.tsx 修改 handleContinueToComponents
2. 测试：有选区发选区确认节点，无选区发全部确认节点

## Epic 2: 列表虚拟化（100+ 节点不卡顿）
1. 使用 @tanstack/react-virtual 实现列表虚拟化
2. 验证：100 节点下滚动流畅

## Epic 3: 用户引导体系（空状态和功能说明）
1. 添加空状态 Hint 组件
2. 功能入口添加 tooltip

## 依赖
Epic1 是根因修复，Epic2/3 可并行

## 验收
选区过滤正常工作，100+ 节点无卡顿，有用户引导

## 实现记录

### Epic1: 状态管理规范化 ✅
- [x] CanvasPage.tsx: handleContinueToComponents 选区过滤逻辑
- [x] selectedNodeIds 引入，依赖数组更新
- [x] 验收：选中部分发送选中，未选中发送全部（向后兼容）
- [x] CanvasPageSelectionFilter.test.tsx: 6 tests (AC-1, AC-2, S1.1-S1.3)

### Epic2: 列表虚拟化 (P1) - 部分完成
- [x] @tanstack/react-virtual: 已安装 3.13.23

### Epic3: 用户引导体系 (P1)
- [x] S3.2: Flow type legend 连线图例（BusinessFlowTree.tsx + canvas.module.css）
- [x] S3.3: start/end node markers 已存在 (line 208-219)

### 验证
- 选区过滤: selectedContextSet.size > 0 ? filter by selection : send all
- 流程图例: 顺序/分支/循环 三个图例项
