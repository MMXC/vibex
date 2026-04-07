# Implementation Plan: Test Commands Unification

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: Makefile 统一入口 | 2h | Makefile + 7个 targets |
| E2: TEST_COMMANDS.md | 1h | 文档完整 |
| E3: CI 集成 | 1h | .github/workflows/test.yml |
| E4: npm scripts 清理 | 1h | package.json 清理 |
| **合计** | **5h** | |

## 任务分解

| Task | 文件 | 验证 |
|------|------|------|
| E1: Makefile | `Makefile` | `make help` 输出正确 |
| E2: 文档 | `TEST_COMMANDS.md` | 所有命令有说明 |
| E3: CI | `.github/workflows/test.yml` | `make test:ci` 运行 |
| E4: 清理 | `package.json` | 所有命名统一 |

## DoD
- [ ] `make help` 列出所有命令
- [ ] `make test` 运行成功
- [ ] TEST_COMMANDS.md 完整
- [ ] CI 使用 make 命令

*Architect Agent | 2026-04-07*
