# P003 快捷键集成 实现方案

## 背景

`shortcutStore` 和 `useKeyboardShortcuts` 均已完整实现，但未连接——用户在设置页配置的快捷键不生效。P001 已将 `DDSCanvasPage` 的 undo/redo stub 替换为 `canvasHistoryStore` 真实实现。P003 需要：

1. **U1-P003**: `useKeyboardShortcuts` 动态读取 `shortcutStore` 驱动运行时行为
2. **U2-P003**: 快捷键冲突检测运行时触发（设置页保存时警告）
3. **U3-P003**: `?` 快捷键帮助面板回归验证

## 分析

### 现有代码结构

| 文件 | 现状 |
|------|------|
| `shortcutStore.ts` | 完整实现，含 `captureKey`/`saveShortcut`/`conflictInfo` |
| `useKeyboardShortcuts.ts` | 硬编码快捷键，无动态读取 |
| `DDSCanvasPage.tsx` | P001 已连接 undoCallback/redoCallback 到 historyStore |
| `CanvasPage.tsx` | 有 `useKeyboardShortcuts` + ShortcutPanel |
| `useCanvasEvents.ts` | 处理 `?` 键 toggle ShortcutPanel |

### 影响范围

- `useKeyboardShortcuts.ts` — 核心改动
- `useKeyboardShortcuts.test.ts` — 新增动态行为测试
- `shortcutStore.ts` — 添加 `isKeyUsedInHandler` 辅助
- `DDSCanvasPage.tsx` — 确保 `?` 键触发 ShortcutPanel
- `CanvasPage.tsx` — 确保 useKeyboardShortcuts 兼容

## 方案设计

### 方案A: 在 useKeyboardShortcuts 内部 subscribe shortcutStore（推荐）

在 hook 内部直接 subscribe shortcutStore，动态更新 handler 中的 key 映射。

**优点**: 单一组件负责，外部调用方无需修改
**缺点**: handler 逻辑变复杂

### 方案B: 在 DDSCanvasPage 中订阅 shortcutStore，动态更新传递给 useKeyboardShortcuts 的回调

在父组件订阅 store，用 state 驱动传递给 hook。

**优点**: hook 改动小
**缺点**: 状态提升，外部组件复杂

**选择方案A**，更内聚。

### 核心变更

1. **添加 `ACTION_KEY_MAP`**: 静态映射 action name → key pattern，用于从 shortcutStore 读取 currentKey 时判断哪个 callback 应该触发
2. **添加 `registerDynamicShortcut(key, action)`**: 动态注册/注销单条快捷键
3. **添加 shortcutStore subscribe 逻辑**: store 变化时重新注册所有动态快捷键
4. **保留硬编码兜底**: shortcutStore 中没有的 action，沿用硬编码
5. **U2-P003**: 在 `captureKey` 成功时（无冲突），shortcutStore 中已能阻止保存——无需额外 runtime 触发，冲突检测逻辑已完整

### 关键: store subscribe 实现

```typescript
// 在 useEffect 中
useEffect(() => {
  // 动态注册系统
  const dynamicHandlers: Map<string, (e: KeyboardEvent) => void> = new Map();

  function unregisterAll() {
    dynamicHandlers.forEach((handler, key) => {
      document.removeEventListener('keydown', handler, false);
    });
    dynamicHandlers.clear();
  }

  function registerDynamic(key: string, action: string) {
    // 焦点保护
    if (isInputFocused(e) && key !== 'Escape') return;
    // 触发对应 callback
    actionCallbacks[action]?.();
  }

  // Subscribe shortcutStore
  const unsubscribe = useShortcutStore.subscribe((state) => {
    unregisterAll();
    state.shortcuts
      .filter(s => s.enabled && s.currentKey)
      .forEach(s => {
        if (ACTION_KEY_MAP[s.action]) {
          const handler = (e: KeyboardEvent) => {
            // parseKeyEvent(e) === s.currentKey 时触发
            registerDynamic(s.currentKey, s.action);
          };
          dynamicHandlers.set(s.currentKey, handler);
          document.addEventListener('keydown', handler, false);
        }
      });
  });

  return () => {
    unregisterAll();
    unsubscribe();
  };
}, [/* deps */]);
```

实际上，动态快捷键的触发方式和硬编码一样——都是按 key → 触发 callback。区别在于注册源：
- 硬编码: `Ctrl+Z` → `undo()` 始终注册
- 动态: `shortcutStore.currentKey` → `callback` 按 store 配置动态注册

所以实现上，只需把动态快捷键当作另一组注册源，和硬编码一起在同一个 handler 里判断。

**简化方案**:
1. 硬编码快捷键逻辑不变（作为默认值/兜底）
2. 额外注册一个动态 handler：从 shortcutStore 读取 `shortcuts` 列表，按 `currentKey` 映射到对应 callback
3. 当 `currentKey === 'Cmd+Z'` 且 store 中 enabled=true，动态 handler 也会触发 `undo()`，与硬编码重复但无害（都是调用同一个 callback）
4. 冲突检测：在 `captureKey` 时检查 `isKeyUsedInHandler(action)`，如果 action 不在 handler 中但 key 冲突，则警告

### 更简化方案

关键是理解：「shortcutStore 配置快捷键，用户期望自定义」的核心需求是：
- 用户改 `Cmd+Z` → `Ctrl+Shift+Z`，画布中 undo 的触发 key 也随之改变
- 用户改某个未硬编码的 action（如 `go-to-canvas`），当按下 `Cmd+1` 时能触发对应 callback

最简单实现：在 useKeyboardShortcuts 中直接读取 `shortcutStore.getState().shortcuts`，按 action→key 映射注册到对应的 callback。

```typescript
useEffect(() => {
  const state = useShortcutStore.getState();
  const handlers: Array<() => void> = [];
  
  state.shortcuts.forEach(s => {
    if (!s.currentKey || !s.enabled) return;
    const callback = actionMap[s.action];
    if (!callback) return; // 没有对应 callback，跳过
    
    const handler = (e: KeyboardEvent) => {
      const keyStr = parseKeyEvent(e);
      if (keyStr === s.currentKey) {
        if (isInputFocused(e) && keyStr !== 'Escape') return;
        e.preventDefault();
        callback();
      }
    };
    document.addEventListener('keydown', handler);
    handlers.push(handler);
  });
  
  return () => handlers.forEach(h => document.removeEventListener('keydown', h));
}, [shortcuts /* 依赖 shortcutStore */]);
```

但这在每次 store 变化时都会重新注册所有 handler。更高效的方式是用 subscribe 只更新变化的快捷键，但要完全避免冲突需要跟踪每个 handler。

考虑到快捷键数量有限（20 个左右），重新注册的性能影响可以忽略不计，关键是实现简洁可靠。所以采用订阅 store 变化时完全重新注册所有 handler 的方案。

## 实施步骤

### Step 1: 修改 useKeyboardShortcuts.ts

- 导入 `useShortcutStore`
- 定义 `actionMap`: `{ [action: string]: () => void }` 从 props callbacks 构造
- 添加 `useEffect` 订阅 shortcutStore，每次变化完全重新注册动态 handler
- 保留硬编码兜底（shortcutStore 中没有的 action）

### Step 2: 添加测试

在 `useKeyboardShortcuts.test.ts` 中：
- 测试 shortcutStore 变化后 handler 随之更新
- 测试 conflict 场景

### Step 3: 验证

- `pnpm tsc --noEmit` 通过
- `pnpm build` 通过
- `pnpm test` 通过

### Step 4: commit

## 验收标准

- [ ] `shortcutStore.getState().shortcuts` 驱动 `useKeyboardShortcuts` 的运行时行为
- [ ] 用户在设置页修改快捷键后，画布中实时生效
- [ ] 保存冲突快捷键时，UI 显示警告并阻止保存（shortcutStore 已有此逻辑）
- [ ] `?` 键打开快捷键帮助面板（DDSCanvasPage 已实现）
- [ ] 所有现有测试通过
- [ ] 无 TypeScript 错误
- [ ] CHANGELOG 更新

## 回滚计划

`git revert <commit>` 即可撤销。