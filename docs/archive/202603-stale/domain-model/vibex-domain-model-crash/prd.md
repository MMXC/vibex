# 领域模型渲染报错修复 - PRD

**项目**: vibex-domain-model-crash
**版本**: 1.0
**状态**: PM 细化
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 背景

`vibex-domain-model-crash-fix` 已修复数据层面的防护，本项目补充渲染层面的防护。`domainModels.map()` 未做空值保护，可能导致渲染崩溃。

### 1.2 目标

添加渲染时空值保护，确保 `domainModels` 为 undefined 时不崩溃。

### 1.3 核心指标

| 指标 | 目标 |
|------|------|
| 渲染崩溃 | 0 次 |
| 空状态友好提示 | 显示 |
| 正常流程影响 | 无 |

---

## 2. 功能需求

### F1: domainModels 空值保护

**描述**: 渲染时添加 `?? []` 保护

**验收标准**:
- `expect(code).toMatch(/\(\w+\?\?\s*\[\]\)\.map/)`
- `expect(render).not.toThrow("Cannot read properties of undefined")`

### F2: 条件渲染

**描述**: 添加空状态友好提示

**验收标准**:
- `expect(emptyState).toShowMessage("暂无领域模型数据")`
- `expect(ui).toMatch(/暂无.*领域模型/)`

### F3: API 响应处理

**描述**: 处理 `domainModels = null` 情况

**验收标准**:
- `expect(nullResponse).toBeTreatedAsEmptyArray()`

---

## 3. Epic 拆分

### Epic 1: 渲染层空值保护

**目标**: 修复 domainModels.map() 空值问题

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S1.1 | 添加 `?? []` 保护 | `expect(map).toUseNullishCoalescing()` |

### Epic 2: 空状态 UI

**目标**: 友好提示而非白屏

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S2.1 | 添加空状态提示 | `expect(ui).toShowEmptyState()` |

### Epic 3: API 响应增强

**描述**: 处理 null 响应

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S3.1 | 处理 null 为空数组 | `expect(null).toEqual([])` |

---

## 4. 验收标准汇总

| 优先级 | 验收项 | 标准 |
|--------|--------|------|
| P0 | 渲染不崩溃 | domainModels 为 undefined 不报错 |
| P0 | 空状态显示 | 显示友好提示 |
| P1 | API null 处理 | null 视为空数组 |
| P2 | 回归测试 | 正常流程不受影响 |

---

## 5. DoD

- [ ] 所有 Story 验收通过
- [ ] E2E 测试覆盖
- [ ] 代码审查通过

---

**产出物**: `docs/vibex-domain-model-crash/prd.md`
**验证**: `test -f /root/.openclaw/vibex/docs/vibex-domain-model-crash/prd.md`
