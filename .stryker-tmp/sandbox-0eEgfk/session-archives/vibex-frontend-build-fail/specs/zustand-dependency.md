# Feature: zustand 依赖修复

## Jobs-To-Be-Done

- 作为 DevOps，我需要 zustand 明确声明在 package.json 中，以便 CI/CD 构建稳定可靠，不会因隐式传递依赖而产生 extraneous 警告或失败。

## User Stories

- **US1**: 作为开发者，我希望运行 `pnpm build` 能稳定成功，以便我确信每次构建都是可重复的。
- **US2**: 作为 CI/CD 管道，我希望 `npm ls zustand` 无 extraneous 警告，以便构建日志干净且可审查。
- **US3**: 作为代码审查者，我希望 package.json 清楚地列出所有运行时依赖，以便快速发现依赖管理问题。

## Requirements

- [ ] **(F1.1)** 在 `package.json` 的 `dependencies` 中添加 `"zustand": "^4.5.7"`
- [ ] **(F1.2)** 版本与当前 reactflow 传递的 zustand 版本保持一致（^4.5.7）
- [ ] **(F1.3)** 执行 `pnpm install` 更新 lockfile
- [ ] **(F1.4)** 提交 package.json 和 pnpm-lock.yaml 到 git

## Technical Notes

- reactflow@11.11.4 当前传递依赖 zustand@4.5.7，修复后版本保持不变
- zustand 是运行时依赖，必须放在 `dependencies`，不是 `devDependencies`
- 修改 store 代码不是本次范围，只需添加依赖声明

## Acceptance Criteria

- [ ] `expect(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies.zustand).toMatch(/^\\^?4\\.5\\.7$/)`
- [ ] `expect(childProcess.execSync('cd /root/.openclaw/vibex && pnpm build', { encoding: 'utf8' })).toContain('✓')`
- [ ] `expect(childProcess.execSync('cd /root/.openclaw/vibex && pnpm ls zustand', { encoding: 'utf8' })).not.toContain('extraneous')`
