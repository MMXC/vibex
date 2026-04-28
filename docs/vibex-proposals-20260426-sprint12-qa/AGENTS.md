# VibeX Sprint 12 QA — AGENTS.md (开发约束)

**Agent**: architect
**Date**: 2026-04-28
**Project**: vibex-proposals-20260426-sprint12-qa

---

## 1. 角色职责

| Role | 职责 |
|------|------|
| Dev | 修复 QA 发现的问题（E10 UI 浏览器修复） |
| Tester | 运行 ~98 个单元测试 + E2E，验证 UI（gstack /qa） |
| Reviewer | 验证测试通过 + CHANGELOG 更新 |

---

## 2. Epic 技术约束

### E6: Prompts 安全 AST 扫描

**Dev 约束**:
- `walkNode()` 必须覆盖所有 Babel AST 节点类型
- innerHTML/outerHTML 检测不得遗漏
- false-positive-samples.ts 样本必须覆盖已知边界情况

**Tester 约束**:
- 验证 `npx jest --testPathPatterns=codeAnalyzer --no-coverage` → 21/21 passed
- 验证性能 < 50ms/5000行
- 验证 false positive = 0

**Reviewer 约束**:
- 检查 AST walker 无遗漏节点类型
- 检查 CHANGELOG 包含 E6 entry

---

### E7: MCP Server 可观测性

**Dev 约束**:
- `sanitize()` 必须过滤 8 种敏感 key：password, token, secret, key, apiKey, authorization, __proto__, constructor
- `logToolCall()` 必须包含 tool/duration/success 字段
- serverVersion 从 package.json 动态读取，不得硬编码

**Tester 约束**:
- 验证 logger.test.ts 12 tests + health.test.ts 通过
- 验证 sanitize() 对 8 种 key 的过滤
- 验证 MCP tsc --noEmit exit 0

**Reviewer 约束**:
- 检查敏感字段过滤完整性
- 检查 CHANGELOG 包含 E7 entry

---

### E8: Canvas 协作冲突解决

**Dev 约束**:
- ConflictDialog 必须有 `data-testid="conflict-dialog"`
- 三选项（keep-local/keep-remote/merge）必须全部渲染
- Firebase lock timeout = 60s，不得修改
- LWW auto-adopt 路径必须正确

**Tester 约束**:
- 验证 conflictStore 12 tests + ConflictDialog 28 tests
- 验证 E2E conflict-resolution.spec.ts 通过
- 验证 Firebase unconfigured → graceful fallback

**Reviewer 约束**:
- check merge 策略 keep-local 为 placeholder（设计已知）
- 检查 ConflictDialog data-testid
- 检查 CHANGELOG 包含 E8 entry

---

### E9: AI 设计评审

**Dev 约束**:
- designCompliance 必须检测硬编码 hex/rgba 颜色
- a11yChecker 必须支持 WCAG 2.1 AA 级别检查
- componentReuse similarityScore 阈值必须可配置

**Tester 约束**:
- 验证 40 个单元测试通过（11+12+17）
- 验证 review_design MCP tool schema 正确

**Reviewer 约束**:
- **注意**: MCP tool 端到端需真实 MCP server environment，当前只验证 schema
- 检查 CHANGELOG 包含 E9 entry

---

### E10: 设计稿代码生成

**Dev 约束**:
- CodeGenPanel 必须有 `data-testid="codegen-panel"`
- framework selector 必须有 `data-testid="codegen-framework-selector"`
- >200 节点时必须显示警告（不阻断，但必须可见）
- `packageAsZip()` 必须生成真实 ZIP 文件（使用 JSZip）

**Tester 约束**:
- 验证 25 个 codeGenerator tests + tsc --noEmit
- **必须浏览器验证**（gstack /qa）:
  - CodeGenPanel 在 DDSCanvasPage 正确渲染
  - framework selector 可切换（React → Vue → Solid）
  - >200 节点时警告显示
  - ZIP 下载触发并生成文件

**Reviewer 约束**:
- 检查 TS null check（tabs type annotation）通过
- 检查 CHANGELOG 包含 E10 entry

---

## 3. 已知风险与处置

| Risk | 级别 | 处置 |
|------|------|------|
| E6 后端单元测试缺失 | 🟡 低 | 逻辑主要在前端，可接受 |
| E8 merge 策略 keep-local 占位 | 🟡 低 | 设计已知，E2E smoke 不报错即可 |
| E9 MCP tool 需真实 MCP env | 🟡 中 | 条件通过，配置后验证 |
| E10 UI 需浏览器验证 | 🟡 中 | **gstack /qa 验证 CodeGenPanel** |

---

## 4. 浏览器验证检查单（E10）

gstack `/qa` 验证步骤：

1. 打开 `/design/dds-canvas?projectId=test`
2. 打开 CodeGenPanel
3. **验证项**:
   - [ ] `data-testid="codegen-panel"` 可见
   - [ ] `data-testid="codegen-framework-selector"` 可见
   - [ ] 切换 React → Vue → Solid 选择器工作
   - [ ] 输入 >200 节点触发警告显示
   - [ ] 点击下载按钮触发 JSZip 打包

---

## 5. 测试稳定性规范

### 单元测试
- E6-E10 使用 Jest，测试命令见 IMPLEMENTATION_PLAN.md
- 不得跳过任何测试用例

### E2E 测试
- `conflict-resolution.spec.ts` 必须通过
- 使用 `waitForLoadState('networkidle')` 保证稳定性

### UI 验证
- E10 必须用 gstack `/qa` 真实浏览器验证
- 不得仅依赖单元测试通过就认为 UI 正常

---

## 6. 禁止事项

| 规则 | 说明 |
|------|------|
| 禁止 AST walker 遗漏节点类型 | E6: 必须覆盖所有 Babel AST 节点 |
| 禁止 sanitize() 遗漏敏感 key | E7: 8 种 key 必须全部过滤 |
| 禁止 Firebase lock timeout 修改 | E8: 60s 固定 |
| 禁止 E10 UI 仅靠单元测试 | E10: 必须浏览器验证 CodeGenPanel |
| 禁止 merge 策略替代 keep-local | E8: keep-local 占位是设计已知，不修改 |
