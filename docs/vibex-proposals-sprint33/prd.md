# VibeX Sprint 33 — Product Requirements Document

**Agent**: pm
**日期**: 2026-05-09
**项目**: vibex-proposals-sprint33
**仓库**: `/root/.openclaw/vibex`
**状态**: Draft

---

## 执行摘要

### 背景

Sprint 32 产出 6 个 Epic 全部交付。S32 Analyst Review 识别两个延后提案（Group/Folder 层级抽象、协作感知增强）需在 Sprint 33 处理。此外 S32 QA 发现 2 处 `data-testid` 缺失需要修复。

### 本期目标

1. 实现 Group/Folder 画布节点折叠/展开 UI（DDSFlow），打通 `parentId` 数据模型的最后缺失环节
2. 实现协作者冲突可视化——当检测到多端编辑冲突时，在 DDSFlow 画布上高亮冲突节点并触发 ConflictBubble
3. 实现协作者意图气泡——在 RemoteCursor 旁显示当前协作者的操作意图类型（编辑/选择/拖拽）
4. 补齐 S32 QA 报告中缺失的测试属性，确保 E2E 测试可定位关键组件

### 成功指标

| 指标 | 目标 |
|------|------|
| Group/Folder 折叠 UI 可用 | 折叠/展开操作延迟 < 100ms |
| 冲突可视化响应时间 | 检测到冲突后 < 500ms 高亮显示 |
| 意图气泡覆盖率 | presence 节点更新后 < 1s 显示气泡 |
| QA 修复完成率 | S32 QA 报告 2 项修复项 100% 完成 |
| E2E 测试通过率 | sprint33 相关 E2E 测试 100% 通过 |

---

## 1. Epic 拆分

| Epic ID | 标题 | 类型 | 来源 | 优先级 | 工期 | 依赖 |
|---------|------|------|------|--------|------|------|
| Epic 1 | Group/Folder 层级抽象 | core | S32 遗留 (P001-B) | P0 | 2.5d | 无 |
| Epic 2 | 冲突可视化（高亮） | collab | S32 P003 拆分 (P003-A) | P1 | 2d | architect 数据模型方案 |
| Epic 3 | 协作者意图气泡 | collab | S32 P003 拆分 (P003-B) | P1 | 1.5d | Epic 2 |
| Epic 4 | S32 QA 修复项 | quality | S32 QA (N001) | P1 | 0.5d | 无 |

**总工期**: 6.5d
**关键路径**: Epic 1 (2.5d) → Epic 2 (2d) → Epic 3 (1.5d)

---

## 2a. 本质需求穿透

### Epic 1 — Group/Folder 层级抽象

**底层动机**: 用户在大型 DDS 画布上找不到自己添加的节点。画布节点无限增长，用户需要按 Group 折叠/展开来管理复杂度。

**去掉现有方案后的理想解法**: 一个折叠按钮，点击后该 Group 节点下的所有子节点从画布消失，Group 节点变为"已折叠"视觉态。再次点击展开，所有子节点回到原来位置。

**解决的本质问题**: 画布信息密度过高导致的认知负担。

### Epic 2 — 冲突可视化（高亮）

**底层动机**: 协作者 A 在北京修改用户故事卡片标题，协作者 B 在上海也在修改同一张卡片。双方都不知道有冲突，直到一方同步后另一方的修改被覆盖。

**去掉现有方案后的理想解法**: 冲突发生时，冲突节点立即高亮（红框脉冲），ConflictBubble 弹出仲裁弹窗。用户选择保留本地或使用远程，冲突节点恢复正常状态。

**解决的本质问题**: 多端并发编辑导致的"无声覆盖"问题。

### Epic 3 — 协作者意图气泡

**底层动机**: 协作者头像出现在画布上，但用户不知道对方在干什么——是在看我正在编辑的卡片，还是只是随便浏览？

**去掉现有方案后的理想解法**: RemoteCursor 旁显示一个小型气泡，持续 3 秒，显示"正在编辑 / 正在选择 / 正在拖拽"。用户可以判断是否需要协调。

**解决的本质问题**: 协作意图不透明导致的协作摩擦。

### Epic 4 — S32 QA 修复项

**底层动机**: E2E 测试无法定位 CanvasThumbnail 和 OfflineBanner，导致 CI 回归盲区。

**解决的本质问题**: 测试可定位性缺失（Testability Debt）。

---

## 2b. 最小可行范围

### Epic 1 — Group/Folder 层级抽象

**本期必做**:
- DDSFlow 折叠/展开按钮（Group 节点左上角）
- 折叠态 Group 节点视觉（虚线边框 + 展开指示器）
- 展开动画（300ms ease-out）
- `parentId` 继承：子节点跟随父节点折叠/展开
- Store 状态管理（DDSCanvasStore 可见性过滤）

**本期不做**:
- 跨 Group 拖拽节点（影响范围超出本期）
- Group 间父子关系循环检测
- Group 嵌套层级深于 2 级的 UI

**暂缓**:
- Group 重命名（放在 Group/Folder 完全稳定后）

### Epic 2 — 冲突可视化（高亮）

**本期必做**:
- ConflictBubble.tsx (`components/canvas/ConflictBubble.tsx`) 集成到 DDSFlow 外层
- Firebase 冲突事件监听（RTDB `conflicts/` 节点）
- 冲突节点高亮（红框脉冲动画，`data-conflict="true"` 标记）
- 无冲突时不渲染任何内容

**本期不做**:
- 冲突自动合并策略（E8-S2 已预留 merge 接口，本期只需 keep-local/use-remote）
- 操作历史时间线（P003-C，延后至 S34）

**暂缓**:
- ConflictBubble 与 OfflineBanner 联动（需要单独 Epic）

### Epic 3 — 协作者意图气泡

**本期必做**:
- `presence.ts` 增加 `intention` 字段（`{ x, y, nodeId, timestamp, type: 'edit' | 'select' | 'drag' | 'idle' }`）
- RemoteCursor 组件增加气泡 UI（卡片上方 8px，显示意图图标 + 文案）
- 气泡显示逻辑（停留 > 500ms 显示，消失后 3s 内重新出现不重复显示）

**本期不做**:
- 意图类型的自定义配置
- 意图历史记录

**暂缓**:
- 与 Epic 2 合并展示（冲突时意图气泡隐藏）

### Epic 4 — S32 QA 修复项

**本期必做**:
- `CanvasThumbnail.tsx` 根元素增加 `data-testid="canvas-thumbnail"`
- `OfflineBanner.tsx` 根元素增加 `data-sync-progress` 属性（值为 `pendingCount/totalCount` 格式）
- 生成 baseline screenshots

**本期不做**:
- 其他组件的 testid 审查

---

## 2c. 用户情绪地图

### DDSFlow 画布（Epic 1 & Epic 2 & Epic 3）

**用户进入画布时的情绪**: "我要找到我上次做的那个模块"——带着明确目标，但画布节点多，不知道从哪里开始。

**迷路引导文案**:
- 空章节: "还没有卡片，试试 + 新建"
- 折叠节点悬停: "点击展开 N 个子节点"
- 展开中: "展开中..."（loading 状态不应超过 500ms）

**错误兜底机制**:
- 折叠后节点意外消失 → 自动展开并显示 toast "展开失败，请重试"
- 冲突节点高亮消失 → 自动重试高亮，最多 3 次

### ConflictBubble 弹窗（Epic 2）

**用户看到仲裁弹窗时的情绪**: "出什么事了？"——惊讶但需要快速决策。

**兜底文案**:
- "检测到与其他协作者的编辑冲突"
- "选择保留你的修改，或使用他人的修改"
- 超时未选择（30s）: 默认保留本地修改，显示 toast 提示

---

## 2d. UI 状态规范

Epic 1、Epic 2、Epic 3 均涉及 DDSFlow 页面，需创建四态规格文件。

| 文件 | 对应 Epic | 页面 |
|------|----------|------|
| `specs/Epic1-group-folder.md` | Epic 1 | DDSFlow |
| `specs/Epic2-conflict-visual.md` | Epic 2 | DDSFlow |
| `specs/Epic3-intention-bubble.md` | Epic 3 | DDSFlow（RemoteCursor） |

---

## 3. 功能点清单

### Epic 1 — Group/Folder 层级抽象

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | Group 折叠按钮 | Group 节点左上角显示折叠/展开切换按钮 | `expect(container.querySelector('[data-testid="collapse-toggle"]')).toBeVisible()` | DDSFlow ✅ |
| E1-F2 | 折叠态视觉 | 折叠后 Group 节点显示虚线边框 + 子节点数量徽章 | `expect(groupNode).toHaveClass(/collapsed/)` | DDSFlow ✅ |
| E1-F3 | 展开动画 | 点击展开后子节点以 300ms ease-out 进入画布 | `expect(subNode).toBeVisible()` 且动画时长 ≤ 300ms | DDSFlow ✅ |
| E1-F4 | parentId 继承 | 折叠操作影响所有 `parentId === groupId` 的子节点 | `expect(store.getState().visibility.filter(v => v.parentId === groupId && v.visible === false).length).toBe(subNodeCount)` | Store ✅ |
| E1-F5 | 折叠状态持久化 | 折叠状态存入 DDSCanvasStore，用户刷新后保持折叠 | `expect(localStorage.getItem('collapsed-group-xxx')).toBe('true')` | Store ✅ |

### Epic 2 — 冲突可视化（高亮）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | ConflictBubble 集成 | ConflictBubble.tsx 挂载在 DDSFlow 外层，无冲突时不渲染 | `expect(container.querySelector('[data-testid="conflict-dialog"]')).toBeNull()` | DDSFlow ✅ |
| E2-F2 | Firebase 冲突监听 | 监听 RTDB `conflicts/{canvasId}` 节点，冲突事件触发 activeConflict | `expect(conflictStore.getState().activeConflict).not.toBeNull()` | Store ✅ |
| E2-F3 | 冲突节点高亮 | 冲突节点显示红框脉冲动画 + `data-conflict="true"` | `expect(conflictNode).toHaveAttribute('data-conflict', 'true')` | DDSFlow ✅ |
| E2-F4 | 仲裁操作 | 用户点击 keep-local / use-remote 后冲突解决，高亮消失 | `expect(screen.queryByTestId('conflict-highlight')).not.toBeInTheDocument()` | DDSFlow ✅ |

### Epic 3 — 协作者意图气泡

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E3-F1 | presence.ts intention 字段 | `updateCursor` 支持 `type` 参数，写入 RTDB presence 节点 | `expect(RTDB_patch).toHaveBeenCalledWith(expect.objectContaining({ intention: expect.any(String) }))` | RTDB ✅ |
| E3-F2 | 意图气泡 UI | RemoteCursor 旁显示气泡，显示意图图标 + 文案 | `expect(screen.getByText(/正在编辑/)).toBeVisible()` | RemoteCursor ✅ |
| E3-F3 | 意图气泡交互 | 协作者停止操作 3s 后气泡消失，移动后重新显示 | `expect(bubble).not.toBeVisible()` after 3s idle | RemoteCursor ✅ |

### Epic 4 — S32 QA 修复项

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E4-F1 | CanvasThumbnail testid | 根元素增加 `data-testid="canvas-thumbnail"` | `expect(screen.getByTestId('canvas-thumbnail')).toBeVisible()` | CanvasThumbnail ✅ |
| E4-F2 | OfflineBanner data 属性 | 根元素增加 `data-sync-progress="X/Y"` 格式属性 | `expect(banner).toHaveAttribute('data-sync-progress', '3/5')` | OfflineBanner ✅ |
| E4-F3 | Baseline screenshots | 生成当前 sprint 相关组件的 baseline screenshots | `expect(baselineDir.has('canvas-thumbnail.png')).toBe(true)` | E2E ✅ |

---

## 4. 验收标准（expect() 条目）

### Epic 1

```typescript
// E1-F1: 折叠按钮可见
const groupNode = screen.getByTestId('dds-node-user-story-1');
const toggle = groupNode.querySelector('[data-testid="collapse-toggle"]');
expect(toggle).toBeVisible();

// E1-F1: 点击折叠按钮，子节点从画布消失
fireEvent.click(toggle);
expect(screen.queryByTestId('dds-node-user-story-child-1')).not.toBeInTheDocument();

// E1-F2: 折叠后 Group 节点有 collapsed 样式
expect(groupNode).toHaveClass(/collapsed/);
expect(groupNode.querySelector('[data-testid="collapsed-badge"]')).toHaveTextContent('3');

// E1-F3: 点击展开，子节点出现
const expandToggle = groupNode.querySelector('[data-testid="collapse-toggle"]');
fireEvent.click(expandToggle);
await waitFor(() => {
  expect(screen.getByTestId('dds-node-user-story-child-1')).toBeVisible();
});

// E1-F4: Store 状态正确
const visible = ddsCanvasStore.getState().nodes.filter(n => !n.hidden);
expect(visible.some(n => n.data.parentId === 'group-1')).toBe(true);

// E1-F5: 刷新后折叠状态保持
await page.reload();
expect(screen.getByTestId('dds-node-user-story-1')).toHaveClass(/collapsed/);
```

### Epic 2

```typescript
// E2-F1: 无冲突时 ConflictBubble 不渲染
expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();

// E2-F2: 冲突事件触发高亮
conflictStore.getState().setActiveConflict({
  nodeId: 'node-123',
  localData: {},
  remoteData: {},
  remoteVersion: 2,
});
await waitFor(() => {
  const node = screen.getByTestId('dds-node-node-123');
  expect(node).toHaveAttribute('data-conflict', 'true');
});

// E2-F2: ConflictDialog 出现
expect(screen.getByTestId('conflict-dialog')).toBeVisible();

// E2-F4: keep-local 解决冲突
fireEvent.click(screen.getByText('保留我的修改'));
await waitFor(() => {
  expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('dds-node-node-123')).not.toHaveAttribute('data-conflict');
});
```

### Epic 3

```typescript
// E3-F1: updateCursor 带 intention
const updateSpy = vi.spyOn(presenceModule, 'updateCursor');
fireEvent.mouseMove(canvas, { clientX: 100, clientY: 200 });
await waitFor(() => {
  expect(updateSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(String),
    100,
    200,
    expect.objectContaining({ type: 'drag' })
  );
});

// E3-F2: 意图气泡可见
await waitFor(() => {
  expect(screen.getByTestId('intention-bubble')).toBeVisible();
  expect(screen.getByText('正在拖拽')).toBeVisible();
});

// E3-F3: idle 3s 后气泡消失
await act(async () => { vi.clock.tick(3000); });
expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();
```

### Epic 4

```typescript
// E4-F1: CanvasThumbnail 有 testid
expect(screen.getByTestId('canvas-thumbnail')).toBeVisible();

// E4-F2: OfflineBanner 有 data-sync-progress
const banner = screen.getByTestId('offline-banner');
expect(banner).toHaveAttribute('data-sync-progress', '3/5');
```

---

## 5. Definition of Done（研发完成判断标准）

### 通用 DoD

- [ ] 所有代码变更已通过 `pnpm lint` 和 `pnpm type-check`
- [ ] 单元测试覆盖率不降低（`pnpm test -- --coverage`）
- [ ] E2E 测试新增场景已写入 `sprint33.spec.ts`
- [ ] 相关 TypeScript 类型定义已更新
- [ ] 组件 API 变更已写入 CHANGELOG.md

### Epic 1 DoD

- [ ] `DDSCanvasStore` 增加 `collapsedGroups: Set<string>` 状态
- [ ] `DDSFlow.tsx` 渲染折叠/展开切换按钮
- [ ] 折叠动画使用 CSS transition，duration = 300ms
- [ ] `parentId` 字段正确影响节点可见性
- [ ] localStorage 持久化折叠状态
- [ ] E2E 测试: 折叠/展开流程端到端可跑通
- [ ] specs/Epic1-group-folder.md 四态规格已完成

### Epic 2 DoD

- [ ] `ConflictBubble` 从 `components/canvas/` 正确集成到 DDSFlow 外层
- [ ] Firebase RTDB 冲突监听已实现（监听 `conflicts/{canvasId}` 节点）
- [ ] 冲突节点高亮: `data-conflict="true"` + CSS 脉冲动画
- [ ] ConflictDialog 仲裁操作（keep-local/use-remote）正常工作
- [ ] 无冲突时组件不渲染任何内容（render null）
- [ ] E2E 测试: 冲突高亮 + 仲裁流程可跑通
- [ ] specs/Epic2-conflict-visual.md 四态规格已完成
- [ ] **前置条件**: architect 已确认 RTDB presence 节点变更方案

### Epic 3 DoD

- [ ] `presence.ts` 的 `updateCursor` 支持 `intention` 参数
- [ ] RTDB presence 节点写入 `{ intention: 'edit' | 'select' | 'drag' | 'idle' }`
- [ ] `RemoteCursor.tsx` 渲染意图气泡（位置: cursor 上方 8px）
- [ ] 气泡显示逻辑: 停留 > 500ms 显示，idle 3s 消失
- [ ] 气泡支持 4 种意图文案: "正在编辑" / "正在选择" / "正在拖拽" / "空闲"
- [ ] E2E 测试: 意图气泡显示/消失流程可跑通
- [ ] specs/Epic3-intention-bubble.md 四态规格已完成
- [ ] **前置条件**: Epic 2 完成（presence 扩展依赖 Epic 2 的数据模型确认）

### Epic 4 DoD

- [ ] `CanvasThumbnail.tsx` 根元素 `data-testid="canvas-thumbnail"` 已添加
- [ ] `OfflineBanner.tsx` 根元素 `data-sync-progress` 属性存在且格式正确
- [ ] `playwright screenshots` 命令可生成 baseline screenshots
- [ ] baseline screenshots 提交到 `tests/screenshots/sprint33/`

---

## 6. 依赖关系图

```
[Sprint 32 完成]
     │
     ├─► Epic 1 (P001-B, 2.5d) ─────────────────────────────────────────┐
     │      - parentId 数据模型已存在                                     │
     │      - 纯 UI 实现 + Store 状态                                    │
     │                                                                   │
     ├─► Epic 2 (P003-A, 2d) ───────────────────────┐                   │
     │      - 依赖 architect 数据模型方案 ⚠️         │                   │
     │      - ConflictBubble 集成                    │                   │
     │      - RTDB 冲突监听                         │                   │
     │                                                  │                   │
     ├─► Epic 4 (N001, 0.5d) ◄──────────┐             │                   │
     │      - data-testid 补充          │             │                   │
     │      - baseline screenshots       │             │                   │
     └───────────────────────────────── │ ─────────── │ ───────────────────┘
                                          │             │
                                          ▼             │
                                    [Epic 2 完成]  ◄───┘
                                          │
                                          ▼
                                    [Epic 3 (P003-B, 1.5d)]
                                          - 依赖 Epic 2 完成
                                          - presence.ts intention 扩展
                                          - 意图气泡 UI
```

---

## 7. 不推荐的提案

| 提案 | 标题 | 原因 | 建议 |
|------|------|------|------|
| P003-C | 操作历史时间线 | RTDB schema 变更风险高，需重构版本控制逻辑 | 延后至 Sprint 34 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint33
- **执行日期**: 2026-05-09

---

_PM Agent | 2026-05-09_