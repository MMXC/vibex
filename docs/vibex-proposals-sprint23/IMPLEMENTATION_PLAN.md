# VibeX Sprint 23 实施计划

**项目**: vibex-proposals-sprint23
**架构师**: Architect Agent
**日期**: 2026-05-03

---

## 1. 执行摘要

Sprint 23 包含 5 个 Epic，16 个 Story，总工时 25h。按依赖关系分三条并行开发线：

1. **独立线**: E4 导出格式（3 个 exporter 可并行）
2. **串行线**: E2 Design Review（按钮 → diff → 后端）
3. **串行线**: E5 模板库（导出 → 版本历史）
4. **独立线**: E1 Slack 报告（CI 配置，无前端依赖）
5. **基础设施线**: E3 Firebase Cursor（字段 → 组件 → throttle）

---

## 2. Sprint 路线图

```
Week 1 (Day 1-3)
├── E1: CI Slack 报告脚本 (1h) ✅
├── E4.1: PlantUML exporter (2h) ✅
└── E5.1: 模板导出 JSON (2h) ✅

Week 1 (Day 4-5) + Week 2 (Day 1)
├── E2.1: 重评按钮 (1h) ✅
├── E2.2: previousReportId 参数 (1h) ✅
├── E2.3: diff 视图 (2h) ✅
├── E4.2: JSON Schema exporter (2h) ✅
└── E5.2: 模板版本历史 (2h) ✅

Week 2 (Day 2-5)
├── E3.1: Firebase cursor 字段 (2h) ✅
├── E3.2: RemoteCursor 组件 (2h) ✅
├── E3.3: 鼠标 throttle (1h) ✅
├── E4.3: SVG exporter + fallback (3h) ✅
└── E2.4: 后端 diff API (2h) ✅

Week 3 (Day 1-2)
├── E3.4: E2E 测试覆盖 cursor sync (1h) ✅
├── 全量 E2E 回归测试
└── pnpm build 验证
```

---

## 3. 详细任务分解

### Epic E1: E2E CI 闭环落地

| Story | 任务 | 工时 | 依赖 | 执行者 |
|-------|------|------|------|--------|
| S1.1 | 创建 `scripts/e2e-summary-slack.ts` | 0.5h | 无 | Dev | :white_check_mark: |
| S1.1 | 修改 `.github/workflows/test.yml` e2e job 末尾调用脚本 | 0.5h | S1.1 | Dev | :white_check_mark: |
| S1.2 | 验证 Block Kit payload 格式 | 0.5h | S1.1 | Dev | :white_check_mark: |
| S1.2 | 测试 Slack webhook 发送 | 0.5h | S1.1 | Dev | :white_check_mark: |

### Epic E2: Design Review 反馈闭环

| Story | 任务 | 工时 | 依赖 | 执行者 |
|-------|------|------|------|--------|
| S2.1 | ReviewReportPanel 添加 re-review-btn | 1h | 无 | Dev | :white_check_mark: |
| S2.2 | useDesignReview 支持 previousReportId | 1h | S2.1 | Dev | :white_check_mark: |
| S2.3 | DiffView 组件（红/绿标记） | 1.5h | S2.2 | Dev | :white_check_mark: |
| S2.3 | diff 算法实现 | 0.5h | S2.2 | Dev | :white_check_mark: |
| S2.4 | POST /design/review-diff 后端 API | 2h | S2.2 | Backend |

### Epic E3: Firebase Cursor Sync 基础

| Story | 任务 | 工时 | 依赖 | 执行者 |
|-------|------|------|------|--------|
| S3.1 | presence.ts 新增 cursor 字段类型 | 0.5h | 无 | Dev |
| S3.1 | Firebase presence 写入 cursor | 0.5h | 无 | Dev |
| S3.1 | cursor 数据验证 | 0.5h | 无 | Dev |
| S3.2 | RemoteCursor 组件开发 | 1.5h | S3.1 | Dev |
| S3.2 | RemoteCursor CSS 样式 | 0.5h | S3.1 | Dev |
| S3.3 | useCursorSync hook（100ms throttle） | 1h | S3.2 | Dev |

### Epic E4: Canvas 导出格式扩展

| Story | 任务 | 工时 | 依赖 | 执行者 |
|-------|------|------|------|--------|
| S4.1 | PlantUML exporter 类 | 1h | 无 | Dev |
| S4.1 | PlantUML 语法验证（StarUML 可打开） | 1h | 无 | Dev |
| S4.2 | JSON Schema exporter 类 | 2h | 无 | Dev |
| S4.3 | SVG exporter 类 | 2h | 无 | Dev |
| S4.3 | SVG 降级策略（try-catch + UI） | 1h | 无 | Dev |

### Epic E5: 需求模板库深耕

| Story | 任务 | 工时 | 依赖 | 执行者 |
|-------|------|------|------|--------|
| S5.1 | 模板导出 JSON（download 触发） | 1h | 无 | Dev |
| S5.1 | 模板导入 JSON（file input） | 1h | S5.1 | Dev |
| S5.2 | 模板历史面板 UI | 1h | S5.1 | Dev |
| S5.2 | localStorage 版本快照存储（≤10） | 1h | S5.1 | Dev |

---

## 4. 依赖关系图

```
E1: Slack 报告
└── S1.1 → S1.2 (串行)

E2: Design Review
└── S2.1 → S2.2 → S2.3 → S2.4 (串行)

E3: Firebase Cursor
└── S3.1 → S3.2 → S3.3 → S3.4 (串行)

E4: 导出格式
├── S4.1 (独立)
├── S4.2 (独立)
└── S4.3 (独立)

E5: 模板库
└── S5.1 → S5.2 (串行)
```

---

## 5. 资源配置

### 开发时间估算

| Epic | 预估工时 | 并行度 | 关键路径 |
|------|---------|-------|---------|
| E1 | 2h | 1 | S1.1 → S1.2 |
| E2 | 6h | 2 | S2.1 → S2.2 → S2.3 → S2.4 |
| E3 | 6h | 2 | S3.1 → S3.2 → S3.3 |
| E4 | 7h | 3 | 均可并行 |
| E5 | 4h | 1 | S5.1 → S5.2 |

### 并行开发策略

- **E1 + E4**: 可同步进行，无交集
- **E2 + E3**: 可同步进行，无交集
- **E5**: 可在 E2/E3 期间完成

**建议**: Sprint 23 由 2 名 Dev 并行执行：
- Dev A: E1 + E2
- Dev B: E3 + E4 + E5

---

## 6. 验收标准

### Sprint 23 整体 DoD

- [ ] 5 Epic 全部完成
- [ ] `pnpm run build` → 0 errors
- [ ] Playwright E2E 覆盖率 > 80%
- [ ] Slack #analyst-channel 收到测试报告（E1）
- [ ] PlantUML 文件可被 StarUML 打开（E4）
- [ ] 模板历史最多 10 个 snapshot（E5）

### DoD 详细检查点

| Epic | 检查点 |
|------|--------|
| E1 | `.github/workflows/test.yml` e2e job 末尾步骤存在 |
| E1 | Slack 消息为 Block Kit 格式，含 pass/fail 摘要 |
| E2 | `data-testid="re-review-btn"` 存在 |
| E2 | diff 视图 added（红）/ removed（绿）标记显示 |
| E3 | RemoteCursor 组件存在 `src/components/presence/RemoteCursor.tsx` |
| E3 | mock 模式下 RemoteCursor 不渲染 |
| E4 | DDSToolbar ExportModal 含 plantuml / svg / schema 选项 |
| E4 | SVG 导出失败显示降级文案 |
| E5 | 模板导出触发 download，导入支持 file input |
| E5 | 历史面板最多显示 10 条 |

---

## 7. 回滚计划

| 场景 | 回滚策略 |
|------|---------|
| E1 Slack 报告失败 | CI job 仍通过（报告脚本失败不影响 exit code） |
| E2 diff 视图出错 | 隐藏 diff 视图，回退到单报告展示 |
| E3 cursor 同步异常 | 关闭 Firebase cursor 写入，RemoteCursor 不渲染 |
| E4 导出格式崩溃 | 降级文案显示，不影响画布操作 |
| E5 版本历史损坏 | localStorage 清理，用户重新开始 |

---

## 8. 里程碑

| 里程碑 | 日期 | 交付物 |
|-------|------|--------|
| M1: Sprint 开始 | Day 1 | E1 Slack 脚本 + E4.1 PlantUML |
| M2: 第一个 Release | Day 5 | E2 重评按钮 + E5 导出 |
| M3: 功能完整 | Day 10 | E3 Cursor + E4 SVG |
| M4: Sprint 结束 | Day 14 | E2 后端 API + 全量测试 |

---

*文档版本: 1.0*
*创建时间: 2026-05-03*
*作者: Architect Agent*