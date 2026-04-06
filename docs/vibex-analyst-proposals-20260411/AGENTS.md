# AGENTS.md: vibex-analyst-proposals

**项目**: vibex-analyst-proposals-20260411

## 约束
- [ ] @ci-blocking 分批移除（每批 ≤ 10 处）
- [ ] 每批移除后 CI 验证通过再继续
- [ ] PR 合并前必须通过 CLI 更新状态

## 验收检查清单
- [ ] `grep xoxp- task_manager.py == 0`
- [ ] `grep @ci-blocking == 0`
- [ ] `wrangler deploy` 成功
- [ ] CLI CI 集成测试通过
