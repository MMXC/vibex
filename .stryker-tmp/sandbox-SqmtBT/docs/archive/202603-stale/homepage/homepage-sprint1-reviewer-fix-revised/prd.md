# PRD: homepage-sprint1-reviewer-fix-revised

> **项目**: homepage-sprint1-reviewer-fix-revised  
> **目标**: 修复 homepage-redesign-analysis/reviewer-sprint1-layoutstatenav 失败的 3 个核心问题  
> **状态**: ✅ PRD 完成  
> **PM**: PM Agent  
> **生成时间**: 2026-03-21  
> **背景**: 上游审查失败根因分析：Epic 9 Zustand Store 缺失、GridContainer 组件空目录、步骤数不匹配

---

## 执行摘要

Reviewer Sprint 1 审查发现 3 个核心阻塞问题，需全部修复后方可上线验收通过。其中 **Epic 9 Zustand Store 缺失**（P0 BLOCKING）和 **GridContainer 空目录**（P0 BLOCKING）为立即阻塞，步骤数不匹配（P1 待决策）需团队决策后处理。

**关键指标**:
- 阻塞问题: 3 个 (2 P0 BLOCKING, 1 P1 待决策)
- 预估修复工时: 5 人日
- 影响范围: Sprint 1 无法上线

---

## 决策项

### 决策: 步骤数选择（需团队共识）

| 选项 | 描述 | 影响 |
|------|------|------|
| **选项 A（推荐）** | 更新 PRD → 6 步流程（需求录入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成） | 限界上下文和领域模型是 VibeX 核心价值（DDD 可视化），符合产品逻辑 |
| **选项 B** | 还原实现 → 4 步流程 | 保持 PRD 作为唯一事实来源，减少维护成本 |

**推荐选项 A**：将 6 步流程正式纳入 PRD，理由：
1. Bounded Context + Domain Model 是 VibeX 区别于竞品的核心能力
2. 代码已实现完整，数据已由 confirmationStore 管理
3. 用户研究显示"流程可视化"是核心卖点

---

## Epic 拆分

### Epic 1: Epic 9 Zustand Store 创建 — P0 BLOCKING

**目标**: 创建 `src/stores/homePageStore.ts`，统一管理首页布局状态

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-9.1 | HomePageStore 定义 | 创建 Zustand Store，导出 `useHomePageStore` | `expect(useHomePageStore).toBeDefined()` | P0 |
| ST-9.2 | 布局状态管理 | leftDrawerOpen, rightDrawerOpen, bottomPanelHeight, panelSizes | `expect(useHomePageStore.getState().leftDrawerOpen).toBeDefined()` | P0 |
| ST-9.3 | localStorage 持久化 | Zustand persist middleware，key: `homepage-storage` | `expect(localStorage.getItem('homepage-storage')).toBeTruthy()` | P0 |
| ST-9.4 | 快照栈 | 保存/恢复最近 5 个快照 | `expect(snapshots.length).toBeLessThanOrEqual(5)` | P0 |
| ST-9.5 | SSE 连接管理 | 连接状态、错误重连（指数退避 1s→2s→4s） | `expect(reconnectCount).toBeLessThanOrEqual(5)` | P0 |

**DoD (Epic 9)**:
```
✅ src/stores/homePageStore.ts 存在
✅ 导出 useHomePageStore hook
✅ 单元测试: getState() 返回正确初始值
✅ persist middleware: 刷新后状态恢复
✅ pushSnapshot/popSnapshot: 最多 5 个
✅ SSE: 挂载连接，卸载断开，指数退避重连
```

### Epic 2: GridContainer 组件修复 — P0 BLOCKING

**目标**: 处理空目录问题，实现或删除

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-2.1 | GridContainer 目录处理 | 目录非空或已删除（Architect 决策） | `ls src/components/homepage/GridContainer/` 非空 OR 目录不存在 | P0 |
| ST-2.2 | 布局实现 | 若实现，使用 3×3 CSS Grid，1400px 居中 | `expect(container.offsetWidth).toBeLessThanOrEqual(1400)` | P0 |
| ST-2.3 | 响应式断点 | 1200px / 900px 断点正确切换 | `expect(layout).toMatch(/grid-3col\|grid-2col\|grid-1col/)` | P1 |

**DoD (Epic 2)**:
```
✅ GridContainer/index.tsx 存在且可渲染（方案A）
✅ 或 GridContainer/ 目录已删除（方案B）
✅ 布局通过 Architect 决策确认
✅ 1400px 居中，响应式正常
```

### Epic 3: 步骤流程修复 — P1（取决于决策结果）

**目标**: 根据决策结果统一步骤数

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-3.1 | 步骤数量 | 选项 A: 6步 / 选项 B: 4步 | `expect(steps.length).toBe(N)` | P1 |
| ST-3.2 | 步骤名称 | 与决策后的流程定义一致 | `expect(steps[0]).toBe('需求录入')` | P1 |
| ST-3.3 | 步骤切换 | 切换响应 < 500ms | `expect(switchDuration).toBeLessThan(500)` | P1 |
| ST-3.4 | SSE 流式数据 | 限界上下文/领域模型 SSE 生成 | `expect(boundedContexts).toBeDefined()` | P1 |

**DoD (Epic 3)**:
```
✅ 步骤数量符合决策结果（6 或 4）
✅ 步骤名称与流程定义匹配
✅ 切换响应 < 500ms
✅ SSE 流式生成数据正确展示
```

---

## 验收标准总表

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC-9.1 | 首次访问 | 加载 App | `useHomePageStore` 已定义 | P0 |
| AC-9.2 | 调整布局 | 刷新页面 | 布局状态完全恢复 | P0 |
| AC-9.3 | 调整面板大小 | 刷新页面 | panelSizes 正确恢复 | P0 |
| AC-9.4 | 保存快照 | 保存第 6 次 | 数组长度 = 5，最早快照被清除 | P0 |
| AC-9.5 | 恢复快照 | 点击恢复 | 状态回退到快照时刻 | P0 |
| AC-9.6 | SSE 断开 | 模拟网络中断 | 指数退避重连 | P0 |
| AC-2.1 | 渲染 GridContainer | 页面加载 | 目录非空或已删除 | P0 |
| AC-2.2 | 响应式 | 窗口宽度 < 1200px | 布局切换正确 | P1 |
| AC-3.1 | 步骤数量 | 获取步骤列表 | 长度为决策结果（6 或 4） | P1 |
| AC-3.2 | 步骤切换 | 点击任意步骤 | 响应 < 500ms | P1 |

---

## 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F9.1 | HomePageStore | Zustand Store | expect(useHomePageStore).toBeDefined() | ✅ |
| F9.2 | 布局状态 | 面板开关/大小 | expect(state.leftDrawerOpen).toBeDefined() | ✅ |
| F9.3 | localStorage 持久化 | 刷新恢复 | expect(localStorage.getItem('homepage-storage')).toBeTruthy() | ✅ |
| F9.4 | 快照栈 | 最多 5 个 | expect(snapshots.length).toBeLessThanOrEqual(5) | ✅ |
| F9.5 | SSE 连接管理 | 连接/断开/重连 | expect(isConnected).toBe(true) | ✅ |
| F2.1 | GridContainer | 布局组件 | test -f GridContainer/index.tsx | ✅ |
| F2.2 | 响应式断点 | 1200/900px | expect(width).toBeLessThanOrEqual(1400) | ✅ |
| F3.1 | 步骤数量 | N 个步骤 | expect(steps.length).toBe(N) | ✅ |
| F3.2 | 步骤名称 | 名称匹配 | expect(name).toBe('需求录入') | ✅ |

---

## 非功能需求

- **性能**: 状态切换 < 500ms，刷新后恢复 < 200ms
- **兼容性**: Chrome/Firefox/Safari 最新版
- **可维护性**: Store 测试覆盖率 ≥ 80%
- **可靠性**: SSE 重连成功率 ≥ 99%

---

## 实施计划

| 阶段 | 任务 | 负责 | 工时 | 依赖 |
|------|------|------|------|------|
| Phase 1 | 决策步骤数（4步 vs 6步） | PM/Architect | - | 决策 |
| Phase 2 | 创建 HomePageStore | Dev | 3h | Phase 1 |
| Phase 3 | 处理 GridContainer | Dev | 2h | Phase 1 |
| Phase 4 | 修复步骤流程 | Dev | 1h | Phase 1 |
| Phase 5 | 全量回归测试 | Tester | 2h | Phase 2-4 |
| Phase 6 | Reviewer 复审 | Reviewer | - | Phase 5 |

**总工时**: ~8h（1人日，不含决策时间）

---

## 上游产物

- 分析文档: `docs/homepage-sprint1-reviewer-fix-revised/analysis.md`
- 验收标准: 本文档

## 下游依赖

- Dev: 领取 Epic 9 / Epic 2 / Epic 3 实现任务
- Architect: 决策 GridContainer 方案
- PM: 决策步骤数
- Tester: 编写/更新测试用例
- Reviewer: 修复完成后复审
