# Research Report: vibex-proposals-20260426-sprint12-qa

**Researcher**: analyst-subagent (subagent:bb1d454b)
**日期**: 2026-04-28
**工作目录**: /root/.openclaw/vibex

---

## 1. 历史相关案例 + 教训

### 1.1 本项目 Learnings 库检索

检索路径: `docs/learnings/` + `docs/.learnings/`

| 文件 | 关键词匹配 | 核心教训 |
|------|-----------|---------|
| `vibex-e2e-test-fix.md` | E2E、测试框架 | Jest/Playwright 隔离、@ci-blocking 跳过、BASE_URL 环境变量 |
| `canvas-testing-strategy.md` | Canvas、单元测试 | mock store 过简导致假通过、Vitest vs Jest 语法迁移 |
| `canvas-cors-preflight-500.md` | Canvas、CORS | OPTIONS 预检不带 Auth、路由注册顺序敏感 |
| `canvas-api-completion.md` | Canvas API | Route 顺序（/latest 必须在 /:id 之前） |
| `vibex-proposals-20260426.md` | Sprint 11, E0-E4 | tsc --noEmit 作为 gate、Firebase graceful degradation |

### 1.2 关键教训提取

**教训 1: mock store 过简导致假通过（canvas-testing-strategy）**
- E1 useCanvasRenderer 的 33 个测试中，mockStore 过于简化（所有字段返回空数组）
- 结果：测试通过但实际运行时报错
- **防范**: `vi.mock()` 的 `mockReturnValue` 必须模拟真实数据结构，不能用硬编码空对象

**教训 2: IMPLEMENTATION_PLAN scope drift（vibex-e2e-test-fix）**
- Architect 在 IMPLEMENTATION_PLAN 中创建了 PRD 范围外的 E2/E3 Epic
- 导致 task chain 存在但实际无人执行，永远 pending
- **防范**: IMPLEMENTATION_PLAN scope 必须严格对照 PRD，不得超出

**教训 3: 虚假完成检测（vibex-e2e-test-fix）**
- `coord-completed` 触发时只检查第一个 reviewer-push-epic1 的状态
- 即使 E2/E3 的 task chain 全 pending，project-level status 仍显示 completed
- **防范**: 项目完成判定必须验证所有 Epic 的 task chain 状态

**教训 4: CORS 预检不带 Auth（canvas-cors-preflight-500）**
- OPTIONS 请求不带 Authorization header，但受保护的 API 期望有 Authorization
- 死锁：OPTIONS → authMiddleware → 401 → 浏览器阻止 POST
- **防范**: 所有受保护 API 必须在 gateway 层单独处理 OPTIONS

**教训 5: 路由顺序敏感（canvas-api-completion）**
- `GET /latest` 在 `GET /:id` 之后注册 → /latest 被 :id 匹配为 id=latest
- **防范**: REST API 路由顺序必须标注优先级，测试覆盖特殊路径

**教训 6: Sprint 11 并发问题（vibex-proposals-20260426.md）**
- E3 hook test 11 个失败（URL test fixture 缺少 ?projectId=test）
- E2/E3 reviewer 批准后仍有 pre-existing unit test 失败
- **防范**: reviewer 批准不能替代 tester 阶段；tester 必须验证 E2E 路径

---

## 2. Git History 关键发现

### 2.1 Sprint 12 提交序列（按时间逆序）

| Commit | Epic | 内容 | 关键观察 |
|--------|------|------|---------|
| `ea8c6e79f` | E10 | codeGenerator + CodeGenPanel + CSS Module | ⚠️ 包含 TS null check 修复 |
| `9519d0602` | E9 | AI design review MCP tools + 40 tests | ✅ 完整提交 |
| `5c44b0ba5` | E8 | LWW conflict + ConflictDialog + lock | ✅ 完整提交 |
| `4bf59939e` | E7-S1 | dynamic SERVER_VERSION | ⚠️ 仅 S1 |
| `e3229f884` | E6 | SecurityAnalysisResult + AST walker + 21 tests | ✅ 完整提交 |
| `607cd5d06` | E8 | fix import paths | 🔧 修复 commit |
| `ae5f566e1` | E8 | rewrite ConflictDialog unit tests | 🔧 修复 commit |
| `0b9c43806` | E8 | add Playwright E2E | 🧪 测试 commit |

### 2.2 修复 commit 模式分析

Sprint 12 存在 **3 次修复 commit**（607cd5d06 / ae5f566e1 / ea8c6e79f 末尾的 fix）：
- `607cd5d06`: E8 import paths 错误 → 修复后才提交 E2E
- `ae5f566e1`: ConflictDialog unit tests 接口错误 → 重写
- `ea8c6e79f`: CodeGenPanel TS null check → 提交后修复

**规律**: 有 fix commit 的 epic 需要更高关注度——说明首次实现时存在设计接口不稳定问题。

### 2.3 Sprint 13/14 后续影响

Sprint 14 的 E3（`a4f16090d fix(E3): always-visible CodeGenPanel`）修复了一个 bug：
- `CodeGenPanel` 在某些情况下不可见 → 修复了 visibility 问题
- 这与 E10 的 CodeGenPanel 直接相关——说明 E10 的 UI 在 Sprint 14 被发现有问题

### 2.4 CHANGELOG 格式问题

CHANGELOG 中 E10 有一条单独修复记录：
```
**修复**: CodeGenPanel TS null check (tabs type annotation)
```
这与 `ea8c6e79f` 的 `feat(E10)` 混在一起，格式不统一（修复内容混入功能提交）。

---

## 3. 当前 Sprint 的背景与目标

### 3.1 Sprint 12 概览

**时间**: 2026-04-26
**范围**: 5 个 Epic（E6~E10），涵盖 VibeX 安全分析、可观测性、协作、AI 评审、代码生成

| Epic | 名称 | 开发者 | Reviewer | 状态 |
|------|------|--------|----------|------|
| E6 | AST 安全扫描 | dev-e6 | reviewer-epic6-ast扫描 ✅ | ✅ |
| E7 | MCP 可观测性 | dev-e7 | reviewer-epic7-mcp可观测性 ✅ | ✅ |
| E8 | 冲突解决 | dev-e8 | reviewer-epic8-冲突解决 ✅ | ✅ |
| E9 | AI 设计评审 | dev-e9 | reviewer-epic9-ai设计评审 ✅ | ✅ |
| E10 | 代码生成 | dev-e10 | reviewer-epic10-设计稿代码生成 ✅ | ✅ |

### 3.2 QA 阶段现状（截至 2026-04-28）

**已完成**:
- ✅ E6 tester 报告已产出（tester-tester-e6-report-20260428-061202.md）
- ✅ 分析报告已产出（analysis.md）

**未完成**:
- ❌ E7~E10 tester 阶段尚未开始（无报告文件）

### 3.3 当前 Sprint 与后续 Sprint 的关联

**E10 CodeGenPanel → Sprint 14 E3 fix**:
- Sprint 14 发现 `CodeGenPanel` visibility 问题（`a4f16090d`）
- 说明 E10 的 CodeGenPanel UI 在首次实现时不够健壮
- **结论**: 当前 Sprint 12 QA 必须重点验证 CodeGenPanel 的渲染和交互

**E8 冲突解决 → Sprint 11 E4 Firebase**:
- E8 的 LWW 仲裁依赖 Firebase RTDB
- Firebase 的 `isFirebaseConfigured()` guard 模式来自 Sprint 11 E4
- **结论**: E8 的 Firebase fallback 路径是测试重点

---

## 4. 防止重复犯错的具体建议

### 4.1 tester 阶段必须验证的关键点

| # | Epic | 风险 | 验证方式 | 参考教训 |
|---|------|------|---------|---------|
| 1 | E10 | CodeGenPanel UI visibility（已在 Sprint 14 发现） | `/qa` 浏览器验证 | Sprint 11 E3 |
| 2 | E10 | TS null check（已在 ea8c6e79f 修复） | `pnpm exec tsc --noEmit` | Sprint 12 自有修复 |
| 3 | E8 | ConflictDialog 接口不稳定（ae5f566e1 重写） | 单元测试 + `/qa` | E2E test fix learnings |
| 4 | E8 | Firebase fallback 降级路径 | 模拟 unconfigured 场景 | Sprint 11 E4 Firebase guard |
| 5 | E9 | MCP tool 真实配置（已在 analysis 标注为 🟠） | MCP server 真实调用 | — |
| 6 | E6 | false-positive 样本覆盖 | 随机采样验证 | canvas-testing-strategy |

### 4.2 结构性改进建议

**建议 1: 引入真实环境 fixture 模式**
- 参考 Sprint 11 的 `?projectId=test` URL fixture
- E8/E10 的测试应包含 URL fixture 的等价物

**建议 2: fix commit 触发强制 re-review**
- 当发现修复 commit（607cd5d06 / ae5f566e1 模式），应强制重新 review
- 修复 commit 说明原提交存在设计接口问题，reviewer 未在首次发现

**建议 3: CHANGELOG 格式规范**
- 修复内容不应混入 feat commit
- 应单独记录 `fix: CodeGenPanel TS null check` commit
- 或在 CHANGELOG 中用 `🔧` 前缀区分修复条目

**建议 4: tester 报告完整性门槛**
- 当前仅 E6 tester 完成 → 评审结论为"有条件通过"而非"通过"
- 后续应要求全部 Epic tester 报告完成后才能判定

### 4.3 风险缓解优先级

| 优先级 | 行动 | 负责人 | 截止 |
|--------|------|--------|------|
| P0 | 完成 E7~E10 tester 报告 | tester | 2026-04-29 06:12 |
| P1 | E10 CodeGenPanel 浏览器验证（gstack /qa） | dev/tester | 2026-04-29 |
| P1 | E9 MCP review_design 真实配置验证 | dev | 待配置 environment |
| P2 | E8 merge 策略真实场景测试 | dev | 下一 sprint |

---

## 附录: 关键文件索引

```
docs/
├── vibex-proposals-20260426-sprint12-qa/
│   ├── analysis.md              ← analyst 评审报告
│   ├── prd.md                   ← PRD
│   └── tester-tester-e6-report-20260428-061202.md  ← E6 tester 报告
├── learnings/
│   ├── vibex-e2e-test-fix.md
│   ├── canvas-testing-strategy.md
│   ├── canvas-cors-preflight-500.md
│   └── canvas-api-completion.md
└── .learnings/
    └── vibex-proposals-20260426.md  ← Sprint 11 经验
```
