# PRD: TypeScript Strict 模式迁移

**项目**: vibex-ts-strict  
**日期**: 2026-03-19  
**状态**: In Progress

---

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-ts-strict |
| **类型** | 技术债务清理 |
| **目标** | 启用 TypeScript strict 模式，消除类型安全风险 |
| **完成标准** | `tsc --strict` 无 error |

---

## 2. Epic 拆分

### Epic 1: 配置启用 (P0)

**Story F1.1**: 启用 strict 模式
- **验收标准**: `expect(tsconfig.strict).toBe(true)`

**Story F1.2**: 验证构建
- **验收标准**: `expect(buildSuccess).toBe(true)`

### Epic 2: 类型修复 (P1)

**Story F2.1**: 修复 any 类型
- **验收标准**: `expect(asAnyCount).toBeLessThan(10)`

**Story F2.2**: 修复 null/undefined
- **验收标准**: `expect(strictNullChecks).toPass()`

### Epic 3: CI 集成 (P2)

**Story F3.1**: 添加类型检查
- **验收标准**: `expect(ciTypeCheck).toExist()`

---

## 3. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 运行 tsc | strict 模式 | 无 error |
| AC2.1 | 检查代码 | as any | < 10 处 |
| AC3.1 | CI 运行 | 类型检查 | 通过 |

---

## 4. DoD

- [ ] tsconfig.json strict: true
- [ ] `as any` < 10
- [ ] CI 类型检查通过

---

*PRD 由 PM 生成 - 2026-03-19*
