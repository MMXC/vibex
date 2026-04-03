# Epic 3: 代码规范与流程治理 — 技术规格

## 概述

规范化多 Epic 共 commit 审查流程，推进 TypeScript 严格模式，并建立审查报告归档机制。

---

## E3-S1: AGENTS.md 更新 — 多 Epic 共 commit 约定

### 现状
多个 Epic 共用同一 commit（如 `canvas-component-validate-fix` Epic 1/2/3 共 commit `0dc052be`），审查效率提升但流程未成文。

### 约定内容（建议追加到 AGENTS.md）

```markdown
### 多 Epic 共 commit 审查约定

当多个 Epic 共用同一 commit 时：
1. **只审查一次**：Reviewer 只对该 commit 做一次完整审查
2. **共用 changelog**：changelog 条目注明覆盖 Epic 范围
3. **PR 描述标注**：PR description 包含 `[shared-commit: E1,E2,E3]` 标签
4. **例外处理**：若后续 Epic 包含独立功能点，仍需单独审查

示例 changelog 条目：
```markdown
- fix: 修复 canvas 组件校验问题 (shared-commit 0dc052be, E1+E2+E3)
```
```

### 验收条件
- AGENTS.md 包含多 Epic 共 commit 约定章节
- 约定被团队实践验证

---

## E3-S2: TypeScript 严格模式升级

### 实施步骤
1. **统计分析**：运行 `grep -rn "as any" frontend/src/ --include="*.ts" | wc -l` 建立基线
2. **高优先级替换**：优先处理 `canvasStore.ts` 中的 `as any`
3. **ESLint 规则**：启用 `@typescript-eslint/no-explicit-any: warn`
4. **分阶段验证**：每替换一处，跑通相关单元测试

### 关键文件
- `frontend/src/stores/canvasStore.ts`（主要治理对象）
- `frontend/src/utils/`（相关工具函数）

### 类型守卫替换示例
```typescript
// Before
const data = result.rows as any;

// After
function isValidRow(row: unknown): row is Row {
  return typeof row === 'object' && row !== null && 'id' in row;
}
const data = result.rows.filter(isValidRow);
```

### 验收条件
- canvasStore.ts 中 `as any` 减少 ≥50%
- `@typescript-eslint/no-explicit-any` 规则激活
- 相关单元测试 100% 通过

---

## E3-S3: reports/INDEX.md 建立

### 目录结构
```
reports/
├── INDEX.md          # 报告索引
├── 2026-04-02/       # 按日期组织
│   ├── canvas-bc-checkbox-fix-review.md
│   └── ...
└── 2026-03-16/
    └── ...
```

### INDEX.md 格式
```markdown
# Review Reports Index

## 2026-04-02
| 项目 | Epic | 审查结果 | 报告文件 |
|------|------|---------|---------|
| canvas-bc-checkbox-fix | E1 | PASSED | 2026-04-02/canvas-bc-checkbox-fix-review.md |

## 2026-03-16
| 项目 | Epic | 审查结果 | 报告文件 |
|------|------|---------|---------|
```

### 自动追加脚本
```bash
# .git/hooks/post-review（示例 hook）
# 审查完成后自动追加到 reports/INDEX.md
```

### 验收条件
- `reports/INDEX.md` 存在
- 包含所有历史报告条目
- 新增报告自动追加到索引
