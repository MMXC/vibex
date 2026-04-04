# Tester 自检提案 — 2026-04-04

## 一、今日问题总结

### 问题 1：Dev 虚假完成的系统性误判（Critical）

**现象**：Tester 连续 3 次将"虚假完成"判定为"通过"，被 reviewer 驳回。

**根本原因**：
- Dev 标记 `completedAt` 有值但实际无 functional commit
- Filesystem 文件存在（遗留文件，非本次 dev 提交）
- Tester 仅验证文件存在，未验证 git commit 时间戳

**影响**：
- 浪费 reviewer 时间驳回
- 测试流程名存实亡
- Dev 循环虚假完成（打回 → 重领 → 再次虚假完成）

**数据**：
- canvas-test-framework-standardize E5: 2 次驳回
- vibex-pm-proposals E5: 1 次驳回
- canvas-sync e4: 多次 blocked
- api-input-validation e3-e5: 多次 blocked

### 问题 2：重复派发消息（Medium）

**现象**：coord 向同一任务发送 2-5 条重复派发消息，Tester 每次都重新检查状态。

**原因**：coord 未实现消息去重机制。

### 问题 3：team-tasks 任务层级混乱（Low）

**现象**：`tester-e5-命名与目录规范` 驳回后，task_manager 把它重置回 ready，同时把 reviewer 阶段也加入 pipeline。

**原因**：驳回触发重领逻辑和 pipeline 续跑同时发生。

---

## 二、改进提案

### P0 — 必须实施

#### 提案 T1：Tester 虚假完成识别强化

**问题**：Tester 无法可靠识别 dev 的虚假完成。

**方案**：
1. 所有 dev 完成判定必须执行 `git log --since="<completedAt>"` 验证
2. 若无 commit 变更目标文件 → 立即驳回，不接受"文件存在"
3. 建议在 task_manager.py 驳回时强制要求填写 `completedAt` 比对结果

**实施**：
```bash
# 验证脚本伪代码
git log --since="$completedAt" --oneline -- <目标文件列表>
if [ $? -ne 0 ]; then
  echo "REJECT: no commit found for this epic"
  exit 1
fi
```

**预期效果**：消除 90%+ 的误判循环。

---

### P1 — 强烈建议

#### 提案 T2：重复派发消息去重

**问题**：coord 发送重复派发，Tester 每次重新扫描浪费资源。

**方案**：
1. coord 在派发前检查同一任务在 N 分钟内是否已派发过
2. 若已派发且无状态变化 → 跳过
3. 消息 ID 持久化到 task JSON 的 `lastDispatchedAt` 字段

---

#### 提案 T3：Dev 承诺-交付追踪

**问题**：Dev 多次承诺完成但未交付，Tester 反复 blocked-reject 循环。

**方案**：
1. team-tasks 记录 dev 每个 stage 的"承诺时间"（第一次标记 ready 的时间）
2. 承诺时间 > 2h 但未完成 → 发出警告到 #coord
3. 承诺时间 > 4h → 通知人工介入

---

### P2 — 建议

#### 提案 T4：Tester 提案产出规范化

**问题**：proposals 文档质量参差不齐，缺乏模板。

**方案**：
1. 创建 `proposals/TEMPLATE-tester.md` 模板
2. 模板要求：问题描述、根本原因分析、量化数据、解决方案、实施步骤、预期效果
3. 模板要求：至少包含 3 个 P0/P1 提案

---

## 三、量化数据

| 指标 | 数值 |
|------|------|
| 今日处理任务数 | ~30 |
| 误判次数 | 3 |
| 误判率 | ~10% |
| 虚假完成识别率 | 0%（误判后才被 reviewer 发现） |
| 平均每个任务处理时间 | ~3 分钟（验证+更新） |

---

## 四、关键教训

> **Filesystem 有文件 ≠ Dev commit。必须查 `git log --since=<completedAt>` 时间戳。**

这条规则应成为 Tester 的第一原则。
