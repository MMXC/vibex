# 可行性分析: wow-harness 实装验证

**项目**: vibex / analyze-requirements
**Analyst**: Analyst
**日期**: 2026-04-13
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

| 历史项目 | 相关性 | 教训 |
|---------|--------|------|
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

---

## 二、需求理解

**业务目标**: 将 wow-harness 的"机械约束 > 软约束"工程哲学实装到 OpenClaw agent 治理体系，提升代码质量下限（防止审查 agent 越权、打破重复编辑循环、量化风险操作），同时保持 OpenClaw 的灵活性和多 agent 协作架构。

**目标用户**:
- Coord Agent — 需要机械门控防止假完成
- Dev Agent — 需要循环检测打破编辑陷阱
- Reviewer Agent — 需要 schema-level 隔离确保物理写文件不可能
- 全团队 — 需要 session 反射量化各 guard 的实际效果

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
| JTBD-1 | **防止审查 agent 越权** | "我不希望审查 agent 能偷偷修改代码，即使 prompt 里说不要改。通过 schema-level 隔离，物理上无法 spawn 写文件的审查 agent" |
| JTBD-2 | **打破重复编辑循环** | "当 dev agent 在同一文件上编辑超过 5 次还没解决问题时，系统应该提醒'换方法'而不是继续重复" |
| JTBD-3 | **机械门控防止假完成** | "我不相信 dev agent 的自评。通过检查 progress.json 或 build + test 结果，机械验证任务是否真正完成" |
| JTBD-4 | **量化风险操作频率** | "我希望知道 dev agent 调用的 Bash/Edit/Write 高频操作，以及哪些 guard 实际命中了，以便持续优化治理策略" |
| JTBD-5 | **失败模式积累** | "我希望系统能自动积累每次失败的经验模式，新任务遇到类似场景时能直接复用，而不是重复踩坑" |

---

## 四、技术方案分析（至少 2 个）

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

---

### 方案对比

| 维度 | 方案 A（精选机制） | 方案 B（Hook Layer） |
|------|-----------------|---------------------|
| 工期 | 3-5 days | 20-30 days |
| 复杂度 | P2 | P3（极高） |
| 架构侵入性 | 低 | 高（核心改造） |
| 机制覆盖度 | 5/8 可移植机制 | 8/8（理论上） |
| 风险 | 中 | 极高 |
| OpenClaw 兼容性 | ✅ 完全兼容 | ❌ 需架构改造 |
| 推荐度 | **⭐⭐⭐⭐⭐** | **⭐⭐** |

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| R1: OpenClaw 不暴露等价的 tool interception 接口（方案 B 核心风险） | 高 | 高 | 选方案 A，避免架构改造 |
| R2: Over-engineering — wow-harness 6 个月生产经验，OpenClaw 可能不需要全套 | 中 | 中 | 方案 A 精选机制，渐进引入，不全量移植 |
| R3: Loop detection 精度不足（无 Claude Code Hook API） | 高 | 低 | 方案 A 中降级为 exec 调用计数器 + warning（精度降低但可用） |
| R4: Review agent schema 隔离限制审查有效性 | 中 | 中 | 隔离写操作，保留 read-only 审查能力，审查报告质量不受影响 |
| R5: 维护多套独立机制增加运营负担 | 中 | 低 | 方案 A 每个机制独立可拔插，无需强制全开 |
| R6: Session reflection metrics 增加心跳负载 | 低 | 低 | JSONL 追加写入，非实时，对响应时间无影响 |
| R7: 假阳性 — loop detection 在大型重构时频繁误触发 | 中 | 中 | 设置阈值 5 次 / 同一文件（参考 wow-harness 原值），仅 warning 不阻塞 |

---

## 六、依赖分析（Dependency Analysis）

```
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

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
| AC-1 | Review agent schema 隔离 | 任何 spawn 审查类 agent 时，tools 参数不含 Edit/Write/exec | `sessions_spawn` 调用审查，assert tools 白名单 |
| AC-2 | D8 progress check | 任务完成前强制验证 build + test，未 pass 则 status ≠ done | 模拟 build 失败场景，观察 task status |
| AC-3 | Loop detection | 同一文件 >5 次 Edit/Write，additionalContext 注入警告 | E2E: 模拟 6 次编辑同一文件，观察 context |
| AC-4 | Session reflection | 心跳 JSONL 包含 tool 调用频次和 guard 命中数 | 检查 heartbeat 脚本输出格式 |
| AC-5 | Risk tracking | Bash/Edit/Write 高频调用有记录，阈值可配置 | 模拟高频调用，检查 metrics |
| AC-6 | 机制可拔插 | 每个机制有独立的开关（ENV 或 config），不强制全开 | 配置文件中逐个开关测试 |
| AC-7 | OpenClaw 向后兼容 | 实装前已有的功能（skill 调度、消息路由）不受影响 | 全量回归测试 |
| AC-8 | 工期验收 | Phase 1 在 5 个工作日内完成交付 | 时间追踪 |

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | Dev 报告已验证 OpenClaw 可移植机制边界 |
| 缺少验收标准 | ✅ 通过 | 8 条 AC 覆盖所有核心机制 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history + dev 报告 |
| 技术方案缺失 | ✅ 通过 | 2 个方案完整，方案 A 推荐 |
| 依赖不明确 | ✅ 通过 | 已验证 sessions_spawn/tools API 能力 |

---

## 九、执行决策

- **决策**: 已采纳
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
