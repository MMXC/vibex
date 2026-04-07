# PRD: vibex-reactflow-visualization — ReactFlow 可视化能力整合

**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-03-23  
**PM**: PM Agent  
**目标**: 统一可视化平台，整合 JSON树 + Mermaid + ReactFlow

---

## 1. 执行摘要

### 背景
VibeX 是 DDD 建模工具，可视化是核心能力。当前 ReactFlow、Mermaid、JSON Tree 分散使用，无统一抽象。

### 目标
- 创建统一可视化抽象层 `useVisualization` Hook
- 支持 Flow / Mermaid / JSON Tree 三种视图切换
- 可视化状态持久化

### 关键指标
| 指标 | 目标 |
|------|------|
| 视图切换时间 | < 500ms |
| npm test 通过率 | ≥ 99% |
| 三种视图渲染正确率 | 100% |

---

## 2. Epic 拆分

### Epic 1: 统一可视化抽象层
**目标**: 创建 `useVisualization` Hook 作为统一入口

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S1.1 | 创建 `useVisualization` Hook 接口 | ✅ `expect(typeof useVisualization).toBe('function')` |
| S1.2 | 支持 `type: 'flow' | 'mermaid' | 'json'` 参数 | ✅ `expect(useVisualization('flow', data).nodes).toBeTruthy()` |
| S1.3 | 统一错误处理（无效 type、渲染失败）| ✅ `expect(() => useVisualization('invalid', {})).toThrow()` |
| S1.4 | TypeScript 类型完整，无 `any` | ✅ `tsc --noEmit` 退出码 0 |

**DoD**: Hook 接口稳定，类型安全，文档完整。

---

### Epic 2: ReactFlow 流程图渲染
**目标**: 确保 ReactFlow 渲染 FlowData 正确，集成到抽象层

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S2.1 | `flow/page.tsx` 使用 `useVisualization('flow', data)` | ✅ `expect(screen.queryByTestId('reactflow-canvas')).toBeTruthy()` |
| S2.2 | 节点/边正确渲染，无布局错位 | ✅ Playwright 截图对比测试 |
| S2.3 | 支持缩放、拖拽、节点选中 | ✅ E2E 测试验证交互 |
| S2.4 | 刷新页面后布局状态恢复 | ✅ `expect(store.getState().flowState).toEqual(prevState)` |

**DoD**: ReactFlow 功能完整，截图对比通过。 【需页面集成】

---

### Epic 3: Mermaid 图渲染
**目标**: 确保 Mermaid 渲染 DDD 图（领域模型、限界上下文）正确

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S3.1 | `useVisualization('mermaid', data)` 渲染正确 | ✅ `expect(container.querySelector('.mermaid')).toBeTruthy()` |
| S3.2 | 领域模型图显示节点和关系 | ✅ 截图对比测试 |
| S3.3 | 渲染失败时显示友好错误提示 | ✅ `expect(screen.queryByText(/渲染失败/i)).toBeTruthy()` |
| S3.4 | Mermaid 内容刷新后不丢失 | ✅ 状态持久化验证 |

**DoD**: Mermaid 渲染正确，错误处理完善。 【需页面集成】

---

### Epic 4: JSON Tree 可视化
**目标**: 新增 JSON Tree 可视化能力，补全三视图

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S4.1 | 创建 `useJsonTreeVisualization` Hook | ✅ `expect(typeof useJsonTreeVisualization).toBe('function')` |
| S4.2 | JSON 对象正确渲染为可展开树 | ✅ `expect(screen.queryByTestId('json-tree')).toBeTruthy()` |
| S4.3 | 支持折叠/展开节点 | ✅ E2E 点击测试 |
| S4.4 | 嵌套层级正确显示缩进 | ✅ `expect(screen.queryByText(/\\s{2}key:/)).toBeTruthy()` |
| S4.5 | `npm test` 覆盖新增代码 | ✅ 测试覆盖率 ≥ 90% |

**DoD**: JSON Tree 功能完整，测试覆盖达标。 【需页面集成】

---

### Epic 5: 视图切换与状态管理
**目标**: 三种视图可自由切换，状态跨视图保持

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S5.1 | 切换按钮切换视图类型 | ✅ E2E: 点击切换按钮，视图切换 < 500ms |
| S5.2 | 切换时当前视图状态不丢失 | ✅ 切回后节点/边/数据一致 |
| S5.3 | URL 参数同步当前视图类型 | ✅ `expect(location.search).toContain('view=flow')` |
| S5.4 | 移动端视图切换正常 | ✅ Playwright 移动端测试通过 |

**DoD**: 切换流畅，状态一致。 【需页面集成】

---

### Epic 6: 性能与稳定性
**目标**: 确保大规模数据下渲染性能达标

| Story ID | 描述 | 验收标准 |
|----------|------|---------|
| S6.1 | 100 节点 ReactFlow 渲染 < 2s | ✅ Playwright 性能测试 |
| S6.2 | Mermaid 大图（50+ 节点）渲染 < 3s | ✅ Performance API 验证 |
| S6.3 | JSON Tree 1000 节点展开 < 1s | ✅ `expect(renderTime).toBeLessThan(1000)` |
| S6.4 | 内存占用稳定（无泄漏）| ✅ CI 内存监控 |

**DoD**: 性能指标全部达标。

---

## 3. 验收标准（expect 断言格式）

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | FlowData | `useVisualization('flow', data)` | `expect(nodes.length).toBeGreaterThan(0)` |
| AC-2 | MermaidData | `useVisualization('mermaid', data)` | `expect(container.querySelector('.mermaid')).toBeTruthy()` |
| AC-3 | JSONData | `useVisualization('json', data)` | `expect(screen.queryByTestId('json-tree')).toBeTruthy()` |
| AC-4 | 三种视图 | 切换 | `expect(transitionTime).toBeLessThan(500)` |
| AC-5 | npm test | after code changes | `expect(coverage).toBeGreaterThanOrEqual(0.99)` |
| AC-6 | tsc | `tsc --noEmit` | `expect(exitCode).toBe(0)` |

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | 视图切换 < 500ms，大图渲染 < 3s |
| **可访问性** | 键盘导航支持，屏幕阅读器友好 |
| **可测试性** | 单元测试覆盖 ≥ 90% |
| **类型安全** | 无 `any`，TypeScript strict |

---

## 5. 实施计划

| 阶段 | 内容 | 负责 |
|------|------|------|
| Phase 1 | 架构设计 + useVisualization 接口定义 | Architect |
| Phase 2 | Epic 1 Hook 实现 + Epic 2 ReactFlow 集成 | Dev |
| Phase 3 | Epic 3 Mermaid 集成 + Epic 4 JSON Tree | Dev |
| Phase 4 | Epic 5 视图切换 + Epic 6 性能调优 | Dev |
| Phase 5 | E2E 测试覆盖 + CI 验证 | Tester |
| Phase 6 | PM 验收 | PM |

---

## 6. 风险与缓解

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| ReactFlow 版本升级破坏现有功能 | 中 | 低 | 锁定版本 + 回归测试 |
| 抽象层性能开销 | 中 | 中 | 按需加载，不预加载所有可视化器 |
| Mermaid 跨浏览器兼容 | 低 | 中 | Playwright 跨浏览器测试 |

---

*PRD v1.0 — 2026-03-23*
