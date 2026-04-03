---
template_version: "1.0"
report_type: code-review
title: "Code Review Report"
title_zh: "代码审查报告"
project: ""
reviewer: ""
review_time: ""
commit: ""
status: ""
tags:
  - security
  - performance
  - code-quality
---

# {{ title }}

**项目 / Project**: {{ project }}
**审查人 / Reviewer**: {{ reviewer }}
**审查时间 / Review Time**: {{ review_time }}
**Commit**: {{ commit }}

---

## 1. Summary / 整体评估

**结论 / Conclusion**: 

> ✅ PASSED / ❌ FAILED / ⚠️ NEEDS_REVIEW

{简要总结 / Brief summary}

---

## 2. Security Issues / 安全问题

### 2.1 安全检查结果 / Security Check Results

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| SQL 注入 / SQL Injection | ✅ PASS / ❌ FAIL | 说明 / description |
| XSS 跨站脚本 / XSS | ✅ PASS / ❌ FAIL | 说明 / description |
| CSRF 攻击 / CSRF | ✅ PASS / ❌ FAIL | 说明 / description |
| 敏感信息泄露 / Sensitive Data Leak | ✅ PASS / ❌ FAIL | 说明 / description |
| 认证授权 / Auth & Authorization | ✅ PASS / ❌ FAIL | 说明 / description |
| 依赖漏洞 / Dependency Vulnerabilities | ✅ PASS / ❌ FAIL | 说明 / description |

### 2.2 风险项 / Risk Items

{如有风险项，详细描述 / If there are risks, describe in detail}

| 风险等级 / Risk Level | 问题描述 / Issue | 影响范围 / Impact | 建议 / Recommendation |
|----------------------|------------------|-------------------|----------------------|
| CRITICAL / HIGH / MEDIUM / LOW | 问题描述 | 影响范围 | 修复建议 |

---

## 3. Performance Issues / 性能问题

### 3.1 性能检查结果 / Performance Check Results

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| N+1 查询 / N+1 Queries | ✅ PASS / ❌ FAIL | 说明 / description |
| 数据库索引 / DB Indexes | ✅ PASS / ❌ FAIL | 说明 / description |
| 缓存策略 / Cache Strategy | ✅ PASS / ❌ FAIL | 说明 / description |
| API 响应时间 / API Response Time | ✅ PASS / ❌ FAIL | 说明 / description |
| 前端渲染性能 / Frontend Render | ✅ PASS / ❌ FAIL | 说明 / description |

### 3.2 性能瓶颈 / Performance Bottlenecks

{如有性能问题，详细描述 / If there are performance issues, describe in detail}

---

## 4. Code Quality / 代码规范

### 4.1 规范检查 / Code Standards

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 命名规范 / Naming Conventions | ✅ PASS / ❌ FAIL | 说明 / description |
| 类型安全 / Type Safety | ✅ PASS / ❌ FAIL | 说明 / description |
| 代码复杂度 / Code Complexity | ✅ PASS / ❌ FAIL | 说明 / description |
| 注释完整 / Documentation | ✅ PASS / ❌ FAIL | 说明 / description |
| 错误处理 / Error Handling | ✅ PASS / ❌ FAIL | 说明 / description |
| 测试覆盖 / Test Coverage | ✅ PASS / ❌ FAIL | 说明 / description |

### 4.2 改进建议 / Improvement Suggestions

{如有改进项 / If there are improvements}

| 优先级 / Priority | 位置 / Location | 建议 / Suggestion |
|-------------------|-----------------|-------------------|
| HIGH / MEDIUM / LOW | 文件路径 | 改进建议 |

---

## 5. Test Coverage / 测试覆盖

| 模块 / Module | 覆盖率 / Coverage | 状态 / Status |
|---------------|-------------------|---------------|
| Backend API | XX% | ✅ PASS / ❌ FAIL |
| Frontend Components | XX% | ✅ PASS / ❌ FAIL |
| Utils / Helpers | XX% | ✅ PASS / ❌ FAIL |

---

## 6. Files Reviewed / 变更文件

| 文件 / File | 变更类型 / Change Type | 风险等级 / Risk Level |
|-------------|----------------------|----------------------|
| `src/api.ts` | 修改 / Modified | Low / Medium / High / Critical |
| `src/utils.ts` | 新增 / Added | Low / Medium / High / Critical |
| `src/components/` | 删除 / Deleted | Low / Medium / High / Critical |

---

## 7. Conclusion / 结论

| 维度 / Dimension | 结论 / Conclusion |
|------------------|-------------------|
| 安全性 / Security | ✅ PASSED / ❌ FAILED |
| 性能 / Performance | ✅ PASSED / ❌ FAILED |
| 代码规范 / Code Quality | ✅ PASSED / ❌ FAILED |
| 测试覆盖 / Test Coverage | ✅ PASSED / ❌ FAILED |

**最终结论 / Final Conclusion**: 

> ✅ **PASSED - 可以合并 / Can Merge**
> 
> ❌ **FAILED - 需要修复 / Needs Fix**
> 
> ⚠️ **NEEDS_REVIEW - 需要进一步审查 / Needs Further Review**

---

## 8. Reviewer Info / 审查人信息

**审查人 / Reviewer**: {{ reviewer }}

**签名 / Signature**: {{ review_time }}

---

*Template: vibex-report-template v1.0*
*Generated: {{ review_time }}*
