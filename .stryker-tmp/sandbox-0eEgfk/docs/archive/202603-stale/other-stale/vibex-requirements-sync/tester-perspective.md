# Tester Perspective: VibeX 需求测试保障分析

**会议**: VibeX 项目需求对齐会议
**发言者**: Tester
**日期**: 2026-03-20
**项目**: vibex-requirements-sync

---

## 总需求流程（测试视角）

```
Step 1: 首页输入需求
  → Step 2: 对话澄清
    → Step 3: 生成核心上下文业务流程
      → Step 4: 询问通用支撑域
        → Step 5: 用户勾选流程节点
          → Step 6: 生成页面/组件节点
            → Step 7: 用户再次勾选
              → Step 8: 创建项目
                → Step 9: Dashboard
                  → Step 10: 原型预览 + AI助手
```

---

## 一、测试覆盖点（Test Coverage Map）

### 1.1 已实现功能 — 需持续回归保护

| 功能 | 组件 | 测试类型 | 状态 |
|------|------|---------|------|
| 首页需求输入 | `StepRequirementInput` | E2E + Unit | ✅ 需回归 |
| SSE 流式限界上下文生成 | `useDDDStream` | Unit (vitest) | ✅ 需回归 |
| 思考过程实时展示 | `ThinkingPanel` | Unit | ✅ 需回归 |
| Mermaid 流程图渲染 | `MermaidPreview` | Unit + E2E | ⚠️ 回归Bug |
| 业务流程图生成 | `useBusinessFlowStream` | Unit | ✅ 需回归 |
| 节点树选择器 | `NodeTreeSelector` | E2E | ⚠️ 回归Bug |
| 项目创建 API | `projectApi.createProject` | Unit + API | ✅ 需回归 |
| Dashboard 项目列表 | `DashboardPage` | E2E | ✅ 需回归 |
| 步骤导航回退 | `StepNavigator` | E2E | ✅ 需回归 |
| 状态持久化 | `confirmationStore` | Unit | ✅ 需回归 |
| secureStorage 加密 | `SecureStorage` | Unit | ✅ 需回归 |

### 1.2 已完成 PRD — 待开发功能

| 功能 | PRD Epic | 测试类型规划 | 状态 |
|------|---------|------------|------|
| 对话澄清交互 | `vibex-interactive-confirmation` | E2E + 集成 | 📋 待开发 |
| 首页→Design 数据同步 | `vibex-step2-issues` Epic 1 | E2E | ⚠️ 回归Bug |
| 步骤回退快照 | `vibex-step2-issues` Epic 4 | E2E + Unit | ⚠️ 待修复 |
| UI 组件点击修复 | `vibex-step2-regression` Epic 1 | E2E | ⚠️ 待修复 |
| 流程图显示修复 | `vibex-step2-regression` Epic 2 | E2E | ⚠️ 待修复 |

### 1.3 完全缺失功能 — 测试规划阶段

| 功能 | 缺失影响 | 测试策略规划 |
|------|---------|-------------|
| 通用支撑域询问 | P1 | 需等 PRD 完成 |
| 两轮节点勾选数据流 | P0 | 需等 Epic 新建 |
| 项目创建流程（HomePage 集成） | P0 | 需等功能开发 |
| Dashboard 原型预览 | P1 | 需等 Epic 新建 |
| AI 助手集成 | P2 | 需等 Epic 新建 |

---

## 二、关键路径测试用例（Critical Path Test Cases）

### 2.1 端到端主流程（Happy Path）

```
用例编号: TC-E2E-001
标题: 首页需求提交 → 项目创建 → Dashboard 查看
前置条件: 用户已登录，无历史项目
测试步骤:
  1. 访问首页 (/)
  2. 在需求输入框输入: "用户注册登录系统"
  3. 点击提交按钮
  4. 等待 SSE 流式响应完成（限界上下文生成）
  5. 验证 Mermaid 流程图显示
  6. 勾选至少一个上下文节点
  7. 进入项目创建步骤
  8. 输入项目名称: "test-e2e-project"
  9. 点击创建项目
  10. 验证跳转到 Dashboard
  11. 验证项目 "test-e2e-project" 在列表中
预期结果: 全流程无错误，项目成功创建并显示
优先级: P0
自动化: ✅ Playwright E2E
```

### 2.2 首页→Design 数据同步

```
用例编号: TC-E2E-002
标题: 首页生成限界上下文后跳转 Design 页面数据保留
前置条件: 首页完成 Step 1-3
测试步骤:
  1. 首页输入需求并提交
  2. 等待上下文生成完成
  3. 验证 PreviewArea 显示流程图
  4. 点击跳转到设计页面
  5. 验证设计页面显示相同的限界上下文
  6. 验证流程图内容一致
预期结果: 跳转后数据完整保留，不丢失
优先级: P0
自动化: ✅ Playwright E2E
回归风险: 🔴 高 — 当前为已知 Bug (confirmationStore ↔ designStore 不同步)
```

### 2.3 步骤回退与快照恢复

```
用例编号: TC-E2E-003
标题: 多步骤导航回退后数据完整恢复
前置条件: 首页完成 Step 1-3
测试步骤:
  1. 首页输入需求并生成上下文
  2. 点击下一步进入 Step 2
  3. 点击上一步回到 Step 1
  4. 验证 Step 1 数据（输入的文本、生成的上下文）未丢失
  5. 再次点击下一步回到 Step 2
  6. 验证 Step 2 数据完整
预期结果: 任意步骤回退后数据快照完整恢复
优先级: P0
自动化: ✅ Playwright E2E
回归风险: 🟡 中 — `vibex-step2-issues` Epic 4 需完成
```

### 2.4 SSE 流式输出与 UI 更新

```
用例编号: TC-INT-001
标题: SSE 流式响应正确更新思考面板和预览区
前置条件: 正常网络连接
测试步骤:
  1. 首页输入复杂需求文本（>50字符）
  2. 点击提交
  3. 实时验证思考面板显示流式 thinking 消息
  4. 实时验证 PreviewArea 逐步更新 Mermaid 代码
  5. 等待 SSE 结束（收到 done 信号）
  6. 验证最终限界上下文数量 ≥ 1
预期结果: SSE 消息正确解析，UI 实时更新无卡顿
优先级: P0
自动化: ✅ Vitest Unit + Playwright E2E
```

### 2.5 节点勾选与反勾选

```
用例编号: TC-E2E-004
标题: NodeTreeSelector 节点可点击且状态正确切换
前置条件: 首页生成上下文后
测试步骤:
  1. 生成限界上下文后，验证 NodeTreeSelector 可见
  2. 点击第一个节点，验证高亮选中
  3. 再次点击，验证取消选中
  4. 点击第二个节点（不取消第一个），验证多选
  5. 触发后续操作后验证选中状态被正确使用
预期结果: 节点点击响应正常，多选行为正确
优先级: P0
自动化: ✅ Playwright E2E
回归风险: 🔴 高 — 当前为已知 Bug (节点不可点击)
```

### 2.6 项目创建 API 集成

```
用例编号: TC-API-001
标题: 项目创建 API 返回正确的项目 ID 和数据结构
前置条件: 有效的限界上下文数据
测试步骤:
  1. 准备有效的请求数据（contextIds, modelIds, requirementText）
  2. 调用 POST /api/project
  3. 验证返回 201 状态码
  4. 验证返回数据包含 id, name, createdAt
  5. 验证 Dashboard 可通过 GET /api/project 查到该项目
预期结果: API 契约正确，前后端数据一致
优先级: P0
自动化: ✅ Vitest API Mock + Integration
```

### 2.7 Mermaid 流程图渲染边界

```
用例编号: TC-UNIT-001
标题: Mermaid 代码无效时优雅降级，不崩溃
前置条件: 无
测试步骤:
  1. 渲染组件，传入空字符串 mermaidCode
  2. 验证显示空状态提示（不崩溃）
  3. 传入无效 Mermaid 语法（如未闭合的 graph）
  4. 验证显示错误提示，不阻断用户操作
  5. 传入正常 Mermaid 代码
  6. 验证正常渲染
预期结果: 边界情况下优雅降级，无空白页面或白屏
优先级: P1
自动化: ✅ Vitest Unit
```

### 2.8 Dashboard 项目管理

```
用例编号: TC-E2E-005
标题: Dashboard 支持项目删除和恢复
前置条件: Dashboard 存在至少 2 个项目
测试步骤:
  1. 访问 /dashboard
  2. 验证项目列表显示所有活跃项目
  3. 删除第一个项目
  4. 验证项目从列表消失或进入"已删除"区域
  5. 恢复已删除项目
  6. 验证项目重新出现在列表中
预期结果: 删除/恢复功能正常，数据持久化到后端
优先级: P1
自动化: ✅ Playwright E2E
```

---

## 三、回归测试策略（Regression Test Strategy）

### 3.1 回归测试分层架构

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: 单元测试 (Vitest)                         │
│  - Store 状态管理 (confirmationStore, designStore)  │
│  - Hook 逻辑 (useDDDStream, useBusinessFlowStream) │
│  - 工具函数 (MermaidParser, SecureStorage)          │
│  - 覆盖率目标: ≥ 65%                               │
│  - 执行频率: 每次 PR / 每日 CI                     │
├─────────────────────────────────────────────────────┤
│  Layer 2: 集成测试 (Vitest + MSW)                  │
│  - API 模块 (page.test.ts, domain-model.test.ts)   │
│  - Store ↔ API 交互                                │
│  - 执行频率: 每次 PR                               │
├─────────────────────────────────────────────────────┤
│  Layer 3: E2E 测试 (Playwright)                    │
│  - 关键路径 (TC-E2E-001 ~ 005)                     │
│  - 浏览器: Chromium + Firefox                      │
│  - 执行频率: 每日 CI + 每次 major release          │
├─────────────────────────────────────────────────────┤
│  Layer 4: 人工测试 (探索性测试)                     │
│  - 新功能验收                                      │
│  - 复杂交互边界                                     │
│  - 执行频率: sprint 结束时                          │
└─────────────────────────────────────────────────────┘
```

### 3.2 已知回归 Bug — 重点监控

| Bug ID | 描述 | 影响范围 | 测试用例 | 修复优先级 |
|--------|------|---------|---------|-----------|
| `vibex-step2-regression` Epic 1 | 节点不可点击 | 流程节点勾选 | TC-E2E-004 | P0 |
| `vibex-step2-regression` Epic 2 | 流程图不显示 | 首页→Design 跳转 | TC-E2E-002 | P0 |
| confirmationStore ↔ designStore | 数据不同步 | 首页→Design 跳转 | TC-E2E-002 | P0 |
| `onCreateProject={() => {}}` | 项目创建空实现 | 端到端断裂 | TC-E2E-001 | P0 |

**回归策略**:
1. 上述 4 个 Bug 修复后，必须运行完整 E2E 测试套件验证
2. 每次代码变更前，确保 `TC-E2E-001`, `TC-E2E-002`, `TC-E2E-004` 通过
3. 在 CI 中配置: PR 必须通过 `npm test` (Layer 1+2) 才可合并

### 3.3 高频变更区域 — 强化覆盖

| 区域 | 变更频率 | 测试策略 |
|------|---------|---------|
| 首页流程 (HomePage, Step 1-3) | 高 | 每次变更跑全量 E2E |
| DDD Stream (useDDDStream) | 高 | 每次变更跑 Vitest + E2E |
| Store 层 (confirmationStore, designStore) | 中 | 每次变更跑 Vitest + 持久化测试 |
| API 层 (routes/*.ts) | 中 | 每次变更跑 Vitest API 测试 |
| Mermaid 渲染 (MermaidPreview) | 中 | 每次变更跑边界测试 (TC-UNIT-001) |
| Dashboard | 低 | 每周回归 E2E |

### 3.4 性能基准

| 指标 | 基准 | 告警阈值 | 测试方式 |
|------|------|---------|---------|
| `npm test` 执行时间 | < 120s | > 180s | CI 监控 |
| Jest 单测执行时间 | < 60s | > 90s | CI 监控 |
| E2E 关键路径 (TC-E2E-001) | < 30s | > 45s | Playwright CI |
| 首屏加载时间 | < 2s | > 3s | Lighthouse |
| SSE 流式响应首字节时间 | < 500ms | > 1000ms | E2E custom metric |

### 3.5 安全测试要点

| 测试项 | 方法 | 频率 |
|--------|------|------|
| 输入注入 (XSS) | Playwright E2E — 在需求输入框尝试 `<script>` | 每次 PR |
| API 认证 | Vitest — 验证未认证请求返回 401 | 每次 API 变更 |
| 敏感数据加密 | Vitest Unit — SecureStorage 加密/解密验证 | 每次 PR |
| 错误日志脱敏 | Unit — 验证敏感字段不写入 console | 每次 PR |

### 3.6 CI/CD 流水线建议

```yaml
# 建议的 CI 阶段
stages:
  - lint        # ESLint + Prettier
  - typecheck   # tsc --noEmit
  - test:unit   # vitest --coverage (Layer 1+2)
  - test:e2e    # playwright (Layer 3, 仅关键路径)
  - test:full   # 全量 E2E (仅 main 分支)
  - audit       # npm audit
  - build       # npm run build

gate:
  # 合入 main 的条件
  - test:unit coverage ≥ 60%
  - test:e2e pass rate = 100%
  - audit 无高危漏洞
```

---

## 四、当前测试状态快照

| 维度 | 状态 | 说明 |
|------|------|------|
| 单元测试覆盖 | ✅ 654+ tests, 63.55% | 持续保持 > 60% |
| E2E 关键路径 | ⚠️ 部分阻塞 | 4 个 P0 Bug 阻断 E2E |
| Playwright 配置 | ⚠️ 环境问题 | `Class extends value undefined` 需修复 |
| API 集成测试 | ✅ 覆盖完整 | MSW mock 到位 |
| 回归自动化 | ⚠️ 部分可用 | Layer 1+2 可用，Layer 3 部分受阻 |

---

## 五、建议行动项

### 立即行动（P0）
1. **修复 `vibex-step2-regression` Epic 1** — 节点点击不可用，导致 TC-E2E-004 失败
2. **修复 `vibex-step2-regression` Epic 2** — 流程图不显示，导致 TC-E2E-002 失败
3. **修复 HomePage `onCreateProject`** — 空实现导致 TC-E2E-001 无法完成

### 近期行动（P1）
4. **打通 confirmationStore → designStore** — 首页→Design 数据同步
5. **完成 `vibex-step2-issues` Epic 4** — 步骤快照回退
6. **修复 Playwright E2E 环境** — `Class extends value undefined` 问题

### 中期规划（P2）
7. 新增缺失功能的测试用例（Step 4, 6, 7, 9, 10）
8. 提升 E2E 覆盖率至关键路径 100% 自动化
9. 引入性能回归测试（CI 集成 Lighthouse）

---

*Tester Perspective — VibeX 需求对齐会议 — 2026-03-20*
