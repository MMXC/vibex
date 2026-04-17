# AGENTS.md — vibex-sprint6-ai-coding-integration

**项目**: vibex-sprint6-ai-coding-integration
**日期**: 2026-04-18
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### 架构约束

- **E2-U3.1 必须先验证**: `sessions_spawn` 在 VibeX 环境中可用性。如果不可用，立即降级为方案B（HTTP → 后端 AI 服务），不要盲目继续。
- OpenClaw 集成使用 `runtime: "acp"` 和 `mode: "session"`
- 不在 ProtoEditor 或 DDSCanvas 中直接硬编码 OpenClaw 调用，所有集成逻辑封装在 `coding-agent.ts` 中
- **版本 diff 使用 jsondiffpatch**（已存在于 version-history）

### Figma Import 约束

- **E1-U2（P2）暂缓**: MVP 不实现 Figma API 集成（需要 Token 配置）
- E1-U1（Image AI 解析）优先：复用 `cf-image-loader.ts` 的 AI vision pipeline
- Figma Import UI (`FigmaImport.tsx`) 已存在，只扩展，不重写

### AI Coding Agent 约束

- Coding Agent 生成的代码必须经过用户确认才能写入项目文件
- `CodingFeedbackPanel` 提供"接受"/"拒绝"两个明确操作
- 不自动覆盖已有文件：所有写入通过用户确认

### 版本 Diff 约束

- 使用 `jsondiffpatch`（已在 version-history 使用）
- diff 结果不修改原始快照，只读展示
- 支持相邻版本和任意两个版本的比较

### 测试要求

- **Vitest + Testing Library**
- CodingAgentService: ≥ 5 个测试用例（含 mock sessions_spawn）
- VersionDiff: ≥ 5 个测试用例
- Image AI Import: ≥ 3 个测试用例

### 不在本期处理

- Figma API 完整实现（Token 配置复杂）
- 自动化 AI Coding Agent 测试（需要真实 OpenClaw 环境）
- 跨会话 AI 上下文管理

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint6-ai-coding-integration
- **执行日期**: 2026-04-18
- **备注**: E2-U3 需先验证 sessions_spawn 可用性
