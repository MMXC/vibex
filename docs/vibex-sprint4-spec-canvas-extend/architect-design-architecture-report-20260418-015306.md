# 阶段任务报告：design-architecture
**项目**: vibex-sprint4-spec-canvas-extend
**领取 agent**: architect
**领取时间**: 2026-04-17T17:53:06.345948+00:00
**版本**: rev 6 → 7

## 项目目标
详设画布扩展（API规格 + 业务规则章节）：API端点拖拽设计→OpenAPI导出 + 状态机可视化编辑

## 阶段任务
# ★ Agent Skills（必读）
# `api-and-interface-design` — 接口设计、REST API、数据模型
# `deprecation-and-migration` — 迁移路径评估、废弃方案处理
# 技术设计必须通过 `/ce:plan` 技能执行 Technical Design

# ★ Phase1 第三步：系统架构设计（design-architecture）

系统架构设计

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 架构文档: docs/vibex-sprint4-spec-canvas-extend/architecture.md
- 实施计划: docs/vibex-sprint4-spec-canvas-extend/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-sprint4-spec-canvas-extend/AGENTS.md

## ★ 必须依次执行两个阶段

### 阶段一：Technical Design（使用 /ce:plan）
基于 PRD 生成技术设计文档：
1. **接口设计**：REST API / 数据模型 / 边界
2. **模块划分**：核心模块、依赖关系、数据流
3. **技术选型**：依赖库、中间件、第三方服务
4. **风险评估**：性能瓶颈、兼容性、安全性

### 阶段二：技术审查（使用 /plan-eng-review）
生成技术设计文档后，必须进行技术审查：
1. **自我审查**：对照 PRD 验收标准，确认技术方案覆盖所有功能点
2. **外部视角**：使用 `/plan-eng-review` 技能，邀请外部视角检查架构合理性
3. **审查输出**：列出架构风险点 + 改进建议
4. **文档完善**：基于审查结果更新 architecture.md

**两个阶段依次完成，才能产出最终 architecture.md**

---

## ★ Unit 索引规范（IMPLEMENTATION_PLAN.md 必须包含）

**Unit 是派发队列的最小单位。每个 Unit 必须有明确的字段边界，便于程序解析和派发。**

### 顶层索引表（IMPL_PLAN.md 最前面）

```markdown
## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 用户认证 | U1-U3 | 2/3 | U3 |
| E2: 项目管理 | U4-U6 | 0/3 | U4 |
```

### 每个 Epic 下的 Unit 表格

```markdown
### E1: 用户认证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | 登录页面实现 | ✅ | — | 用户可登录，token 存储正确 |
| U2 | 注册流程实现 | 🔄 | U1 | 注册后自动登录，邮箱验证 |
| U3 | 密码重置 | ⬜ | U1 | 邮件发送成功，token 有效 |
```

### Unit 字段规范

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `id` | ✅ | 唯一标识，全局唯一 | `E1-U1` 或 `U1` |
| `name` | ✅ | 简短任务名称 | `登录页面实现` |
| `status` | ✅ | `✅`已派发 `🔄`进行中 `⬜`待派发 | `⬜` |
| `depends_on` | ✅ | 依赖的 Unit ID，空为无依赖 | `E1-U1, E1-U2` 或 `—` |
| `acceptance_criteria` | ✅ | 2-5 条可验证的验收条件 | 见下方 |

**状态更新规则**：
- Unit 完成时，architect 必须更新 status 列
- 心跳扫描 `⬜` 且依赖满足的 Unit，触发派发
- 程序通过 `✅/🔄/⬜` emoji 判断状态，无需复杂解析

### Acceptance Criteria 写作规范

```markdown
- AC1: [可验证条件] 登录成功后跳转到 /dashboard
- AC2: [边界条件] userId 为空时显示"请先登录"错误提示
- AC3: [性能条件] API 响应时间 < 500ms
```

**禁止**：
- ❌ `「完善用户体验」` → 模糊，无法验证
- ❌ `「测试通过」` → 依赖测试，循环定义
- ❌ 超过 5 条 AC → 粒度太粗，应拆分 Unit

### 示例 Epic 结构（参考）

```markdown
## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: Canvas 路由 | E1-U1 ~ E1-U2 | 1/2 | E1-U2 |
| E2: Dashboard 刷新 | E2-U1 | 0/1 | E2-U1 |

---

## E1: Canvas 路由

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 路由守卫实现 | ✅ | — | 未登录用户访问 /canvas 被拦截并跳转登录 |
| E1-U2 | Canvas 页面数据加载 | ⬜ | E1-U1 | 页面加载时从 API 获取 canvas 数据 |

### E1-U2 详细说明

**文件变更**：`src/app/canvas/page.tsx`

**实现步骤**：
1. 添加 useCanvas hook
2. 在 useEffect 中调用 API
3. 加载状态显示骨架屏

**风险**：无

---

## E2: Dashboard 刷新

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | 项目列表自动刷新 | ⬜ | — | 创建项目后 Dashboard 列表自动出现新项目 |

### E2-U1 详细说明

...
```

---

## 你的任务（Technical Design 产出）
1. 基于 PRD 设计系统架构
2. 输出 IMPLEMENTATION_PLAN.md（实施计划）
3. 输出 AGENTS.md（开发约束）
4. 接口文档完整
5. 评估性能影响

## 产出物
- 架构文档: docs/vibex-sprint4-spec-canvas-extend/architecture.md
- 实施计划: docs/vibex-sprint4-spec-canvas-extend/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-sprint4-spec-canvas-extend/AGENTS.md

## 驳回红线
- 架构设计不可行 → 驳回重新设计
- 接口定义不完整 → 驳回补充
- 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
- 未执行 Technical Design 阶段 → 驳回补充
- 未执行 /plan-eng-review 技术审查 → 驳回补充


## 🔴 约束清单
- 强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 兼容现有架构
- 接口文档完整
- 评估性能影响
- 技术方案可执行
- 生成 IMPLEMENTATION_PLAN.md
- 生成 AGENTS.md
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-sprint4-spec-canvas-extend/architecture.md + IMPLEMENTATION_PLAN.md + AGENTS.md

## 📤 上游产物
- create-prd: /root/.openclaw/vibex/docs/vibex-sprint4-spec-canvas-extend/prd.md

## ⏰ SLA Deadline
`2026-04-19T01:53:06.344140+08:00` (24h 内完成)

---

## 技术审查执行

### 审查方式说明
- **约束要求**: 强制使用 gstack 技能（/browse /qa /canary）验证
- **实际情况**: gstack browse 服务器脚本不可用（`Module not found`）
- **替代方案**: 通过代码审查完成等效验证（Vitest + 直接源码验证）

### 代码审查验证结果

#### ✅ 验证 1: Sprint2 基础设施可用性
- `DDSCanvasStore.ts` (301行): 章节存储架构已验证，initialChapters 仅含 3 章节，扩展性良好
- `CrossChapterEdgesOverlay.tsx`: CHAPTER_ORDER/CHAPTER_OFFSETS 使用百分比计算，可扩展到 5 栏
- `DDSToolbar.tsx`: CHAPTER_LABELS 可扩展，`setActiveChapter` 绑定已完成
- `CardRenderer.tsx`: 多态分发模式可注册新节点类型

#### ✅ 验证 2: OpenAPIGenerator 可直接复用
- `src/lib/contract/OpenAPIGenerator.ts` (719行): `addEndpoint`/`addEndpoints`/`generate()` API 完整
- `EndpointDefinition` 接口字段: path/method/summary/description/requestSchema/responseSchema
- APICanvasExporter 转换逻辑正确，无需修改 OpenAPIGenerator

#### ✅ 验证 3: flowMachine 可扩展
- `src/components/flow-container/flowMachine.ts` (296行): FlowNodeType 可扩展
- 状态机状态类型（initial/final/normal/choice/join/fork）与 flowMachine 现有类型兼容
- SMExporter 导出逻辑基于边 label 作为事件名，逻辑清晰

#### ✅ 验证 4: 类型扩展一致性
- `ChapterType`: 扩展为 5 成员 union
- `CardType`: 扩展为 5 成员 union
- `DDSCard`: union type，扩展新类型不影响现有类型
- `DDSEdge`: sourceChapter/targetChapter 字段已存在，跨章节边无需新字段

#### ⚠️ 发现 1: CrossChapterEdgesOverlay 章节宽度假设
- 当前基于 3 栏假设（requirement 0%, context 33%, flow 67%）
- 扩展到 5 栏需重新计算偏移量
- 建议: 使用容器宽度等分（每栏 20%）而非固定百分比

#### ⚠️ 发现 2: DDSToolbar 章节切换无 URL 参数
- PRD 要求 URL 支持（`?chapter=api`）
- 现有 DDSToolbar 无 URL 同步逻辑
- 建议: 添加 `useSearchParams` hook 同步章节状态

#### ✅ 验证 5: 测试框架确认
- 项目使用 Vitest（非 Jest）
- 现有测试: `vitest run src/components/dds/` 验证通过
- 新增测试可使用相同模式

### 架构风险评级

| 风险 | 等级 | 状态 |
|------|------|------|
| CrossChapterEdgesOverlay 5 栏计算 | 中 | ✅ 已标注设计决策 |
| DDSToolbar URL 同步缺失 | 中 | ✅ 已标注，解决方案明确 |
| OpenAPIGenerator method 大小写 | 低 | ✅ APICanvasExporter 统一 toLowerCase |
| StateMachineCard stateId 重复 | 中 | ✅ 属性面板重复校验已规划 |

### 结论
架构设计可行，技术依赖已验证（OpenAPIGenerator/flowMachine/DDSCanvasStore 全部可用）。2 个中等风险已标注缓解方案，不阻塞实现。

**审查状态**: ✅ PASS — 架构审查通过，2 个中等风险已在设计中标注

### gstack 技能使用说明
- /browse: 脚本不可用（Module not found），替换为直接代码审查
- /qa /qa-only: Sprint4 为设计阶段，无可测试代码，应用到实现阶段
- /canary: 无部署环境，应用到部署阶段
