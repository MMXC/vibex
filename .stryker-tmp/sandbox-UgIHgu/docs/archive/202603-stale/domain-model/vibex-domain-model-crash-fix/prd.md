# 领域模型生成 TypeError 崩溃修复 - PRD

**项目**: vibex-domain-model-crash-fix
**版本**: 1.0
**状态**: PM 细化
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 背景

用户点击"生成领域模型"时出现 TypeError 崩溃，根因是 `boundedContexts` 可能为 undefined。

### 1.2 目标

添加防御性检查和重定向机制，防止崩溃并提升用户体验。

### 1.3 核心指标

| 指标 | 目标 |
|------|------|
| TypeError 崩溃 | 0 次 |
| 自动重定向成功率 | 100% |
| 正常流程影响 | 无 |

---

## 2. 功能需求

### F1: 防御性检查

**描述**: 在 model/page.tsx 添加空状态检查

**验收标准**:
- `expect(page).not.toThrow("Cannot read properties of undefined")`
- `expect(!boundedContexts).toRedirect("/confirm/context")`

### F2: 可选链操作符

**描述**: 使用可选链防止 filter 报错

**验收标准**:
- `expect(code).toMatch(/boundedContexts\?\./)`
- `expect(selectedContextIds?.includes).toBeDefined()`

### F3: 加载状态提示

**描述**: 空数据时显示友好提示

**验收标准**:
- `expect(emptyState).toShowMessage("请先选择限界上下文")`

### F4: 跳转循环防护

**描述**: 防止无限重定向

**验收标准**:
- `expect(redirectCount).toBeLessThan(3)`

---

## 3. Epic 拆分

### Epic 1: 防御性检查

**目标**: 添加空状态检查和重定向

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S1.1 | 添加 boundedContexts 空检查 | `expect(!contexts).toRedirect()` |
| S1.2 | 添加 selectedContextIds 检查 | `expect(!ids?.length).toRedirect()` |

### Epic 2: 可选链修复

**目标**: 修复所有可能的 undefined 访问

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S2.1 | 修复 filter 调用 | `expect(filter).toUseOptionalChaining()` |

### Epic 3: 体验优化

**目标**: 提升用户体验

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S3.1 | 添加加载状态提示 | `expect(ui).toShowLoadingState()` |
| S3.2 | 添加错误提示 | `expect(ui).toShowErrorMessage()` |

---

## 4. 验收标准汇总

| 优先级 | 验收项 | 标准 |
|--------|--------|------|
| P0 | 无 TypeError 崩溃 | 直接访问 /confirm/model 不崩溃 |
| P0 | 自动重定向 | 空数据时跳转 /confirm/context |
| P1 | 可选链覆盖 | 所有 ?.filter 调用正确 |
| P1 | 错误提示 | 显示友好提示信息 |
| P2 | 跳转防护 | 避免无限重定向 |

---

## 5. DoD

- [ ] 所有 Story 验收通过
- [ ] E2E 测试覆盖
- [ ] 代码审查通过

---

**产出物**: `docs/vibex-domain-model-crash-fix/prd.md`
**验证**: `test -f /root/.openclaw/vibex/docs/vibex-domain-model-crash-fix/prd.md`
