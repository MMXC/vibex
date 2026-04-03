# Spec: Epic 4 - 废弃代码清理

## Jobs-To-Be-Done

- **JTBD 1**: 作为开发者，我希望废弃的代码已被清理，以便降低代码库维护成本和认知负担。

## User Stories

- US4.1: 作为开发者，我删除 `/confirm` 目录后，所有相关引用都已清理，不会导致构建错误。
- US4.2: 作为开发者，我删除 `/requirements` 目录后，相关路由和组件不再存在。
- US4.3: 作为维护者，我更新文档后，新人可以快速理解路由结构。

## Requirements

### F4.1: /confirm 目录删除
- [ ] 确认所有 `/confirm/*` 路由的重定向已生效
- [ ] 删除 `src/app/confirm/` 目录及所有子目录
- [ ] 全局搜索确认无残留引用（`import.*from.*confirm`）
- [ ] 构建验证无错误

### F4.2: /requirements 目录删除
- [ ] 确认 `/requirements` 路由的重定向已生效
- [ ] 删除 `src/app/requirements/` 目录及所有子目录
- [ ] 全局搜索确认无残留引用
- [ ] 构建验证无错误

### F4.3: 废弃组件清理
- [ ] 删除 `ConfirmationSteps` 组件
- [ ] 删除 `RequirementsList` 组件（如存在）
- [ ] 删除其他仅被废弃流程使用的组件
- [ ] 全局搜索确认无残留引用

### F4.4: 废弃 Store 清理
- [ ] 确认无 `legacyConfirmationStore` 或类似废弃 Store
- [ ] 确认 `confirmationStore` 是唯一确认状态存储
- [ ] 删除废弃 Store 相关代码

### F4.5: 文档和路由图更新
- [ ] 更新 `README.md`，说明单一入口策略
- [ ] 更新路由图文档
- [ ] 更新开发者文档（如有）

## Technical Notes

### 删除前检查清单
```bash
# 1. 确认无外部依赖
grep -r "/confirm" . --include="*.ts" --include="*.tsx" | grep -v "deprecated"

# 2. 确认无测试引用
grep -r "/confirm" . --include="*.test.ts" --include="*.test.tsx"

# 3. 确认无 import
grep -r "from.*confirm" . --include="*.ts" --include="*.tsx"

# 4. 备份（可选）
git branch backup-before-cleanup
```

### Git 删除命令
```bash
git rm -r src/app/confirm/
git rm -r src/app/requirements/
git commit -m "chore: remove deprecated /confirm and /requirements routes"
```

## Acceptance Criteria

- [ ] `expect(fs.existsSync('src/app/confirm')).toBe(false)` — /confirm 目录不存在
- [ ] `expect(fs.existsSync('src/app/requirements')).toBe(false)` — /requirements 目录不存在
- [ ] `expect(grep('/confirm')).toHaveLength(0)` — 无残留引用
- [ ] `expect(build.exitCode).toBe(0)` — 构建成功
- [ ] `expect(readme).toContain('single entry point')` — 文档已更新

## Definition of Done

| 维度 | 标准 |
|------|------|
| 功能 | 废弃目录和组件已删除，无残留引用 |
| 测试 | 构建成功，无测试失败 |
| 安全 | 删除不影响现有功能 |
| 文档 | README 和路由图已更新 |
| 代码行数 | 减少 ≥ 2000 行（对比清理前） |
