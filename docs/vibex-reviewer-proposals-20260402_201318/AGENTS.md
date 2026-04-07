# AGENTS.md: Vibex Reviewer 提案落地

**项目**: vibex-reviewer-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### CI 门禁
- ✅ PR 必须通过 tsc + eslint + npm audit
- ❌ TS error / ESLint error / npm audit moderate+ 不得 merge

### CHANGELOG
- ✅ 安全漏洞记录到 CHANGELOG
- ✅ 每次 sprint 审查间接依赖

### TS 严格模式
- ✅ 新代码禁止 `as any`
- ❌ 已有 `as any` 需替换或注释说明

---

## Reviewer 约束

- [ ] CI 门禁配置正确
- [ ] CHANGELOG 格式规范
- [ ] reports/INDEX.md 索引完整
- ❌ CI 失败不得 approve

---

## Tester 约束

- [ ] CI/CD pipeline 测试通过
- [ ] commit-msg hook 验证
- [ ] 覆盖率 CI 输出正确
