# AGENTS.md: VibeX Quality Governance 2026-04-10

> **项目**: vibex-proposals-summary-vibex-proposals-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev-A** | @dev | P0 修复（E1-E4）+ Vitest 迁移 |
| **Dev-B** | @dev | Feature 开发（E7）+ DX 改进（E6）|
| **Reviewer** | @reviewer | 安全审查 + 代码审查 |
| **Tester** | @tester | E2E 测试 + CI 验证 |
| **Architect** | @architect | 架构设计 + 风险评估 |

---

## 2. Sprint 分配

| Sprint | Dev-A | Dev-B |
|--------|-------|-------|
| Sprint 0 | E1 (P0-1) | — |
| Sprint 1 | E2 (P0-2, P0-3, P0-7) | — |
| Sprint 2 | E3 (P0-4, P0-6, P1-1, P1-7) | — |
| Sprint 3 | E4 (P0-5, P0-11, P0-12, P0-13) | — |
| Sprint 4 | E5 (P0-8, P1-16) | — |
| Sprint 5 | — | E7 (template + onboarding) |
| Sprint 6-9 | E6 (P1 issues) | E6 (P1 issues) |
| Sprint 10-18 | E8 (P2 features) | E8 (P2 features) |
| Sprint 19-27 | E9 (P3 features) | E9 (P3 features) |

---

## 3. Dev Agent 职责

### 3.1 提交规范

```bash
# 格式: <type>(<scope>): <ticket> <description>
# 示例:
git commit -m "fix(P0-1): use env var for Slack token"
git commit -m "fix(P0-2): add AbortController to streaming"
git commit -m "fix(P0-3): add Workers guard for PrismaClient"
git commit -m "fix(P0-4): remove as any from 9 files"
git commit -m "fix(P0-6): unify sessionId→generationId in Zod schema"
git commit -m "fix(P0-7): add SSE timeout control"
git commit -m "fix(P0-8): migrate from Jest to Vitest"
git commit -m "fix(P0-11): unify Playwright config timeout"
git commit -m "fix(P0-12): fix stability.spec.ts path check"
git commit -m "fix(P0-13): remove grepInvert for @ci-blocking"
```

### 3.2 禁止事项

| 禁止模式 | 正确替代 |
|---------|---------|
| `as any` | `unknown` + 类型守卫，或具体类型 |
| `catch (error) {}` | `catch (error) { if (error instanceof AppError) throw error; }` |
| `waitForTimeout(n)` | Playwright 智能等待 |
| `console.log` | `console.error` / structured logger |
| 硬编码 token | `process.env.XXX` |
| `localStorage` token | `sessionStorage` |
| 双框架测试 | 统一 Vitest |

---

## 4. Reviewer Agent 职责

### 4.1 P0 PR 审查清单（强制）

```bash
# S-01: Token 安全
grep -rn "xoxb\|slack\|token.*=.*'" scripts/ | grep -v ".env\|process.env"
# 应无结果

# S-02: 类型安全
pnpm exec tsc --noEmit
# 应 0 errors

# S-03: 无 `as any`
grep -rn "as any" src/ | wc -l
# 应为 0

# S-04: streaming 有 AbortController
grep -rn "AbortController\|signal" services/llm.ts
# 应有结果

# S-05: PrismaClient 有 Workers 守卫
grep -rn "IS_CF_WORKERS\|caches" lib/prisma.ts
# 应有结果

# S-06: 无 grepInvert
grep -rn "grepInvert" playwright.config.ts
# 应无结果
```

### 4.2 驳回条件

1. PR 引入新的 `as any`
2. PR 引入硬编码 token
3. P0 修复无对应测试
4. Streaming 路由无超时控制
5. Playwright 配置有 `grepInvert`

---

## 5. Tester Agent 职责

### 5.1 E2E 测试用例

| 用例 | 描述 | 验收 |
|------|------|------|
| UC-01 | streaming API 无 ReferenceError | 日志无 "variable is not defined" |
| UC-02 | wrangler deploy 成功 | 部署日志无 PrismaClient 错误 |
| UC-03 | flowId 有效 | `page.evaluate(() => __FLOW_ID__)` 匹配 UUID |
| UC-04 | Vitest 全部通过 | `pnpm vitest run` → 0 failures |
| UC-05 | Playwright 无跳过测试 | `grep "@ci-blocking" results.json` → 全部运行 |
| UC-06 | template + onboarding | 见 E7 详细测试 |

### 5.2 CI 验证

```yaml
# .github/workflows/ci.yml
- name: Type Check
  run: pnpm exec tsc --noEmit

- name: Vitest
  run: pnpm vitest run --coverage

- name: Playwright
  run: pnpm playwright test
  # 注意: 不再有 grepInvert，所有测试运行
```

---

## 6. Definition of Done

### Phase1 DoD（P0 全部完成）

- [ ] E1: task_manager 无硬编码 token
- [ ] E2: streaming API 无崩溃，deploy 成功
- [ ] E3: `tsc --noEmit` → 0 errors，无 `as any`
- [ ] E4: Playwright 配置统一，无测试跳过
- [ ] E5: Vitest 替代 Jest，全部测试通过

### Phase2 DoD

- [ ] E6: DX 问题全部修复
- [ ] E7: 模板库 + 引导流程上线

### Phase3 DoD

- [ ] E8: P2 功能交付
- [ ] E9: P3 功能交付

---

## 7. 进度追踪

**每周检查**:
```bash
# Phase1 进度
ls docs/vibex-proposals-summary-vibex-proposals-20260410/specs/

# P0 完成率
grep -rn "✅" docs/vibex-proposals-summary-vibex-proposals-20260410/ | wc -l
```

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
