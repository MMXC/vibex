# Implementation Plan: vibex-reactflow-visualization

**项目**: vibex-reactflow-visualization
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. Sprint 概览

| Sprint | 名称 | 工期 | 目标 | Epic |
|--------|------|------|------|------|
| Sprint 1 | 抽象层 + ReactFlow | 3 天 | useVisualization 接口 + FlowRenderer 集成 | Epic 1 + 2 |
| Sprint 2 | Mermaid + JSON Tree | 3 天 | MermaidRenderer + JsonTreeRenderer | Epic 3 + 4 |
| Sprint 3 | 视图切换 + 状态 | 2 天 | ViewSwitcher + URL 同步 + 状态持久化 | Epic 5 |
| Sprint 4 | 性能 + 稳定性 | 2 天 | 性能调优 + 回归测试 + CI | Epic 6 |

**预计总工期**: 10 个工作日 (2 周)

---

## 2. Sprint 详细计划

### Sprint 1 — 抽象层 + ReactFlow (Day 1-3)

**目标**: 建立统一可视化抽象层，集成 ReactFlow

#### Day 1: 类型系统 + Store

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T1.1 | 定义 `VisualizationType` 联合类型 | dev | `expect(typeof 'flow' | 'mermaid' | 'json').toBeDefined()` |
| T1.2 | 创建 `visualizationStore` (Zustand) | dev | `expect(store.getState().currentType).toBeDefined()` |
| T1.3 | TypeScript 类型文件 `types/visualization.ts` | dev | `tsc --noEmit` 退出码 0 |
| T1.4 | `ErrorBoundary` 组件 | dev | `expect(() => render(<ErrorBoundary><Error /></>)).not.toThrow()` |

**交付物**: 类型系统 + Store 骨架

#### Day 2: useVisualization Hook

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T1.5 | 实现 `useVisualization(type, data, options)` | dev | `expect(useVisualization('flow', data).component).toBeDefined()` |
| T1.6 | 内部路由到具体可视化器 | dev | `expect(switch internal renderer).toBeCalled()` |
| T1.7 | 错误处理 + `onError` 回调 | dev | `expect(error).toBeHandled()` |

**交付物**: `useVisualization` Hook

#### Day 3: ReactFlow 集成

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T1.8 | `FlowRenderer` 组件 | dev | `expect(container.querySelector('.react-flow')).toBeTruthy()` |
| T1.9 | `useFlowVisualization` Hook | dev | `expect(useFlowVisualization(data).nodes).toBeTruthy()` |
| T1.10 | 节点/边渲染 + 缩放/拖拽 | dev | E2E 测试验证 |
| T1.11 | 状态同步到 store | dev | `expect(store.getState().flowNodes).toEqual(nodes)` |

**交付物**: ReactFlow 功能完整

**Sprint 1 验收清单**:
- [ ] `useVisualization` 接口稳定
- [ ] TypeScript 0 error
- [ ] ReactFlow 渲染正确
- [ ] Store 状态同步

---

### Sprint 2 — Mermaid + JSON Tree (Day 4-6)

#### Day 4-5: Mermaid 集成

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T2.1 | `MermaidRenderer` 组件 | dev | `expect(container.querySelector('.mermaid')).toBeTruthy()` |
| T2.2 | `useMermaidVisualization` Hook | dev | `expect(useMermaidVisualization(code).svg).toBeDefined()` |
| T2.3 | 节点点击事件处理 | dev | `expect(onNodeClick).toBeCalled()` |
| T2.4 | 渲染失败 fallback | dev | `expect(errorFallback).toBeVisible()` |

#### Day 6: JSON Tree 自研

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T2.5 | `JsonTreeRenderer` 组件 (虚拟滚动) | dev | `expect(container.querySelector('[data-testid="json-tree"]')).toBeTruthy()` |
| T2.6 | `useJsonTreeVisualization` Hook | dev | `expect(useJsonTreeVisualization(data).nodes).toBeTruthy()` |
| T2.7 | 展开/收起 + 搜索/高亮 | dev | E2E 测试验证 |

**Sprint 2 验收清单**:
- [ ] Mermaid 渲染正确
- [ ] JSON 树功能完整
- [ ] 1000 节点渲染 < 1s

---

### Sprint 3 — 视图切换 + 状态 (Day 7-8)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T3.1 | `ViewSwitcher` 组件 (3 个切换按钮) | dev | `expect(screen.getByRole('button', { name: 'Flow' })).toBeTruthy()` |
| T3.2 | 视图切换动画 (骨架屏) | dev | `expect(transitionTime).toBeLessThan(500)` |
| T3.3 | URL 参数同步 (`?view=flow`) | dev | `expect(location.search).toContain('view=')` |
| T3.4 | 切换时状态保持 | dev | `expect(state).toEqual(previousState)` after switch back |

**Sprint 3 验收清单**:
- [ ] 三视图切换流畅 < 500ms
- [ ] URL 同步正确
- [ ] 状态保持一致

---

### Sprint 4 — 性能 + 稳定性 (Day 9-10)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| T4.1 | 100 节点 ReactFlow 性能测试 | tester | `expect(renderTime).toBeLessThan(2000)` |
| T4.2 | Mermaid 50+ 节点性能测试 | tester | `expect(renderTime).toBeLessThan(3000)` |
| T4.3 | JSON 1000 节点虚拟滚动验证 | tester | `expect(renderTime).toBeLessThan(1000)` |
| T4.4 | 内存泄漏检测 | tester | `expect(memoryGrowth).toBeLessThan(10)` MB |
| T4.5 | E2E 回归测试 | tester | `expect(coverage).toBeGreaterThanOrEqual(0.99)` |
| T4.6 | Playwright CI 配置更新 | tester | CI 通过 |

**Sprint 4 验收清单**:
- [ ] 所有性能指标达标
- [ ] 内存稳定
- [ ] CI 100% 通过

---

## 3. 风险识别与缓解

| ID | 风险 | 影响 | 概率 | 缓解 |
|----|------|------|------|------|
| R1 | ReactFlow 版本升级破坏现有功能 | 中 | 低 | 锁定版本 + 回归测试 |
| R2 | 抽象层性能开销 | 中 | 中 | 按需加载，不预加载所有可视化器 |
| R3 | Mermaid 复杂图表解析失败 | 中 | 中 | 提供 SVG fallback |
| R4 | JSON 树大数据量性能 | 高 | 中 | 虚拟滚动 + `shouldComponentUpdate` |

---

**实施计划完成**: 2026-03-23 12:52 (Asia/Shanghai)
**预计上线**: 2026-04-07 (基于 10 个工作日估算)

---

## Sprint 1 实现记录 (Dev — Epic1 接口与Store)

### Day 1: 类型系统 + Store ✅ (2026-03-23)

| ID | 任务 | 状态 | 产出物 |
|----|------|------|--------|
| T1.1 | VisualizationType 联合类型 | ✅ DONE | `src/types/visualization.ts` |
| T1.2 | visualizationStore (Zustand) | ✅ DONE | `src/stores/visualizationStore.ts` |
| T1.3 | TypeScript 类型文件 | ✅ DONE | `tsc --noEmit` 退出码 0 |
| T1.4 | ErrorBoundary 组件 | ✅ DONE (已有) | `src/components/error-boundary/ErrorBoundary.tsx` |

**Commit**: `adcf6127`
**测试**: 23 tests (visualizationStore) + 2160 total — ALL PASS
