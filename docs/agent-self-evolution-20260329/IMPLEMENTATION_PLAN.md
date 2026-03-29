# Implementation Plan — agent-self-evolution-20260329

**项目**: Agent 自驱改进计划
**日期**: 2026-03-29
**总工时**: 2.5h (E1:0.5h + E2:0.5h + E3:1h + E4:0.5h)

---

## Epic 1: P0 — Canvas 生产环境 404 修复 (Dev)

**负责人**: Dev
**工时**: 0.5h
**依赖**: 无

### 任务步骤

1. 用 gstack 验证 `/canvas` 生产环境状态
2. 检查 Next.js 路由配置 (`app/canvas/` 或 `pages/canvas.tsx`)
3. 检查 `vercel.json` / `next.config.js` 路由规则
4. 若配置缺失，补充路由并触发 redeploy
5. 用 gstack browse 截图验证修复

### 验收标准
- `gstack browse https://[domain]/canvas` 返回 200
- 截图包含画布元素（非 404 错误页）

### 产出物
- PR 或 Vercel deployment 记录
- gstack 截图证据

---

## Epic 2: P1 — Epic 规模标准化 (Analyst)

**负责人**: Analyst
**工时**: 0.5h
**依赖**: 无

### 任务步骤

1. 读取当前 Analyst SOUL.md
2. 增加「Epic 规模自检」逻辑：创建 Epic 前检查功能点数量
3. 若功能点 > 5，按优先级排序并拆分为 sub-Epic
4. 更新 SOUL.md 记录此规范

### 验收标准
- Analyst SOUL.md 包含 Epic 规模规范
- 下次创建 Epic 时自动检查功能点数量

### 产出物
- 更新的 Analyst SOUL.md

---

## Epic 3: P2 — Tester 主动扫描机制 (Tester)

**负责人**: Tester
**工时**: 1h
**依赖**: E2（Epic 规模标准化）

### 任务步骤

1. 读取当前 Tester HEARTBEAT.md
2. 增加「扫描 `~/.gstack/reports/`」逻辑
3. 每心跳检查新报告，若有则生成 phase 分析文件
4. 测试通过率 < 80% 时触发告警

### 验收标准
- `~/.gstack/reports/` 中放入测试报告后，Tester 自动生成分析 phase 文件

### 产出物
- 更新的 Tester HEARTBEAT.md

---

## Epic 4: P3 — Phase 文件格式升级 (Dev)

**负责人**: Dev
**工时**: 0.5h
**依赖**: 无

### 任务步骤

1. 创建 `vibex/scripts/phase-file-template.md`
2. 更新 Dev HEARTBEAT.md：使用 `--overwrite` 模式写 phase 文件
3. 批量为现有 phase 文件添加 `__FINAL__` 标记（仅追加，不改内容）

### 验收标准
- `phase-file-template.md` 存在且符合规范
- 多次执行同一 agent 任务，phase 文件大小增长 < 10%

### 产出物
- `vibex/scripts/phase-file-template.md`
- 更新的 Dev HEARTBEAT.md

---

## 依赖关系

```
E1 (Dev Canvas) ← 无依赖
E2 (Analyst Epic标准化) ← 无依赖
E3 (Tester主动扫描) ← 依赖 E2（Epic 规范）→ 可并行
E4 (Dev Phase文件) ← 无依赖 → 可并行

E1 和 E2 可并行执行
E3 依赖 E2，E4 无依赖 → 可并行
```

## 排期建议

| Day | 任务 |
|-----|------|
| Day 1 AM | Dev E1 + E4 并行 |
| Day 1 PM | Analyst E2 + Tester E3 并行 |
