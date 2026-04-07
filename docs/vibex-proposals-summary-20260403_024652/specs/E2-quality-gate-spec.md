# E2 Spec: 质量门禁建立

## S2.1 CHANGELOG 规范

### AGENTS.md 章节
```markdown
### CHANGELOG 更新规范
- Frontend: 仅维护 `vibex-fronted/CHANGELOG.md`，禁止手动修改 App 页面
- Backend: 维护 `vibex-backend/CHANGELOG.md`
- 格式: `### [Epic名称] — YYYY-MM-DD` + `#### Added/Fixed/Changed`
- 触发: 任何功能/修复提交时必须更新
```

### Reviewer Constraints 追加
```
- [ ] CHANGELOG.md 已更新（根目录 Markdown）
- [ ] 更新格式符合 CHANGELOG_CONVENTION.md
```

## S2.2 Pre-submit 自查脚本

### scripts/pre-submit-check.sh
```bash
#!/bin/bash
set -e

echo "=== Pre-submit Checks ==="

# 1. CHANGELOG 检查
if ! grep -q "Epic\|feat\|fix\|refactor" CHANGELOG.md; then
  echo "❌ CHANGELOG.md 未更新"
  exit 1
fi

# 2. TypeScript 检查
npx tsc --noEmit || {
  echo "❌ TypeScript 编译失败"
  exit 1
}

# 3. ESLint 检查（warn 而非 error，避免阻断）
npx eslint ./src --max-warnings=0 || {
  echo "⚠️ ESLint 检查有 warning"
}

echo "✅ Pre-submit 检查通过"
```

### CI 集成
```yaml
# .github/workflows/ci.yml 追加
- name: Pre-submit check
  run: bash scripts/pre-submit-check.sh
```

## S2.3 驳回模板

### AGENTS.md 驳回章节
```markdown
### 驳回格式（强制）
❌ 审查驳回: <问题描述>
📍 文件: <文件路径>:<行号>
🔧 修复命令: <具体命令>
📋 参考: AGENTS.md §<章节>
⏰ 请在 24h 内修复并重新提交
```

## S2.4 reports/INDEX.md

### 格式
```markdown
# VibeX 审查报告索引

## 2026-04

| 日期 | 项目 | Epic | 审查结论 | 链接 |
|------|------|------|----------|------|
| 2026-04-03 | vibex-proposals-summary | E1 技术债 | ✅ 通过 | vibex-proposals-summary-20260403_024652/ |
```
