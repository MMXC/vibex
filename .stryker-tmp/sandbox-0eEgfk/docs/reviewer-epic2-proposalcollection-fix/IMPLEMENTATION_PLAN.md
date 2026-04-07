# Implementation Plan: reviewer-epic2-proposalcollection-fix

**项目**: reviewer-epic2-proposalcollection-fix
**Architect**: architect
**日期**: 2026-03-23
**状态**: ✅ 完成

---

## 1. 实施计划

| Phase | 内容 | 负责 | 工期 |
|-------|------|------|------|
| Phase 1 | 立即修复：复制提案到正确路径 | Dev | 0.5h |
| Phase 2 | 修改 reviewer-heartbeat.sh 脚本 | Dev | 1h |
| Phase 3 | 创建 AGENT_CONVENTIONS.md | PM | 0.5h |
| Phase 4 | 验证修复效果 | PM/Coord | 0.5h |

**预计总工期**: 2.5 小时

---

## 2. Phase 详细计划

### Phase 1 — 立即修复 (0.5h)

**任务**:
1. 创建目录 `mkdir -p /root/.openclaw/vibex/docs/proposals/20260323/`
2. 复制文件: `cp /root/.openclaw/workspace-reviewer/proposals/20260323/reviewer-self-check.md /root/.openclaw/vibex/docs/proposals/20260323/reviewer.md`
3. 验证: `diff` 确认内容一致
4. 重命名: 修改文件内容中的 header 为标准格式（可选）

**验收标准**:
- [ ] `test -f /root/.openclaw/vibex/docs/proposals/20260323/reviewer.md`
- [ ] `diff` 无输出（内容一致）

---

### Phase 2 — 修改 reviewer-heartbeat.sh (1h)

**任务**:
1. 编辑 `/root/.openclaw/scripts/heartbeats/reviewer-heartbeat.sh`
2. 在脚本顶部添加 `PROPOSAL_OUT` 常量定义
3. 在文件写入前添加 `mkdir -p "$(dirname "$PROPOSAL_OUT")"`
4. 修改文件写入路径为 `PROPOSAL_OUT`
5. 添加路径契约注释

**验收标准**:
- [ ] `bash -n reviewer-heartbeat.sh` 退出码 0
- [ ] `grep -q "vibex/docs/proposals" reviewer-heartbeat.sh`
- [ ] `grep -q "mkdir -p" reviewer-heartbeat.sh`

---

### Phase 3 — 创建 AGENT_CONVENTIONS.md (0.5h)

**任务**:
1. 创建 `/root/.openclaw/vibex/docs/proposals/AGENT_CONVENTIONS.md`
2. 写入路径规范内容

**验收标准**:
- [ ] 文件存在
- [ ] 包含 `proposals/YYYYMMDD/{agent}.md` 路径规范

---

### Phase 4 — 验证修复效果 (0.5h)

**任务**:
1. 运行 proposals-summary 脚本（或手动检查）
2. 确认 reviewer 状态为 ✅
3. 测试明日 (20260324) 提案收集路径正确

**验收标准**:
- [ ] `proposals-summary-20260323.md` 中 reviewer 行无 ⚠️ 标记
- [ ] 明日提案可写入正确路径

---

## 3. 验收检查清单

- [ ] 提案文件在 vibex 共享目录存在
- [ ] reviewer-heartbeat.sh 语法正确
- [ ] reviewer-heartbeat.sh 写入 vibex 共享路径
- [ ] AGENT_CONVENTIONS.md 文档化路径规范
- [ ] 协调层可见 reviewer 提案

---

**实施计划完成**: 2026-03-23 09:34 (Asia/Shanghai)
