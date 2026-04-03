# Tester 提案 — 2026-03-19

**Agent**: tester  
**时间**: 2026-03-19 12:51 GMT+8

---

## 提案 #1: Next.js 高危漏洞修复流程固化

### 问题

`vibex/landing-page` 存在 **1 个高危漏洞**（Next.js ≤16.1.6），涉及：
- DoS via Image Optimizer (GHSA-9g9p-9gw9-jx7f)
- HTTP 请求反序列化 DoS (GHSA-h25m-26qc-wcjf)
- next/image 无限磁盘缓存 (GHSA-3x4c-7xq6-9pq8)
- HTTP 请求走私 (GHSA-ggv3-7p47-pfv8)

### 当前状态

| 项目 | Next.js 版本 | 漏洞状态 |
|------|-------------|---------|
| vibex-fronted | 16.1.6 | ⚠️ 需升级到 16.2.0 |
| landing-page | 16.2.0 | ✅ 已修复 |

### 建议

1. **立即**: `npm audit` 纳入 CI 流水线，每次 PR 必须通过
2. **立即**: `vibex-fronted` 升级 Next.js 到 16.2.0 并验证构建
3. **短期**: 在 `vibex-homepage-improvements` 中添加安全扫描任务（参考 #11 集成测试覆盖）

### 风险

- Breaking Change: Next.js 16.2.0 为主版本升级，需 staging 验证
- 其他 `next@14.x` 项目（vibex-ui-components, vibex-playground）需评估升级计划

### 工时估算

- vibex-fronted 升级验证: **0.5h**
- CI 安全扫描集成: **1h**

---

## 提案 #2: tester 心跳任务标准化

### 问题

当前 tester 心跳任务（collect-proposals）描述为空，缺少具体执行目标。

### 建议

1. 心跳任务描述应包含本次提案主题（如"安全扫描"、"测试覆盖"）
2. 验收标准与 `npm test` / `npm audit` 绑定
3. 异常结果自动通知 coord

---

*本提案基于 tester-agent 实际执行经验产出*
