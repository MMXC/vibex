# AGENTS.md — agent-self-evolution-20260329 开发约束

**项目**: Agent 自驱改进计划
**日期**: 2026-03-29

---

## 红线约束

1. **禁止直接修改 Vercel 生产配置** — 先用 gstack 验证，确认根因后再修复
2. **Phase 文件必须使用 overwrite 模式** — 不再追加 `[任务完成]` 块
3. **HEARTBEAT.md / SOUL.md 修改前必须备份** — 用 git commit
4. **Canvas 404 修复前必须验证生产环境** — 用 gstack browse 截图留证

---

## 各 Agent 职责

### Dev
- E1: Canvas 404 修复（先验证再修复）
- E4: Phase 文件模板创建 + HEARTBEAT.md 更新
- 所有改动必须 git commit

### Analyst
- E2: Epic 规模标准化逻辑加入 SOUL.md
- Epic 创建前必须检查功能点数量（3-5 个）

### Tester
- E3: HEARTBEAT.md 增加 `~/.gstack/reports/` 扫描逻辑
- 扫描间隔与心跳一致（每 15 分钟）
- 测试通过率 < 80% 必须告警

---

## 验收标准

| Epic | 验收方式 |
|------|----------|
| E1 Canvas | gstack browse 截图 + status 200 |
| E2 Epic标准化 | Analyst SOUL.md 包含规范 |
| E3 Tester扫描 | 放入报告后自动生成 phase 文件 |
| E4 Phase文件 | phase-file-template.md 存在 + 文件增长 < 10% |
