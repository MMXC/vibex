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

---

## 需求澄清 SOP（Brainstorming 技能）

### 何时使用 Brainstorming

当遇到以下情况时，必须使用 Brainstorming 技能：

1. **需求歧义**：描述包含模糊词汇（"优化体验"、"改进 UI"）无具体指标
2. **方案分歧**：涉及多个方案权衡，无明显最优解
3. **领域陌生**：涉及新领域，团队缺乏上下文
4. **PRD 存疑**：PRD 中存在"待确认"项超过 3 个

### Brainstorming 流程

```
1. 触发  → 在 #vibex 或对应频道 @analyst "需要 brainstorm: <需求描述>"
2. 分析  → Analyst 使用 gstack browse 验证问题真实性
3. 提案  → 生成 2-3 个方案选项 + 权衡分析
4. 决策  → PM 选择方案，更新 PRD
5. 记录  → 将决策记录到对应提案的 ANALYSIS.md
```

### 验收标准

| 标准 | 验证 |
|------|------|
| 歧义需求被识别 | `grep "优化\\|改进\\|完善" prd.md` → 无未量化描述 |
| 方案有权衡分析 | 每个方案有 pros/cons |
| 决策有记录 | ANALYSIS.md 包含 decision 章节 |
