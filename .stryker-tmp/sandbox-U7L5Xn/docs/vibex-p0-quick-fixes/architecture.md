# Architecture: VibeX Sprint 0 — P0 快速修复

**项目**: vibex-p0-quick-fixes
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

解除 CI 门禁阻断，使 `npm run test` 全绿。

**总工时**: 0.75h

---

## 1. Tech Stack

| 技术 | 操作 | 理由 |
|------|------|------|
| **TypeScript** | 修复 tsconfig + 污染文件 | 解除编译阻断 |
| **ESLint** | eslint --fix + 手动修复 | 解除 pre-test-check 阻断 |
| **npm audit** | 安全审查 + overrides | 解除漏洞风险 |

---

## 2. 修复方案

### E1: TypeScript 错误修复

```bash
# 步骤 1: 定位错误
cd vibex-fronted && npx tsc --noEmit 2>&1 | grep "error TS"

# 步骤 2: 分类处理
# - TS1434/TS1128 在 tests/e2e/canvas-expand.spec.ts → 恢复或删除
# - 其他错误 → 逐个修复

# 步骤 3: 验证
npx tsc --noEmit
# 期望: 退出码 0
```

### E2: ESLint 问题修复

```bash
# 步骤 1: 自动修复
npm run lint -- --fix

# 步骤 2: 检查剩余问题
npm run lint 2>&1 | grep "error"

# 步骤 3: 手动修复剩余问题
```

### E3: DOMPurify 安全审查

```bash
# 步骤 1: 检查漏洞
npm audit --audit-level=high

# 步骤 2: 如需修复，添加 overrides
# package.json
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

---

## 3. 性能影响

无性能影响，纯 CI 修复。

---

## 架构决策记录

### ADR-001: 污染文件处理策略

**状态**: Accepted

**上下文**: tests/e2e/canvas-expand.spec.ts 包含 TS 语法错误。

**决策**: 优先恢复，如无法恢复则删除。

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-p0-quick-fixes
- **执行日期**: 2026-04-02
