# VibeX Sprint 14 提案分析报告

**Agent**: analyst
**日期**: 2026-04-27
**项目**: vibex-proposals-20260427-sprint14
**分析视角**: 可行性验证 + 业务场景分析 + gstack 验证

---

## 业务场景分析

### S14-E1: Design-to-Code Pipeline 串联

**业务场景**：设计师在 Canvas 上完成组件设计，通过 CodeGen 生成 TSX 骨架后，希望直接交给 AI Agent 继续实现业务逻辑。目前需要手动复制代码、切换页面、粘贴，流程割裂。

**用户故事**：
- 作为产品设计师，我希望点击一个按钮就把设计上下文发送给 AI Agent，这样我不需要懂代码也能获得可用的组件实现
- 作为开发者，我希望 AI Agent 能直接读取 Canvas 上的设计节点，这样我收到的上下文就是完整的

**技术方案选项**：

**方案 A（推荐）：按钮注入模式**
- CodeGenPanel 增加 "Send to AI Agent" 按钮
- `agentStore.injectContext()` 接收 generatedCode context
- 路由跳转 `/design/canvas?agentSession=new`
- Pros：单一入口，操作路径短，与 CodeGenPanel 紧邻
- Cons：增加 CodeGenPanel 复杂度

**方案 B：右键菜单模式**
- Canvas Node 右键菜单增加 "Open in AI Agent" 选项
- 只传递选中节点的上下文
- Pros：不增加 CodeGenPanel 复杂度，节点级别控制
- Cons：上下文传递路径长，用户需先选中节点

**方案 C：独立 Pipeline 页面**
- 新建 `/design/pipeline` 页面，聚合 CodeGen + AI Agent
- 用户先选择 Canvas → CodeGen → 一键发送到 AI Agent
- Pros：页面职责单一，不污染现有 UI
- Cons：新增页面路由，增加导航成本

---

### S14-E2: Canvas 导入/导出系统

**业务场景**：用户 A 设计了一个 Canvas，想分享给用户 B；或者用户想备份自己的设计文件。当前只有 localStorage 持久化，一旦换设备或清缓存，数据就没了。

**用户故事**：
- 作为用户，我希望导出一份 JSON 文件，这样即使换设备也能继续工作
- 作为团队 lead，我希望导入同事的 Canvas 文件，这样可以在我的项目里复用他的设计

**技术方案选项**：

**方案 A（推荐）：JSON 文件导入导出**
- Export：`exportCanvas()` → JSON，包含 chapters + crossChapterEdges + metadata
- Import：`useCanvasImport` hook，JSON schema 校验，merge 策略
- Pros：格式简单，可读性好，易于调试
- Cons：无压缩，大型 Canvas 文件可能较大

**方案 B：YAML 格式**
- 同样的数据结构，用 YAML 序列化
- Pros：人类可读性更好，适合版本控制
- Cons：YAML 解析库可能有安全问题（js-yaml 已报 TS2307）

**方案 C：专用二进制格式（.vibex）**
- 打包为 ZIP，内含 JSON + 资源文件（图片等）
- Pros：可携带资源，支持未来扩展
- Cons：需要新增文件格式，非通用

---

### S14-E3: E2E 测试覆盖增强

**业务场景**：Dev Agent 在完成 E10 CodeGen 和 AI Agent 功能后，只有单元测试。随着功能稳定，需要 E2E 覆盖关键用户路径，防止 regression。

**验收标准具体性**：
- `agent-session.spec.ts`：创建 session → 发送消息 → 接收回复 → 保存到节点 → 关闭 session，每步都有 `expect` 断言
- `codegen-pipeline.spec.ts`：选择 Canvas 节点 → CodeGenPanel 生成 → 预览 → Send to AI Agent → 验证 AI Agent 收到 context，每步 data-testid 可定位

---

### S14-E4: Analytics 看板增强

**业务场景**：PM 想看用户从打开 Canvas 到最终导出代码的转化率，但目前只有原始数字，无法判断用户在哪个步骤流失。

**用户故事**：
- 作为 PM，我希望看到"10 个用户打开 Canvas，6 个添加卡片，3 个生成代码，1 个导出"这样的漏斗，这样我知道哪个环节需要优化
- 作为开发者，我想在 Canvas 页面内看到当前设计的使用统计，这样我知道哪个 chapter 被用得最多

**技术方案选项**：

**方案 A（推荐）：FunnelWidget + Canvas 内嵌入口**
- 新增 `/api/v1/analytics/funnel` endpoint，计算 7 天滚动窗口转化率
- FunnelWidget：SVG 漏斗图，无需外部图表库
- DDSCanvasPage 工具栏"分析"按钮，展开内联 Widget
- Pros：API 复用 S10 E1 基础设施，Widget 纯 SVG 不引入依赖
- Cons：需要新的 API endpoint

**方案 B：只用 Dashboard FunnelWidget**
- 不在 Canvas 内嵌，只在 Dashboard 增加漏斗图
- Pros：实现更简单
- Cons：无法按 Canvas 查看内联统计，用户无法感知自己的使用情况

---

### S14-E5: Design Token 版本化管理

**业务场景**：Design Token Palette Manager（若 S13-E2 通过）若无版本控制，修改 token 就是不可逆的。多用户协作时，无法追溯"谁在什么时候把主色从 #00ffff 改成了 #00e5e5"。

**注意**：S14-E5 依赖 S13-E2（Design Token Palette Manager）是否实施。若 S13-E2 未实施，此 Epic 无对象可以版本化管理——**应 conditional，即只有 S13-E2 实施后才启动 E5**。

---

## 可行性评估

### 总体判断

| Epic | 技术可行性 | 依赖可行性 | 备注 |
|------|-----------|-----------|------|
| E1 Design-to-Code Pipeline | ✅ 高 | 依赖 S13-E1 提案是否通过 | S13-E1 即为此 Epic 的前身 |
| E2 Canvas 导入/导出 | ✅ 高 | 纯本地，无外部依赖 | E6 已验证 chapters 数据结构 |
| E3 E2E 测试增强 | ✅ 高 | 纯测试代码，不影响生产 | MockAgentService 已存在 |
| E4 Analytics 看板增强 | ✅ 高 | 依赖 S10 E1 Analytics API | 后端基础设施已就绪 |
| E5 Design Token 版本化 | ⚠️ 条件 | **依赖 S13-E2 是否实施** | 需在 Sprint Planning 时确认 |

### 关键技术风险

**E1 风险：AI Agent Context 注入破坏现有 Session**
- 场景：用户已有活跃的 AI Agent session，此时点击"Send to AI Agent"
- 选项1：强制替换现有 session → 用户可能丢失已有对话
- 选项2：提示"当前有活跃 session，是否合并？" → 增加 UI 复杂度
- 建议：S1-S3 先实现 feature flag 隔离，明确"新 session" vs "注入现有"

**E2 风险：JSON Schema 演进导致历史文件无法导入**
- 场景：Sprint 14 后 chapters 数据结构增加新字段，历史 JSON 导入时报错
- 缓解：`schemaVersion` 字段 + forward-compatibility 处理（忽略未知字段）

**E4 风险：早期产品数据稀疏**
- 场景：上线时 analytics 数据很少，漏斗每个步骤只有 1-2 条记录
- 缓解：graceful empty state + "数据不足以计算漏斗"的提示文案

**E5 风险：S13-E2 未实施**
- 若 S13-E2（Design Token Palette Manager）未进入 Sprint 14 执行，则 E5 无对象可做
- 建议：E5 标记为 conditional，只有 S13-E2 完成后才启动

---

## 初步风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| E1 Session 注入覆盖问题 | 中 | 中 | feature flag + S1-S3 渐进 |
| E2 跨版本 JSON 不兼容 | 低 | 高 | schemaVersion + forward-compat |
| E3 Mock 与实际行为不一致 | 中 | 低 | 明确标注 mock 范围，注释说明 |
| E4 Analytics 数据稀疏 | 高 | 低 | graceful empty state + 提示文案 |
| E5 S13-E2 未实施，E5 悬空 | 中 | 低 | conditional 标记，plan 时确认 |

---

## 验收标准（具体可测试）

### S14-E1
- [ ] `test:e2e` 通过 `codegen-pipeline.spec.ts`（选择节点 → 生成 → 发送到 AI Agent → 验证 context 注入）
- [ ] `agentStore.injectContext()` 单元测试覆盖（valid/invalid context）
- [ ] 200 节点截断时 CodeGenPanel 同步显示警告（E2E 断言）

### S14-E2
- [ ] 导出 JSON 可被 `JSON.parse()` 成功解析，且包含 `schemaVersion` + `chapters` + `crossChapterEdges`
- [ ] 导入不兼容 JSON 时，控制台无 error（warn），UI 显示错误提示
- [ ] `data-testid="canvas-export-btn"` 和 `data-testid="canvas-import-btn"` 存在于 DDSCanvasPage

### S14-E3
- [ ] `pnpm exec playwright test --grep "agent-session"` → 0 failures
- [ ] `pnpm exec playwright test --grep "codegen-pipeline"` → 0 failures
- [ ] `pnpm exec playwright test --grep "design-review-e2e"` → 0 failures

### S14-E4
- [ ] `GET /api/v1/analytics/funnel` 返回 `{ success, data: { steps: [{name, count, rate}] } }`
- [ ] FunnelWidget 在 Dashboard 和 Canvas 内嵌两种模式下渲染一致
- [ ] date range picker 选择 7d/30d 时，API 请求参数正确

### S14-E5（Conditional）
- [ ] 若 S13-E2 未实施，此 Epic 自动跳过（不产生空代码）
- [ ] 若 S13-E2 实施，Token Palette Store 包含 `versions` 字段
- [ ] Rollback 后 `tokens` 状态与选中 version 完全一致（单元测试断言）

---

## 驳回/阻塞条件

- 若 S13-E1 未通过，E1 依赖断裂，**应阻塞**直到 S13-E1 进入执行
- 若 S10 E1 未实施，E4 的后端 API 不存在，**应阻塞**直到后端 API 就绪
- E2/E3 无依赖阻断，可独立执行

---

## 评审结论

**推荐，有条件**

Sprint 14 五条 Epic 中四条无依赖风险，技术可行性高。

唯一条件：**E5 必须 conditional**——只有 S13-E2（Design Token Palette Manager）确认进入 Sprint 14 执行后，E5 才启动。否则应从 Sprint 14 提案中剔除。

**e-signature**: analyst | 2026-04-27

---

## gstack 验证结果（2026-04-27 子代理执行）

> 验证时间：2026-04-27 04:05-04:13（子代理异步执行）
> 目标 URL：https://vibex-app.pages.dev

### E1 验证结果：✅ 问题真实
- **CodeGenPanel 源码存在**：`/components/CodeGenPanel/index.tsx` 包含 `handleDownload`（ZIP），无任何 agent 相关逻辑
- **CodeGenPanel 未部署到生产环境**：Canvas 页面 HTML 无 `codegen` 关键词，组件未集成到任何路由
- **结论**：CodeGenPanel 有"下载 ZIP"按钮，无"Send to AI Agent"入口。问题真实，且比提案描述更严重——组件本身尚未上线

### E2 验证结果：⚠️ 问题存在但描述需修正
- **Canvas 已有导出菜单**：包含 PNG/SVG/全部节点 ZIP 格式
- **真实缺口**：缺 JSON 格式的导入/导出（当前导出的是图片格式，无法分享 Canvas 数据结构）
- **修正**：原描述"无法导出 Canvas"不准确，应改为"可导出图片格式，无法以 JSON 结构化数据导出/导入"

### E4 验证结果：✅ 问题真实
- `AnalyticsWidget.tsx` 仅被 `dashboard/page.tsx` 引用
- `/canvas` 页面 HTML 无任何 `analytics` 关键词
- **结论**：Analytics Widget 只在 Dashboard，不在 Canvas。问题真实

### 额外发现
- E10 CodeGenPanel 本身未部署到生产 Canvas 页面——这意味着 E1 的"Send to AI Agent"入口依赖于 E10 先完成部署。建议在 E1 实施前先确认 CodeGenPanel 是否已集成

### 验证截图（子代理保存）
- `/tmp/vibex-landing.png` — 首页
- `/tmp/vibex-canvas-export-menu.png` — Canvas + 导出菜单
- `/tmp/vibex-dashboard.png` — Dashboard

### 更新后的风险矩阵

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| E1 CodeGenPanel 未部署，E1 依赖断裂 | 中 | 高 | 实施 E1 前先确认 E10 部署状态，或将 E10 部署纳入 E1 前置任务 |
| E2 描述不准确 | 低 | 低 | 已修正验收标准（JSON 格式，非图片格式） |
| E3/E4 无变化 | - | - | 同上 |
