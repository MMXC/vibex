# Feature List — wow-harness OpenClaw 实装验证

**项目**: vibex
**基于**: Analyst 报告 (analysis.md)
**日期**: 2026-04-13
**Plan 类型**: feat
**Plan 深度**: Standard
**推荐方案**: 方案 A（精选机制集成）

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | Review agent 工具白名单配置 | 定义 review 类 agent 的 tools 白名单（只含 Read/Grep/sessions_history），通过 config 文件管理 | JTBD-1, AC-1 | 1h |
| F1.2 | sessions_spawn 审查隔离 | spawn 审查类 agent 时传入 tools 白名单，物理上禁止写文件 | JTBD-1, AC-1 | 1h |
| F2.1 | D8 机械化 build+test 验证 | 任务完成前强制执行 `pnpm build && pnpm test`，解析退出码 | JTBD-3, AC-2 | 2h |
| F2.2 | progress.json 写入 | D8 check 通过后写入 `progress.json`（status/pass/timestamp） | JTBD-3, AC-2 | 0.5h |
| F2.3 | task_manager.py D8 钩子 | 在 task_manager.py 中插入 D8 check 调用点 | JTBD-3, AC-2 | 1h |
| F2.4 | D8 check 失败阻塞交付 | D8 check 未 pass 时 task status 保持 pending，不允许 done | JTBD-3, AC-2 | 0.5h |
| F3.1 | Edit 次数追踪 | 跟踪同一文件的 Edit/Write 调用次数，以文件路径为 key | JTBD-2, AC-3 | 1h |
| F3.2 | Loop 警告注入 | 同一文件 >5 次编辑时，在 additionalContext 注入警告 | JTBD-2, AC-3 | 1h |
| F3.3 | 阈值可配置 | 阈值通过 config 文件配置（默认 5，支持调整） | JTBD-2, AC-3 | 0.5h |
| F4.1 | Session metrics 收集 | 心跳增强：记录 tool 调用频次、guard 命中数、agent 类型 | JTBD-4, AC-4 | 1h |
| F4.2 | metrics JSONL 写入 | 将 metrics 追加写入 `~/.openclaw/sessions/{sessionId}/metrics.jsonl` | JTBD-4, AC-4 | 0.5h |
| F5.1 | Risk 操作频次记录 | 记录 Bash/Edit/Write 调用频率，写入 metrics | JTBD-4, AC-5 | 1h |
| F5.2 | Risk 高频警告 | 单次 session 中某类操作超过阈值时注入提醒 | JTBD-4, AC-5 | 0.5h |
| F6.1 | Pattern DB 初始化 | 创建 `~/.openclaw/failure-patterns.jsonl`，维护失败模式集合 | JTBD-5, AC-6 | 1h |
| F6.2 | Pattern lookup 接口 | 提供函数查询 pattern DB，返回已知解决方案 | JTBD-5, AC-6 | 1h |

**总工时**: ~14h（约 2 个工作日）

---

## Epic 划分

| Epic | 主题 | 包含功能 | 工时 |
|------|------|---------|------|
| E1 | Review agent schema-level 隔离 | F1.1, F1.2 | 2h |
| E2 | D8 机械化 progress check | F2.1, F2.2, F2.3, F2.4 | 4h |
| E3 | Loop detection + Session reflection | F3.1, F3.2, F3.3, F4.1, F4.2 | 4h |
| E4 | Risk tracking + Pattern learning | F5.1, F5.2, F6.1, F6.2 | 4h |

---

## 依赖关系

```
E1（隔离）→ 可独立交付，先完成
E2（进度检查）→ 依赖 E1 完成
E3（检测+反射）→ 可独立，与 E2 并行
E4（追踪+学习）→ 依赖 E3 metrics 数据结构
```

---

## 验收条件

- [ ] Review agent spawn 时 tools 白名单生效
- [ ] D8 check 未 pass 时 task status 保持 pending
- [ ] 同一文件 6 次编辑后 additionalContext 含警告
- [ ] metrics.jsonl 包含 tool 频次和 guard 命中数
- [ ] Pattern DB 可查询和追加
