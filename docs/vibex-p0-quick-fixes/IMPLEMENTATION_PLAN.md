# Implementation Plan: VibeX Sprint 0 — P0 快速修复

**项目**: vibex-p0-quick-fixes
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 0: CI 门禁修复（0.75h）

### 步骤 E1: TypeScript 错误修复（0.25h）

```bash
# 1. 定位错误
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit 2>&1 | grep "error TS"

# 2. 修复 tests/e2e/canvas-expand.spec.ts
# 方案A: 恢复语法正确版本
# 方案B: 删除文件

# 3. 验证
npx tsc --noEmit
# 期望: 退出码 0
```

### 步骤 E2: ESLint 问题修复（0.25h）

```bash
# 1. 自动修复
npm run lint -- --fix

# 2. 检查剩余
npm run lint
# 期望: 退出码 0

# 3. 验证 test
npm run test
# 期望: 全绿
```

### 步骤 E3: DOMPurify 安全审查（0.25h）

```bash
# 1. 检查漏洞
npm audit --audit-level=high
# 期望: 无 high/critical

# 2. 如需修复
# 添加 package.json overrides
```

---

## 验收清单

- [x] `npx tsc --noEmit` 退出码 0 ✅
- [ ] `npm run lint` 退出码 0
- [ ] `npm run test` 全绿
- [ ] `npm audit --audit-level=high` 无 high/critical

### Epic1 记录
- 2026-04-02 07:15: 修复 canvas-expand.spec.ts 变量引用错误（4处）
- 修复 contextStore.ts devtools 参数类型
- npm build 通过
