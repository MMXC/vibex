# Agent Self-Evolution Architecture — 2026-03-29

**项目**: agent-self-evolution-20260329
**作者**: Coord (架构补全)
**日期**: 2026-03-29
**状态**: Draft

---

## 1. 背景

本项目为各 Agent 的每日自检改进计划，基于 `analysis.md` 识别的 P0-P3 问题，制定修复方案。

**核心问题**:
- P0: `/canvas` 生产环境 404 — 核心价值无法触达
- P1: Epic 规模失控（18 功能点/Epic）
- P2: Tester 静默问题（24h 无新阶段）
- P3: Phase 文件膨胀

---

## 2. 架构设计

### 2.1 系统架构（轻量流程改进型）

本项目不涉及代码系统架构，而是 Agent 协作流程的改进。

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent 自驱改进流程                         │
├─────────────────────────────────────────────────────────────┤
│  [P0] Dev                                                   │
│   └─ 修复 /canvas 生产 404                                  │
│   └─ 更新 Phase 文件格式（__FINAL__ 标记）                    │
├─────────────────────────────────────────────────────────────┤
│  [P1] Analyst                                               │
│   └─ Epic 规模标准化（3-5 功能点/Epic）                      │
│   └─ 更新 SOUL.md 记录规范                                    │
├─────────────────────────────────────────────────────────────┤
│  [P2] Tester                                                │
│   └─ 主动扫描 ~/.gstack/reports/                            │
│   └─ 更新 HEARTBEAT.md 增加扫描逻辑                          │
├─────────────────────────────────────────────────────────────┤
│  [P3] Dev                                                   │
│   └─ 创建 phase-file-template.md                            │
│   └─ 批量更新 agent HEARTBEAT.md                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 关键组件

| 组件 | 负责人 | 文件位置 | 说明 |
|------|--------|----------|------|
| Canvas 部署修复 | Dev | N/A | Vercel/Next.js 路由配置 |
| Epic 规模规范 | Analyst | SOUL.md | Analyst 固定工作准则 |
| Tester 主动扫描 | Tester | HEARTBEAT.md | 每心跳扫描 ~/.gstack/reports/ |
| Phase 文件模板 | Dev | vibex/scripts/phase-file-template.md | 标准化 phase 文件格式 |

### 2.3 数据流

```
Analyst 自检 → analysis.md → PRD → 架构设计 → Coord 决策
                                                    ↓
                                              phase2 执行
                                                    ↓
Dev (E1/E4) → Tester (E3) → Reviewer → Reviewer-Push
Analyst (E2) ──────────────────────────────────────┘
```

---

## 3. 技术决策

### T1: Canvas 404 修复方案

**选项 A**: 检查 Next.js App Router (`app/canvas/page.tsx`)
- 若存在，确认 Vercel build 包含

**选项 B**: 检查 Pages Router (`pages/canvas.tsx`)
- 若使用 `vercel.json` 配置，确认路由规则

**推荐**: 选项 A + 验证 Vercel deployment 配置

### T2: Epic 规模标准化

**方案**: Analyst HEARTBEAT.md 增加 pre-flight check
- Epic 创建前扫描功能点数量
- 若 > 5，自动拆分

### T3: Phase 文件格式

**方案**: 使用 `__FINAL__` 标记 + overwrite 模式
- 不再追加 `[任务完成]` 块
- 每次执行覆盖文件

---

## 4. 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| Canvas 404 根因复杂（超出 Dev 权限） | 中 | 先用 gstack 验证，找用户确认 Vercel 配置 |
| Analyst HEARTBEAT.md 修改影响其他流程 | 低 | 先在测试分支验证 |
| Phase 文件批量更新出错 | 低 | 先备份，再用脚本批量处理 |

---

## 5. 非功能性要求

- **可维护性**: 所有改进都记录到对应 Agent 的 SOUL.md / HEARTBEAT.md
- **可回滚**: Phase 文件模板有版本号，支持回滚
- **可验证**: 每个改进有 gstack 验证或人工抽查证据
