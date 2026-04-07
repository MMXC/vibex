# AGENTS.md: VibeX Canvas 架构演进路线图

> **项目**: vibex-canvas-evolution-roadmap  
> **架构文档**: `docs/architecture/architecture.md`  
> **实施计划**: `docs/architecture/IMPLEMENTATION_PLAN.md`  
> **版本**: v1.0.0  
> **日期**: 2026-03-29  

---

## Dev Agent 约束

### 🚨 硬性约束（违反 = PR Block）

| 约束 | 说明 | 违规后果 |
|------|------|---------|
| ❌ 禁止 emoji 作为交互元素 | checkbox、按钮等必须用 CSS/图标 | Accessibility 扫描失败 |
| ❌ 禁止硬编码颜色值 | 必须使用 CSS 变量 | 样式回退风险 |
| ❌ 禁止在 canvas 模块引入 Tailwind | 已有 Tailwind 不移除，新代码用 CSS Modules | 样式不一致 |
| ❌ 禁止删除现有数据字段 | 新字段必须有向后兼容推导逻辑 | 数据丢失风险 |
| ❌ 禁止在 render 中同步大量计算 | 必须使用 `useMemo`/`useCallback` | 性能问题 |

### ✅ 强制要求

| 要求 | 实现方式 | 验证方式 |
|------|---------|---------|
| 所有交互元素有 `aria-*` 属性 | `aria-label`, `aria-checked`, `aria-expanded` | axe-core 扫描通过 |
| CSS 变量必须定义在 `canvas.variables.css` | 统一管理，禁止散落 | 代码审查 |
| 状态管理使用 Zustand canvasStore | 禁止新建 local state 存储树数据 | 代码审查 |
| 单元测试覆盖率 > 80% | Canvas 相关模块 | `pnpm coverage` |
| 新组件必须有 Vitest 测试 | 每个组件至少 3 个测试用例 | CI 门禁 |

---

## Dev Agent 任务卡

### 🎯 Phase 1 任务

#### P1-T1: 限界上下文领域分组虚线框

**文件变更**:
- `core/canvas/types.ts` — 增加 `DomainType` 类型
- `core/canvas/utils.ts` — 增加 `deriveDomainType()` 函数
- `components/canvas/BoundedContextTree.tsx` — 按 domainType 分组
- `styles/canvas.variables.css` — 新建，定义领域色变量

**实现检查点**:
- [ ] `deriveDomainType()` 测试覆盖 > 90%
- [ ] 4 种领域类型颜色不同
- [ ] 空分组不渲染 DOM

#### P1-T2: CSS Checkbox 统一样式

**文件变更**:
- `components/ui/checkbox/Checkbox.tsx` — 新建封装组件
- `components/ui/checkbox/Checkbox.module.css` — 新建样式文件
- `ComponentSelectionStep.tsx` — 替换 emoji checkbox
- `NodeSelector.tsx` — 替换 emoji checkbox
- `BoundedContextTree.tsx` — 替换 confirmedBadge

**实现检查点**:
- [ ] 3 个组件均使用统一 Checkbox 组件
- [ ] 无 emoji 字符 `grep -r '[✓○×]' components/canvas`
- [ ] axe-core 扫描 0 violations

#### P1-T3: 流程卡片虚线边框 + 步骤类型

**文件变更**:
- `core/canvas/types.ts` — 增加 `FlowStepType`
- `core/canvas/utils.ts` — 增加 `deriveStepType()` 函数
- `components/canvas/FlowCard.module.css` — border: solid → dashed
- `components/canvas/BusinessFlowTree.tsx` — 渲染步骤类型图标
- `components/canvas/StepEditor.tsx` — 增加类型选择下拉框

**实现检查点**:
- [ ] undefined stepType → 'normal' 推导 100% 覆盖
- [ ] `.flowCard` 边框为虚线
- [ ] 分支/循环有对应图标标识

#### P1-T4: 导入导航修复

**文件变更**:
- `data/example-canvas.json` — 补充 previewUrl 字段
- `components/canvas/ComponentTree.tsx` — handleNodeClick 降级逻辑
- `app/preview/page.tsx` — query param 增强

**实现检查点**:
- [ ] 导入示例后点击所有节点无 404
- [ ] 不存在的节点 → 友好提示（非白屏）

---

### 🎯 Phase 2 任务

#### P2-T1: 三栏画布双向展开

**文件变更**:
- `core/canvas/store.ts` — 扩展 PanelExpandState
- `components/canvas/CanvasContainer.tsx` — CSS Grid 动态布局
- `components/canvas/CanvasContainer.module.css` — expand-both 样式

**实现检查点**:
- [ ] expand-both 时 canvas 占 3fr
- [ ] 动画过渡 0.3s ease
- [ ] 移动端（< 768px）禁用 expand-both

#### P2-T2: 数据持久化完善

**文件变更**:
- `core/canvas/store.ts` — 配置 persist middleware

**实现检查点**:
- [ ] 刷新页面后三棵树数据完整
- [ ] localStorage 存储 < 5MB
- [ ] 首次加载 < 2s

#### P2-T3: 组件树批量操作

**文件变更**:
- `components/canvas/CanvasToolbar.tsx` — 新建
- `core/canvas/store.ts` — 增加 selectAll/deselectAll/clearCanvas

**实现检查点**:
- [ ] 批量勾选后批量确认/删除
- [ ] 清空前二次确认弹窗

#### P2-T4: 画布拖拽排序

**文件变更**:
- `package.json` — 依赖 `@dnd-kit/core`
- `components/canvas/ComponentTree.tsx` — 集成拖拽
- `core/canvas/store.ts` — 增加 reorderNodes

**实现检查点**:
- [ ] 拖拽时显示占位符
- [ ] 排序后 order 字段正确更新

---

### 🎯 Phase 3 任务

#### P3-T1: ReactFlow 统一层

**文件变更**:
- `package.json` — 依赖 `reactflow`
- `components/canvas/VibeXFlow.tsx` — 新建包装组件
- `core/canvas/nodeRegistry.ts` — 节点注册表
- `core/canvas/edgeRegistry.ts` — 边注册表

**实现检查点**:
- [ ] 三种树统一使用 VibeXFlow 渲染
- [ ] 新节点类型无需修改 VibeXFlow 核心

#### P3-T5: 导出功能

**文件变更**:
- `core/canvas/exporters/` — JSON/OpenAPI/Markdown 导出器
- `components/canvas/ExportMenu.tsx` — 导出菜单

**实现检查点**:
- [ ] 导出 JSON 包含三棵树完整数据
- [ ] 导出 OpenAPI 可直接用于 API 文档

---

## Tester Agent 约束

### 测试覆盖率要求

| 模块 | 覆盖率目标 | 最低测试数 |
|------|-----------|-----------|
| `core/canvas/` | > 85% | 30 个用例 |
| `components/canvas/` | > 70% | 20 个用例 |
| `utils/` 推导函数 | > 90% | 15 个用例 |

### 关键测试场景

| 场景 | 测试方式 | 覆盖率要求 |
|------|---------|-----------|
| domainType 推导 | Vitest | 100% 分支覆盖 |
| stepType 推导 | Vitest | 100% 分支覆盖 |
| 面板展开状态切换 | Vitest | 全部状态覆盖 |
| 导入导航跳转 | Playwright E2E | 全部节点类型 |
| 深色模式样式 | Playwright | 截图对比 |
| 无障碍合规 | axe-core | 0 violations |

### E2E 测试清单

```typescript
// e2e/canvas/phase1.spec.ts
test.describe('Phase 1 验收测试', () => {
  test('限界上下文 4 色分组渲染', async ({ page }) => {
    await page.goto('/canvas');
    // 验证 4 种颜色均出现
  });
  
  test('Checkbox 无 emoji 字符', async ({ page }) => {
    const emojiCount = await page.evaluate(() => {
      const body = document.body.innerText;
      return (body.match(/[✓○×]/g) || []).length;
    });
    expect(emojiCount).toBe(0);
  });
  
  test('流程卡片虚线边框', async ({ page }) => {
    const flowCard = page.locator('.flowCard').first();
    await expect(flowCard).toHaveCSS('border-style', 'dashed');
  });
  
  test('导入导航 100% 可点击', async ({ page }) => {
    // 见 IMPLEMENTATION_PLAN.md
  });
});

// e2e/canvas/phase2.spec.ts
test.describe('Phase 2 验收测试', () => {
  test('双向展开动画流畅', async ({ page }) => {
    // 见 IMPLEMENTATION_PLAN.md
  });
  
  test('数据持久化', async ({ page }) => {
    await page.goto('/canvas');
    // 添加节点
    await page.reload();
    // 验证节点仍在
  });
});

// e2e/canvas/phase3.spec.ts
test.describe('Phase 3 验收测试', () => {
  test('ReactFlow 节点渲染', async ({ page }) => {
    // 见 IMPLEMENTATION_PLAN.md
  });
});
```

---

## 代码审查清单

### PR 合并前必须通过

- [ ] 单元测试覆盖率报告（Canvas 相关 > 80%）
- [ ] `pnpm lint` 通过
- [ ] `pnpm type-check` 通过
- [ ] axe-core 无障碍扫描 0 violations
- [ ] Playwright E2E 核心场景 100% 通过
- [ ] 无硬编码颜色值（使用 CSS 变量）
- [ ] 无 emoji 交互元素
- [ ] 新组件有 Vitest 测试用例

### 样式规范检查

```bash
# 检查硬编码颜色
grep -rn '#[0-9a-fA-F]\{3,6\}' components/canvas/*.module.css | grep -v 'var(--' || echo "✅ 无硬编码颜色"

# 检查 emoji 字符
grep -rn '[✓○×]' components/canvas/*.tsx || echo "✅ 无 emoji checkbox"
```

---

## 提交规范

```
feat(canvas): <功能描述>

详细的变更说明

BREAKING CHANGE: (如有)
Closes: #<issue>
```

---

## 参考文档

- 架构文档: `docs/architecture/architecture.md`
- 实施计划: `docs/architecture/IMPLEMENTATION_PLAN.md`
- PRD: `docs/architecture/prd.md`
- 分析报告: `docs/architecture/analysis.md`
- ADR 索引: `docs/architecture/vibex-canvas-evolution.md#7-adr-索引`
- 变更日志: `docs/vibex-canvas-evolution-roadmap/CHANGELOG.md`（必须产物，从 Next.js changelog page 导出）
