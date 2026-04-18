# PRD — vibex-sprint6-ai-coding-integration-qa

**项目**: vibex-sprint6-ai-coding-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM（QA 验证）
**上游**: `vibex-sprint6-ai-coding-integration` (prd.md, specs/, analyst-qa-report.md)

---

## 执行摘要

### 背景
`vibex-sprint6-ai-coding-integration` 是 VibeX 最后一期，包含设计稿导入/AI Coding Agent/版本 Diff 三组功能。Analyst QA 结论：**🔴 Not Recommended — E2 功能性阻断**。E1 和 E3 基础设施完整，但 E2 的核心逻辑是 `mockAgentCall()` stub。

### 目标
对 `vibex-sprint6-ai-coding-integration` 的产出物进行系统性 QA 验证，确认 BLOCKER 状态、归档缺陷。

### 成功指标
- E2 mock stub 状态确认
- E3 路由页面缺失状态确认
- 所有缺陷归档入 `defects/`
- E1 测试数量修正（有数据错误）
- 无遗留 P0 缺陷进入下一阶段（E2 P0 待 dev 修复）

---

## 1. 产出物完整性检查矩阵

| Epic | 代码产出 | 测试 | Spec 产出 | 状态 |
|------|---------|------|---------|------|
| E1: 设计稿导入 | image-ai-import.ts + /api/chat + /api/figma ✅ | 6 tests (实际) ⚠️ | E1-import-ui.md ✅ | ⚠️ 有条件通过 |
| E2: AI Coding Agent | AgentFeedbackPanel + AgentSessions + agentStore ✅ | 13 tests ✅ | E2-ai-coding.md ✅ | 🔴 BLOCKER |
| E3: 版本Diff | VersionDiff.ts + VersionDiffPanel ✅ | 11 tests ✅ | E3-version-history.md ✅ | ⚠️ 缺少路由 |

### BLOCKER 分析

#### 🔴 BLOCKER 1: E2 CodingAgentService 是 Stub
- `mockAgentCall()` 是 `// TODO: Replace with real agent code`
- UI 组件完整但无实际 AI 功能
- 测试 13/13 通过但测的是 mock 逻辑

#### 🟡 BLOCKER 2: E3 缺少路由页面
- `VersionDiffPanel.tsx` 存在但 `app/canvas/delivery/version/page.tsx` 不存在
- CHANGELOG 声称有 page 集成，实际无路由入口
- 用户无法访问 VersionDiff 面板

### 交互可用性检查

| ID | 路径 | 验证项 | 预期 | 状态 |
|----|------|--------|------|------|
| I1 | E1 图片导入 | 拖拽上传 → AI 识别 | 识别结果显示 | ✅ |
| I2 | E1 Figma导入 | Figma URL → 组件列表 | URL 解析成功 | ✅ |
| I3 | E2 AI面板 | AgentFeedbackPanel 渲染 | 面板显示 | ✅ (UI) |
| I4 | E2 AI功能 | mockAgentCall 调用 | 返回 mock 数据 | ✅ (stub) |
| I5 | E3 VersionDiff | VersionDiffPanel 渲染 | diff 可视化 | ⚠️ 无路由 |
| I6 | E3 快照创建 | diffVersions() | 返回结构化 diff | ✅ |

### 设计一致性检查

| ID | 检查项 | 规范来源 | 预期 | 状态 |
|----|--------|---------|------|------|
| C1 | 环境变量 fallback | /api/chat | AI_API_BASE/KEY 有默认值 | ✅ |
| C2 | Figma token 503 | /api/figma | 未配置时 503 | ✅ |
| C3 | jsondiffpatch 使用 | VersionDiff.ts | 使用成熟库 | ✅ |
| C4 | E1 测试数据 | image-ai-import.test.ts | 6 tests（非声称的 10）| ✅ |

---

## 2. Epic 拆分（QA 验证维度）

### E1: 设计稿导入产出物完整性

**Epic 目标**: 验证 Figma/图片导入代码、测试、文档。

#### E1-QA1: /api/chat Route
- **验证项**: `app/api/chat/route.ts` 支持 `image_url` content part
- **验收标准**: `expect(typeof handler).toBe('function')`

#### E1-QA2: image-ai-import 测试数量修正
- **验证项**: tester-e1-report 声称 10 tests，实际 6
- **验收标准**: 修正 analyst-qa-report 数据：E1 实际 6 tests

#### E1-QA3: 文件限制验证
- **验证项**: 10MB 大小 + PNG/JPG/JPEG 类型限制
- **验收标准**: 代码审查有对应验证逻辑

---

### E2: AI Coding Agent产出物完整性

**Epic 目标**: 确认 mock stub 状态。

#### 2a. 本质需求穿透

- **验证的核心**: `CodingAgentService.ts` 核心逻辑是否为 mock
- **去掉的验证项**: 真实 AI 接入（dev 下一 sprint 负责）

#### 2c. 情绪地图（QA 视角）

- **进入 AI Coding Tab**: 预期看到生成的代码 → 检查点：I4
- **点击重新生成**: 预期代码更新 → 检查点：I4（实际：mock 数据不变）

#### E2-QA1: mockAgentCall Stub 确认
- **验证项**: `CodingAgentService.ts` 含 "// TODO: Replace with real agent code"
- **验收标准**: `expect(sourceCode).toMatch(/TODO.*real agent/i)`

#### E2-QA2: UI 组件存在性
- **验证项**: AgentFeedbackPanel + AgentSessions + agentStore
- **验收标准**: `expect(typeof AgentFeedbackPanel).toBe('function')`

---

### E3: 版本Diff产出物完整性

**Epic 目标**: 确认 VersionDiffPanel 存在但缺少路由页面。

#### E3-QA1: VersionDiffPanel 存在
- **验证项**: `components/version-diff/VersionDiff.tsx` 存在
- **验收标准**: `expect(typeof VersionDiff).toBe('function')`

#### E3-QA2: 路由页面缺失
- **验证项**: `app/canvas/delivery/version/page.tsx` 不存在
- **验收标准**: `expect(fs.existsSync(routePath)).toBe(false)`

#### E3-QA3: diffVersions 函数
- **验证项**: `lib/version/VersionDiff.ts` 含 `diffVersions()`
- **验收标准**: `expect(typeof diffVersions).toBe('function')`

---

## 3. 优先级矩阵

| 优先级 | Epic | QA 项 | 依据 |
|--------|------|-------|------|
| P0 | E2 | QA1（mock stub 确认）| 功能性阻断，AI 无实际价值 |
| P0 | E3 | QA2（路由页面缺失）| 用户无法访问 VersionDiff |
| P1 | E1 | QA2（测试数据修正）| 数据一致性错误 |
| P2 | E1 | C4（Integration 测试缺失）| 测试覆盖缺口 |
| P2 | E2 | UI 组件完整确认 | 功能就绪等待后端 |

---

## 4. 验收标准汇总

```
// E1-QA1: /api/chat handler
expect(typeof handler).toBe('function')

// E1-QA2: 测试数量
expect(exec('pnpm test -- --testPathPattern=image-ai-import').summary.tests).toBe(6)

// E2-QA1: mock stub 确认
expect(sourceCode).toMatch(/TODO.*Replace.*real agent/i)

// E2-QA2: UI 组件
expect(screen.getByTestId('agent-feedback-panel')).toBeInTheDocument()

// E3-QA1: VersionDiffPanel
expect(screen.getByTestId('version-diff-panel')).toBeInTheDocument()

// E3-QA2: 路由缺失
// find app/canvas/delivery/version/page.tsx → 不存在
expect(fs.existsSync('app/canvas/delivery/version/page.tsx')).toBe(false)

// E3-QA3: diffVersions
const diff = diffVersions(data1, data2)
expect(diff).toBeDefined()
```

---

## 5. DoD (Definition of Done)

### QA 完成判断标准

- [ ] E1~E3 所有产出物路径验证
- [ ] E2 mock stub 状态归档
- [ ] E3 路由页面缺失归档
- [ ] E1 测试数据修正归档
- [ ] 所有缺陷归档入 `defects/`
- [ ] 产出 `qa-final-report.md`

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration-qa
- **执行日期**: 2026-04-18
