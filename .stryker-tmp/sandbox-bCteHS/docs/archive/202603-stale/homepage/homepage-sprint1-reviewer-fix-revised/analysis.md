# 首页 Sprint1 Review 修复分析报告

> **项目**: homepage-sprint1-reviewer-fix-revised  
> **分析时间**: 2026-03-21  
> **分析师**: Analyst Agent  
> **状态**: 🔍 分析完成，等待决策  
> **上游**: homepage-redesign-analysis/reviewer-sprint1-layoutstatenav 审查失败  
> **产出**: `/root/.openclaw/vibex/docs/homepage-sprint1-reviewer-fix-revised/analysis.md`

---

## 执行摘要

**审查发现的 3 个核心问题均影响 Sprint 1 验收通过**，其中 Epic 9 和 GridContainer 是阻塞性问题，步骤数不匹配需要决策确认。

| # | 问题 | 根因 | 修复方案 | 优先级 |
|---|------|------|----------|--------|
| 1 | Epic 9 Zustand Store 缺失 | `HomePageStore` 未创建，布局状态分散在 local hooks | 创建 `src/stores/homePageStore.ts` | P0 阻塞 |
| 2 | GridContainer 组件空目录 | `GridContainer/` 目录存在但无实现文件，布局逻辑内联在 `HomePage.tsx` | 实现 GridContainer 组件或删除空目录并修正引用 | P0 阻塞 |
| 3 | 步骤数不匹配 (PRD 4步 vs 实现 6步) | PRD Epic 3 定义 4 步，代码实现 6 步（含限界上下文、领域模型） | 需决策：还原到 4 步 OR 更新 PRD | P1 待决策 |

---

## 1. 问题详述与根因分析

### 问题 1: Epic 9 Zustand Store 缺失 (P0 阻塞)

#### 现状

**PRD Epic 9 要求** (prd.md, Sprint 1):
- `ST-9.1`: localStorage 持久化 → 刷新后所有状态字段完整恢复
- `ST-9.2`: 状态快照 (支持回退) → 保存最近 5 个快照，回退后状态正确
- `ST-9.3`: SSE 连接管理 → 组件挂载时连接，卸载时断开
- `ST-9.4**: 错误重连 (指数退避) → 1s → 2s → 4s 重连

**架构图明确要求**:
```
HP[HomePage] → HMS[HomePageStore<Zustand + persist>]
HMS → HSS[SnapshotStack<最近5个快照>]
HMS → LSP[localStorage persist]
HMS → SSE[SSE Connection Manager]
```

**实际情况**:
- ✅ `src/stores/confirmationStore.ts` 存在 — 管理流程数据 (requirementText, boundedContexts, domainModels 等)
- ❌ `src/stores/homePageStore.ts` **不存在** — 布局状态无集中管理
- 布局状态分散在多个 local hooks:
  - `useHomePageState.ts` — 面板大小、最大化/最小化
  - `useHomePanel.ts` — 面板展开/收起
  - `usePanelActions.ts` — 面板操作
  - `useLocalStorage.ts` — localStorage 封装
  - `useSSEStream.ts` — SSE 流式处理

**影响**:
- 布局状态 (面板大小、抽屉开关) 无法跨组件共享
- SSE 连接管理分散，多个组件可能重复建立连接
- 状态快照功能无法实现 (PRD ST-9.2)
- 持久化逻辑重复，无统一管理

#### 修复方案

**方案 A: 创建独立 HomePageStore (推荐)**

```
src/stores/homePageStore.ts
├── 布局状态: leftDrawerOpen, rightDrawerOpen, bottomPanelHeight
├── 面板状态: panelSizes, maximizedPanel, minimizedPanel
├── SSE 管理: connectionStatus, reconnectCount
├── 快照栈: snapshots[], push/pop/clear
├── 持久化: persist middleware → localStorage
```

验收标准:
- `expect(useHomePageStore.getState().leftDrawerOpen).toBe(true)` ✅
- `expect(useHomePageStore.persist.getStoredState()).toBeTruthy()` ✅
- `expect(useHomePageStore.getState().snapshots.length).toBeLessThanOrEqual(5)` ✅

**方案 B: 扩展 confirmationStore**

将布局状态合并到 `confirmationStore`。缺点：store 职责混杂，单一职责原则违背。

---

### 问题 2: GridContainer 组件空目录 (P0 阻塞)

#### 现状

```
src/components/homepage/GridContainer/
└── [空目录，无任何文件]
```

**PRD Epic 1 要求** (布局框架):
- 3×3 Grid 布局 (header + 左抽屉 + 预览区 + 右抽屉 + 底部面板)
- 1400px 居中，响应式断点 (1200/900px)

**架构图**:
```
HP[HomePage] → GC[GridContainer] → LD[LeftDrawer] + PV[PreviewArea] + RD[RightDrawer] + BP[BottomPanel]
```

**实际情况**:
- `GridContainer/` 目录为空
- `HomePage.tsx` 直接渲染所有子组件，无 GridContainer 包裹
- 布局逻辑在 `homepage.module.css` 中以 CSS Grid 实现

#### 修复方案

**方案 A: 实现 GridContainer 组件 (推荐)**

创建 `GridContainer/index.tsx`，接收子组件作为 props，实现统一布局管理：

```tsx
<GridContainer>
  <Header />
  <Sidebar />
  <PreviewArea />
  <RightDrawer />
  <BottomPanel />
</GridContainer>
```

好处：
- 布局逻辑从页面组件中解耦
- GridContainer 可独立管理布局状态 (响应式断点、z-index)
- 便于后续单独测试和复用

**方案 B: 删除空目录**

如果确定使用 `homepage.module.css` 中的 CSS Grid 布局，则删除空目录，消除误导。

**推荐方案 A**，与架构图保持一致。

---

### 问题 3: 步骤数不匹配 (P1 待决策)

#### 现状

| 来源 | 步骤数 | 步骤定义 |
|------|--------|----------|
| PRD Epic 3 | **4 步** | 需求录入 → 需求澄清 → 业务流程 → 组件图 |
| 架构图 analysis.md | **4 步** | 同上 |
| 实现 HomePage.tsx | **6 步** | 需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成 |

#### 根因

PRD 定义 4 步流程，实现时增加了：
- Step 2: **限界上下文** (Bounded Context)
- Step 3: **领域模型** (Domain Model)

这两步的数据 (boundedContexts, domainModels) 已由 `confirmationStore` 管理，且有 SSE 流式生成能力。但 PRD 并未将其作为独立步骤列出。

#### 影响

- Review 测试 `expect(screen.getAllByRole('listitem')).toHaveLength(4)` 会失败（实际返回 6）
- PRD 与实现不一致，导致后续开发参考依据模糊
- Epic 4/5/6 的 Story ID 编排基于 4 步假设

#### 修复方案

**方案 A: 更新 PRD 以匹配实现 (推荐)**

将实现中的 6 步流程正式纳入 PRD：
- Epic 3: 左侧抽屉 → 6 步流程
- ST-3.1 验收标准改为 `expect(screen.getAllByRole('listitem')).toHaveLength(6)`
- 增加 ST-3.4–ST-3.6 覆盖新增步骤

理由：限界上下文和领域模型是 VibeX 核心价值（DDD 可视化），作为独立步骤符合产品逻辑。

**方案 B: 还原实现到 4 步**

移除 Step 2 (限界上下文) 和 Step 3 (领域模型)，或将其合并到 Step 1 和 Step 4。

理由：保持 PRD 作为唯一事实来源，减少维护成本。

---

## 2. 风险评估

| 风险 | 概率 | 影响 | 等级 | 缓解 |
|------|------|------|------|------|
| HomePageStore 创建后与现有 hooks 冲突 | 中 | 高 | P1 | 先迁移 hooks，逐步废弃旧代码 |
| GridContainer 实现破坏现有布局 | 低 | 高 | P1 | 保留 homepage.module.css 作为 fallback |
| PRD 更新引发连锁修改 (Epic 4-9 Story ID) | 中 | 中 | P2 | 协调 PM/Architect 统一更新 |

---

## 3. 推荐行动

### P0 立即修复 (Sprint 1 验收阻塞)

1. **Dev**: 创建 `src/stores/homePageStore.ts`，迁移布局状态
   - 文件: `src/stores/homePageStore.ts`
   - 覆盖: leftDrawerOpen, rightDrawerOpen, bottomPanelHeight, panelSizes, maximizedPanel, minimizedPanel
   - 持久化: `persist` middleware，`homepage-storage` 作为 key
   - 快照: `snapshots[]` 数组，`pushSnapshot()/popSnapshot()`

2. **Dev**: 处理 GridContainer 空目录
   - 推荐: 删除空目录 + 移除架构图引用（若使用 CSS Grid 方案）
   - 备选: 实现 GridContainer 组件（需 Architect 决策）

### P1 决策项 (需团队共识)

3. **PM/Architect 决策**: 步骤数选择
   - 选项 A: 更新 PRD → 6 步流程
   - 选项 B: 还原实现 → 4 步流程

---

## 4. 验收标准

修复完成后，Review 任务应通过以下检查：

| 检查项 | 验收标准 |
|--------|----------|
| Epic 9 状态管理 | `test -f src/stores/homePageStore.ts` + 单元测试通过 |
| GridContainer | `ls src/components/homepage/GridContainer/` 非空 OR 目录已删除 |
| 步骤数 | `expect(screen.getAllByRole('listitem')).toHaveLength(N)` 其中 N 由决策决定 |

---

## 5. 下一步

- [ ] **Architect**: 确认 GridContainer 方案 (实现 OR 删除)
- [ ] **PM**: 决策步骤数 (4步 OR 6步) 并更新 PRD
- [ ] **Dev**: 实现 HomePageStore + 处理 GridContainer
- [ ] **Tester**: 更新测试用例匹配新状态结构
- [ ] **Reviewer**: 重新审查修复后的实现

---

**分析完成** ✅  
**文档版本**: v1.0  
**下一步**: PM 创建修订版 PRD → Dev 实现修复 → Reviewer 重新审查
