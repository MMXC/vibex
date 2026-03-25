# PRD: VibeX 三树画布后端对接

**项目**: vibex-backend-integration-20260325
**版本**: 1.0
**PM**: PM Agent
**日期**: 2026-03-25
**状态**: 🔴 草稿

---

## 1. 执行摘要

### 问题陈述
VibeX 三树画布（上下文树 / 流程树 / 组件树）用户点击"启动画布"后画布为空，原因是 **3 个 AI 生成 API 不存在**，前端无法调用后端服务完成 DDD 驱动的完整生成流程。

### 目标
实现 3 个后端 API + 前端集成，打通三树画布从用户输入到生成结果的全链路。

### 成功指标
| 指标 | 目标 |
|------|------|
| 三树生成成功率 | ≥ 90%（无网络错误时） |
| 画布冷启动时间 | ≤ 5s（API 响应） |
| 功能回归通过率 | 100%（现有 ProjectBar 流程不受影响） |

---

## 2. 功能需求

### F1: 上下文树生成 API
**端点**: `POST /api/canvas/generate-contexts`
**输入**: `{ requirementText: string }`
**输出**: `{ contexts: BoundedContext[], confidence: number }`
**触发**: 用户在 CanvasPage 输入需求文本并点击"启动画布"

**验收标准**:
- `expect(response.contexts.length).toBeGreaterThan(0)` — 至少返回 1 个上下文
- `expect(context.name).toBeDefined()` — 每个 context 包含 name 字段
- `expect(api.status).toBe(200)` — HTTP 200 响应
- API 失败时返回友好的 error 字段，不抛 500

### F2: 流程树生成 API
**端点**: `POST /api/canvas/generate-flows`
**输入**: `{ contexts: BoundedContext[] }`
**输出**: `{ flows: BusinessFlow[] }`
**触发**: 用户确认所有上下文节点后自动调用

**验收标准**:
- `expect(response.flows.length).toBeGreaterThan(0)` — 至少返回 1 个流程
- `expect(flow.steps.length).toBeGreaterThan(0)` — 每个 flow 包含至少 1 个 step
- 流程名称包含上下文关键词（相关性验证）

### F3: 组件树生成 API
**端点**: `POST /api/canvas/generate-components`
**输入**: `{ contexts: BoundedContext[], flows: BusinessFlow[] }`
**输出**: `{ components: Component[] }`
**触发**: 用户确认所有流程节点后自动调用

**验收标准**:
- `expect(response.components.length).toBeGreaterThan(0)` — 至少返回 1 个组件
- `expect(component.type).toBeOneOf(['page', 'form', 'list', 'detail', 'modal'])` — 组件类型合法
- `expect(component.apiMock).toBeDefined()` — 包含 API mock 信息

### F4: 前端集成 — 三树生成流程
**文件**: `components/canvas/CanvasPage.tsx`, `lib/canvas/canvasStore.ts`

**验收标准**:
- `expect(screen.getByText('启动画布')).toBeDisabled()` — loading 期间按钮禁用
- `expect(screen.getByText('启动画布')).not.toBeDisabled()` — loading 结束后恢复
- `expect(canvasStore.contextNodes.length).toBeGreaterThan(0)` — 启动后上下文非空
- 断网场景: `expect(toast.error).toHaveBeenCalled()` — 显示错误提示，画布不崩溃

### F5: 回归保障 — ProjectBar 流程不变
**文件**: `components/canvas/ProjectBar.tsx`

**验收标准**:
- 现有 ProjectBar.createProject + generate 流程不受影响
- 导出功能（`/api/canvas/export`）正常
- 状态轮询（`/api/canvas/status`）正常

---

## 3. Epic 拆分

### Epic 1: 后端 API 实现（P0）
**负责人**: Dev
**工作量**: ~6h

| Story | 描述 | 验收 |
|-------|------|------|
| S1.1 | 实现 `/api/canvas/generate-contexts` | 输入需求文本返回 BoundedContext 数组 |
| S1.2 | 实现 `/api/canvas/generate-flows` | 输入 contexts 返回 BusinessFlow 数组 |
| S1.3 | 实现 `/api/canvas/generate-components` | 输入 contexts+flows 返回 Component 数组 |
| S1.4 | 添加 MiniMax API 调用与错误处理 | 超时重试 3 次 + fallback 空数组 |

### Epic 2: 前端集成（P0）
**负责人**: Dev
**工作量**: ~4h

| Story | 描述 | 验收 |
|-------|------|------|
| S2.1 | CanvasPage 启动画布调用 generate-contexts API | loading + 按钮禁用 + 状态更新 |
| S2.2 | confirmContextNode() 触发 generate-flows API | 流程树自动生成 |
| S2.3 | confirmFlowNode() 触发 generate-components API | 组件树自动生成 |
| S2.4 | 添加错误处理与 toast 提示 | 断网场景友好降级 |

### Epic 3: 测试与回归（P0）
**负责人**: Tester
**工作量**: ~3h

| Story | 描述 | 验收 |
|-------|------|------|
| S3.1 | E2E 测试: 完整三树生成流程 | V1-V3 验收标准自动化 |
| S3.2 | E2E 测试: API 失败降级 | V5 验收标准自动化 |
| S3.3 | 回归测试: ProjectBar 现有流程 | V4+V7 验收标准自动化 |

### Epic 4: Open Questions 待确认（P1）
**负责人**: PM / 用户

| Question | 优先级 | 状态 |
|----------|--------|------|
| AI 模型选择（MiniMax / 其他） | P0 | 🔴 待确认 |
| 节点数量上限（分页需求） | P1 | 🟡 待确认 |
| 生成失败策略（手动输入 vs 报错） | P0 | 🔴 待确认 |
| 中间状态持久化到 Prisma | P2 | 🟢 可延期 |

---

## 4. UI/UX 流程

```
[用户输入需求文本]
         ↓
[点击"启动画布"]
         ↓
[调用 POST /api/canvas/generate-contexts]
         ↓
[显示 loading spinner，按钮禁用]
         ↓
[返回 contexts → 显示上下文树节点]
         ↓
[用户确认 / 编辑 / 删除上下文]
         ↓
[全量确认 → 调用 POST /api/canvas/generate-flows]
         ↓
[返回 flows → 显示流程树节点]
         ↓
[用户确认 / 编辑 / 删除流程]
         ↓
[全量确认 → 调用 POST /api/canvas/generate-components]
         ↓
[返回 components → 显示组件树节点]
         ↓
[用户确认全量 → 创建项目（已有流程）]
```

**错误流程**:
```
[API 调用失败]
         ↓
[显示 toast 错误提示]
         ↓
[画布保持当前状态，不崩溃]
         ↓
[用户可重试]
```

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | API 响应时间 ≤ 5s（MiniMax API 超时配置 10s） |
| **可用性** | API 失败时降级显示，不阻塞用户操作 |
| **安全性** | API key 仅存在于后端，不暴露到前端 |
| **可维护性** | API 端点与 DDD 服务层分离，便于独立测试 |
| **回归** | 现有 ProjectBar / export / status 功能不受影响 |

---

## 6. 技术约束

- **前端框架**: Next.js App Router + TypeScript
- **状态管理**: Zustand (canvasStore.ts)
- **后端框架**: Next.js Route Handlers (App Router)
- **AI 提供商**: MiniMax API（复用现有 `lib/ai/minimax.ts`）
- **数据库**: Prisma + SQLite（已有 CanvasProject 模型）

---

## 7. 实施计划

| 阶段 | 内容 | 产出 | 依赖 |
|------|------|------|------|
| Phase 1 | 后端 API 实现（S1.1-S1.4） | 3 个 API 端点 | Open Questions 确认 |
| Phase 2 | 前端集成（S2.1-S2.4） | 三树生成流程打通 | Phase 1 完成 |
| Phase 3 | 测试与回归（S3.1-S3.3） | E2E 测试用例 | Phase 2 完成 |

**预计总工期**: ~13h（Dev ~10h + Test ~3h）

---

## 8. DoD（完成定义）

- [ ] 3 个 API 端点全部实现并返回正确数据结构
- [ ] 前端三树生成流程端到端可运行
- [ ] API 失败场景有友好降级（不崩溃）
- [ ] E2E 测试覆盖 V1-V7 全部验收标准
- [ ] 现有 ProjectBar / export / status 回归测试通过
- [ ] Open Questions 至少解决 2/4（P0 项必须确认）
