# VibeX 技术债清理 — 实施计划

**项目**: vibex-dev-proposals-task
**日期**: 2026-04-11
**总工时**: ~12-18 天（建议 3 个 Sprint，每 Sprint 5 天）

---

## Sprint 划分

| Sprint | 时间 | Epic | 工时 | 目标 |
|--------|------|------|------|------|
| Sprint 1 | D1-D5 | Epic 1 + Epic 2 + Epic 6 | ~7d | 设计系统统一（Auth + Preview），文档治理 |
| Sprint 2 | D6-D10 | Epic 3 + Epic 4 | ~4-5d | renderer 重构 + Canvas 拆分 |
| Sprint 3 | D11-D15 | Epic 5 | ~2d | Store 规范化 + 收尾 |

---

## Sprint 1: 设计系统统一

### Epic 1: Auth CSS Module（3-5 天）

#### Story 1.1: Auth 内联样式迁移

**代码修改点**:

1. 创建 `vibex-fronted/src/app/auth/auth.module.css`
2. 提取 `page.tsx` 中的内联 `style={{...}}` 对象到 CSS Module
3. 将 `style={styles.xxx}` 替换直接 JSX 引用
4. 确保 CSS 变量覆盖所有设计 token

**关键文件**:
```
vibex-fronted/src/app/auth/
  page.tsx           ← 移除内联 style，引用 CSS Module
  auth.module.css    ← 新建
```

**执行步骤**:
```bash
# 1. 统计当前内联样式数量
grep -n "style={{" vibex-fronted/src/app/auth/page.tsx | wc -l

# 2. 创建 CSS Module
touch vibex-fronted/src/app/auth/auth.module.css

# 3. 逐元素迁移（示例）
# 从: <div style={{ padding: '16px', color: '#fff' }}>
# 到:   <div className={styles.container}>
```

#### Story 1.2: Auth Hover 修复

**代码修改点**:
```
vibex-fronted/src/app/auth/auth.module.css
  添加: .submitButton:hover { background-color: var(--color-primary-hover); }

vibex-fronted/src/styles/globals.css
  检查: --color-primary-hover: #00e5e5; 是否存在
```

---

### Epic 2: Preview CSS Module（3-4 天）

#### Story 2.1: Preview 内联样式迁移

**关键文件**:
```
vibex-fronted/src/app/preview/
  page.tsx              ← 移除内联 style，引用 CSS Module
  preview.module.css    ← 新建
```

**执行步骤**:
```bash
# 1. 统计当前内联样式数量
grep -rn "style={{" vibex-fronted/src/app/preview/ --include="*.tsx" | wc -l
# 期望: ~362 处

# 2. 创建 CSS Module
touch vibex-fronted/src/app/preview/preview.module.css

# 3. 分批迁移（建议按组件/区域分）
```

#### Story 2.2: Preview 硬编码颜色清理

**代码修改点**:
```
vibex-fronted/src/app/preview/preview.module.css
  将硬编码颜色替换为 CSS 变量
  例如: color: '#fff' → color: var(--color-surface);
```

---

### Epic 6: 文档治理（0.5 天）

#### Story 6.1: Firebase 状态标注

**代码修改点**:
```
README.md
  "多人实时协作" → "多人实时协作（规划中）"
```

#### Story 7.1: ESLint 豁免清理

**代码修改点**:
```
ESLINT_EXEMPTIONS.md
  添加 quarterly review 机制说明
  检查豁免数量 ≤ 2
```

---

## Sprint 2: 渲染引擎与 Canvas

### Epic 3: renderer 重构（3 天）

#### Story 3.1: renderer.ts 拆分

**关键文件**:
```
vibex-fronted/src/lib/prototypes/renderer/
  types.ts                  ← 新建: 类型定义
  style-utils.ts            ← 新建: 样式工具函数
  component-renderers.ts   ← 新建: 组件渲染器
  theme-resolver.ts        ← 新建: 主题解析
  main-renderer.ts         ← 新建: 主入口，代理原 renderer.ts
  renderer.ts              ← 保留备份，逐步精简
```

**执行步骤**:
```bash
# 1. 分析 renderer.ts 依赖图
cd vibex-fronted && pnpm exec madge --circular src/lib/prototypes/renderer.ts

# 2. 按顺序拆分
# Step 1: 提取 types.ts（纯类型，无依赖）
# Step 2: 提取 style-utils.ts（依赖 types）
# Step 3: 提取 theme-resolver.ts（依赖 types, style-utils）
# Step 4: 提取 component-renderers.ts（依赖 types, style-utils, theme-resolver）
# Step 5: 提取 main-renderer.ts（入口，依赖所有子模块）

# 3. 验证渲染功能
cd vibex-fronted && pnpm exec playwright test tests/e2e/preview/
```

#### Story 3.3: renderer Vitest 测试

**代码修改点**:
```
vibex-fronted/src/lib/prototypes/renderer/
  types.test.ts
  style-utils.test.ts
  component-renderers.test.ts
  theme-resolver.test.ts
  main-renderer.test.ts
```

---

### Epic 4: Canvas 组件拆分（1-2 天）

#### Story 4.1: CanvasPage 职责拆分

**关键文件**:
```
vibex-fronted/src/components/canvas/
  CanvasLayout.tsx        ← 新建: 三列布局编排
  CanvasHeader.tsx        ← 新建: 工具栏（从 CanvasPage 提取）
  CanvasPanels.tsx        ← 新建: 面板管理
  CanvasPage.tsx          ← 重构: 降为编排层，≤150 行
```

**执行步骤**:
```bash
# 1. 统计当前行数
wc -l vibex-fronted/src/components/canvas/CanvasPage.tsx
# 期望: 723 行

# 2. 按 UI 区域提取
# 提取逻辑: CanvasHeader → 工具栏相关 state + handlers
# 提取逻辑: CanvasPanels → 面板展开/收起状态
# 提取逻辑: CanvasLayout → 三列 flex 布局
```

---

## Sprint 3: Store 规范化

### Epic 5: Store 体系规范化（2 天）

#### Story 5.1: Store 分层文档

**代码修改点**:
```
vibex-fronted/docs/architecture/
  store-architecture.md    ← 新建: Store 架构文档
```

**文档内容**:
- 根 stores vs canvas/stores 职责矩阵
- store 间通信规范（crossStoreSync 使用场景）
- 新增 store 命名规范

#### Story 5.2: 重复 Store 清理

**代码修改点**:
```
# 识别重复 store
grep -rn "simplifiedFlowStore\|flowStore" vibex-fronted/src/

# 清理策略:
# 1. 保留功能更完整的 store
# 2. 将简化的 store 代理到完整的 store
# 3. 逐步迁移引用后删除
```

---

## 验收总览

| Sprint | Story | 验收条件 | 状态 |
|--------|-------|----------|------|
| 1 | 1.1 | grep "style={{" auth/ → 空 | 待验证 |
| 1 | 1.2 | hover 效果正常 | 待验证 |
| 1 | 2.1 | grep "style={{" preview/ → 空 | 待验证 |
| 1 | 2.2 | 无硬编码颜色 | 待验证 |
| 1 | 6.1 | README 状态已更新 | 待验证 |
| 1 | 7.1 | ESLint 豁免 ≤ 2 | 待验证 |
| 2 | 3.1 | renderer 5 子模块存在，行数 < 600 | 待验证 |
| 2 | 3.3 | renderer 测试覆盖率 ≥ 70% | 待验证 |
| 2 | 4.1 | CanvasPage.tsx ≤ 150 行 | 待验证 |
| 3 | 5.1 | store-architecture.md 存在 | 待验证 |
| 3 | 5.2 | 无重复 Store | 待验证 |

