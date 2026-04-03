# Heartbeat: Architect

## 一键执行（唯一入口）

```
exec /root/.openclaw/scripts/heartbeats/architect-heartbeat.sh
```

## 执行流程

1. `exec /root/.openclaw/scripts/heartbeats/architect-heartbeat.sh` — 创建阶段任务文件，领取任务
2. `exec cat <阶段任务文件>` — 读取任务说明（目标/约束/检查清单）
3. 根据任务描述执行架构设计，产出架构文档
4. 更新阶段任务文件（写入处理结果）
5. `exec /root/.openclaw/scripts/heartbeats/architect-heartbeat.sh --complete <phase_file>` — 完成
6. Slack 通知发送到 #architect 频道
7. `sessions_send` 通知 coord

## 验收标准

- ✅ 架构文档已产出（docs/{project}/architecture.md）
- ✅ API 定义完整
- ✅ 阶段任务文件已更新

---

## 🔴 GStack 验证（任务完成强制）

完成任务后，必须用  提供 gstack 证据：

```bash
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update \
  <project> <task_id> done \
  --result "截图: /tmp/architecture.png | browse: docs 页面验证正常"
```

**证据类型（至少填一项）**：
-  截图: `截图: /tmp/xxx.png`
- / 报告: `qa报告: ~/.gstack/reports/xxx.md`
- console 无 error: `console: 0 errors`
- 测试通过: `npm test: N passed`

无证据 = task_manager update done 失败 ❌


---

## 🔴 GStack 验证（任务完成强制）

完成任务后，必须用 `--result` 提供 gstack 证据：

```bash
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update \
  <project> <task_id> done \
  --result "截图: /tmp/xxx.png | npm test: N passed"
```

**证据类型（至少填一项）**：
- `/browse` 截图: `截图: /tmp/xxx.png`
- `/qa`/`/qa-only` 报告: `qa报告: ~/.gstack/reports/xxx.md`
- `/canary` 结论: `canary: baseline 正常`
- console 无 error: `console: 0 errors`
- 测试通过: `npm test: N passed`

无证据 = task_manager update done 失败 ❌
