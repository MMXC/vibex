# Epic 6 Spec: 状态同步机制

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 6  
**负责人**: coord

---

## 1. 功能规格

### S6.1 coord 派发前状态校验

**输入**: coord 收到的任务派发请求  
**处理**:
1. coord 读取 `~/.openclaw/workspace-coord/tasks/vibex-tester-proposals-20260402_201318/tasks.json`
2. 在派发前检查任务状态：
   - 状态为 `ready` → 正常派发
   - 状态为 `done` → 拒绝派发，记录 "Task already completed"
   - 状态为 `rejected` → 拒绝派发，记录 "Task rejected, awaiting fix"
   - 状态为 `in-progress` → 拒绝派发，记录 "Task already in progress"
3. 仅派发 `ready` 状态的任务

**输出**: coord 派发日志，状态校验记录

**期望行为**:
```
[coord] Checking task vibex-tester-proposals-20260402_201318/create-prd
[coord] Status: done → skip dispatch (already completed)
```

---

### S6.2 修复通知标注

**输入**: dev 修复后的 Slack 消息  
**处理**:
1. dev 修复驳回项后，在 Slack 明确标注：
   - 格式：`✅ 已修复，请重新测试 | 项目: <name> | Epic: <id> | 修复内容: <brief>`
2. coord 识别此标注后，更新任务状态为 `ready`
3. coord 重新派发任务给 tester

**输出**: 规范化修复通知模板

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | coord 不再派发非 ready 状态任务 | 模拟测试：派发 done/rejected 状态任务，coord 拒绝 |
| E2 | 修复通知格式规范化 | dev 修复 Slack 消息符合 `✅ 已修复，请重新测试 | 项目: X | Epic: Y` 格式 |
| E3 | 状态同步后任务正常重新派发 | 模拟：rejected → 修复标注 → ready → 正常派发 |
