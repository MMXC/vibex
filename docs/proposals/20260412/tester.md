# Tester 提案 — 2026-04-12

**Agent**: tester
**日期**: 2026-04-12
**项目**: vibex
**仓库**: /root/.openclaw/vibex
**分析视角**: 测试基础设施维护者 + 质量门禁守护者

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| T001 | bug | 测试 Auth Mock 全面失效（15 测试套件 / 94 测试失败） | backend 测试 | P0 |
| T002 | tech-debt | E2E waitForTimeout 87 处需重构为智能等待 | E2E 测试 | P1 |
| T003 | test-gap | flowId E2E 测试缺失 | canvas E2E | P1 |
| T004 | test-gap | JsonTreePreviewModal 无单元测试覆盖 | ComponentTree | P2 |
| T005 | bug | Chat/Router 请求日志泄露 token | 安全/日志 | P1 |

---

## 2. 提案详情

### T001: 测试 Auth Mock 全面失效（P0）

**分析视角**: tester — 测试基础设施维护者

**问题描述**:
vibex-backend 有 15 个测试套件 / 94 个测试失败，全部是 auth mock 相关问题。测试期望 200/400 状态码，但实际返回 401（auth 未通过 mock）。

根因：getAuthUserFromRequest 函数签名在 E4 refactor 后从 1 参数变为 2 参数（增加了 env/JWT_SECRET），但测试文件中仍使用旧的 mock 方式：
```typescript
// 当前测试 mock（失效）
jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockResolvedValue({ id: 'user1' })
}));

// 当前代码（E4 后）
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
// 需要 2 参数：getAuthUserFromRequest(request, env)
```

**影响范围**:
- 15 个测试套件持续失败（auth/logout, messages/route, pages/route, users/route 等）
- CI 门禁失效，无法检测 auth 相关回归
- 影响：全部 5 个 Epic 的 reviewer 无法信任测试结果

**根因**:
E4 auth consolidation (commit c1bb5e17) 修改了 auth 函数签名，但测试 mock 未同步更新。这是典型的"改代码不更新测试"债务。

**方案**:
1. 识别所有 auth mock 失效的测试文件
2. 统一使用 `jest.mock('@/lib/authFromGateway')` 替换旧的 mock
3. 提供标准 mock factory：`mockGetAuthUser(userId: string)`
4. 逐个测试套件修复并验证
5. 添加 auth mock 的 type-safe mock helper 到 `tests/__mocks__/`

**验收标准**:
```bash
# 验收命令
cd vibex-backend && npm test
# 预期：Test Suites: 79 passed, 0 failed
# 预期：Tests: 745 passed, 0 failed
```

**工时估算**: 3h（识别 15 个文件 + 统一 mock pattern + 逐个修复）

---

### T002: E2E waitForTimeout 87 处需重构为智能等待（P1）

**分析视角**: tester — 测试稳定性工程师

**问题描述**:
E2E 测试中有 87 处使用 `waitForTimeout(ms)` 进行硬等待，这会导致：
- 测试运行时间过长（每次等待固定时间）
- 在 CI 环境（低配机器）中更慢，导致超时
- 无法适应不同环境的网络延迟

**影响范围**:
- E2E 测试套件（~87 处硬等待）
- CI 稳定性（超时导致 Flaky）

**方案**:
分批清理（每批 ≤ 10 处）：
1. 用 Playwright 智能等待替代：`page.waitForSelector()` / `page.waitForResponse()`
2. 对 API 测试使用 `expect.poll()` / `page.waitForRequest()`
3. 对 UI 动画使用 `page.waitForLoadState()`
4. 建立 E2E wait pattern guide

**验收标准**:
```bash
grep -rn "waitForTimeout" vibex-fronted/tests/e2e --include="*.ts" | grep -v "stability.spec.ts" | wc -l
# 预期：0
```

**工时估算**: 4h（分 4 批，每批 ≤ 10 处）

---

### T003: flowId E2E 测试缺失（P1）

**分析视角**: tester — 功能验证工程师

**问题描述**:
flowId matching 功能（Epic flowId匹配修复）在单元测试层面已验证（35/35 PASS），但缺少 E2E 真实浏览器测试。用户在 canvas 中生成组件时，flowId 是否正确匹配 flow 标签无法在端到端层面验证。

**影响范围**:
- canvas generate-components 流程
- ComponentTree 组件分组显示

**方案**:
1. 创建 E2E 测试：`tests/e2e/canvas-flowid-matching.spec.ts`
2. 测试场景：
   - 创建一个 flow（含多个步骤）
   - 在 canvas 中生成组件
   - 验证组件正确归入对应 flow 分组
   - 验证通用组件归入 "Common" 组
3. 使用真实 project API（mock 或 fixture）

**验收标准**:
```bash
npx playwright test e2e/canvas-flowid-matching.spec.ts
# 预期：all passed
```

**工时估算**: 2h

---

### T004: JsonTreePreviewModal 无单元测试覆盖（P2）

**分析视角**: tester — 组件测试工程师

**问题描述**:
c8ffde20 实现了 JsonTreePreviewModal（JSON 预览功能），但没有对应的单元测试。当前只有关于 ComponentTree 逻辑的测试，没有测试 JsonTreePreviewModal 组件本身的渲染和交互。

**影响范围**:
- JsonTreePreviewModal 组件
- JsonRenderPreview 集成

**方案**:
添加组件测试：
```typescript
// tests/canvas/JsonTreePreviewModal.test.tsx
test('renders JSON preview for selected node')
test('shows empty state when no node selected')
test('escapes HTML in JSON values')
```

**验收标准**:
```bash
npx jest JsonTreePreviewModal --coverage
# 预期：branch coverage ≥ 80%
```

**工时估算**: 1h

---

### T005: Chat/Router 请求日志泄露 token（P1）

**分析视角**: tester — 安全测试工程师

**问题描述**:
在测试 auth 相关功能时，发现 `/api/chat` 和 `/api/pages` 等路由在处理请求时，会打印包含 Bearer token 的日志（通过 `safeError` 或 console.error）。虽然 `safeError` 做了脱敏处理，但 `log-sanitizer` 的覆盖范围有限。

**影响范围**:
- `vibex-backend/src/app/api/chat/route.ts`
- `vibex-backend/src/app/api/pages/route.ts`
- 任何直接使用 `console.error(error)` 的路由

**方案**:
1. 扫描所有路由文件中的 `safeError` 调用覆盖情况
2. 确保所有 error 日志路径都经过 `safeError` 处理
3. 添加单元测试验证 token 不在日志中泄露
4. 将 `log-sanitizer` 设为 ESLint 要求（不得绕过）

**验收标准**:
```bash
# 测试：调用 chat API 并捕获日志，验证无 Bearer token 出现
grep -rn "console\." vibex-backend/src/app/api --include="*.ts" | grep -v "safeError\|log-sanitizer"
# 预期：0 结果
```

**工时估算**: 1.5h

---

## 3. 总结

| 提案 | 优先级 | 工时 | 影响 |
|------|--------|------|------|
| T001 Auth Mock 失效 | P0 | 3h | 94 tests 恢复 |
| T002 waitForTimeout | P1 | 4h | 测试速度提升 |
| T003 flowId E2E | P1 | 2h | 真实场景覆盖 |
| T004 JsonTreeModal 测试 | P2 | 1h | 组件覆盖率 |
| T005 Token 日志泄露 | P1 | 1.5h | 安全合规 |

**总计**: 11.5h（可并行了 tester 2 人）
