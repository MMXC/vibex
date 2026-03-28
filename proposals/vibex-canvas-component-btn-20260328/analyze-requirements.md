# 需求分析报告：「继续·组件树」按钮缺失问题

**项目**: vibex-canvas-component-btn-20260328  
**任务**: analyze-requirements  
**角色**: Analyst  
**分析时间**: 2026-03-28 16:26 GMT+8  
**状态**: ✅ 分析完成

---

## 1. 问题概述

### 1.1 问题描述
用户在完成业务流程树编辑后，无法找到或看到「继续 → 组件树」按钮，导致无法继续到组件树生成阶段。

### 1.2 问题影响
- **用户体验**: 用户流程中断，无法完成三树画布的完整操作流程
- **业务目标**: 阻断 DDD 建模流程的最后一环
- **影响范围**: 所有进入 flow 阶段的用户

---

## 2. 问题场景分析

### 2.1 正常用户流程

```
需求录入 → 限界上下文树 → 业务流程树 → 组件树 → 原型生成
                                      ↑
                              需要「继续→组件树」按钮
```

### 2.2 问题触发场景

| 场景 | 描述 | 触发条件 |
|------|------|----------|
| 场景 A | 桌面端三栏布局 | flowNodes 存在但按钮不可见 |
| 场景 B | 移动端 Tab 切换 | 切换到 flow Tab 后按钮缺失 |
| 场景 C | 面板折叠状态 | flowPanelCollapsed=true 时按钮隐藏 |
| 场景 D | 空流程树 | flowNodes.length === 0 时按钮不渲染（预期行为）|

### 2.3 用户行为路径

1. 用户完成上下文树编辑和确认
2. 系统自动/手动生成流程树
3. 用户进入 flow 面板进行编辑
4. 用户寻找「继续到组件树」按钮
5. **问题**: 按钮不可见或位置不明确

---

## 3. 根因定位

### 3.1 代码层面分析

通过代码审查，发现按钮实现位于 `CanvasPage.tsx`：

```typescript
// CanvasPage.tsx (行 297-310)
<TreePanel
  tree="flow"
  title="业务流程树"
  nodes={flowTreeNodes}
  collapsed={flowPanelCollapsed}
  isActive={flowActive}
  onToggleCollapse={toggleFlowPanel}
  actions={
    flowNodes.length > 0 ? (  // ← 条件渲染
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleContinueToComponents}
          disabled={componentGenerating}
          aria-label="继续到组件树"
          title="基于已确认的流程树生成组件树"
        >
          {componentGenerating ? '◌ 生成中...' : '继续 → 组件树'}
        </button>
      </div>
    ) : undefined
  }
>
```

### 3.2 根因识别

| 根因编号 | 根因描述 | 影响程度 |
|----------|----------|----------|
| **G1** | `actions` 渲染位置在 `treePanelBody` 内，折叠时不可见 | 高 |
| **G2** | 按钮位置不够突出，与其他按钮混在一起 | 中 |
| **G3** | Tab 模式下按钮渲染逻辑与桌面端一致，但样式可能不同 | 中 |
| **G4** | 缺少明确的视觉引导告知用户下一步操作 | 中 |

### 3.3 根因详解

#### G1: 折叠状态导致按钮不可见
- **位置**: `TreePanel.tsx` 行 124
- **代码**: `{actions && <div className={styles.treePanelActions}>{actions}</div>}`
- **条件**: 仅在 `!collapsed` 时渲染
- **问题**: 用户可能默认折叠面板，导致按钮消失

#### G2: 按钮视觉权重不足
- **CSS**: `.treePanelActions` 使用 `display: flex; gap: 0.5rem`
- **问题**: 「继续 → 组件树」按钮与「重新生成」等按钮视觉权重相同
- **影响**: 用户可能忽视此按钮

#### G3: 移动端适配问题
- **代码**: `useTabMode` 控制渲染分支
- **Tab 模式**: 使用 `renderTabContent()` 函数渲染
- **桌面模式**: 直接在 JSX 中渲染 `TreePanel`
- **问题**: 两套渲染逻辑可能导致行为不一致

---

## 4. 解决方案建议

### 4.1 方案 A: 提升按钮优先级（推荐）

**原理**: 将「继续 → 组件树」按钮移出 `actions`，作为独立的高优先级操作按钮

**改动范围**:
- `CanvasPage.tsx`: 添加独立按钮区域
- `canvas.module.css`: 新增 `.continueButton` 样式

**优点**: 视觉突出，用户一眼可见  
**缺点**: 需要调整布局

### 4.2 方案 B: 折叠时显示提示

**原理**: 面板折叠时，在折叠 summary 区域显示提示

**改动范围**:
- `TreePanel.tsx`: 折叠状态显示下一步提示
- `canvas.module.css`: 新增 `.collapsedHint` 样式

**优点**: 保持一致性，引导清晰  
**缺点**: 改动组件结构

### 4.3 方案 C: 双位置冗余

**原理**: 在面板头部和底部同时显示按钮

**改动范围**:
- `TreePanel.tsx`: 添加 `headerActions` prop
- `CanvasPage.tsx`: 传递头部按钮

**优点**: 任意位置都能看到  
**缺点**: 重复按钮，代码冗余

---

## 5. 技术约束

### 5.1 技术栈
- **框架**: Next.js 16 + React 19
- **状态管理**: Zustand
- **样式**: CSS Modules
- **测试**: Jest + Playwright

### 5.2 关键文件
| 文件 | 用途 | 修改风险 |
|------|------|----------|
| `src/components/canvas/CanvasPage.tsx` | 主画布组件 | 中 |
| `src/components/canvas/TreePanel.tsx` | 树面板容器 | 高 |
| `src/lib/canvas/canvasStore.ts` | 状态管理 | 低 |

---

## 6. 验收标准

| 验收项 | 标准 | 验证方法 |
|--------|------|----------|
| **V1** | 桌面端 flow 面板有 flowNodes 时，「继续 → 组件树」按钮可见 | Playwright 截图 |
| **V2** | 移动端 Tab 切换到 flow 时，按钮可见 | Playwright 移动端测试 |
| **V3** | 面板折叠时，折叠区域有下一步提示 | Playwright 截图 |
| **V4** | 点击按钮后，componentNodes 被正确生成 | 状态断言 |
| **V5** | 无 flowNodes 时，按钮不渲染（不报错）| 单元测试 |

---

## 7. 风险评估

| 风险 | 描述 | 缓解措施 |
|------|------|----------|
| R1 | 修改 TreePanel 可能影响其他树 | 增量修改，回归测试 |
| R2 | 移动端样式适配复杂 | 使用响应式设计 |
| R3 | 状态同步问题 | 单元测试覆盖 |

---

## 8. 下一步行动

- [ ] **create-prd**: 细化 PRD，明确按钮设计规范
- [ ] **design-architecture**: 设计 UI 改动方案
- [ ] **coord-decision**: 确认方案选择

---

**分析完成时间**: 2026-03-28 16:30 GMT+8  
**分析质量**: 根因定位清晰，3个候选方案  
**建议优先级**: P1（阻断用户流程）
