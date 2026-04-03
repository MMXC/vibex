# AGENTS.md - VibeX Backend Agent 协作规范

## CHANGELOG 规范（简化版）

### 更新时机

- **必须更新**: 每个 Epic 结束时（Reviewer 验收通过后）
- **无需更新**: 纯实验性 PR（标记 `[skip-changelog]`）

### Backend CHANGELOG

| 类型 | 路径 | 说明 |
|------|------|------|
| Backend CHANGELOG | `CHANGELOG.md` | 所有 Epic 变更记录 |
| Prisma Schema | `prisma/schema.prisma` | 可修改，需说明迁移计划 |
| API 路由 | `src/app/api/**` | 可修改，需同步更新 CHANGELOG |

### 格式规范（Backend）

```markdown
## [Epic <编号>] <Epic 名称> (<YYYY-MM-DD>)

- <变更点 1>
- <变更点 2>

类型: <feat|fix|refactor|docs|test|chore>
影响: <API 路由或模块>
```

### 禁止事项

1. **禁止直接修改数据库表结构**，必须通过 Prisma Migration
2. **禁止删除历史 CHANGELOG 条目**
3. **禁止提交未经测试的数据库迁移**

### 提交前自检

- [ ] `CHANGELOG.md` 已追加当前 Epic 条目
- [ ] `pnpm run lint` 通过
- [ ] `pnpm run type-check` 通过
- [ ] 数据库迁移脚本已验证（`prisma validate`）
