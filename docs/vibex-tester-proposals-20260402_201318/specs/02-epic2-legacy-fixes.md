# Epic 2 Spec: 遗留驳回项修复

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 2  
**负责人**: dev

---

## 1. 功能规格

### S2.1 vibex-canvasstore-refactor E5 sessionStore 补充测试

**输入**: `src/stores/sessionStore.ts`（115 行）  
**处理**:
1. 创建 `src/stores/__tests__/sessionStore.test.ts`
2. 测试用例覆盖：
   - sessionStore 初始化
   - `setSession(key, value)` / `getSession(key)`
   - `clearSession()`
   - `sessionExists(key)`
   - 边界情况：空 key、无效值、过期处理
3. 执行 `npx jest sessionStore --coverage`，确保行覆盖率 ≥70%

**输出**: `src/stores/__tests__/sessionStore.test.ts`，覆盖率报告

**验收测试**:
```bash
npx jest sessionStore --coverage --coverageReporters=text-summary
# 期望: All files 100%, sessionStore 行覆盖率 ≥70%
```

---

### S2.2 checkbox-persist-bug E1 dev 提交代码

**输入**: checkbox-persist-bug 项目  
**处理**:
1. 检查 git log，确认有 dev commit
2. 创建 PR（如尚未创建）
3. 修复代码问题
4. `npx jest checkbox-persist --no-coverage` 全通过

**输出**: checkbox-persist-bug PR 已创建，测试全通过

**验收测试**:
```bash
git log --oneline | grep checkbox-persist
# 期望: 有提交记录
npx jest checkbox-persist --no-coverage
# 期望: All tests passed
```

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | sessionStore 测试文件存在 | `ls src/stores/__tests__/sessionStore.test.ts` |
| E2 | sessionStore 测试通过 | `npx jest sessionStore --no-coverage` → All passed |
| E3 | sessionStore 覆盖率 ≥70% | `npx jest sessionStore --coverage` 报告 ≥70% |
| E4 | checkbox-persist-bug 有 dev commit | `git log` 有记录 |
| E5 | checkbox-persist-bug 测试全通过 | `npx jest checkbox-persist --no-coverage` → All passed |
