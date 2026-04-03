# PRD: vibex-tester-proposals-20260324_185417

**项目**: vibex-tester-proposals-20260324_185417  
**PM**: PM Agent  
**时间**: 2026-03-24 20:06 (UTC+8)  
**状态**: 进行中  
**依赖上游**: analysis.md (Analyst)  
**目标**: 将 Tester 提案转化为可执行 PRD

---

## 1. 执行摘要

Tester 提出 3 项提案（来自汇总，无独立提案文件），均与第一批次 tester-proposals-20260324.md 重复。核心聚焦：dedup 生产验证、API 错误测试覆盖、Accessibility 基线建立。

### 遗留问题
- tester 未产出独立提案文件，依赖 coord 汇总
- 建议：后续要求 tester 产出独立 `.md` 文件

### 成功指标
- [ ] dedup 误报率 < 10%
- [ ] 6 类 API 错误全覆盖
- [ ] WCAG 自动化检测基线建立

---

## 2. 功能需求

### F1: dedup 生产验证 (P0)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F1.1 | 误报率验证 | 真实数据扫描误报率 < 10% | `expect(dedupFalsePositiveRate).toBeLessThan(10)` |
| F1.2 | 正确识别相似项目 | 测试用例覆盖：完全重复/部分重复/无关 | `expect(similarityDetection).toBeAccurate()` |
| F1.3 | 边界条件测试 | 空输入/单字符/超长输入处理 | `expect(boundaryCases.all).toPass()` |

**DoD**: 误报率 < 10%，正确识别 3 类相似度场景

### F2: API 错误测试覆盖 (P1)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F2.1 | 401 未授权测试 | 未登录请求返回 401 | `expect(api('/secure').get()).resolves.toHaveStatus(401)` |
| F2.2 | 403 禁止访问测试 | 无权限请求返回 403 | `expect(api('/admin').get()).Resolves.toHaveStatus(403)` |
| F2.3 | 404 未找到测试 | 无效资源返回 404 | `expect(api('/invalid').get()).resolves.toHaveStatus(404)` |
| F2.4 | 500 服务器错误测试 | 模拟服务器异常返回 500 | `expect(simulateServerError()).resolves.toHaveStatus(500)` |
| F2.5 | 超时错误测试 | 请求超时处理 | `expect(timeoutRequest()).resolves.toTimeout()` |
| F2.6 | 并发取消测试 | 并发请求取消场景 | `expect(cancelledConcurrentRequests.count).toBe(0)` |

**DoD**: 6 类错误全覆盖，pytest 全部通过

### F3: Accessibility 基线建立 (P2)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F3.1 | WCAG 核心页面检测 | 自动化 WCAG 检测核心页面 | `expect(wcagViolations.core).toHaveLength(0)` |
| F3.2 | 自动化检测集成 | CI 门禁集成 accessibility 检测 | `expect(ciAccessibilityGate.pass).toBe(true)` |
| F3.3 | 基线文档 | 记录当前 WCAG 基线状态 | `expect(wcagBaseline.documented).toBe(true)` |

**DoD**: 核心页面 WCAG 自动化检测通过，基线文档建立

---

## 3. Epic 拆分

| Epic | Story | 描述 | 优先级 |
|------|-------|------|--------|
| Epic 1 | S1.1 | 误报率验证 | P0 |
| Epic 1 | S1.2 | 相似项目识别 | P0 |
| Epic 1 | S1.3 | 边界条件测试 | P0 |
| Epic 2 | S2.1 | 401/403/404 覆盖 | P1 |
| Epic 2 | S2.2 | 500/超时/并发覆盖 | P1 |
| Epic 3 | S3.1 | WCAG 检测 | P2 |
| Epic 3 | S3.2 | CI 门禁集成 | P2 |
| Epic 3 | S3.3 | 基线文档 | P2 |

---

## 4. 验收标准汇总

| ID | 验收条件 | 验证方法 | 优先级 |
|----|----------|----------|--------|
| V1 | dedup 误报率 < 10% | 生产数据验证 | P0 |
| V2 | 相似项目识别准确 | 单元测试 | P0 |
| V3 | 边界条件 100% 覆盖 | 边界测试套件 | P0 |
| V4 | 401/403/404 全覆盖 | pytest | P1 |
| V5 | 500/超时/并发全覆盖 | pytest | P1 |
| V6 | WCAG 核心页面 0 违规 | 自动化检测 | P2 |
| V7 | CI 门禁通过 | CI 报告 | P2 |
| V8 | 基线文档建立 | 文件检查 | P2 |

---

## 5. 遗留改进项

| 问题 | 建议 |
|------|------|
| tester 未产出独立提案文件 | Coord 强制要求 `.md` 文件规范 |
| 提案分散导致追踪困难 | 统一路径存储 + 工具支持 |

---

## 6. 工时估算

| Epic | Tester | Dev 支持 | 总计 |
|------|--------|----------|------|
| Epic 1 | 3h | 0.5h | ~3.5h |
| Epic 2 | 4h | 1h | ~5h |
| Epic 3 | 4h | 2h | ~6h |
| **合计** | **~11h** | **~3.5h** | **~14.5h** |
