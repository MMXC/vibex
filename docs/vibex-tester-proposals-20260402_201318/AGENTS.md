# VibeX 测试流程改进 — 开发约束（AGENTS.md）

**文档版本**: v1.0  
**编写日期**: 2026-04-02  
**编写角色**: Architect  
**项目**: vibex-tester-proposals-20260402_201318  
**适用范围**: vibex-tester-proposals 项目下所有 agent

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-tester-proposals-20260402_201318
- **执行日期**: 2026-04-02

---

## 2. Dev Agent 约束

### 2.1 Definition of Done（必须遵守）

> **本项目 DoD 扩展 — 测试准备为强制要求**

每条 Epic 完成后，必须同时满足以下条件：

- [ ] **代码实现完成**：Epic 功能按 PRD 要求实现
- [ ] **测试文件同步更新**：新增 Epic 必须同时提交 `.test.ts` 文件
- [ ] **本地测试通过**：执行 `npx jest <EpicName> --no-coverage`，必须全部通过
- [ ] **同 PR 提交**：测试文件与实现文件必须在同一 PR 中提交
- [ ] **覆盖率达标**（仅针对 Epic 3 Store 覆盖率任务）：
  - contextStore / uiStore / flowStore / componentStore: ≥80%
  - sessionStore: ≥70%

**DoD 违规后果**: tester 前置检查发现测试文件缺失或失败，直接驳回，不执行完整测试。

### 2.2 单元测试规范

**测试文件位置**：
- 新建 store 测试 → `vibex-fronted/src/stores/__tests__/xxxStore.test.ts`
- 现有 store 补充测试 → 同目录下的 `.test.ts` 或 `__tests__/` 子目录
- 保持与已有文件路径一致，不迁移现有测试文件

**测试命名**：
```typescript
// 文件: xxxStore.test.ts
describe('xxxStore', () => {
  it('F<Epic>.<Story>.<场景编号>: <描述>', () => { ... });
  it('F4.1: 三树切换保持选中状态', async () => { ... });
});
```

**测试工具**：
- 框架: Jest（`npm test`）
- React 组件测试: `@testing-library/react`
- Store 测试: 直接调用 `useXxxStore.getState()` 和 `act()`
- Mock: `jest.mock()` + `vi.fn()`

### 2.3 E2E 测试规范（Epic 4 相关）

**E2E 测试文件位置**：
- Canvas E2E 测试 → `vibex-fronted/tests/e2e/canvas/*.spec.ts`
- 命名规范: `<功能>-<场景>.spec.ts`

**选择器优先级**（必须遵守）：
1. `data-testid` 属性（最优先，dev 必须为可交互元素添加）
2. ARIA 属性（`aria-label`, `role`）
3. CSS 类名（仅作辅助，不可靠）
4. XPath（禁止使用）

**data-testid 命名规范**：
```typescript
// Canvas 组件示例
<div data-testid="context-tree">
  <div data-testid="tree-node" data-node-name="xxx" data-node-status="pending">
    <input type="checkbox" data-testid="tree-node-checkbox" />
  </div>
</div>

// 按钮
<button data-testid="tree-tab-context">Context</button>
<button data-testid="confirm-button">确认</button>

// 反馈
<div data-testid="confirm-toast">确认成功</div>
<div data-testid="node-detail-panel">
  <span data-testid="node-detail-name"></span>
</div>
<div data-testid="selected-count">0</div>
```

**E2E 测试稳定要求**：
- 同一测试连续运行 **3 次** 均通过才算合格
- flaky test 发现后立即修复，不允许合入
- 失败时必须截图：`screenshot: 'only-on-failure'`

### 2.4 Git 提交规范

**提交信息格式**：
```
<type>(<scope>): <subject>

<type>: feat | fix | test | docs | chore
<scope>: epic-name | store-name | e2e-name
```

**示例**：
```
feat(canvas-e2e): add context-tree-switch E2E test

test(sessionStore): add initial sessionStore coverage ≥70%

fix(AGENTS): update DoD with mandatory test preparation requirement
```

### 2.5 PR 规范

- PR 标题格式: `[Epic <N>] <简短描述>`
- PR 描述必须包含：
  - 改动了哪些文件
  - 如何验证（运行命令）
  - 覆盖率报告（如适用）
- 关联 team-tasks 任务 ID

### 2.6 禁止事项

| 禁止行为 | 原因 |
|---------|------|
| 不提交测试文件单独提交代码 | 违反 DoD，tester 直接驳回 |
| E2E 测试使用不稳定选择器 | 导致 flaky test |
| 在 `/tests/e2e/` 目录外创建 Playwright 测试 | jest.config.ts 忽略策略 |
| 修改已有测试文件不补测 | 破坏现有覆盖率 |
| 不添加 `data-testid` 直接写 E2E 测试 | 选择器不稳定 |

---

## 3. Reviewer Agent 约束

### 3.1 PR Review 清单（必须检查）

#### 代码实现审查

- [ ] 功能实现与 PRD 描述一致
- [ ] 无明显的 bug 或边界条件遗漏
- [ ] 代码可读性和命名规范
- [ ] 无安全风险（硬编码 secret、SQL 注入等）

#### 测试文件审查

- [ ] 测试文件与实现文件在同一 PR 中
- [ ] 测试文件存在：`find -name "*.test.ts" | grep <EpicName>`
- [ ] `npx jest <EpicName> --no-coverage` 在 CI 中通过
- [ ] 测试用例覆盖核心路径（不仅仅是 happy path）

#### 覆盖率审查（仅 Epic 3 相关）

- [ ] 覆盖率报告存在（`--coverage` 输出）
- [ ] 覆盖率达标（见 2.1 DoD）
- [ ] 覆盖率报告截图保存在 PR 评论中

#### E2E 测试审查（仅 Epic 4 相关）

- [ ] 测试文件在 `vibex-fronted/tests/e2e/canvas/` 目录
- [ ] 选择器使用 `data-testid` 或 ARIA 属性
- [ ] 测试场景覆盖 PRD 描述的交互
- [ ] 3 次连续运行稳定性确认

### 3.2 Review 决策

| 结论 | 条件 | 后续动作 |
|-----|------|---------|
| **LGTM** | 所有清单项通过 | 合并 PR |
| **Request Changes** | DoD 测试要求未满足 | 标注缺失项，打回 dev |
| **Request Changes** | 测试 flaky 或不稳定 | 要求修复后再 review |
| **Needs Info** | PR 描述不完整 | 要求补充验证信息 |

### 3.3 审查原则

- **原则 1**: 测试文件缺失 = 直接驳回，不需要详细 review
- **原则 2**: 覆盖率不达标 = 直接驳回，不需要详细 review
- **原则 3**: E2E 选择器不稳定 = 要求修复，不允许合入
- **原则 4**: Review 意见必须具体，包含修复建议

### 3.4 禁止事项

| 禁止行为 | 原因 |
|---------|------|
| 跳过测试文件检查 | 破坏 DoD 约束 |
| 通过有 flaky 的 E2E 测试 | 影响 CI 可靠性 |
| 降低覆盖率要求 | 违反项目目标 |
| 使用模糊的 review 意见 | dev 无法修复 |

---

## 4. Tester Agent 约束

### 4.1 收到任务后的前置检查（强制执行）

> **前置检查是 DoD 约束生效的第一道防线，必须严格执行。**

#### 步骤 1: 读取任务描述（0.5min）

```bash
# 读取 PRD 相关章节
cat /root/.openclaw/vibex/docs/<project>/prd.md
```

#### 步骤 2: 快速运行 jest 测试（2min）

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 单个 Epic 测试
npx jest <EpicName> --no-coverage --passWithNoTests

# 或使用 find 定位测试文件
find . -name "*<EpicName>*.test.ts" -not -path "*/node_modules/*" | head -5
```

#### 步骤 3: 决策分支

| 检查结果 | 决策 | 动作 |
|---------|------|------|
| 测试通过 ✅ | 继续 | 执行完整测试 |
| 测试失败 ❌ | **直接驳回** | Slack: "❌ 驳回: jest 测试失败，请先修复" |
| 测试文件缺失 ⚠️ | **直接驳回** | Slack: "❌ 驳回: 测试文件未提交，请先补充" |
| 有警告但核心通过 ⚠️ | 继续 | 记录警告，完成完整测试 |

**驳回模板（Slack）**:
```
❌ Epic <N> 测试驳回

**驳回原因**: <jest 失败原因 / 测试文件缺失>
**Epic**: <name>
**检查命令**: `npx jest <EpicName> --no-coverage`
**错误信息**:
```
<错误输出>
```
**建议**: <修复建议>

---
⚠️ DoD 约束: 测试文件必须与实现文件同步提交
```

### 4.2 完整测试流程

#### 单元测试（必须执行）

```bash
# 覆盖率检查（Epic 3 相关）
npx jest <StoreName> --coverage --coverageReporters=text

# 完整测试套件（如果项目有多个文件）
npx jest --testPathPattern="<EpicName>" --coverage
```

#### E2E 测试（Epic 4 相关）

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 启动开发服务器（后台）
npm run dev &
sleep 10

# 运行 E2E 测试
npx playwright test canvas/<test-file>.spec.ts --reporter=list

# 关闭开发服务器
pkill -f "next dev"
```

#### 覆盖率报告

```bash
# 生成覆盖率报告
npx jest --coverage --coverageReporters=lcov --coverageReporters=text

# 截图保存覆盖率（Epic 3）
# 保存输出到 docs/<project>/coverage-report-<date>.txt
```

### 4.3 测试通过报告模板

```markdown
✅ Epic <N> 测试通过

**Epic**: <name>
**Tester**: <agent-name>
**测试时间**: <YYYY-MM-DD HH:MM>

### 测试结果

| 测试类型 | 结果 | 覆盖率 |
|---------|------|--------|
| 单元测试 | ✅ | <cov>% |
| E2E 测试 | ✅ | N/A |

### 测试文件
- `<file1>.test.ts`
- `<file2>.spec.ts`

### 验证命令
\`\`\`bash
npx jest <EpicName> --no-coverage
npx playwright test canvas/<test-file>.spec.ts
\`\`\`

---
*DoD 约束已验证: 测试文件与实现文件同步提交，测试通过*
```

### 4.4 早期介入流程（P2+ 功能）

#### 介入时机

- PM/Coord 派发 P2+ 功能时，CC tester
- Analyst 完成需求分析后，tester 参与 plan-eng-review

#### 介入内容

1. 阅读 Epic 需求文档（PRD）
2. 评估测试覆盖可行性
3. 设计初步测试用例
4. 在 Epic 文档的 Testing Strategy 章节记录测试计划
5. 提出测试覆盖建议（如边界条件、异常场景）

#### 介入记录

```markdown
## Testing Strategy（Tester 介入）

### 测试用例初稿
| ID | 用例描述 | 预期结果 | 测试类型 |
|----|---------|---------|---------|
| T1 | <描述> | <结果> | 单元/E2E |
| T2 | ... | ... | ... |

### 风险评估
- <风险1>: <缓解措施>
- <风险2>: <缓解措施>

### 介入时间
- <YYYY-MM-DD HH:MM>
- <Tester name>
```

### 4.5 禁止事项

| 禁止行为 | 原因 |
|---------|------|
| 跳过前置检查直接完整测试 | 浪费时间，可能测到不可用的代码 |
| 在测试失败时仍然完成测试 | 破坏数据准确性 |
| 不记录驳回原因 | dev 无法修复 |
| 修改 dev 代码 | tester 只负责测试，不改实现 |
| 泄露测试中发现的问题给外部 | 仅在 Slack/team-tasks 内沟通 |

---

## 5. 覆盖率目标（汇总）

| 范围 | 目标 | 验收命令 |
|-----|------|---------|
| contextStore | ≥80% | `npx jest contextSlice --coverage` |
| uiStore | ≥80% | `npx jest uiStore --coverage` |
| flowStore | ≥80% | `npx jest flowStore --coverage` |
| componentStore | ≥80% | `npx jest componentStore --coverage` |
| sessionStore | ≥70% | `npx jest sessionStore --coverage` |
| authStore | ≥80% | `npx jest authStore --coverage` |
| Canvas E2E 核心交互 | ≥80% | `npx playwright test canvas/` |

---

## 6. 本项目专用快捷命令

```bash
# === Dev: 运行单个 Epic 测试 ===
npx jest <EpicName> --no-coverage

# === Dev: 运行 Store 覆盖率 ===
npx jest <StoreName> --coverage --coverageReporters=text

# === Dev: 运行所有 Store 测试 ===
npx jest --testPathPattern="stores" --coverage

# === Tester: 前置检查 ===
npx jest <EpicName> --no-coverage --passWithNoTests

# === Tester: Canvas E2E ===
cd /root/.openclaw/vibex/vibex-fronted && \
  npm run dev & sleep 10 && \
  npx playwright test canvas/ --reporter=list && \
  pkill -f "next dev"

# === Tester: 覆盖率报告 ===
npx jest --coverage --coverageReporters=lcov --coverageReporters=text > \
  docs/vibex-tester-proposals-20260402_201318/coverage-report-$(date +%Y%m%d).txt

# === Reviewer: 快速检查测试文件 ===
find /root/.openclaw/vibex/vibex-fronted -name "*.test.ts" | grep -E "<EpicName>|stores" | head -20
```

---

## 7. 本项目任务派发规则（coord 侧）

- 只派发 `status: ready` 的任务
- P2+ 功能派发时 CC `@tester`
- 修复完成后 Slack 消息必须包含 "✅ 已修复，请重新测试"
