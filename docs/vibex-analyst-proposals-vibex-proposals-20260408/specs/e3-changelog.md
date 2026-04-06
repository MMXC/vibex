# Spec: Epic E3 — Changelog 补录 + 规范

## 1. Changelog 补录范围

2026-04-06 完成（来源 git log）：
- canvas-button-cleanup E4: 移除未使用 `.selectionCheckbox` CSS
- canvas-button-cleanup E5: 批量删除 `deleteAllNodes`
- canvas-jsonrender-preview E3: 预览编辑同步
- P0 fixes: OPTIONS 预检路由、checkbox onChange、flowId 修复

2026-04-07 完成（来源 git log）：
- canvas-button-consolidation: 按钮状态合并
- canvas-flowtree-guard-fix: FlowTree guard 修复
- canvas-flowtree-api-fix: FlowTree API 修复
- canvas-optimization-roadmap: Canvas 优化路线图
- vibex-generate-components-consolidation: 组件生成合并

## 2. Changelog 格式

```markdown
## [Unreleased]

### 2026-04-07
- **canvas-button-consolidation E1**: 统一按钮状态管理 (`abc1234`)
- **canvas-flowtree-guard-fix E1**: 修复 FlowTree guard 边界条件 (`def5678`)

### 2026-04-06
- **canvas-button-cleanup E4**: 移除 `.selectionCheckbox` 未使用 CSS (`ghi9012`)
- **P0 Fixes**: OPTIONS/CORS、Canvas checkbox、flowId 修复 (`jkl3456`)
```

## 3. CLAUDE.md 规范

```markdown
## Changelog 更新规范

每完成一个 Epic，必须：
1. 在 `CHANGELOG.md` 添加条目（Epic 名 + 描述 + commit hash）
2. commit message 必须以 `changelog: ` 开头或包含 `[changelog]` 标记
3. 未更新 changelog 不允许合并 PR（reviewer 检查）
```

## 4. 验收标准

```bash
# 验证补录完整
grep "2026-04-06" CHANGELOG.md | wc -l  # ≥ 4
grep "2026-04-07" CHANGELOG.md | wc -l  # ≥ 4

# 验证规范存在
grep -i "changelog" CLAUDE.md | wc -l  # ≥ 2
```
