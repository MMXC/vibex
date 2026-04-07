# AGENTS.md — canvas-phase-nav-and-toolbar-issues 开发约束

**项目**: canvas-phase-nav-and-toolbar-issues
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 通用约束

- **禁止引入破坏性变更** — 所有修改向后兼容
- **CSS 规范** — 仅修改 `canvas.module.css`，不得引入内联 style 新规则
- **必须写测试** — 每个 Story 必须有对应测试文件
- **禁止删除现有 store 方法** — selectAll/deselectAll 等方法必须保留

### 1.2 E1 专项约束

#### T1: 导航去重约束
```tsx
// ✅ 正确：input 阶段保留 PhaseProgressBar
{phase === 'input' && (
  <PhaseProgressBar ... />
)}

// ✅ 正确：非 input 阶段只保留 TabBar
{phase !== 'input' && (
  <TabBar onTabChange={...} onPhaseChange={...} />
)}

// ❌ 错误：删除 PhaseProgressBar（input 阶段需要）
```

#### T2: 继续按钮约束
```tsx
// ✅ 正确：始终渲染，用 disabled 控制
<button disabled={flowGenerating || contextNodes.length === 0}>
  {contextNodes.length === 0 ? '需先生成上下文' : '→ 继续 → 流程树'}
</button>

// ❌ 错误：条件渲染导致按钮消失
{contextNodes.length > 0 && <button>...</button>}
```

#### T3: 工具栏约束
```tsx
// ✅ 正确：使用 TreeToolbar 组件统一
<TreeToolbar
  treeType="flow"
  nodeCount={flowNodes.length}
  onSelectAll={...}
  onClear={...}
/>

// ❌ 错误：内联分散的按钮
<div>
  <button>继续</button>
  <button>展开</button>
</div>
```

#### T4: API 调用约束
```typescript
// ✅ 正确：使用 canvasApi
const contexts = await canvasApi.generateContexts(text);

// ❌ 错误：直接写入 mock 数据
setContextNodes(mockData);
```

---

## 2. Git 提交规范

### 2.1 Commit Message 格式

```
<type>(<scope>): <subject>

<type>: feat | fix | test | style
<scope>: canvas-nav | toolbar | drawer | api
```

### 2.2 示例

```bash
fix(canvas-nav): 移除 PhaseIndicator/PhaseLabelBar 重复导航
fix(toolbar): 继续按钮移除 length > 0 条件渲染
feat(toolbar): 新增 TreeToolbar 统一三栏工具栏
feat(api): canvasApi 新增 generateContexts/Flows/Components
fix(drawer): handleSend 调用真实 canvasApi 替换 mock
test(canvas-nav): canvas-nav-dedup 单元测试
```

---

## 3. 测试规范

### 3.1 Vitest 单元测试

| Story | 测试文件 | 覆盖率目标 |
|-------|---------|-----------|
| E1-S1 | `canvas-nav-dedup.test.tsx` | > 70% |
| E1-S2 | `continue-button.test.tsx` | > 70% |
| E1-S4 | `left-drawer-send.test.tsx` | > 70% |

### 3.2 Playwright E2E 测试

| Story | 测试文件 | 验收点 |
|-------|---------|--------|
| E1-S3 | `toolbar-unified.spec.ts` | 全选/清空/继续按钮存在 |

### 3.3 Mock 规范

```typescript
// Vitest: mock canvasApi
vi.mock('@/api/canvasApi', () => ({
  canvasApi: {
    generateContexts: vi.fn().mockResolvedValue([mockCtx]),
    generateFlows: vi.fn().mockResolvedValue([mockFlow]),
    generateComponents: vi.fn().mockResolvedValue([mockComp]),
  },
}));
```

---

## 4. 代码审查清单

### E1-S1 导航去重
- [ ] phase === 'input' 时保留 PhaseProgressBar
- [ ] phase !== 'input' 时只保留 TabBar
- [ ] PhaseIndicator 包裹（phase !== 'input' 时）已删除
- [ ] PhaseLabelBar 已删除
- [ ] TabBar 有 onPhaseChange prop

### E1-S2 继续按钮
- [ ] TreePanel actions 不再有 `length > 0` 条件渲染
- [ ] 空状态显示提示文字且 disabled
- [ ] 非空状态正常显示且可点击

### E1-S3 工具栏统一
- [ ] TreeToolbar.tsx 已创建
- [ ] 三栏 TreePanel 都使用 TreeToolbar
- [ ] 全选/取消/清空按钮存在
- [ ] 继续按钮显示正确标签
- [ ] 按钮 min-height >= 44px

### E1-S4 发送按钮
- [ ] canvasApi.ts 已创建
- [ ] generateContexts/Flows/Components 方法存在
- [ ] LeftDrawer handleSend 调用 canvasApi
- [ ] 不再有直接 setContextNodes(mockData)

---

## 5. 设计规范

- **颜色**: 复用 `canvas.module.css` 已有 CSS 变量
- **字体**: 复用 `design-tokens.css` 定义
- **动画**: 使用 CSS transition + transform（GPU 加速）
- **无障碍**: 按钮高度 44px 满足 iOS 可访问性标准
- **按钮风格**: 统一使用 `.secondaryButton` 和 `.continueButton` class

---

## 6. 环境配置

```bash
# 测试环境
NODE_ENV=test
VITEST=true

# Playwright E2E
npx playwright test --project=chromium e2e/canvas/

# Vitest 单元测试
npm run test:unit -- --coverage
```

---

## 7. 关键文件路径

```
vibex-fronted/src/
├── components/canvas/
│   ├── CanvasPage.tsx           # 主要修改点
│   ├── TabBar.tsx               # 新增 onPhaseChange
│   ├── LeftDrawer.tsx          # handleSend 修复
│   └── TreeToolbar.tsx         # 新增
├── api/
│   └── canvasApi.ts            # 新增
└── app/canvas/
    └── canvas.module.css       # treeToolbar 样式
```

---

*本文档由 Architect Agent 生成于 2026-04-04 18:53 GMT+8*
