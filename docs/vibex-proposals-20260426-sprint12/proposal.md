# VibeX Sprint 12 功能提案

**项目**: vibex-proposals-20260426-sprint12
**提案日期**: 2026-04-26
**提案人**: Analyst
**基于**: Sprint 1-11 历史交付 + E6/E7 Architect 提案

---

## 执行摘要

### Sprint 目标
基于 Sprint 11 画布协作基础（Firebase Presence MVP），推进三项高优先级能力：
1. 协作冲突解决（DurableObjects）
2. AI 辅助设计评审（MCP 工具集成）
3. 设计稿自动生成组件代码（Design-to-Code Pipeline）

### 决策

| 状态 | 执行项目 | 执行日期 |
|------|---------|---------|
| 已采纳 | vibex-proposals-20260426-sprint12 | 2026-04-26 |

---

## 1. 技术可行性评估

### 1.1 Sprint 1-11 交付基线

| Sprint | 核心交付 | 技术基础 |
|--------|---------|---------|
| S1-S4 | Canvas 原型 / 正式画布 | Flow + Node + Chapter 数据模型 |
| S5 | Delivery 集成 / Analytics API | REST API + D1 |
| S6 | AI Coding 集成 | MCP Server v0.5.0 |
| S7 | CI TypeScript Gate / Batch Export | CI/CD + KV Storage |
| S8 | Sprint 9 债务清理 | TS 类型系统 |
| S9 | Sprint 10 | Teams Dashboard |
| S10 | Sprint 10 E3/E6 | Firebase 实时协作 / Canvas 本地持久化 |
| S11 | TS 债务 + 快捷键 + 搜索 + Firebase MVP | Zustand + Firebase RTDB + useKeyboardShortcuts |

**结论**：架构基础稳固，技术债务已大幅清理（197→28 TS 错误），Sprint 11 Firebase Presence 已验证降级策略。

### 1.2 E6 — Prompts 安全 AST 扫描

| 维度 | 评估 |
|------|------|
| 技术难度 | 中（@babel/parser 成熟，code-review.ts 已存在） |
| 工时估算 | 4h（E6-S1: 2h, E6-S2: 1h, E6-S3: 1h） |
| 依赖 | 无外部依赖，基于现有 code-review.ts |
| 风险 | Babel 解析失败 fallback 已定义；包体积 ~5MB 可接受 |
| 可行性 | ✅ 高确定性，Architect E6 spec 已完整定义 |

### 1.3 E7 — MCP Server 可观测性

| 维度 | 评估 |
|------|------|
| 技术难度 | 低（Express handler + JSON logger，模式成熟） |
| 工时估算 | 3h（E7-S1: 1.5h, E7-S2: 1.5h） |
| 依赖 | 无外部依赖，基于现有 packages/mcp-server/ |
| 风险 | 日志聚合需基础设施（已在 Edge Case 中标注） |
| 可行性 | ✅ 高确定性，Architect E7 spec 已完整定义 |

### 1.4 E8 — Canvas 协作冲突解决

| 维度 | 评估 |
|------|------|
| 技术难度 | 高（Sprint 11 已建立 Firebase Presence，但冲突处理未实现） |
| 工时估算 | 10h（E8-S1: 3h, E8-S2: 4h, E8-S3: 3h） |
| 依赖 | Sprint 11 Firebase Presence（✅ 已完成）；DurableObjects（✅ 已集成到 backend） |
| 风险 | 多用户同时编辑同一节点的冲突仲裁算法复杂；需 E2E 测试覆盖 |
| 可行性 | ⚠️ 中等，需 PM 确认冲突仲裁策略 |

### 1.5 E9 — AI 设计评审 MCP 工具

| 维度 | 评估 |
|------|------|
| 技术难度 | 中（复用现有 code-review.ts + MCP SDK） |
| 工时估算 | 8h（E9-S1: 2h, E9-S2: 3h, E9-S3: 3h） |
| 依赖 | MCP Server E7（可并行）；code-review.ts（✅ 已存在） |
| 风险 | AI 评审质量依赖 prompt engineering；需人工抽检 |
| 可行性 | ✅ 中高确定性，code-review.ts 已有基础 |

### 1.6 E10 — 设计稿自动生成组件代码

| 维度 | 评估 |
|------|------|
| 技术难度 | 高（Design-to-Code 跨模态，业界难题） |
| 工时估算 | 8h（S10-S1: 2h, S10-S2: 3h, S10-S3: 3h） |
| 依赖 | AI Coding 集成（Sprint 6 ✅）；Canvas Node 数据（✅ 已建模） |
| 风险 | 生成质量不可控；需 MVP 限定范围（仅生成 CSS Module + TSX 骨架） |
| 可行性 | ⚠️ 中等，建议 MVP 限定为「设计规范内 TSX 骨架生成」，非完整业务逻辑 |

---

## 2. 风险矩阵

### 2.1 Sprint 12 综合风险

| 风险 ID | 风险描述 | 概率 | 影响 | 风险等级 | 应对策略 |
|---------|---------|------|------|---------|---------|
| R1 | E8 多用户冲突仲裁算法复杂度超预期 | 中 | 高 | 🔴 高 | MVP 仅处理「最后写入胜出」，完整 CRDT 放入 backlog |
| R2 | E10 Design-to-Code 生成质量不可控 | 高 | 中 | 🟡 中 | 限定 MVP：仅生成符合 DESIGN.md 的 TSX 骨架，AI 补充细节由人工评审 |
| R3 | E9 AI 评审 prompt 质量差，误报率高 | 中 | 中 | 🟡 中 | 复用 E6 AST 安全扫描作为辅助，AI 评审作为参考而非仲裁 |
| R4 | Sprint 11 Firebase 降级策略在生产环境失效 | 低 | 高 | 🟡 中 | 添加 Playwright E2E 测试验证 Firebase configured/unconfigured 双路径 |
| R5 | TypeScript 债务（28 处 `as any`）在新 Epic 扩散 | 低 | 低 | 🟢 低 | CI 已加 typecheck gate，新增代码需保持零新增 |
| R6 | E6 Babel 包体积影响 Worker bundle size | 低 | 低 | 🟢 低 | wrangler deploy 时监测 bundle size，阈值 > 5MB 则优化 |

### 2.2 依赖关系风险

```
E6 (AST 扫描) ──────┬── 无外部依赖 ────────────────→ ✅ 可立即开始
E7 (MCP 观测) ──────┴── 无外部依赖 ────────────────→ ✅ 可立即开始
E8 (冲突解决) ──── 依赖 Sprint 11 Firebase ──────→ ✅ Firebase MVP 已完成
E9 (AI 评审) ────── 依赖 E7 MCP 观测（并行）──────→ ⚠️ E7 完成后集成
E10 (Design-to-Code) ─ 依赖 Canvas Node 数据模型 ─→ ✅ 数据模型已完备

E6 + E7 可并行（无共享代码）
E9 + E10 可并行（无共享代码）
E8 独立路径
```

---

## 3. 工期估算

### 3.1 Epic 工时汇总

| Epic | 主题 | 工时 | 推荐并行 |
|------|------|------|---------|
| E6 | Prompts 安全 AST 扫描 | 4h | 与 E7/E8 并行 |
| E7 | MCP Server 可观测性 | 3h | 与 E6/E8 并行 |
| E8 | Canvas 协作冲突解决 | 10h | 独立路径 |
| E9 | AI 设计评审 MCP 工具 | 8h | 与 E10 并行 |
| E10 | 设计稿自动生成组件代码 | 8h | 与 E9 并行 |

**Sprint 12 总工时**: 33h

### 3.2 人员分配建议

| 开发者 | 分配 | 依赖 |
|--------|------|------|
| Dev-A | E6 (4h) + E9 (8h) = 12h | E9 需等 E7 完成 MCP 基础 |
| Dev-B | E7 (3h) + E10 (8h) = 11h | 并行开发 |
| Dev-C | E8 (10h) | 独立路径，无需等待 |

**覆盖**: 33h / 2人并行 ≈ 2 Sprint 天（合理）

### 3.3 里程碑

| 里程碑 | 日期 | 完成条件 |
|--------|------|---------|
| M1 | Day 1 | E6 + E7 完成（7h，P0 基础设施） |
| M2 | Day 2 | E9 MCP 工具集成完成 |
| M3 | Day 3 | E8 冲突解决 MVP（Last-Write-Wins） |
| M4 | Day 3 | E10 Design-to-Code MVP（骨架生成） |

---

## 4. 依赖分析

### 4.1 内部依赖

- **E8 → Sprint 11 Firebase Presence**: `isFirebaseConfigured()` ✅, `usePresence` ✅, `updateCursor` ✅
- **E9 → E7**: MCP 工具注册依赖 `/health` 和 `logger` 基础设施
- **E9 → code-review.ts**: ✅ 已存在，Sprint 6 AI Coding 集成
- **E10 → Canvas Node 数据模型**: ✅ Flow + 5-chapter 结构完备

### 4.2 外部依赖

| 依赖项 | 来源 | 状态 | 风险 |
|--------|------|------|------|
| @babel/parser | npm | 需添加到 backend package.json | 🟢 低 |
| @babel/traverse | npm | 需添加到 backend package.json | 🟢 低 |
| @modelcontextprotocol/sdk | npm | 已在 mcp-server | 🟢 低 |
| Firebase Admin SDK | npm | 已在 frontend | 🟢 低 |
| DurableObjects | Cloudflare Workers | 已在 backend 集成 | 🟢 低 |

---

## 5. 历史经验参考

### 5.1 Sprint 11 经验（直接适用）

1. **Firebase 降级策略**: `isFirebaseConfigured()` guard 已验证有效，E8/E9/E10 需继承此模式
2. **Zustand persist 白名单**: `partialize` 白名单字段策略已验证，E8 冲突解决需同步更新 store persist
3. **TypeScript CI Gate**: `tsc --noEmit` 已强制执行，E6/E7/E8/E9/E10 需保持零新增 `as any`
4. **CORS 预检处理**: OPTIONS handler 模式已验证，E7 MCP 健康检查端点无需认证但需正确 CORS

### 5.2 Sprint 5-7 经验

1. **API 测试策略**: Snapshot testing 对结构化 JSON 响应高效（已在 canvas-api-completion 验证）
2. **Vitest vs Jest 隔离**: Vitest 配置 `include/exclude` 必须与 Jest 完全隔离（已在 canvas-testing-strategy 验证）
3. **Route 顺序敏感性**: Hono 中 `GET /latest` 必须在 `GET /:id` 之前（已在 canvas-api-completion 验证）

### 5.3 Sprint 1-4 经验

1. **画布三树联动**: Chapter 数据结构（requirement/context/flow/api/business-rules）已稳定，E10 组件代码生成依赖此模型
2. **Canvas 状态管理**: Zustand store 架构已验证，E8 冲突解决需扩展现有 store 而非另起炉灶

---

## 6. 提案 Epic 详情

### 6.1 E6 — Prompts 安全 AST 扫描（P0，Architect E6 spec 继承）

**背景**: `code-review.ts` 当前使用正则匹配检测 `eval/new Function`，误报率高。

**技术方案**: 使用 `@babel/parser` AST 解析替代正则，精确检测危险模式，误报率目标 <1%。

**Stories**:

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| E6-S1 | @babel/parser AST 解析实现 | 2h | `analyzeCodeSecurity('eval("x")')` → hasUnsafe=true |
| E6-S2 | 误报率 <1% 测试集验证 | 1h | 1000 条合法代码样本，误报率 <1% |
| E6-S3 | AST 解析性能验证 | 1h | 5000 行代码解析 <50ms |

**DoD**: eval/new Function 精确检测；误报率 <1%；性能 <50ms；集成到 code-review.ts 和 code-generation.ts

### 6.2 E7 — MCP Server 可观测性（P0，Architect E7 spec 继承）

**背景**: MCP Server 当前无健康检查和 structured logging，生产环境无法监控。

**技术方案**: 添加 `/health` 端点 + JSON structured logger。

**Stories**:

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| E7-S1 | MCP /health 端点 | 1.5h | GET /health 返回 200 + {status, version, uptime} |
| E7-S2 | Structured logging | 1.5h | 日志 JSON 格式输出，包含 tool/duration/success 字段 |

**DoD**: /health 返回 200；JSON log 输出到 stdout；SDK 版本检查日志；集成到所有 MCP 工具调用

### 6.3 E8 — Canvas 协作冲突解决（P1）

**背景**: Sprint 11 Firebase Presence MVP 已实现 cursor 广播，但多用户同时编辑同一卡片时无冲突解决。

**技术方案**: Last-Write-Wins（LWW）作为 MVP 冲突策略；卡片级锁定（编辑时标记 `lockedBy`）；ConflictBubble 组件显示冲突提示。

**Stories**:

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| E8-S1 | 卡片级编辑锁 | 3h | 选中编辑时写入 `lockedBy: userId`；其他用户看到锁定状态 |
| E8-S2 | 冲突检测 + ConflictBubble | 4h | 远程更新与本地修改冲突时弹出 ConflictBubble |
| E8-S3 | LWW 仲裁 + Playwright E2E | 3h | Last-Write-Wins 策略落地；E2E 覆盖冲突场景 |

**DoD**: 双用户同时编辑同一卡片时，ConflictBubble 显示；LWW 仲裁正确；Firebase configured/unconfigured 双路径 E2E 通过

**⚠️ 风险提示**: 完整 CRDT 算法超出本次 Sprint，建议 LWW MVP 后将 CRDT 放入 backlog。

### 6.4 E9 — AI 设计评审 MCP 工具（P1）

**背景**: 当前 code-review.ts 仅做静态代码分析，无 AI 辅助设计评审能力。

**技术方案**: 将 code-review.ts 封装为 MCP 工具，支持传入 Design Spec（JSON），AI 评审覆盖设计规范合规性、组件复用性、可访问性。

**Stories**:

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| E9-S1 | MCP 工具封装 code-review | 2h | MCP server 注册 `review_design` 工具，返回评审结果 |
| E9-S2 | 设计规范合规性评审 | 3h | 评审检查 DESIGN.md 合规（颜色/字体/间距） |
| E9-S3 | 组件复用性 + 可访问性评审 | 3h | 评审建议组件复用 + a11y 问题 |

**DoD**: MCP 工具可调用；返回结构化评审报告；集成到 Canvas 工具面板

### 6.5 E10 — 设计稿自动生成组件代码（P2，谨慎范围）

**背景**: Canvas 已建模 Flow + 5-chapter，用户完成设计后需手工编写 TSX 代码。

**技术方案**: MVP 限定为「符合 DESIGN.md 的 TSX 骨架生成」：根据 Canvas Node 数据生成 TypeScript 类型定义 + CSS Module 变量 + React 组件文件头注释。

**Stories**:

| ID | 功能 | 工时 | 验收标准 |
|----|------|------|---------|
| S10-S1 | Canvas Node → TypeScript 类型生成 | 2h | 从 Flow/Chapter 数据生成 `.d.ts` 类型定义 |
| S10-S2 | 组件骨架模板生成 | 3h | 生成符合 DESIGN.md 规范的 TSX 骨架文件 |
| S10-S3 | Download as ZIP + Playwright E2E | 3h | 打包为 ZIP 下载；E2E 验证下载内容正确性 |

**DoD**: Canvas Node 数据导出为 TypeScript 类型；TSX 骨架符合 DESIGN.md 设计变量；ZIP 下载 E2E 通过

**⚠️ 风险提示**: 完整 Design-to-Code 超出 3h，MVP 仅生成骨架，业务逻辑由人工补充。

---

## 7. 评审结论

### 7.1 最终推荐

**推荐**: Conditional（条件采纳）

**条件**:
1. E8 冲突解决接受 LWW MVP 策略，完整 CRDT 延后
2. E10 Design-to-Code 接受骨架生成范围，不做完整业务逻辑生成
3. E9 AI 评审仅作为参考建议，不作为强制仲裁

### 7.2 优先级排序

| 优先级 | Epic | 理由 |
|--------|------|------|
| P0 | E6 (AST 扫描) | 安全风险，已有完整 spec，4h 高确定性 |
| P0 | E7 (MCP 观测) | 可观测性基础设施，已有完整 spec，3h 高确定性 |
| P1 | E8 (冲突解决) | Sprint 11 协作能力延伸，用户核心体验 |
| P1 | E9 (AI 评审) | MCP 工具能力扩展，code-review.ts 已验证 |
| P2 | E10 (Design-to-Code) | 用户提效工具，但范围需严格控制 |

### 7.3 拒绝项

| 提案方向 | 拒绝理由 |
|---------|---------|
| 完整 CRDT 冲突解决 | 超出 Sprint 范围，算法复杂度高，放 backlog |
| 完整 Design-to-Code（生成完整业务逻辑） | 超出 Sprint 范围，生成质量不可控，MVP 限定骨架 |
| AI 强制仲裁模式 | 当前 AI 评审质量不足以作为仲裁，仅作参考 |

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260426-sprint12
- **执行日期**: 2026-04-26
- **Sprint 负责人**: Coord
- **开发分配**: Dev-A → E6+E9；Dev-B → E7+E10；Dev-C → E8

---

## 附录

### A. 参考文档

- `vibex-architect-proposals-vibex-proposals-20260416/specs/epic-06-prompts-security-ast.md`
- `vibex-architect-proposals-vibex-proposals-20260416/specs/epic-07-mcp-observability.md`
- `vibex/docs/learnings/canvas-api-completion.md`
- `vibex/docs/learnings/canvas-cors-preflight-500.md`
- `vibex/docs/learnings/canvas-testing-strategy.md`

### B. Sprint 11 完成状态

| Epic | 状态 | 提交 |
|------|------|------|
| E1 (后端 TS) | ✅ | 48292f80d, 639c520f1, 010165584 |
| E2 (快捷键) | ✅ | f0f5e9b32, 9a4403419 |
| E3 (搜索) | ✅ | 9bc9330c1, d48ad4f09 |
| E4 (Firebase) | ✅ | 597bd49bf, a06db153b |

---

*Analyst 评审报告 | 2026-04-26*
