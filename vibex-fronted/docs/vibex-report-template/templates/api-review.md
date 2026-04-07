---
template_version: "1.0"
report_type: api-review
title: "API Review Report"
title_zh: "API 审查报告"
project: ""
reviewer: ""
review_time: ""
commit: ""
status: ""
tags:
  - api
  - rest
  - security
  - documentation
---

# {{ title }}

**项目 / Project**: {{ project }}
**审查人 / Reviewer**: {{ reviewer }}
**审查时间 / Review Time**: {{ review_time }}
**API 版本 / API Version**: {{ api_version }}
**Commit**: {{ commit }}

---

## 1. Summary / 整体评估

**结论 / Conclusion**: 

> ✅ PASSED / ❌ FAILED / ⚠️ NEEDS_REVIEW

{简要总结 / Brief summary}

---

## 2. API Design / API 设计

### 2.1 RESTful 规范 / RESTful Compliance

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| URL 命名规范 / URL Naming | ✅ PASS / ❌ FAIL | 说明 / description |
| HTTP 方法正确 / HTTP Methods | ✅ PASS / ❌ FAIL | 说明 / description |
| 状态码使用 / Status Codes | ✅ PASS / ❌ FAIL | 说明 / description |
| 版本控制 / Versioning | ✅ PASS / ❌ FAIL | 说明 / description |

### 2.2 接口列表 / Endpoints

| 方法 / Method | 路径 / Path | 功能 / Function | 状态 / Status |
|---------------|-------------|------------------|---------------|
| GET | `/api/users` | 获取用户列表 | ✅ / ❌ |
| POST | `/api/users` | 创建用户 | ✅ / ❌ |
| GET | `/api/users/:id` | 获取用户详情 | ✅ / ❌ |
| PUT | `/api/users/:id` | 更新用户 | ✅ / ❌ |
| DELETE | `/api/users/:id` | 删除用户 | ✅ / ❌ |

---

## 3. Security / 安全性

### 3.1 认证授权 / Authentication & Authorization

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 认证机制 / Authentication | ✅ PASS / ❌ FAIL | 说明 / description |
| 授权检查 / Authorization | ✅ PASS / ❌ FAIL | 说明 / description |
| API 密钥管理 / API Key Management | ✅ PASS / ❌ FAIL | 说明 / description |
| 敏感数据保护 / Sensitive Data Protection | ✅ PASS / ❌ FAIL | 说明 / description |

### 3.2 输入验证 / Input Validation

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 参数校验 / Parameter Validation | ✅ PASS / ❌ FAIL | 说明 / description |
| SQL 注入防护 / SQL Injection Prevention | ✅ PASS / ❌ FAIL | 说明 / description |
| XSS 防护 / XSS Prevention | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 4. Performance / 性能

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 响应时间 / Response Time | ✅ PASS / ❌ FAIL | 说明 / description |
| 速率限制 / Rate Limiting | ✅ PASS / ❌ FAIL | 说明 / description |
| 分页支持 / Pagination | ✅ PASS / ❌ FAIL | 说明 / description |
| 缓存策略 / Caching | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 5. Documentation / 文档

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| OpenAPI/Swagger 文档 | ✅ PASS / ❌ FAIL | 说明 / description |
| 请求示例 / Request Examples | ✅ PASS / ❌ FAIL | 说明 / description |
| 响应示例 / Response Examples | ✅ PASS / ❌ FAIL | 说明 / description |
| 错误码说明 / Error Codes | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 6. Error Handling / 错误处理

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 错误响应格式 / Error Response Format | ✅ PASS / ❌ FAIL | 说明 / description |
| HTTP 状态码正确 / HTTP Status Codes | ✅ PASS / ❌ FAIL | 说明 / description |
| 错误信息清晰 / Error Messages Clarity | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 7. Breaking Changes / 破坏性变更

| 变更项 / Change | 类型 / Type | 影响 / Impact | 兼容方案 / Compatibility |
|-----------------|-------------|---------------|-------------------------|
| 接口路径变更 | MAJOR | 高 | 提供重定向 / 版本共存 |

---

## 8. Conclusion / 结论

| 维度 / Dimension | 结论 / Conclusion |
|------------------|-------------------|
| API 设计 / API Design | ✅ PASSED / ❌ FAILED |
| 安全性 / Security | ✅ PASSED / ❌ FAILED |
| 性能 / Performance | ✅ PASSED / ❌ FAILED |
| 文档 / Documentation | ✅ PASSED / ❌ FAILED |

**最终结论 / Final Conclusion**: 

> ✅ **PASSED - 可以合并 / Can Merge**
> 
> ❌ **FAILED - 需要修复 / Needs Fix**
> 
> ⚠️ **NEEDS_REVIEW - 需要进一步审查 / Needs Further Review**

---

## 9. Reviewer Info / 审查人信息

**审查人 / Reviewer**: {{ reviewer }}

**签名 / Signature**: {{ review_time }}

---

*Template: vibex-report-template v1.0*
*Generated: {{ review_time }}*
