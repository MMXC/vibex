# Spec: E3-version-history — 版本历史四态规格

**对应 Epic**: E3 版本历史验证
**组件范围**: prototypeVersionStore + version-history 页面
**版本**: 1.0.0

---

## 1. prototypeVersionStore 数据规格

### 1.1 Store 接口

```typescript
interface Snapshot {
  id: string;              // 非空 UUID
  name: string;             // 版本名称
  createdAt: string;        // ISO 8601 时间戳
  data: {
    nodes: ProtoNode[];     // 画布节点数据
    edges: Edge[];          // 画布连线数据
  };
}

interface PrototypeVersionStore {
  snapshots: Snapshot[];                  // 快照列表
  selectedSnapshotId: string | null;       // 当前选中快照 ID
  comparePair: [string, string] | null;    // 对比 pair
  createSnapshot: (name?: string) => Promise<Snapshot>;
  restoreSnapshot: (id: string) => Promise<void>;
  loadSnapshots: () => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
  setSelectedSnapshot: (id: string | null) => void;
  setComparePair: (pair: [string, string] | null) => void;
}
```

### 1.2 Store 行为规格

**createSnapshot**:
- 调用后 `snapshots.length` 增加 1
- 新增 Snapshot 的 `id` 非空
- 新增 Snapshot 的 `createdAt` 为当前时间
- 新增 Snapshot 的 `data.nodes` 包含当前画布节点

**restoreSnapshot**:
- 调用后当前画布 `nodes` 数据与 Snapshot 的 `data.nodes` 一致
- `selectedSnapshotId` 更新为目标 Snapshot 的 `id`
- 恢复失败时抛出异常，不修改当前画布数据

**loadSnapshots**:
- 异步加载，更新 `snapshots` 数组
- 加载期间页面进入 loading 态

---

## 2. version-history 页面四态

### 2.1 理想态 (ideal)

**触发条件**: 存在 ≥ 1 个版本快照

**UI 元素**:
- 版本列表侧边栏容器（`testId="version-list"`，`role="list"`）
- 版本项（`testId="version-item"`，`role="listitem"`，每个版本一条）：
  - 时间显示（`testId="version-time"`，格式: "2026-04-15 14:32"，正则 `/2026-04-1\d \d\d:\d\d/`）
  - 版本名称（`testId="version-name"`）
  - 节点数量 badge（`testId="node-count-badge"`，显示如 "12 节点"）
  - 选中态高亮（左侧 `4px` 彩色条，`var(--color-primary, #4F46E5)`）
- hover 状态显示操作按钮（`testId="version-actions"`）：
  - "恢复" 按钮（icon + 文字）
  - "对比" 按钮（icon + 文字）
  - "删除" 按钮（icon + 文字，`color: var(--color-error, #EF4444)`）
- "保存版本" 按钮（`testId="save-version-btn"`，floating action，primary 样式）

**情绪引导文案**: "找到你要的版本了吗？"

**间距规范（8倍数）**:
- 列表内边距: `padding: 8px`
- 版本项间距: `gap: 8px`
- 版本项内边距: `padding: 12px`
- 元素间间距: `gap: 8px`
- badge 与文字间距: `gap: 4px`

**颜色 Token**:
- 列表背景: `var(--color-surface, #FFFFFF)`
- 选中态背景: `var(--color-primary-bg, #EEF2FF)`
- 未选中态背景: `var(--color-surface, #FFFFFF)`
- hover 背景: `var(--color-hover, #F9FAFB)`
- 节点数量 badge 背景: `var(--color-badge-bg, #F3F4F6)`

---

### 2.2 空状态 (empty)

**触发条件**: `snapshots.length === 0`

**UI 元素**:
- 版本列表区域保持显示
- 空状态图标（`testId="empty-icon"`，内联 SVG 时间机器图标，`width/height: 48px`，`color: var(--color-text-muted, var(--color-text-muted))`）
- 空状态文案（`testId="empty-text"`）："还没有保存过版本"
- "保存第一个版本" 按钮（`testId="save-first-version-btn"`，primary 样式）
- 禁止纯空白，列表容器仍然渲染

**情绪引导文案**: "还没有版本历史 — 保存一个，之后随时能回来"

**间距规范**:
- 空状态图标与文案间距: `gap: 16px`
- 文案与按钮间距: `gap: 16px`
- 列表容器内居中: `display: flex; flex-direction: column; align-items: center; justify-content: center`

**颜色 Token**: 同 ideal，空状态文案使用 `var(--color-text-muted, #9CA3AF)`

---

### 2.3 加载态 (loading)

**触发条件**: `loadSnapshots()` 调用期间

**UI 元素**:
- 版本列表区域保持显示
- 骨架屏替代列表项（`testId="version-skeleton"`，5 个灰色占位块，每个 `height: 56px`，`border-radius: 8px`）
- skeleton 数量固定 5 个（即使最终版本数 < 5）
- loading spinner（`role="progressbar"`，`aria-label="加载版本历史"`，位于列表顶部或独立）
- 禁止使用纯 spinner，必须有骨架屏

**情绪引导文案**: "正在加载版本历史..."

**间距规范**: 同 ideal，骨架屏间距 `gap: 8px`

**颜色 Token**:
- 骨架屏背景: `var(--color-skeleton, #F3F4F6)`
- 骨架屏动画: `@keyframes shimmer`

---

### 2.4 错误态 (error)

**触发条件**: 版本加载失败 / 版本恢复失败

**UI 元素**:

*场景 A — 加载失败*:
- Toast 弹窗（`role="alert"`，`testId="toast-error"`）："加载版本历史失败"
- "重试" 按钮（`testId="retry-load-btn"`）
- 版本列表区域显示错误状态占位（保持容器，不留白）

*场景 B — 恢复失败*:
- Toast 弹窗（`role="alert"`）："恢复失败，请重试"
- **当前画布数据不受影响**（版本恢复操作有事务保护）
- 选中态回到之前状态

**情绪引导文案**: "出问题了，你的画布数据没丢 — 可以重试"

**间距规范**: 同 ideal

**颜色 Token**:
- Toast 错误背景: `var(--color-error-bg, #FEF2F2)`
- Toast 错误文字: `var(--color-error, #EF4444)`

---

## 3. 验收标准

### QA 验证点映射

| 验证点 | 组件 | 态 | 测试断言 |
|--------|------|---|---------|
| F3.1 | prototypeVersionStore | — | `expect(usePrototypeVersionStore.getState().snapshots).toBeDefined()` |
| F3.1 | prototypeVersionStore | — | `expect(usePrototypeVersionStore.getState().createSnapshot).toBeDefined()` |
| F3.1 | prototypeVersionStore | — | `expect(after).toBe(before + 1)` 创建快照后数量 +1 |
| F3.1 | prototypeVersionStore | — | `expect(afterNodes).toBe(JSON.stringify(target.data.nodes))` 恢复数据一致 |
| F3.2 | version-history | ideal | `expect(getByTestId('version-list')).toBeVisible()` |
| F3.2 | version-history | ideal | `expect(getAllByTestId('version-item').length).toBeGreaterThan(0)` |
| F3.2 | version-history | empty | `expect(getByTestId('empty-text')).toHaveTextContent(/还没有保存过版本/i)` |
| F3.2 | version-history | empty | `expect(getByTestId('save-first-version-btn')).toBeVisible()` |
| F3.2 | version-history | loading | `expect(getAllByTestId('version-skeleton')).toHaveLength(5)` |
| F3.2 | version-history | error | `expect(getByRole('alert')).toBeVisible()` |

---

## 4. 设计约束

### 通用约束

- **间距**: 所有间距使用 8 倍数（`4px / 8px / 12px / 16px`），禁止硬编码非 8 倍数
- **颜色**: 所有颜色通过 CSS Custom Properties（Token）引用，禁止硬编码 hex 值
- **字体**: 时间使用 `var(--text-sm, 14px)`，节点数量 badge 使用 `var(--text-xs, 12px)`
- **动画时长**: `var(--duration-fast, 150ms)` / `var(--duration-base, 300ms)`

### 四态设计原则

- **ideal**: 版本信息完整，选中态清晰，hover 操作可见
- **empty**: 时间机器图标 + 引导文案 + 明确行动按钮，不留白
- **loading**: 骨架屏替代，禁止纯 spinner
- **error**: Toast 提示 + 重试按钮，画布数据不受影响
