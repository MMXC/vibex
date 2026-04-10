# AGENTS.md — 开发约束

**项目**: vibex-reviewer-proposals-vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11

---

## 1. CI 门禁规范

### 1.1 必须通过的检查

**前端 PR 合入前必须通过**:
- `pnpm exec tsc --noEmit` → 退出码 0
- `pnpm exec eslint src/` → 无 error
- `pnpm build-storybook` → 退出码 0
- Story 孤立组件检查 → 退出码 0
- 弯引号扫描 → 无输出

**后端 PR 合入前必须通过**:
- `pnpm exec tsc --noEmit` → 退出码 0
- `pnpm exec eslint src/` → 无 error
- 弯引号扫描 → 无输出

### 1.2 Story 检查脚本使用规范

**规则**:
- ✅ 在 CI 中强制执行
- ✅ 每次 PR 触发
- ❌ 不得跳过或禁用

### 1.3 ESLint 规则

**规则**:
- ✅ `no-irregular-whitespace: error` 必须在 ESLint 配置中启用
- ❌ 不得为弯引号问题添加 eslint-disable 注释

---

## 2. 变更范围约束

**允许操作**:
- ✅ 修改 `.github/workflows/*.yml`
- ✅ 新建 CI 检查脚本
- ✅ 更新 ESLint 配置
- ✅ 创建 `docs/PR_MERGE_CRITERIA.md`

**禁止操作**:
- ❌ 修改业务逻辑代码
- ❌ 修改现有组件或页面
- ❌ 删除 CI 门禁步骤
- ❌ 降低 ESLint 规则级别

---

## 3. PR 合入标准

### 必须满足的条件

1. **构建通过**: 前端 + 后端构建均成功
2. **类型安全**: TypeScript 编译无错误
3. **代码质量**: ESLint 无 error（warning 可讨论）
4. **Story 完整性**: 所有 story 文件引用的组件存在
5. **无弯引号**: 代码中无 Unicode 弯引号
6. **CI 全绿**: 所有 GitHub Actions 检查通过

---

## 4. 审查要求

### 提交前检查清单

```bash
# 前端检查
cd vibex-fronted
pnpm exec tsc --noEmit
pnpm exec eslint src/
pnpm build-storybook
npx ts-node .github/workflows/check-stories.ts

# 后端检查
cd vibex-backend
pnpm exec tsc --noEmit
pnpm exec eslint src/

# 弯引号扫描
grep -rn $'\u2018\|\u2019\|\u201c\|\u201d' vibex-fronted/src/ vibex-backend/src/
```
