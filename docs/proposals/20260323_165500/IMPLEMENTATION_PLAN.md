# Implementation Plan: vibex-homepage-api-alignment

**项目**: vibex-homepage-api-alignment
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. Sprint 概览

| Phase | 内容 | 工期 | Epic |
|-------|------|------|------|
| Phase 1 | useProjectTree Hook | 1 天 | Epic 1 |
| Phase 2 | CardTree 组件 | 2 天 | Epic 2 |
| Phase 3 | 首页集成 + Feature Flag | 1 天 | Epic 3 |
| Phase 4 | 错误处理 + 降级 | 0.5 天 | Epic 4 |
| Phase 5 | 性能调优 | 0.5 天 | Epic 5 |
| Phase 6 | E2E + 截图对比 | 1 天 | — |

**预计总工期**: 6 个工作日

---

## 2. Phase 详细计划

### Phase 1 — useProjectTree Hook (Day 1)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P1.1 | 创建 `src/types/project.ts` | dev | `tsc --noEmit` 通过 |
| P1.2 | 创建 `useProjectTree` Hook (React Query) | dev | `expect(typeof useProjectTree).toBe('function')` |
| P1.3 | `buildTree()` 扁平→树形转换 | dev | `expect(buildTree(flatProjects)).toMatchTree(expected)` |
| P1.4 | Mock 数据降级 | dev | `expect(mockData).toBeTruthy()` |
| P1.5 | TypeScript 完整，无 any | dev | `tsc --noEmit` 退出码 0 |

---

### Phase 2 — CardTree 组件 (Day 2-3)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P2.1 | `CardTree.tsx` 主容器 | dev | `expect(screen.queryByTestId('card-tree')).toBeTruthy()` |
| P2.2 | `CardTreeNode.tsx` 递归节点 | dev | `expect(node.children).toRenderRecursively()` |
| P2.3 | 折叠/展开交互 | dev | `expect(collapsedChild).not.toBeVisible()` |
| P2.4 | 缩进视觉（子节点 +16px）| dev | 截图对比验证 |
| P2.5 | 骨架屏 `CardTreeSkeleton` | dev | `expect(skeleton).toBeVisible()` |
| P2.6 | 无障碍 (ARIA + 键盘) | dev | `axe-core` 验证 |

---

### Phase 3 — 首页集成 (Day 4)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P3.1 | Feature Flag 配置 | dev | `expect(useFeatureFlag('CARD_TREE')).toBe(boolean)` |
| P3.2 | 首页条件渲染 (Flag on → CardTree, off → GridLayout) | dev | `expect(layout).toSwitch()` |
| P3.3 | 保留旧 GridLayout | dev | `expect(GridLayout).toBeDefined()` |
| P3.4 | 首页加载顺序 (骨架屏 → 数据) | dev | Playwright E2E 验证 |

---

### Phase 4 — 错误处理 (Day 5 上午)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P4.1 | `CardTreeError` 组件 | dev | `expect(errorView).toBeVisible()` |
| P4.2 | 重试按钮交互 | dev | `expect(refetch).toBeCalled()` |
| P4.3 | 超时处理 (> 10s) | dev | `expect(timeoutMsg).toBeVisible()` |

---

### Phase 5 — 性能调优 (Day 5 下午)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P5.1 | 50 卡片性能测试 | tester | `expect(renderTime).toBeLessThan(1000)` |
| P5.2 | 折叠动画 60fps 验证 | tester | DevTools Performance 检查 |
| P5.3 | IntersectionObserver 懒加载 | dev | 非视口内卡片不渲染 |

---

### Phase 6 — 测试验证 (Day 6)

**任务**:
| ID | 任务 | 负责 | 验收标准 |
|----|------|------|---------|
| P6.1 | E2E 测试 | tester | `expect(allTests).toPass()` |
| P6.2 | 截图对比 (CardTree vs GridLayout) | tester | 视觉一致性验证 |
| P6.3 | 移动端响应式 | tester | Playwright mobile viewport |

---

## 3. 验收检查清单

- [ ] `useProjectTree` Hook 类型安全
- [ ] 卡片树渲染正确，层级缩进清晰
- [ ] 折叠/展开流畅
- [ ] Feature Flag 控制新旧布局
- [ ] API 错误友好降级
- [ ] 50 卡片渲染 < 1s
- [ ] 无障碍通过
- [ ] 截图对比通过

---

**实施计划完成**: 2026-03-23 17:20 (Asia/Shanghai)
