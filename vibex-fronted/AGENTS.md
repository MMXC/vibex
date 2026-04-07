# AGENTS.md - VibeX Frontend Agent 协作规范

## CHANGELOG 规范

### 路径规则表

| 类型 | 路径 | 说明 |
|------|------|------|
| Frontend CHANGELOG | `CHANGELOG.md` | 所有 Epic 变更记录 |
| Frontend App Changelog | `src/app/changelog/page.tsx` | 自动渲染页面，**禁止手动修改** |
| App 页面 | `src/app/**` | **禁止手动修改**，由代码生成 |
| 组件 | `src/components/**` | 可修改，需同步更新 CHANGELOG |
| 样式 | `src/**/*.module.css` | 可修改，需同步更新 CHANGELOG |
| 配置 | `*.config.*`, `eslint.*` | 可修改，需同步更新 CHANGELOG |

> ⚠️ **红线**: `src/app/` 下的页面文件是 AI 生成的，禁止手动编辑。如需修改，应修改上游领域模型或流程定义。

### 更新时机

- **必须更新**: 每个 Epic 结束时（Reviewer 验收通过后）
- **建议更新**: 涉及 Breaking Change 的热修复
- **无需更新**: 纯实验性 PR（标记 `[skip-changelog]`）

### 格式规范

变更格式遵循 `CHANGELOG_CONVENTION.md` 的约定。

### Reviewer Constraints 检查清单

提交前 Dev 必须自检：

- [ ] `CHANGELOG.md` 已追加当前 Epic 条目
- [ ] Epic 条目包含：名称、日期、类型标签、变更摘要
- [ ] `src/app/` 页面未被手动修改
- [ ] `npm run lint` 通过
- [ ] `npm run type-check` 通过
- [ ] 相关组件测试通过（`npm test`）

---

## Reviewer 驳回模板

### 标准化驳回格式

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: <command>
📋 参考规范: <doc>
```

### 类型 A: CHANGELOG 遗漏

```
❌ 审查驳回
📍 文件位置: CHANGELOG.md
🔧 修复命令: 参考 CHANGELOG_CONVENTION.md 格式，在 CHANGELOG.md 追加 Epic 条目
📋 参考规范: CHANGELOG_CONVENTION.md § Epic 条目结构

原因: 本 Epic 变更未记录到 CHANGELOG.md，违反更新时机规范。
```

### 类型 B: TypeScript 类型错误

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: npm run type-check
📋 参考规范: AGENTS.md § Reviewer Constraints

原因: TypeScript 编译失败，存在类型错误。请修复后重新提交。
```

### 类型 C: ESLint 规则违反

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: npm run lint
📋 参考规范: eslint.config.mjs / eslint-rules/

原因: ESLint 规则检查未通过。请运行 npm run lint 并修复所有错误/警告。
```

### 类型 D: App 页面手动修改

```
❌ 审查驳回
📍 文件位置: src/app/<path>/<page>
🔧 修复命令: git diff src/app/
📋 参考规范: AGENTS.md § 路径规则表

原因: src/app/ 下的页面是 AI 生成的，禁止手动编辑。
请通过修改上游领域模型或流程定义来间接修改页面内容。
```
