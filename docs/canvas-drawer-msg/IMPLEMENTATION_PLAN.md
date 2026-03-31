# IMPLEMENTATION_PLAN: canvas-drawer-msg

## 依赖
无上游依赖。可直接开始。

## Sprint 0

### Epic 1: 消息抽屉基础框架
1. 创建 `stores/messageDrawerStore.ts`（Zustand + persist）
2. 创建 `MessageDrawer.tsx` 容器（200px 展开/收起动画）
3. 创建 `MessageList.tsx` + `MessageItem.tsx`（4 种消息类型）
4. 创建 `ProjectBar.tsx` 抽屉开关按钮
5. CanvasStore 节点操作 → 追加消息（addNode/confirm/delete）
6. 写 MessageDrawer unit tests

### Epic 2: 命令输入系统
1. 创建 `CommandInput.tsx`（底部固定输入框，`/` 触发）
2. 创建 `CommandList.tsx`（命令下拉列表）
3. 实现关键词过滤（`/gen` → 2 命令）
4. 实现节点依赖过滤（有选区 → 只显示 /update-card）
5. 实现命令执行（console.log + 追加 command_executed 消息）
6. 写 CommandInput unit tests

## Sprint 1

### Epic 3: 收尾
1. 视觉风格与 canvas 一致（非 AIChatPanel）
2. 响应式：≤768px 默认隐藏
3. Playwright E2E 测试（打开抽屉/执行命令/节点过滤）
4. gstack screenshot 验证 UI

## 验收
- npm test + E2E 通过
- gstack screenshot 验证 200px 宽度
- 命令过滤 E2E 测试通过

## 实现记录

### Epic 1: 消息抽屉基础框架 ✅
- [x] messageDrawerStore.ts: Zustand + persist, 4种消息类型, addNodeMessage/addSystemMessage/addCommandMessage helpers
- [x] MessageItem.tsx: 4种消息类型展示, TYPE_ICONS, 时间格式化
- [x] MessageList.tsx: auto-scroll to bottom, 空状态
- [x] MessageDrawer.tsx: 200px 展开/收起, aria-hidden, data-testid
- [x] messageDrawer.module.css: drawer 动画, 消息列表样式, 4种类型区分
- [x] ProjectBar.tsx: MessageDrawerToggle 按钮
- [x] CanvasPage.tsx: MessageDrawer 集成
- [x] MessageDrawer.test.tsx: 14 tests
- 验收: drawerWidth=200px, 4种消息类型

### 验证
- pnpm tsc --noEmit → 无错误
- MessageDrawer tests: 16/16 passed ✅
- Full suite: 245 suites, 3117 tests passed ✅

### Epic 1 状态: ✅ 完成 (commit 922c3e74)

### Epic 3: 收尾 ✅
- [x] messageDrawer.module.css: ≤768px 抽屉隐藏 (F3.2)
- [x] canvas-drawer-msg.spec.ts: 7 E2E tests (F3.3)
- 验收: F3.1 drawer独立样式 | F3.2 移动端隐藏 | F3.3 E2E覆盖

### 全部 Epic 完成
| Epic | 状态 | 产出 |
|------|------|------|
| Epic1 消息抽屉基础框架 | ✅ | messageDrawerStore + MessageDrawer + MessageList + MessageItem |
| Epic2 命令输入系统 | ✅ | CommandInput + CommandList + 5命令 + 节点过滤 |
| Epic3 收尾 | ✅ | 移动端响应式 + E2E tests |
