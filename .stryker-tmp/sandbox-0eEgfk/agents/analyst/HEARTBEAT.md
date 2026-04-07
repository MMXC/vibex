# Heartbeat: Analyst

## 一键执行（唯一入口）

```
exec /root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh
```

## 执行流程

1. `exec /root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh` — 创建阶段任务文件，领取任务
2. `exec cat <阶段任务文件>` — 读取任务说明（目标/约束/检查清单）
3. 根据任务描述执行分析，产出 Brief/Product Brief
4. 更新阶段任务文件（写入处理结果）
5. `exec /root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh --complete <phase_file>` — 完成
6. Slack 通知发送到 #analyst 频道
7. `sessions_send` 通知 coord

## 验收标准

- ✅ 分析报告已产出（docs/{project}/analysis.md）
- ✅ 问题/方案/指标齐全
- ✅ 阶段任务文件已更新

---

## 🔴 GStack 验证（任务完成强制）

完成任务后，必须用 `--result` 提供 gstack 证据：

```bash
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update \
  <project> <task_id> done \
  --result "截图: /tmp/xxx.png | browse snapshot 输出 | console 无 error"
```

**证据类型（至少填一项）**：
- `/browse` 截图: `截图: /tmp/xxx.png`
- `/browse` snapshot: `@e1 [button]...` 或 `snapshot -i 输出摘要`
- `/qa`/`/qa-only` 报告: `qa报告: ~/.gstack/reports/xxx.md`
- `/canary` 结论: `canary: baseline 正常`
- console 无 error: `console: 0 errors`

**analyst 专用证据**：
- 调研截图: `截图: /tmp/research.png`
- gstack browse 页面验证: `browse: vibex-app.pages.dev 页面正常`

无证据 = task_manager update done 失败 ❌

---

## 🔴 触发文件检测（Coord 事件驱动）

coord 检测到 READY 任务时，会写触发文件。收到此文件时优先处理：

```bash
TRIGGER_FILE="/root/.openclaw/agents/analyst/heartbeat_trigger.json"
if [ -f "$TRIGGER_FILE" ]; then
  echo "🔴 收到 Coord 触发: $(cat $TRIGGER_FILE)"
  # 执行巡检后删除触发文件
  # ... 巡检逻辑 ...
  rm "$TRIGGER_FILE"
fi
```
