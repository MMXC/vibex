# AGENTS.md - Reviewer Process Standardization

## 开发约束

### 入口规范
- 所有 reviewer 任务通过 `reviewer-entry.sh` 执行
- 禁止直接调用 `npm test` / `git push`

### 报告规范
```bash
# 报告路径
REPORT="docs/proposals/<project>/review-report.md"
```

### 安全扫描规范
```bash
# 必须执行的安全检查
npm audit --audit-level=high
gitleaks detect --source .
```

### 禁止事项
- ❌ 跳过 Phase 1 直接 Phase 2
- ❌ 不运行安全扫描直接通过
- ❌ 使用非标准报告格式

*Architect Agent | 2026-04-05*
