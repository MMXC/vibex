<<<<<<< Updated upstream
# 可行性分析: 上下文/流程/组件/原型 标签页合并为单一标签
=======
# 可行性分析: wow-harness 实装验证
>>>>>>> Stashed changes

**项目**: vibex / analyze-requirements
**Analyst**: Analyst
**日期**: 2026-04-13
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

| 历史项目 | 相关性 | 教训 |
|---------|--------|------|
<<<<<<< Updated upstream
| `canvas-cors-preflight-500` | 间接：Hono 路由中间件层级的顺序问题 | 禁用状态掩盖了真实访问路径，用户看不到原因。多层级守卫应让用户感知到当前状态，而非静默拒绝 |
| `vibex-e2e-test-fix` | 间接：disabled / skip 状态的滥用问题 | "用 skip 掩盖问题"和"用 disabled 锁 tab"本质相同——都是用阻断代替告知。`grepInvert` 优于 `test.skip`，同理：空状态优于 disabled |

**结论**：历史经验一致指向同一个反模式：用阻断代替告知。`disabled` 是一种静默拒绝，用户点击后没有任何反馈，体验断裂。

### 1.2 Git History — TabBar 相关改动轨迹

```
TabBar.tsx 首次引入: canvas-three-tree-unification epic
  - TabBar 含 4 tabs: context/flow/component/prototype
  - 初始实现即带 disabled 锁 tab 机制
  - 基于 phase 顺序: input → context → flow → component → prototype

最近相关改动: canvas-phase-nav-and-toolbar-issues
  - PhaseIndicator 被独立出来，作为阶段指示器
  - TabBar 和 PhaseIndicator 职责已部分分离
```

**关键发现**：
- TabBar 的 disabled 锁定机制从一开始就存在，从未经过 UX 验证
- PhaseIndicator 已经承担了"阶段状态告知"职责，与 TabBar 的 disabled 锁定存在职责重叠
- 移动端 `useTabMode` 有独立的 tab bar 实现，但 desktop 端 TabBar 是全局状态锁

### 1.3 当前 Tab/Phase 架构（关键代码）

**TabBar.tsx:37-42 — 禁用逻辑**：
```typescript
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
// ...
disabled={isLocked}
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}
```

**TabBar.tsx:48-53 — 点击守卫**：
```typescript
if (tabIdx > phaseIdx) {
  // Tab not yet unlocked by phase — do nothing
  return;
}
```

**现状问题**：
- `disabled` 属性 + title 提示 → 用户点击无反应，title tooltip 需要 hover 才能看到
- 桌面端和移动端 tab 行为不一致（`useTabMode` 有独立 tab bar）
- phase 锁定逻辑分散在 TabBar 和 CanvasPage 两处
=======
| `canvas-testing-strategy` | 间接：hook 拆分的单元测试策略 | Hook 机制需要独立测试覆盖，否则重构后边界条件遗漏不会被自动发现 |
| `vibex-e2e-test-fix` | 间接：e2e 测试框架建设 | 自动化检查需要可量化的验收条件（不是主观判断） |
| `canvas-cors-preflight-500` | 间接：中间件层拦截机制 | 分层拦截需要明确各层职责，避免重复处理 |

### 1.2 Git History — Agent 治理相关轨迹

```
beb1f712 feat(ci): E6 add console.* pre-commit hook with lint-staged
902309ef fix: ESLint errors in E1 collaboration code
54dab01b feat(guidance): 重构 CanvasOnboardingOverlay Hooks 顺序并添加单元测试
8b8bcfe1 docs(vibex-third): E1-S2 TanStack Query Hooks 迁移文档
```

**关键发现**: 当前 OpenClaw 的 agent 治理依赖 `SOUL.md` + `AGENTS.md` 软约束（~70% 遵守率），无机械拦截层。wow-harness 的核心价值是"机械约束 > 软约束"。

### 1.3 Dev 报告摘要（wow-harness-validation-20260413.md）

Dev agent 已对 wow-harness 做了完整技术验证，核心结论：

| wow-harness 机制 | OpenClaw 可复刻性 | 评估 |
|-----------------|-----------------|------|
| Review agent schema-level 隔离 | ✅ | 物理上阻塞写文件 |
| D8 机械化 progress check | ✅ | 零 LLM 成本防假完成 |
| Session reflection metrics | ✅ | 增强心跳脚本即可 |
| Context routing | ✅ | AGENTS.md 已有 |
| Loop detection | ⚠️ | 需要自定义计数器 |
| Risk tracking | ⚠️ | 需要 exec 调用拦截 |
| Failure pattern learning | ⚠️ | 需手动维护 pattern DB |
| 16 specialized skills | ❌ | 针对 Claude Code 设计 |
| Stop hook | ❌ | OpenClaw 无等价的会话终止事件 |
| Claude Code Hook API | ❌ | OpenClaw 架构不暴露 tool interception |

**核心问题**: wow-harness 深度依赖 Claude Code Hook API（PreToolUse / PostToolUse / Stop / SessionEnd），OpenClaw 架构是消息路由 + skill 调度，无等价的 tool interception 接口。
>>>>>>> Stashed changes

---

## 二、需求理解

<<<<<<< Updated upstream
**业务目标**：将 TabBar 4 个标签页（上下文/流程/组件/原型）改为单一标签切换模式，点击立即切换内容，**不使用 disabled 阻断状态**。

**核心意图**：用户可以自由浏览任意 Tab 的内容；phase 进度通过其他方式告知（如 PhaseIndicator），而非用 disabled 静默拒绝。
=======
**业务目标**: 将 wow-harness 的"机械约束 > 软约束"工程哲学实装到 OpenClaw agent 治理体系，提升代码质量下限（防止审查 agent 越权、打破重复编辑循环、量化风险操作），同时保持 OpenClaw 的灵活性和多 agent 协作架构。

**目标用户**:
- Coord Agent — 需要机械门控防止假完成
- Dev Agent — 需要循环检测打破编辑陷阱
- Reviewer Agent — 需要 schema-level 隔离确保物理写文件不可能
- 全团队 — 需要 session 反射量化各 guard 的实际效果
>>>>>>> Stashed changes

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
<<<<<<< Updated upstream
| JTBD-1 | **自由浏览** | "我能在任意阶段自由切换上下文/流程/组件标签页，查看已生成的内容" |
| JTBD-2 | **明确状态感知** | "当某个树还没有生成内容时，我能一眼看出是空的，而不是看到 disabled 按钮" |
| JTBD-3 | **Phase 引导** | "系统能告诉我当前在哪个阶段，下一步该做什么，而不是用 disabled 锁住我的操作" |
| JTBD-4 | **移动端一致性** | "在手机上切换标签页的体验和桌面端一致" |
=======
| JTBD-1 | **防止审查 agent 越权** | "我不希望审查 agent 能偷偷修改代码，即使 prompt 里说不要改。通过 schema-level 隔离，物理上无法 spawn 写文件的审查 agent" |
| JTBD-2 | **打破重复编辑循环** | "当 dev agent 在同一文件上编辑超过 5 次还没解决问题时，系统应该提醒'换方法'而不是继续重复" |
| JTBD-3 | **机械门控防止假完成** | "我不相信 dev agent 的自评。通过检查 progress.json 或 build + test 结果，机械验证任务是否真正完成" |
| JTBD-4 | **量化风险操作频率** | "我希望知道 dev agent 调用的 Bash/Edit/Write 高频操作，以及哪些 guard 实际命中了，以便持续优化治理策略" |
| JTBD-5 | **失败模式积累** | "我希望系统能自动积累每次失败的经验模式，新任务遇到类似场景时能直接复用，而不是重复踩坑" |
>>>>>>> Stashed changes

---

## 四、技术方案分析（至少 2 个）

<<<<<<< Updated upstream
### 方案 A：TabBar 移除 disabled + 空状态提示（推荐）

**架构**：移除 `disabled` 属性和 phase 锁定逻辑；TabBar 只负责 UI 切换，数据面板始终挂载，内容根据实际数据量显示空状态。

```
TabBar onClick → setActiveTree(tab) → 三树面板始终渲染
→ 面板内部判断 nodes.length === 0 → 显示空状态提示
→ PhaseIndicator 继续承担 phase 进度告知职责
```

**核心改动**：

1. **TabBar.tsx — 移除 disabled + 锁定逻辑**
   ```typescript
   // 删掉:
   const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
   const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
   disabled={isLocked}

   // 删掉 handleTabClick 中的守卫:
   if (tabIdx > phaseIdx) { return; }

   // 改为始终可点击，但 active 判断保留:
   isActive = tab.id === 'context' ? (activeTree === null || activeTree === 'context')
            : activeTree === tab.id
   ```

2. **TreePanel 空状态** — 面板内容区根据 `nodes.length === 0` 显示友好提示
   - ContextTreePanel: "请先在需求录入阶段输入需求"
   - FlowTreePanel: "请先确认上下文节点，流程将自动生成"
   - ComponentTreePanel: "请先完成流程树，组件将自动生成"

3. **移动端 TabBar 同步移除** — `CanvasPage.tsx` 中 `useTabMode` 下的内联 tab bar 同步改造

**Pros**：
- 改动集中：TabBar.tsx + CanvasPage.tsx 两处
- 不破坏现有 phase 逻辑（PhaseIndicator 不变）
- 彻底消除 disabled 静默拒绝问题
- 移动端一致性自动解决（共享 TabBar 组件）

**Cons**：
- 用户仍可能点击到"空树"——需要良好的空状态设计
- 三树始终渲染（轻微性能开销），可通过 `display: none` 优化

**工期**：0.5-1 day
**复杂度**：低

---

### 方案 B：Tab 导航 + Phase 数据加载分离

**架构**：将"Tab 导航"和"Phase 引导"完全解耦——TabBar 只负责导航，数据按需加载（lazy load）。

```
TabBar click → 仅更新 activeTree 状态
→ TreePanel mount 时检查 nodes.length
  → 有数据 → 正常渲染
  → 无数据 → 显示 phase-gated 空状态（而非 disabled）
→ PhaseIndicator 保持独立，仍显示进度
```

**核心区别**：
- TabBar 完全不做 phase 检查
- 空状态提示包含 phase 引导信息
- TreePanel 根据 phase 判断显示"未到该阶段"还是"数据为空"

**工期**：1-1.5 days
**复杂度**：中（空状态逻辑需要跨组件协调）
=======
### 方案 A：精选机制集成（推荐）

**核心思路**: 只移植高价值 + OpenClaw 可实现的机制，保持现有消息路由架构不变。

```
OpenClaw 现有架构:
  消息路由 (sessions_spawn / sessions_send)
    + Skill 调度 (skill definitions)
    + 软约束 (SOUL.md / AGENTS.md)
  + 新增: 精选 wow-harness 机制
    ├─ Review agent schema 隔离（sessions_spawn 白名单）
    ├─ D8 机械化 progress check（task_manager.py 增强）
    ├─ Loop detection（exec 调用计数器 + warning 注入）
    ├─ Session reflection metrics（heartbeat 增强）
    └─ Risk tracking（exec/Bash 调用频次记录）
```

**核心实现**:

1. **Review agent schema 隔离**: `sessions_spawn` 审查类 agent 时，只传 read-only tools（Read / Grep / sessions_history），禁止 Edit / Write / exec
2. **D8 progress check**: 任务完成前强制执行 `pnpm build && pnpm test`，结果写入 `progress.json`，未 pass 则阻塞交付
3. **Loop detection**: 跟踪同一文件的 `Edit`/`Write` 调用次数，>5 次注入 additionalContext 警告
4. **Session reflection**: 增强心跳脚本，记录 tool 调用频次、guard 命中数，写入 metrics JSONL
5. **Risk tracking**: 记录 Bash / Edit / Write 调用频率，高频触发注入风险提醒

**Pros**:
- 架构侵入性低，不改变 OpenClaw 核心消息路由
- 每个机制独立可插拔，可渐进引入
- 工期短，风险可控

**Cons**:
- 只能覆盖 OpenClaw 已有能力边界的机制（无 Stop hook）
- Loop detection 精度不如 Claude Code Hook API（依赖模拟）
- 维护多个独立机制有一定开销

**工期**: 3-5 days（Phase 1），分 3 个 Epic 交付
**复杂度**: P2

---

### 方案 B：自定义 Hook Layer（深度改造）

**核心思路**: 在 OpenClaw 的 tool interception 层实现类似 Claude Code Hook API 的机制，完整移植 wow-harness 哲学。

```
OpenClaw 改造后架构:
  Tool Interception Layer (新增)
    ├─ PreToolUse Hook: task 级别审查
    ├─ PostToolUse Hook: 文件编辑次数追踪
    ├─ PreExec Hook: Bash 调用风险评估
    └─ Progress Hook: D8机械化检查
  + 消息路由（保持）
  + 16 specialized skills（重新设计 OpenClaw 版本）
```

**核心实现**:

1. **Tool Interception Layer**: 在 `exec` / `read` / `write` / `edit` 工具层面插入钩子，类似 Claude Code Hook API
2. **PreTaskUse Hook**: 任何 spawn subagent 前，检查 schema 白名单
3. **Progress Hook**: 任何任务完成前，强制执行 build + test 机械化验证
4. **16 specialized skills 移植**: 将 wow-harness 的 16 个 skills 重新设计为 OpenClaw native skills

**Pros**:
- 最接近 wow-harness 原生能力
- 架构统一，无 workaround

**Cons**:
- **OpenClaw 核心架构改造**，风险极高
- 工期极长（估算 3-4 周）
- Hook API 改造可能影响现有所有工具行为
- **当前无证据表明 OpenClaw 暴露了等价的 interception 接口**

**工期**: 20-30 days
**复杂度**: P3（极高）
>>>>>>> Stashed changes

---

### 方案对比

<<<<<<< Updated upstream
| 维度 | 方案 A（移除 disabled + 空状态） | 方案 B（Tab/Phase 完全解耦） |
|------|----------------------------------|------------------------------|
| 工期 | 0.5-1 day | 1-1.5 days |
| 复杂度 | 低 | 中 |
| 改动范围 | TabBar + CanvasPage | TabBar + TreePanel 空状态设计 |
| Phase 解耦程度 | 部分（仍依赖 phase 判断空状态） | 完全 |
| 推荐度 | **⭐⭐⭐⭐⭐** | **⭐⭐⭐** |
=======
| 维度 | 方案 A（精选机制） | 方案 B（Hook Layer） |
|------|-----------------|---------------------|
| 工期 | 3-5 days | 20-30 days |
| 复杂度 | P2 | P3（极高） |
| 架构侵入性 | 低 | 高（核心改造） |
| 机制覆盖度 | 5/8 可移植机制 | 8/8（理论上） |
| 风险 | 中 | 极高 |
| OpenClaw 兼容性 | ✅ 完全兼容 | ❌ 需架构改造 |
| 推荐度 | **⭐⭐⭐⭐⭐** | **⭐⭐** |
>>>>>>> Stashed changes

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
<<<<<<< Updated upstream
| R1: 用户点击空树感到困惑 | 中 | 低 | 方案 A/B 均包含空状态提示；PhaseIndicator 引导下一步 |
| R2: 三树同时渲染性能下降 | 低 | 低 | 仅视觉隐藏（CSS `display:none`），不卸载数据 |
| R3: 移动端内联 tab 与桌面端 TabBar 行为不一致 | 高 | 中 | 方案 A 统一改造，两处引用同步修改 |
| R4: phase < tab 对应 phase 时，nodes 为空导致 UI 闪烁 | 低 | 低 | 初始渲染时 phase 决定默认 activeTree，空状态设计平滑 |
| R5: 原型 tab 与其他 tab 行为不一致（prototype 是 phase 驱动） | 低 | 中 | 原型 tab 有独立的 PrototypeQueuePanel，空状态逻辑需同步 |
=======
| R1: OpenClaw 不暴露等价的 tool interception 接口（方案 B 核心风险） | 高 | 高 | 选方案 A，避免架构改造 |
| R2: Over-engineering — wow-harness 6 个月生产经验，OpenClaw 可能不需要全套 | 中 | 中 | 方案 A 精选机制，渐进引入，不全量移植 |
| R3: Loop detection 精度不足（无 Claude Code Hook API） | 高 | 低 | 方案 A 中降级为 exec 调用计数器 + warning（精度降低但可用） |
| R4: Review agent schema 隔离限制审查有效性 | 中 | 中 | 隔离写操作，保留 read-only 审查能力，审查报告质量不受影响 |
| R5: 维护多套独立机制增加运营负担 | 中 | 低 | 方案 A 每个机制独立可拔插，无需强制全开 |
| R6: Session reflection metrics 增加心跳负载 | 低 | 低 | JSONL 追加写入，非实时，对响应时间无影响 |
| R7: 假阳性 — loop detection 在大型重构时频繁误触发 | 中 | 中 | 设置阈值 5 次 / 同一文件（参考 wow-harness 原值），仅 warning 不阻塞 |
>>>>>>> Stashed changes

---

## 六、依赖分析（Dependency Analysis）

```
<<<<<<< Updated upstream
前端:
  ├─ TabBar.tsx                         ← 核心改动：移除 disabled + 锁定逻辑
  ├─ CanvasPage.tsx                     ← 移动端内联 tab bar 同步改造
  ├─ ContextTreePanel.tsx               ← 空状态提示（可选）
  ├─ FlowTreePanelPanel.tsx             ← 空状态提示（可选）
  ├─ ComponentTreePanel.tsx            ← 空状态提示（可选）
  └─ e2e/tab-switching.spec.ts         ← 新增 E2E 测试

后端:
  └─ 无

外部依赖:
  └─ 无
```

**关键改动文件**：
- `vibex-fronted/src/components/canvas/TabBar.tsx` — 移除 `isLocked` + `disabled` + 守卫
- `vibex-fronted/src/components/canvas/CanvasPage.tsx` — 移动端内联 tab bar 移除 disabled
=======
核心依赖:
  ├─ OpenClaw sessions_spawn API — Review agent 隔离必须
  ├─ exec tool — Loop detection 计数依赖
  ├─ task_manager.py — D8 progress check 插入点
  ├─ heartbeat 脚本 — Session reflection 数据写入
  └─ AGENTS.md / SOUL.md — Context routing 扩展

无外部依赖:
  └─ 本次实装不引入任何新外部服务或 npm 包
```

**OpenClaw API 验证**:
- `sessions_spawn` 支持 `tools` 参数白名单 → ✅ 可实现 schema 隔离
- `exec` 工具调用计数器 → ⚠️ 需要在 agent 层面模拟，无原生 Hook API
- `task_manager.py` 可扩展 → ✅ D8 check 可插入
- heartbeat 脚本可写 JSONL → ✅ session reflection 可实现
>>>>>>> Stashed changes

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
<<<<<<< Updated upstream
| AC-1 | TabBar 无 disabled 按钮 | 4 个 tab 按钮均无 `disabled` 属性 | Playwright: `expect(tab).not.toBeDisabled()` |
| AC-2 | 立即切换 | 点击任意 tab，内容立即切换，响应时间 < 100ms | Playwright: 计时 `tab.click()` → 内容可见 |
| AC-3 | 空树有状态提示 | 在 `input` 阶段点击 flow tab，应显示引导提示而非空白 | Visual inspection / screenshot |
| AC-4 | PhaseIndicator 不受影响 | TabBar 改动后 PhaseIndicator 仍正常显示当前 phase | Playwright: PhaseIndicator 存在且正确 |
| AC-5 | 移动端一致性 | `<768px` 视口下内联 tab bar 与桌面端 TabBar 行为一致 | Playwright mobile viewport |
| AC-6 | 原型 tab 正常 | prototype tab 始终可点击（与 phase 解耦），PrototypeQueuePanel 正常展示 | Playwright: prototype tab click |
| AC-7 | active 状态正确 | 只有一个 tab 处于 active 状态 | Playwright: `expect(tabs.filter({has: selected:true})).toHaveCount(1)` |
| AC-8 | 三树数据不丢失 | 切换 tab 后，三树数据（context/flow/component nodes）保持不变 | Unit test: 切换 tab 后检查 store 中的 nodes 数据 |
=======
| AC-1 | Review agent schema 隔离 | 任何 spawn 审查类 agent 时，tools 参数不含 Edit/Write/exec | `sessions_spawn` 调用审查，assert tools 白名单 |
| AC-2 | D8 progress check | 任务完成前强制验证 build + test，未 pass 则 status ≠ done | 模拟 build 失败场景，观察 task status |
| AC-3 | Loop detection | 同一文件 >5 次 Edit/Write，additionalContext 注入警告 | E2E: 模拟 6 次编辑同一文件，观察 context |
| AC-4 | Session reflection | 心跳 JSONL 包含 tool 调用频次和 guard 命中数 | 检查 heartbeat 脚本输出格式 |
| AC-5 | Risk tracking | Bash/Edit/Write 高频调用有记录，阈值可配置 | 模拟高频调用，检查 metrics |
| AC-6 | 机制可拔插 | 每个机制有独立的开关（ENV 或 config），不强制全开 | 配置文件中逐个开关测试 |
| AC-7 | OpenClaw 向后兼容 | 实装前已有的功能（skill 调度、消息路由）不受影响 | 全量回归测试 |
| AC-8 | 工期验收 | Phase 1 在 5 个工作日内完成交付 | 时间追踪 |
>>>>>>> Stashed changes

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
<<<<<<< Updated upstream
| 需求模糊无法实现 | ✅ 通过 | 需求清晰：TabBar 4 tabs 立即切换，无 disabled |
| 缺少验收标准 | ✅ 通过 | 8 条 AC 覆盖核心场景 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history |
=======
| 需求模糊无法实现 | ✅ 通过 | Dev 报告已验证 OpenClaw 可移植机制边界 |
| 缺少验收标准 | ✅ 通过 | 8 条 AC 覆盖所有核心机制 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history + dev 报告 |
| 技术方案缺失 | ✅ 通过 | 2 个方案完整，方案 A 推荐 |
| 依赖不明确 | ✅ 通过 | 已验证 sessions_spawn/tools API 能力 |
>>>>>>> Stashed changes

---

## 九、执行决策

- **决策**: 已采纳
<<<<<<< Updated upstream
- **执行项目**: team-tasks vibex / tab-bar-unified
- **执行日期**: 2026-04-13
- **推荐方案**: 方案 A（TabBar 移除 disabled + 空状态提示）

---

## 十、关键代码位置索引

| 文件 | 行 | 用途 |
|------|----|------|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 37-42 | `isLocked` + `disabled` 定义 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 48-53 | `handleTabClick` 锁定守卫 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 54-61 | 按钮 disabled + class 条件 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | ~240-260 | 移动端内联 tab bar（含 disabled） |
| `vibex-fronted/src/components/visualization/ViewSwitcher/ViewSwitcher.tsx` | 34-50 | 无关：这是 Flow/Mermaid/JSON 视图切换器，与 TabBar 不同 |
=======
- **执行项目**: 待分配（team-tasks）
- **执行日期**: 2026-04-14
- **推荐方案**: 方案 A（精选机制集成）
- **Phase 1 Epic 划分**:
  - E1: Review agent schema-level 隔离（sessions_spawn 白名单）
  - E2: D8 机械化 progress check（task_manager.py 增强）
  - E3: Loop detection + Session reflection metrics（心跳增强）

---

## 十、附：wow-harness 机制可移植性完整评估

| # | 机制 | 可移植性 | 实现路径 | 优先级 |
|---|------|---------|---------|--------|
| 1 | Review agent schema 隔离 | ✅ 完全可移植 | sessions_spawn tools 白名单 | P0 |
| 2 | D8 progress check | ✅ 完全可移植 | task_manager.py 增强 | P0 |
| 3 | Session reflection metrics | ✅ 完全可移植 | heartbeat 脚本增强 | P1 |
| 4 | Context routing | ✅ 已有基础 | AGENTS.md 扩展 path-scoped rules | P1 |
| 5 | Loop detection | ⚠️ 降级可移植 | exec 调用计数器 + warning（非 Hook API） | P2 |
| 6 | Risk tracking | ⚠️ 部分可移植 | Bash/Edit/Write 频率记录（无拦截能力） | P2 |
| 7 | Failure pattern learning | ⚠️ 受限可移植 | 手动维护 pattern DB（无自动提取） | P3 |
| 8 | 16 specialized skills | ❌ 不可移植 | 针对 Claude Code 工作流设计 | N/A |
| 9 | Stop hook | ❌ 不可移植 | OpenClaw 无等价的会话终止事件 | N/A |
| 10 | Claude Code Hook API | ❌ 不可移植 | OpenClaw 架构不暴露 tool interception | N/A |

**Phase 1 范围**: E1 + E2 + E3（3 个 P0/P1 机制），覆盖 4 个核心 JTBD。
>>>>>>> Stashed changes
