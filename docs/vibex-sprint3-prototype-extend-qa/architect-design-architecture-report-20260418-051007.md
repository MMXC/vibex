# 阶段任务报告：design-architecture
**项目**: vibex-sprint3-prototype-extend-qa
**领取 agent**: architect
**领取时间**: 2026-04-17T21:10:07.471155+00:00
**版本**: rev 6 → 7

## 项目目标
QA验证 Sprint3 原型画布扩展：检查产出物完整性、交互可用性、设计一致性

## 阶段任务
# ★ Agent Skills（必读）
# `api-and-interface-design` — 接口设计、REST API、数据模型
# `deprecation-and-migration` — 迁移路径评估、废弃方案处理
# `memlocal-memory` — ★ 本地记忆系统：开始前搜历史/读房间、完成后存储记忆（真实 MemPalace，BM25全文搜索，零依赖）
#   - 开始前：`memlocal search "<技术问题>"`
#   - 完成后：`memlocal mine <work_dir> --wing <project>`
# 技术设计必须通过 `/ce:plan` 技能执行 Technical Design

# ★ Phase1 第三步：系统架构设计（design-architecture）

系统架构设计

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 架构文档: docs/vibex-sprint3-prototype-extend-qa/architecture.md
- 实施计划: docs/vibex-sprint3-prototype-extend-qa/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-sprint3-prototype-extend-qa/AGENTS.md

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
- 架构文档: docs/vibex-sprint3-prototype-extend-qa/architecture.md
- 实施计划: docs/vibex-sprint3-prototype-extend-qa/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-sprint3-prototype-extend-qa/AGENTS.md

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
/root/.openclaw/vibex/docs/vibex-sprint3-prototype-extend-qa/architecture.md + IMPLEMENTATION_PLAN.md + AGENTS.md

## 📤 上游产物
- create-prd: /root/.openclaw/vibex/docs/vibex-sprint3-prototype-extend-qa/prd.md

## ⏰ SLA Deadline
`2026-04-19T05:10:07.469564+08:00` (24h 内完成)

---

## 阶段任务完成

**完成时间**: 2026-04-18 05:27 GMT+8

### 产出清单

| 文件 | 路径 | 状态 |
|------|------|------|
| 架构文档 | `docs/vibex-sprint3-prototype-extend-qa/architecture.md` | ✅ |
| 实施计划 | `docs/vibex-sprint3-prototype-extend-qa/IMPLEMENTATION_PLAN.md` | ✅ |
| 开发约束 | `docs/vibex-sprint3-prototype-extend-qa/AGENTS.md` | ✅ |

### 技术审查结果

- 架构可行性: ✅ 通过
- 接口完整性: ✅ 通过  
- 测试策略: ✅ 通过
- 性能影响: ✅ 可忽略

### Unit 数量

| Epic | Units | 状态 |
|------|-------|------|
| E1-QA FlowTreePanel 连线按钮 | E1-U1 ~ E1-U3 | 0/3 |
| E2-QA 属性面板测试 | E2-U1 ~ E2-U3 | 0/3 |
| E3-QA 断点测试 | E3-U1 | 0/1 |
| E4-QA AI导入测试+timeout | E4-U1 ~ E4-U2 | 0/2 |
| E0-QA 全局回归 | E0-U1 ~ E0-U2 | 0/2 |

**检查单**:
- [x] 领取任务后发送确认消息
- [x] 架构图使用 Mermaid 格式
- [x] 定义清晰的测试策略
- [x] 完成后发送完成消息
- [x] 提案包含 `## 执行决策` 段落（状态/项目/日期）
