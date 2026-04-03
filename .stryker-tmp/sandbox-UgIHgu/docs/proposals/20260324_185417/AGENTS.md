# AGENTS.md — Epic 1 工具链止血

## 红线约束
- ❌ 不得修改应用业务逻辑（components/、stores/、pages/）
- ❌ 不得修改数据库 schema
- ❌ 不得引入新的 npm 依赖（仅修复现有依赖）
- ❌ 不得删除 git history

## 开发约束
- 所有脚本修改需在 `scripts/` 目录下
- P0-2 超时框架需通用（可复用）
- P0-1 删除测试前需确认测试文件归属
- P1-8 需向后兼容已有 thread ID 文件

## 检查清单（Dev 完成后必检）
1. `task_manager.py list` 执行 < 2s
2. `task_manager.py health` 返回 OK
3. `npm test` 100% 通过
4. `scripts/timeout.py` 存在且可 import
5. `scripts/heartbeats/dev-heartbeat.sh` 包含自动保存 thread ID
