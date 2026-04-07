# Spec: Epic 4 — 收尾与验证

**Epic**: E4  
**Project**: vibex-dev-proposals-vibex-proposals-20260411  
**Date**: 2026-04-11

---

## 1. Overview

确保所有改进完成后，全局日志规范检查通过，文档同步更新，项目进入干净状态。

---

## 2. Stories

### E4-S1: 全局日志规范检查

**检查项**:

```bash
# 确认无新增 console.log/console.error
grep -rn "console\.\(log\|error\|warn\)" src/ --include="*.ts"

# 确认无裸 TODO
grep -rn "// TODO:" src/ --include="*.ts" | grep -v "TODO\[20"
```

**CI 检查脚本**（新增到 `scripts/` 或 pre-commit hook）:
```ts
// scripts/verify-logging-compliance.ts
import { execSync } from 'child_process';

const violations: string[] = [];

try {
  const consoleOutput = execSync(
    'grep -rn "console\\.\\(log\\|error\\|warn\\)" src/ --include="*.ts"',
    { encoding: 'utf-8' }
  );
  if (consoleOutput) violations.push(`console.* found:\n${consoleOutput}`);
} catch {
  // grep 返回 1 表示无匹配，这是期望的
}

try {
  const todoOutput = execSync(
    'grep -rn "// TODO:" src/ --include="*.ts" | grep -v "TODO\\[20"',
    { encoding: 'utf-8' }
  );
  if (todoOutput) violations.push(`Bare TODO found:\n${todoOutput}`);
} catch {
  // 无裸 TODO，期望状态
}

if (violations.length > 0) {
  console.error('Logging compliance failed:\n' + violations.join('\n'));
  process.exit(1);
}
```

**验收**:
- CI 通过 `npm run verify:logging`
- `git diff` 无 `console.*` 新增
- 无裸 `// TODO:` 遗留

---

### E4-S2: CHANGELOG 更新

**文件**: `docs/CHANGELOG.md`

**格式**:
```markdown
## [Unreleased] — YYYY-MM-DD

### Backend Improvements

- **Fix**: `connectionPool.ts` — 4 处 console.log 替换为结构化 logger (#proposal: vibex-dev-proposals-vibex-proposals-20260411)
- **Fix**: `project-snapshot.ts` — 快照接口返回真实 D1 数据（消除 5 个假数据 TODO）
- **Enhance**: `ai-service.ts` — JSON 解析支持 markdown 包裹和 token 截断降级
- **Enhance**: `connectionPool.ts` — 异常处理增加阈值告警和 health check 触发
- **Refactor**: `routes/` — devDebug 统一为 logger.debug，console.error 结构化
- **Clean**: 清理 `llm-provider.ts.backup-*` 遗留文件
- **Chore**: 全局 TODO 清理（clarification-questions/diagnosis/business-domain/flow-execution）
```

**验收**:
- CHANGELOG 已更新本次改进条目
- 格式与其他条目一致

---

## 3. Implementation Order

E4 为收尾阶段，在 E1/E2/E3 所有 Phase 完成后执行。

---

## 4. Rollback Plan

| Phase | 回滚方式 |
|-------|---------|
| Phase 1-2 | `git revert <commit>` 独立 PR |
| Phase 3-6 | 逐文件 `git checkout HEAD -- <file>` |
| Phase 7-8 | 文档变更 `git revert` |

**关键**: Phase 1+2（P0 问题）优先合并后，其余 Phase 可安全并行开发。
