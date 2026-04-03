# Feature: CI 依赖完整性检查

## Jobs-To-Be-Done

- 作为 DevOps，我需要在 CI 管道中添加依赖完整性检查，以便未来能及时发现类似 zustand 遗漏的依赖管理问题。

## User Stories

- **US1**: 作为 CI 管道，我希望运行 `npm ls` 检查无 extraneous 警告，以便构建日志可审查。
- **US2**: 作为维护者，我希望依赖完整性检查自动化，以便不需要手动检查。

## Requirements

- [ ] **(F2.1)** 在 CI 构建脚本中添加 `npm ls` 或 `pnpm ls` 检查步骤
- [ ] **(F2.2)** 检查结果写入构建日志，无 extraneous 时报告成功
- [ ] **(F2.3)** CI 检查配置纳入版本控制（.github/workflows 或同等的 CI 配置）

## Technical Notes

- CI 验证可以是独立的 GitHub Actions step 或独立的 CI job
- 检查命令: `pnpm ls --depth 0 --diy 2>&1 | grep extraneous || echo "No extraneous deps"`
- 建议放在 build step 之前，尽早发现问题

## Acceptance Criteria

- [ ] `expect(fs.existsSync('.github/workflows/build.yml') || fs.existsSync('.github/workflows/ci.yml')).toBe(true)`
- [ ] `expect(fs.readFileSync(ciFile, 'utf8')).toContain('pnpm ls')` 或 `toContain('npm ls')`
