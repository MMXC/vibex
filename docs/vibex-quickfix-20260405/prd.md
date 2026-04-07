# PRD: Quickfix 20260405 — OPTIONS CORS 500

> **项目**: vibex-quickfix-20260405  
> **目标**: 修复 Canvas API OPTIONS 预检 500 错误  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
Canvas API OPTIONS 预检请求返回 500，前端无法调用任何受保护的 Canvas API。根因：gateway OPTIONS 路由未穿透到 protected_ 子 app。

### 目标
- P0: 修复 OPTIONS 500 错误
- P0: 验证所有 Canvas API 预检通过

### 成功指标
- AC1: OPTIONS 请求返回 204
- AC2: CORS 头正确
- AC3: 前端 Canvas API 可调用

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | OPTIONS 路由修复 | P0 | 1h |
| E2 | CORS 中间件配置 | P0 | 0.5h |
| E3 | 验证测试 | P0 | 0.5h |
| **合计** | | | **2h** |

---

### E1: OPTIONS 路由修复

**根因**: `v1.options('/*')` 只在顶层匹配，Canvas 在 protected_ 子 app 下。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | Gateway OPTIONS | 0.5h | `expect(status).toBe(204)` ✓ |
| S1.2 | 子 app OPTIONS | 0.5h | `expect(cors).toBe(true)` ✓ |

**验收标准**:
- `expect(OPTIONS /api/v1/canvas/generate-contexts).toStatus(204)` ✓

**DoD**:
- [ ] OPTIONS 请求返回 204
- [ ] 包含 CORS 头

---

### E2: CORS 中间件配置

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | allowMethods 配置 | 0.5h | `expect(allowMethods).toContain('POST')` ✓ |

**验收标准**:
- `expect(res.headers['access-control-allow-methods']).toBeDefined()` ✓

**DoD**:
- [ ] CORS 头完整

---

### E3: 验证测试

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | E2E 验证 | 0.5h | `expect(e2e).toPass()` ✓ |

**验收标准**:
- `expect(playwright.options).toStatus(204)` ✓

**DoD**:
- [ ] E2E 测试通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Gateway OPTIONS | E1 | expect(status).toBe(204) | 无 |
| F1.2 | 子 app OPTIONS | E1 | expect(cors).toBe(true) | 无 |
| F2.1 | CORS 配置 | E2 | expect(headers).toBeDefined() | 无 |
| F3.1 | E2E 验证 | E3 | expect(test).toPass() | 无 |

---

## 4. DoD

- [ ] OPTIONS 返回 204 + CORS 头
- [ ] 所有 Canvas API 预检通过
- [ ] E2E 测试通过

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
