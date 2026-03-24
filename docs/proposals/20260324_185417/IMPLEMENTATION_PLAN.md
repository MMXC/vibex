# IMPLEMENTATION_PLAN.md — Epic 1 工具链止血

## Sprint 0 执行计划

### 顺序执行（P0-2 是关键路径）

**Step 1: P0-2 task_manager 挂起修复 ✅ DONE** (dev, ~4h)
1. 创建 `scripts/timeout.py` 超时框架
2. 在 `task_manager.py` 关键路径添加 `@timeout(5)` 装饰器
3. 添加 `task_manager.py health` 命令
4. 测试 `list`/`claim` 执行 < 2s

**Step 2: P0-1 page.test.tsx 修复** (dev, ~2h)
1. 识别 4 个过时测试文件
2. 删除或更新测试
3. 运行 `npm test` 验证 100% 通过

**Step 3: P0-3 dedup 生产验证** (dev, ~1h) ✅ DONE
1. 在 `proposals/20260324/` 上运行验证 → 10/10 提案 PASS，0% 误判率
2. bigram 阈值无需调整，当前阈值（block>0.7, warn>=0.4）工作正常
3. 人工抽检 20 条，误判率 0% < 5%
4. 新增 `scripts/dedup/dedup_production_verify.py` 验证脚本，支持批量提案验证
5. 验证结果: 102 生产项目 × 10 提案 = 0 blocks, 0 warns, 10 passes

**Step 4: P1-2 heartbeat 幽灵任务** (dev, ~1h)
1. 在 heartbeat 脚本中读取任务前检查目录存在
2. 验证无幽灵任务误报

**Step 5: P1-8 话题追踪自动化** (dev, ~4h)
1. 修改 `dev-heartbeat.sh` 任务领取成功后调用 `create_thread_and_save`
2. 修改 `feishu_self_notify` 自动提取 thread ID
3. 移除手动 save_task_thread_id 调用
