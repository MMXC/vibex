# PRD: 组件树页面结构增强

**Project**: vibex-proposals-20260411-page-structure  
**Stage**: create-prd  
**PM**: PM  
**Date**: 2026-04-07  
**Status**: Draft

---

## 1. 执行摘要

### 背景

当前组件树按 `flowId` 单维度分组，用户无法直观看到组件归属的具体页面名称，且无法自定义页面展示名称。JSON Preview 功能仅支持单组件预览，缺乏组件树整体结构的视图。

### 目标

1. **pageName 可覆盖**: 组件节点支持可选的 `pageName` 字段，允许用户覆盖默认的 BusinessFlowNode.name
2. **组件树 JSON 视图**: 组件树顶部增加「📋 JSON」按钮，点击弹出 JSON 树结构视图
3. **分组元数据增强**: ComponentGroup 增加 `pageId` + `componentCount` 元数据

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 组件树加载时间 | ≤ 500ms（无性能退化） |
| 单元测试覆盖率 | groupByFlowId + getPageLabel ≥ 90% |
| E2E 测试通过率 | 100%（JSON 预览按钮可见且功能正确） |
| TypeScript 错误 | 0 error |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 类型定义增强 | 0.5h | P0 | S1.1 |
| E2 | 组件树分组增强 | 1.5h | P0 | S2.1, S2.2, S2.3 |
| E3 | JSON 预览功能 | 1h | P0 | S3.1, S3.2 |
| E4 | 测试覆盖 | 0.5h | P0 | S4.1, S4.2 |

**总工时**: 3.5h

---

### Epic 1: 类型定义增强

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | ComponentNode 增加 pageName 字段 | 0.5h | TypeScript 类型正确 + 可选字段 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | pageName 可选字段 | ComponentNode 新增 `pageName?: string`，允许覆盖 BusinessFlowNode.name | `expect(typeof node.pageName).toBe('string' \| 'undefined')` | 否 |

---

### Epic 2: 组件树分组增强

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 分组标题显示 pageName | 优先使用 pageName，fallback 到 BusinessFlowNode.name | getPageLabel 逻辑正确 |
| S2.2 | ComponentGroup 元数据 | 增加 pageId + componentCount | JSON 序列化包含这些字段 |
| S2.3 | 通用组件组置顶 | 保持置顶，label 为「🔧 通用组件」，pageId='__common__' | 不改变现有行为 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | getPageLabel pageName 优先 | `getPageLabel()` 优先使用 `node.pageName`，fallback 到 BusinessFlowNode.name | `expect(getPageLabel(nodeWithPageName)).toBe('自定义页面名')` | 【需页面集成】ComponentTree.tsx |
| F2.2 | ComponentGroup pageId | 分组信息包含 `pageId`（从 groupId 提取） | `expect(group.pageId).toBeDefined()` | 【需页面集成】ComponentTree.tsx |
| F2.3 | ComponentGroup componentCount | 分组信息包含 `componentCount` | `expect(group.componentCount).toBeGreaterThan(0)` | 【需页面集成】ComponentTree.tsx |
| F2.4 | 通用组件组保持置顶 | isCommon=true 的组件组 label 为「🔧 通用组件」，pageId='__common__' | `expect(commonGroup.label).toBe('🔧 通用组件')` | 否 |

---

### Epic 3: JSON 预览功能

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | JSON 按钮入口 | 组件树顶部添加「📋 JSON」按钮 | 按钮可见，点击触发 |
| S3.2 | JSON 树视图弹窗 | 展示 `{ pages: [{pageId, pageName, componentCount, components: [...]}] }` | JSON 结构正确 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | JSON 按钮入口 | 组件树顶部添加「📋 JSON」按钮 | `expect(getByText('📋 JSON')).toBeVisible()` | 【需页面集成】ComponentTree.tsx toolbar |
| F3.2 | JSON 预览弹窗 | 点击按钮弹出 JSON 树视图，数据结构正确 | `expect(screen.getByText(/pageId/)).toBeVisible()` | 【需页面集成】CanvasPreviewModal 或新建组件 |
| F3.3 | JSON 数据结构 | `pages` 数组，每项包含 `pageId`, `pageName`, `componentCount`, `components` | `expect(json.pages[0]).toHaveProperty('pageId')` | 否（数据结构） |

---

### Epic 4: 测试覆盖

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 单元测试 | getPageLabel + groupByFlowId 的 pageName fallback 逻辑 | 29+ tests pass |
| S4.2 | E2E 测试 | JSON 预览按钮可见且点击后显示正确结构 | E2E test pass |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | getPageLabel 单元测试 | pageName 优先 fallback 逻辑测试覆盖 | `expect(tests).toBeGreaterThanOrEqual(29)` | 否 |
| F4.2 | E2E JSON 预览测试 | JSON 预览按钮点击测试 | `expect(JSON_BUTTON_TEST).toPass()` | 【需页面集成】E2E 测试文件 |

---

## 3. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | ComponentNode 实例 | 无 pageName | pageName 为 undefined | P0 |
| AC2 | ComponentNode 实例 | 有 pageName | getPageLabel 返回 pageName | P0 |
| AC3 | ComponentNode 实例 | 无 pageName 且无 BusinessFlowNode | getPageLabel 返回兜底 label | P0 |
| AC4 | ComponentGroup | 分组后 | 包含 pageId + componentCount | P0 |
| AC5 | 通用组件组 | isCommon=true | 置顶 + label='🔧 通用组件' + pageId='__common__' | P0 |
| AC6 | 组件树渲染 | 默认状态 | 「📋 JSON」按钮可见 | P0 |
| AC7 | 点击「📋 JSON」 | 按钮点击 | JSON 弹窗显示 pages 数组 | P0 |
| AC8 | JSON 弹窗数据 | 展开任意 page | 包含 pageId + pageName + componentCount + components | P0 |
| AC9 | 单元测试 | 运行测试 | groupByFlowId + getPageLabel ≥ 90% coverage | P0 |
| AC10 | E2E 测试 | 运行测试 | JSON 预览功能 pass 100% | P0 |

---

## 4. DoD (Definition of Done)

### 代码完成标准

- [ ] TypeScript 类型定义正确，无编译错误
- [ ] `pageName?: string` 字段已添加到 ComponentNode 类型
- [ ] `getPageLabel()` 优先使用 pageName
- [ ] ComponentGroup 包含 pageId + componentCount
- [ ] 「📋 JSON」按钮已添加到组件树 toolbar
- [ ] JSON 预览弹窗展示正确的数据结构
- [ ] 通用组件组保持置顶，label 为「🔧 通用组件」

### 测试完成标准

- [ ] `getPageLabel` 单元测试新增 pageName fallback 场景（≥ 3 cases）
- [ ] `groupByFlowId` 单元测试新增 componentCount 场景
- [ ] E2E 测试验证 JSON 按钮可见性
- [ ] E2E 测试验证 JSON 弹窗数据结构
- [ ] 所有测试 pass（单元测试 29+1，E2E 测试 pass）

### 文档完成标准

- [ ] PRD 包含执行摘要、Epic 拆分、验收标准、DoD
- [ ] Specs 目录包含详细实现规格（如需要）

---

## 5. 技术约束

| 约束 | 说明 |
|------|------|
| TypeScript | 必须保持 strict mode，无新增 TS 错误 |
| 性能 | 组件树加载时间 ≤ 500ms |
| 向后兼容 | 现有 flowId 分组逻辑不变 |
| 测试框架 | Vitest（单元）+ Playwright（E2E） |

---

## 6. 依赖

| 依赖 | 说明 | 状态 |
|------|------|------|
| BusinessFlowNode.name | pageName fallback 的目标 | 已存在 |
| ComponentTree.tsx | 主要修改文件 | 已存在 |
| groupByFlowId() | 分组逻辑函数 | 已存在 |
| getPageLabel() | 标签生成函数 | 已存在 |
| CanvasPreviewModal | JSON 预览可复用此组件 | 已存在 |

---

## 7. 实施计划

| 阶段 | 内容 | 工时 | 输出 |
|------|------|------|------|
| Phase 1 | 类型定义增强 | 0.5h | types.ts 修改 |
| Phase 2 | 组件树分组增强 | 1.5h | ComponentTree.tsx 修改 |
| Phase 3 | JSON 预览功能 | 1h | JSONButton + Modal |
| Phase 4 | 测试覆盖 | 0.5h | UT + E2E |
| **Total** | | **3.5h** | |

---

*PRD Version: 1.0*  
*Created by: PM Agent*  
*Last Updated: 2026-04-07*
