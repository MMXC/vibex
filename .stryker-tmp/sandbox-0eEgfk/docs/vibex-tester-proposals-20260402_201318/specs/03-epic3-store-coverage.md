# Epic 3 Spec: Store 拆分测试覆盖率强制要求

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 3  
**负责人**: dev + tester

---

## 1. 功能规格

### S3.1 新 store 测试文件同步创建规则

**输入**: 任何新建 `src/stores/xxxStore.ts`  
**处理**:
1. 创建 store 时，同步创建 `src/stores/__tests__/xxxStore.test.ts`
2. 测试模板：至少包含初始化、核心方法、边界情况 3 类用例
3. 提交时两者必须同时存在

**输出**: 新 store 必有配套测试文件

---

### S3.2–S3.6 各 store 覆盖率达标

**输入**: 5 个 store 文件  
**处理**:

| Store | 测试文件 | 最低覆盖率 |
|-------|---------|----------|
| contextStore | `__tests__/contextStore.test.ts` | ≥80% 行覆盖 |
| uiStore | `__tests__/uiStore.test.ts` | ≥80% 行覆盖 |
| flowStore | `__tests__/flowStore.test.ts` | ≥80% 行覆盖 |
| componentStore | `__tests__/componentStore.test.ts` | ≥80% 行覆盖 |
| sessionStore | `__tests__/sessionStore.test.ts` | ≥70% 行覆盖 |

**处理步骤**（每个 store）:
1. 执行 `npx jest <storeName> --coverage --coverageReporters=lcov,text-summary`
2. 检查行覆盖率
3. 如不达标，补充测试用例
4. tester 验证覆盖率报告

**输出**: 各 store 覆盖率报告（截图 + JSON）

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | contextStore 测试通过且覆盖率 ≥80% | `npx jest contextStore --coverage` |
| E2 | uiStore 测试通过且覆盖率 ≥80% | `npx jest uiStore --coverage` |
| E3 | flowStore 测试通过且覆盖率 ≥80% | `npx jest flowStore --coverage` |
| E4 | componentStore 测试通过且覆盖率 ≥80% | `npx jest componentStore --coverage` |
| E5 | sessionStore 测试通过且覆盖率 ≥70% | `npx jest sessionStore --coverage` |
| E6 | 所有测试文件已提交 | `git status` 无未提交测试文件 |
