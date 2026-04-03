---
template_version: "1.0"
report_type: prd-review
title: "PRD Review Report"
title_zh: "PRD 审查报告"
project: ""
reviewer: ""
review_time: ""
commit: ""
status: ""
tags:
  - prd
  - requirements
  - product
  - specification
---

# {{ title }}

**项目 / Project**: {{ project }}
**审查人 / Reviewer**: {{ reviewer }}
**审查时间 / Review Time**: {{ review_time }}
**PRD 版本 / PRD Version**: {{ prd_version }}
**Commit**: {{ commit }}

---

## 1. Summary / 整体评估

**结论 / Conclusion**: 

> ✅ PASSED / ❌ FAILED / ⚠️ NEEDS_REVIEW

{简要总结 / Brief summary}

---

## 2. Product Overview / 产品概述

### 2.1 产品定位 / Product Positioning

| 维度 / Dimension | 内容 / Content |
|------------------|----------------|
| 产品名称 / Product Name | {{ product_name }} |
| 产品类型 / Product Type | Web / Mobile / Desktop / API |
| 目标用户 / Target Users | 描述 / description |
| 核心价值 / Core Value | 描述 / description |

### 2.2 目标市场 / Target Market

| 市场 / Market | 规模 / Size | 优先级 / Priority |
|---------------|-------------|-------------------|
| 市场 1 | 大/中/小 | P0 / P1 / P2 |
| 市场 2 | 大/中/小 | P0 / P1 / P2 |

---

## 3. Requirements Quality / 需求质量

### 3.1 完整性 / Completeness

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 功能描述完整 | ✅ PASS / ❌ FAIL | 说明 / description |
| 非功能需求完整 | ✅ PASS / ❌ FAIL | 说明 / description |
| 用户故事完整 | ✅ PASS / ❌ FAIL | 说明 / description |
| 边界条件清晰 | ✅ PASS / ❌ FAIL | 说明 / description |

### 3.2 清晰度 / Clarity

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 术语定义清晰 | ✅ PASS / ❌ FAIL | 说明 / description |
| 流程描述清晰 | ✅ PASS / ❌ FAIL | 说明 / description |
| 需求无歧义 | ✅ PASS / ❌ FAIL | 说明 / description |
| 优先级明确 | ✅ PASS / ❌ FAIL | 说明 / description |

### 3.3 可行性 / Feasibility

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 技术可行性 | ✅ PASS / ❌ FAIL | 说明 / description |
| 资源充足性 | ✅ PASS / ❌ FAIL | 说明 / description |
| 时间合理性 | ✅ PASS / ❌ FAIL | 说明 / description |
| 依赖项明确 | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 4. Functional Requirements / 功能需求

### 4.1 核心功能 / Core Features

| 功能 / Feature | 优先级 / Priority | 状态 / Status | 说明 / Description |
|----------------|------------------|---------------|--------------------|
| 功能 1 | P0 | ✅ / ❌ | 说明 |
| 功能 2 | P1 | ✅ / ❌ | 说明 |
| 功能 3 | P2 | ✅ / ❌ | 说明 |

### 4.2 用户交互 / User Interactions

| 场景 / Scenario | 用户角色 / User Role | 预期结果 / Expected Result |
|-----------------|----------------------|---------------------------|
| 场景 1 | 用户/管理员 | 结果描述 |
| 场景 2 | 用户/管理员 | 结果描述 |

### 4.3 数据需求 / Data Requirements

| 数据项 / Data Item | 类型 / Type | 必填 / Required | 说明 / Description |
|--------------------|-------------|------------------|--------------------|
| 用户名 | String | ✅ / ❌ | 说明 |
| 邮箱 | String | ✅ / ❌ | 说明 |

---

## 5. Non-Functional Requirements / 非功能需求

### 5.1 性能 / Performance

| 需求 / Requirement | 目标 / Target | 状态 / Status |
|--------------------|---------------|---------------|
| 页面加载时间 | < 2s | ✅ / ❌ |
| API 响应时间 | < 200ms | ✅ / ❌ |
| 并发用户数 | > 1000 | ✅ / ❌ |

### 5.2 安全性 / Security

| 需求 / Requirement | 目标 / Target | 状态 / Status |
|--------------------|---------------|---------------|
| 数据加密 | AES-256 | ✅ / ❌ |
| 认证机制 | JWT / OAuth | ✅ / ❌ |
| 权限控制 | RBAC | ✅ / ❌ |

### 5.3 可用性 / Availability

| 需求 / Requirement | 目标 / Target | 状态 / Status |
|--------------------|---------------|---------------|
| 系统可用性 | > 99.9% | ✅ / ❌ |
| 故障恢复时间 | < 30min | ✅ / ❌ |
| 备份频率 | 每日/每周 | ✅ / ❌ |

### 5.4 兼容性 / Compatibility

| 需求 / Requirement | 目标 / Target | 状态 / Status |
|--------------------|---------------|---------------|
| 浏览器支持 | Chrome/Firefox/Safari/Edge | ✅ / ❌ |
| 移动端支持 | iOS/Android | ✅ / ❌ |
| API 版本兼容 | v1+ | ✅ / ❌ |

---

## 6. UI/UX Requirements / UI/UX 需求

| 检查项 / Check Item | 状态 / Status | 说明 / Description |
|---------------------|---------------|--------------------|
| 设计规范完整 | ✅ PASS / ❌ FAIL | 说明 / description |
| 响应式设计 | ✅ PASS / ❌ FAIL | 说明 / description |
| 无障碍访问 | ✅ PASS / ❌ FAIL | 说明 / description |
| 交互流程清晰 | ✅ PASS / ❌ FAIL | 说明 / description |

---

## 7. Risk Assessment / 风险评估

| 风险 / Risk | 概率 / Probability | 影响 / Impact | 风险等级 / Risk Level | 缓解措施 / Mitigation |
|-------------|-------------------|---------------|----------------------|----------------------|
| 技术风险 | 高/中/低 | 高/中/低 | CRITICAL/HIGH/MEDIUM/LOW | 措施描述 |
| 市场风险 | 高/中/低 | 高/中/低 | CRITICAL/HIGH/MEDIUM/LOW | 措施描述 |

---

## 8. Dependencies / 依赖项

| 依赖项 / Dependency | 类型 / Type | 状态 / Status | 说明 / Description |
|---------------------|-------------|---------------|--------------------|
| 第三方服务 | External | ✅ / ❌ | 说明 |
| 内部服务 | Internal | ✅ / ❌ | 说明 |
| 基础设施 | Infrastructure | ✅ / ❌ | 说明 |

---

## 9. Acceptance Criteria / 验收标准

| 功能 / Feature | 验收标准 / Acceptance Criteria | 优先级 / Priority | 状态 / Status |
|----------------|--------------------------------|-------------------|---------------|
| 功能 1 | 标准描述 | P0 | ✅ / ❌ |
| 功能 2 | 标准描述 | P1 | ✅ / ❌ |

---

## 10. Conclusion / 结论

| 维度 / Dimension | 结论 / Conclusion |
|------------------|-------------------|
| 需求完整性 / Requirements Completeness | ✅ PASSED / ❌ FAILED |
| 需求清晰度 / Requirements Clarity | ✅ PASSED / ❌ FAILED |
| 可行性 / Feasibility | ✅ PASSED / ❌ FAILED |
| UI/UX 设计 | ✅ PASSED / ❌ FAILED |
| 风险评估 / Risk Assessment | ✅ PASSED / ❌ FAILED |

**最终结论 / Final Conclusion**: 

> ✅ **PASSED - 可以进入开发 / Ready for Development**
> 
> ❌ **FAILED - 需要修改 / Needs Revision**
> 
> ⚠️ **NEEDS_REVIEW - 需要进一步审查 / Needs Further Review**

---

## 11. Reviewer Info / 审查人信息

**审查人 / Reviewer**: {{ reviewer }}

**签名 / Signature**: {{ review_time }}

---

*Template: vibex-report-template v1.0*
*Generated: {{ review_time }}*
