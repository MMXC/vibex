# Epic 1 PRD — 工具链止血

## 目标
修复 VibeX 工具链阻塞问题，解锁 Agent 工作流，恢复 CI 信任。

## 提案列表

| ID | 标题 | 优先级 | 工时 | 负责 |
|----|------|--------|------|------|
| P0-2 | task_manager 挂起修复 | P0 | M | dev |
| P0-1 | page.test.tsx 修复 | P0 | S | dev |
| P0-3 | dedup 生产验证 | P0 | M | tester |
| P1-2 | heartbeat 幽灵任务修复 | P1 | S | dev |
| P1-8 | HEARTBEAT 话题追踪自动化 | P1 | M | dev |

## 验收标准

### P0-2: task_manager 挂起修复
- [ ] `task_manager.py list` 执行时间 < 2s
- [ ] `task_manager.py claim` 执行时间 < 2s
- [ ] 添加 `task_manager.py health` 命令
- [ ] 关键路径添加 5s 超时装饰器

### P0-1: page.test.tsx 修复
- [ ] 删除 4 个过时测试（three-column/grid/sidebar/e2e）
- [ ] `npm test` 100% 通过
- [ ] CI 绿色

### P0-3: dedup 生产验证
- [ ] 在 `proposals/20260324/` 上运行验证
- [ ] bigram 阈值可配置
- [ ] 误判率 < 5%（人工抽检 20 条）

### P1-2: heartbeat 幽灵任务修复
- [ ] 读取任务前先检查目录存在
- [ ] 幽灵任务误报率 = 0

### P1-8: HEARTBEAT 话题追踪自动化
- [ ] 任务领取成功后自动保存 thread ID
- [ ] feishu_self_notify 自动提取 thread ID
- [ ] 手动 save_task_thread_id 调用移除
