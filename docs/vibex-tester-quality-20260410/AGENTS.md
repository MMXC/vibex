# AGENTS.md: VibeX Tester Quality 2026-04-10

> **项目**: vibex-tester-quality-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev** | @dev | 配置修复 + waitForTimeout 替换 |
| **Tester** | @tester | 测试验证 + CI 确认 |
| **Architect** | @architect | 架构设计 |

---

## 2. Dev Agent 职责

### 2.1 提交规范

```bash
git commit -m "fix(test): S1.1 delete duplicate playwright.config.ts"
git commit -m "fix(test): S1.2 unify expect timeout to 30s"
git commit -m "fix(test): S2.1 fix stability.spec.ts path to tests/e2e/"
git commit -m "fix(test): S3.1 remove grepInvert from playwright config"
git commit -m "fix(test): S4.1 migrate useAIController.test to Vitest vi.fn()"
git commit -m "fix(test): S5.1 replace waitForTimeout in conflict-resolution"
git commit -m "fix(test): S5.2 replace waitForTimeout in conflict-dialog"
git commit -m "fix(test): S5.3 replace waitForTimeout in auto-save"
```

### 2.2 禁止事项

| 禁止 | 正确方式 |
|------|---------|
| `tests/e2e/playwright.config.ts` | 单一根配置 |
| `waitForTimeout(n)` | 智能等待 |
| `grepInvert` | 全部测试运行 |
| Jest 语法 | Vitest `vi.*` |
| `./e2e/` 路径 | `tests/e2e/` |

---

## 3. Tester Agent 职责

### 3.1 验收测试

```bash
# 配置验证
pnpm playwright test --list | grep "expect timeout"
# 应显示: 30000ms

# stability.spec.ts
pnpm playwright test tests/e2e/stability.spec.ts
# 应 PASS（非永远 PASS）

# @ci-blocking 测试
pnpm playwright test | grep "@ci-blocking"
# 应显示 35+ 测试运行

# waitForTimeout 残留
grep -rn "waitForTimeout" tests/e2e/ | wc -l
# 应为 0
```

### 3.2 CI 验证

```yaml
# .github/workflows/ci.yml
- name: Playwright E2E
  run: pnpm playwright test
  # 注意：无 grepInvert，所有测试运行
```

---

## 4. Definition of Done

- [ ] Playwright 配置唯一（无 tests/e2e/playwright.config.ts）
- [ ] expect timeout 统一 30000ms
- [ ] 无 grepInvert 配置
- [ ] stability.spec.ts 检查真实路径
- [ ] waitForTimeout 残留 0 处
- [ ] Vitest 测试全部通过
- [ ] CI 无测试跳过

---

## 5. 验收标准

| 检查项 | 命令 | 目标 |
|--------|------|------|
| Playwright 配置唯一 | `find . -name "playwright.config.ts" \| wc -l` | 1 |
| expect timeout | `grep "timeout.*30000" playwright.config.ts` | 有结果 |
| 无 grepInvert | `grep "grepInvert" playwright.config.ts` | 无结果 |
| stability.spec 路径 | `grep "./e2e/" tests/e2e/stability.spec.ts` | 无结果 |
| waitForTimeout | `grep -rn "waitForTimeout" tests/e2e/ \| wc -l` | 0 |
| Vitest | `pnpm vitest run` | 全部通过 |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
