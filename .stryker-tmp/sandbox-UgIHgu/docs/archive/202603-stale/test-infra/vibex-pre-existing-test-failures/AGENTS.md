# AGENTS.md — vibex-pre-existing-test-failures

## 约束
- 只修改测试文件，不修改组件代码
- 不删除任何现有测试
- 修复后运行完整测试套件验证 100% 通过

## 工作目录
`/root/.openclaw/vibex/vibex-fronted`

## 验收标准
- `npx jest CardTreeView --no-coverage` → 全部通过
- `npx jest Navbar --no-coverage` → 全部通过
- `npx jest --passWithNoTests` → 2669/2669 通过
