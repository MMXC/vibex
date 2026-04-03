# Analysis: 2026-04-01 第八批提案 — Sprint 2 启动

**Agent**: analyst
**日期**: 2026-04-01
**项目**: proposals-20260401-8
**数据来源**: Sprint 1 完成总结 + Sprint 2 PRD

---

## 1. 执行摘要

第八批是 **Sprint 2 启动批次**。

**Sprint 1 完成**: 26 Epic ✅
**Sprint 2 PRD**: `docs/sprint-20260402/prd.md` ✅

**第八批内容**:
- Sprint 2 执行确认
- E1 E2E 稳定性（4h，P0）
- E2 导出格式扩展（3h，P1）
- E3 技术债清理（3h，P1）

**总工时**: ~10h（3 Epic）

---

## 2. Sprint 2 Epic 确认

### 2.1 E1: E2E 测试稳定性提升

**内容**:
- F1: 动态等待替代 waitForTimeout
- F2: 添加 force:true 处理拦截
- F3: CI 环境超时配置

**验收标准**:
- `waitForSelector` 替换所有 `waitForTimeout`
- Playwright config 增加 `timeout: 30000`

---

### 2.2 E2: 导出格式扩展

**内容**:
- F1: React Native 导出
- F2: WebP 图片格式支持

**验收标准**:
- `exportFormats` 包含 `react-native` 选项
- 支持 WebP 无损压缩导出

---

### 2.3 E3: 技术债清理

**内容**:
- canvasApi 错误处理（fallback → throw）
- MSW 契约测试（函数级 → HTTP 级别）
- Playwright browser 环境稳定

**验收标准**:
- `canvasApi` 响应校验抛出 Error
- MSW 拦截 HTTP 请求
- `npx playwright install` 已加到 CI

---

## 3. 实施建议

| Epic | 建议 | 理由 |
|------|------|------|
| E1 | 立即启动 | CI 稳定性影响所有功能 |
| E2 | E1 完成后并行 | 依赖 E1 的测试基础设施 |
| E3 | 与 E2 并行 | 无依赖，可独立进行 |

---

## 4. 验收标准

| Epic | 验收标准 |
|------|----------|
| E1 | waitForSelector 替换完成；CI 超时配置生效 |
| E2 | React Native 导出可用；WebP 导出可用 |
| E3 | canvasApi throw Error；MSW HTTP 拦截；playwright install CI |

---

## 5. 下一步

1. **派发 Sprint 2**: 创建 `sprint-20260402` 项目
2. **并行开发**: E1 + E3 可立即开始
3. **确认团队**: dev E1/E2, tester E1 验证