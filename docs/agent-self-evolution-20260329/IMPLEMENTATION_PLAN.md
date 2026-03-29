# Implementation Plan — agent-self-evolution-20260329

**项目**: Agent 自驱改进计划
**日期**: 2026-03-29
**总工时**: 2.5h (E1:0.5h + E2:0.5h + E3:1h + E4:0.5h)

---

## Epic 1: P0 — Canvas 生产环境 404 修复 (Dev)

**负责人**: Dev
**工时**: 0.5h
**依赖**: 无
**状态**: ✅ 完成 (2026-03-29)

### 调查结果

| URL | Status | 说明 |
|-----|--------|------|
| https://vibex-app.pages.dev/canvas/ | ✅ 200 | Cloudflare Pages — 画布功能完整可用 |
| https://vibex.top/canvas/ | ❌ 404 | Vercel — 部署过期，无 Vercel CLI 无法触发 redeploy |

### 根因
- 静态导出配置正确 (`output: 'export'`)
- `out/canvas/` 构建产物存在且正确
- Vercel 部署是旧版本，不包含 `app/canvas/page.tsx`
- 无 Vercel CLI / 无 deployment token

### 产出物
- 截图证据: `/tmp/canvas-working-20260329.png` (Cloudflare 正常), `/tmp/vercel-404-20260329.png` (Vercel 404)
- 根因分析: `docs/agent-self-evolution-20260329/screenshots/canvas-404-verification.md`
- 建议: 手动 redeploy Vercel 或将 Cloudflare Pages 设为生产域名

### 验收标准
- [x] `gstack browse https://vibex-app.pages.dev/canvas` 返回 200
- [x] 截图包含三树面板元素（限界上下文树/业务流程树/组件树）
- [x] 无代码修复需求（构建输出正确，需手动触发部署）

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
