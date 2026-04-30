# Sprint 19 经验沉淀 — E19-1 Design Review 真实 MCP 集成

## 项目信息
- **项目**: vibex-proposals-20260430-sprint19
- **时间**: 2026-04-30 ~ 2026-05-01
- **Epic**: E19-1 — Design Review mock → 真实 API
- **Epic 数量**: 1 (E19-1，含 4 个 Story)

## 核心经验

### 1. API Route 内联 vs MCP stdio 决策
- **最终方案**: API Route 内联核心逻辑（内联 design compliance / a11y / component reuse checker）
- **排除方案**: MCP stdio transport（每次请求多一个进程，性能差）
- **经验**: 后端 checker 函数可直接 import 到 API Route，无需通过 MCP 协议绕路
- **适用场景**: 当前端需要实时调用后端工具逻辑、MCP server 部署复杂时，API Route 内联是更轻量的方案

### 2. Mock 清除的验收标准
- S2 完成标准：`grep -r "setTimeout.*1500\|// Mock\|simulated" src/hooks/useDesignReview` → 0 matches
- 这个标准可量化、可自动化验证，后续 Sprint 可复用
- 建议：Mock 清除统一用 grep 验收标准，写入 DoD

### 3. 适配层设计
- `DesignReviewReport`（MCP API 返回）→ `DesignReviewResult`（前端 hook 使用）需要适配层
- 适配层放在 hook 内部或单独 utility，不污染组件代码
- **教训**: S2 初期规划时漏了适配层说明，S3 才补

### 4. 单元测试策略
- 每个 Story 至少覆盖正向路径 + 错误路径
- E19-1-S2: 9 个测试覆盖 AS2.1–AS2.6（真实 API 调用、响应映射、类型校验、错误状态）
- ReviewReportPanel: 10 个测试覆盖四状态（loading/error/empty/success）
- **经验**: 测试与 DoD 对齐，按 acceptance criteria 逐条写测试用例

### 5. 优雅降级四状态
- ReviewReportPanel 四状态：loading / error / empty / success
- Error 文案分层：网络错误 / 服务端错误 / 400 bad request
- 重试按钮只在 error 状态显示
- **经验**: UI 降级设计在 PRD 阶段就要明确四状态的触发条件和文案

### 6. 虚假完成检查清单
```bash
# dev commit 存在
git log --oneline | grep E19-1

# mock 已清除
grep -r "setTimeout.*1500\|// Mock" src/hooks/useDesignReview.ts

# 单元测试通过
npx vitest run src/hooks/__tests__/useDesignReview.test.tsx

# API route 存在
ls src/app/api/mcp/review_design/route.ts
```

## 风险与应对
| 风险 | 应对 |
|------|------|
| API Route 内联导致后端逻辑重复维护 | 核心 checker 函数独立模块，API Route import 使用 |
| E2E 测试依赖真实 API 环境 | TC1-TC4 覆盖真实路径 + 降级路径 |
| ReviewReportPanel 状态边界不清 | 四状态 + Playwright 覆盖 |

## 关键产出物
- `/api/mcp/review_design/route.ts` — API Route 桥接层
- `src/hooks/useDesignReview.ts` — 移除 mock，真实 API 调用
- `src/components/design-review/ReviewReportPanel.tsx` — 四状态优雅降级
- `tests/e2e/design-review.spec.ts` — 4 个 E2E 测试用例
- `src/hooks/__tests__/useDesignReview.test.tsx` — 9 个单元测试

## 可复用模式
1. **Mock → 真实 API 迁移**: 验收标准 = grep 无 mock 字符串
2. **API Route 内联**: 后端工具函数直接 import，无需额外 transport
3. **四状态降级**: loading/error/empty/success 覆盖所有 UI 路径
4. **按 acceptance criteria 写测试**: DoD 每条对应至少 1 个测试
