# Spec — 全部 Epic 技术规格汇总

> **项目**: vibex-architect-proposals-20260414_143000
> **汇总**: E1 + E2 + E3 + E4 全部 Epic 规格
> **日期**: 2026-04-14

---

## Epic 总览

| Epic ID | Epic 名称 | Story 数量 | 总工时 | Sprint | 状态 |
|---------|-----------|-----------|--------|--------|------|
| E1 | 品牌一致性修复 | 1 | 4h | Sprint 1 | ✅ 进 PRD |
| E2 | API 质量保障 | 2 | 16h | Sprint 1-2 | ✅ 进 PRD |
| E3 | 测试体系建设 | 1 | 12h | Sprint 2 | ✅ 进 PRD |
| E4 | 架构演进 | 3 | 88h+ | Architect Track | ⚠️ 不进产品提案 |

---

## 全部功能点汇总

| ID | 功能点 | Epic | Story | 验收标准数 | 页面集成 |
|----|--------|------|-------|-----------|---------|
| E1.S1.F1.1 | `/pagelist` 样式重写 | E1 | E1.S1 | 3 | 【需页面集成】`/pagelist` |
| E2.S1.F1.1 | API 错误格式统一 | E2 | E2.S1 | 4 | 无（后端改造） |
| E2.S2.F1.1 | API 版本管理策略 | E2 | E2.S2 | 4 | 无（架构规范） |
| E3.S1.F1.1 | 测试覆盖率提升 + Vitest 修复 | E3 | E3.S1 | 6 | 无（测试配置） |

---

## 全部 Story 汇总

| Story ID | Story 名称 | Epic | 工时 | Sprint | 验收标准数 |
|----------|------------|------|------|--------|-----------|
| E1.S1 | `/pagelist` 风格修复 | E1 | 4h | Sprint 1 | 3 |
| E2.S1 | API 错误格式统一 | E2 | 8h | Sprint 1 | 4 |
| E2.S2 | API 版本管理策略 | E2 | 8h | Sprint 2 | 4 |
| E3.S1 | 测试覆盖率提升 | E3 | 12h | Sprint 2 | 6 |
| E4.S1 | 路由重组（条件成熟时） | E4 | 24h+ | Architect Track | 待定 |
| E4.S2 | 前端 Store 重构（条件成熟时） | E4 | 16h | Architect Track | 待定 |
| E4.S3 | 单体服务拆分（依赖 E4.S1） | E4 | 32h | Architect Track | 待定 |

---

## 全部验收标准（Given/When/Then）

### E1 — 品牌一致性修复

| ID | Given | When | Then |
|----|-------|------|------|
| E1.S1.F1.1.AC1 | 用户访问 `/pagelist` | 页面加载 | 背景色为深色，无浅灰白背景 |
| E1.S1.F1.1.AC2 | CSS 变量定义 | 页面渲染 | `--color-bg-primary` 生效 |
| E1.S1.F1.1.AC3 | 开发者运行构建 | 构建完成 | 无 CSS module 错误 |

### E2 — API 质量保障

| ID | Given | When | Then |
|----|-------|------|------|
| E2.S1.F1.1.AC1 | API 返回任何错误 | 响应到达 | `{ error: { code, message, details } }` |
| E2.S1.F1.1.AC2 | 前端调用 API 传无效参数 | 收到 400 | `error.code` = `INVALID_PARAMS` |
| E2.S1.F1.1.AC3 | AI 服务超时 | 收到 504 | `error.code` = `AI_SERVICE_TIMEOUT` |
| E2.S1.F1.1.AC4 | lint 检测路由文件 | 检测完成 | 无违规错误格式 |
| E2.S2.F1.1.AC1 | 新增 API 路由 | 路由创建 | 在 `/v{n}/` 前缀下 |
| E2.S2.F1.1.AC2 | 旧路由（无版本前缀） | lint 扫描 | 触发警告（非阻断） |
| E2.S2.F1.1.AC3 | OpenAPI 文档生成 | 生成完成 | 包含版本化路径 |
| E2.S2.F1.1.AC4 | lint 检查脚本运行 | 运行完成 | 无新增未版本化路由 |

### E3 — 测试体系建设

| ID | Given | When | Then |
|----|-------|------|------|
| E3.S1.F1.1.AC1 | 开发者运行测试 | 执行完成 | exit code = 0 |
| E3.S1.F1.1.AC2 | CI 环境运行测试 | 完成 | 无 "cannot find module" |
| E3.S1.F1.1.AC3 | 运行覆盖率报告 | 完成 | coverage-summary.json 存在 |
| E3.S1.F1.1.AC4 | 覆盖率检测 | 完成 | 达到 thresholds 配置 |
| E3.S1.F1.1.AC5 | 新组件未写测试 | PR 创建 | CI coverage threshold 失败 |
| E3.S1.F1.1.AC6 | API client 模块 | 覆盖率报告 | 行覆盖率 >= 80% |

---

## 依赖关系图

```
[Sprint 1]
  E1.S1 (4h) ─────────────┐
  E2.S1 (8h) ─────────────┤──→ Sprint 1 完成

[Sprint 2]
  E2.S2 (8h) ──→ [E4.S1 路由重组 前提条件]
  E3.S1 (12h) ────────────┤──→ Sprint 2 完成

[Architect Track]
  E4.S1 (24h+) ←── [依赖 E2.S2 API 版本化]
  E4.S2 (16h) ←── 独立
  E4.S3 (32h) ←── [依赖 E4.S1 路由重组]
```

---

## 风险汇总

| 风险 | 关联 Epic | 等级 | 缓解措施 |
|------|-----------|------|----------|
| `/pagelist` 删除影响外部链接 | E1 | 🔴 | 已决策保留修复 |
| 组件去重选错 canonical | E4 | 🟠 | diff 分析 + code review |
| 路由重组影响外部 API | E4 | 🔴 | 先做 E2.S2 版本化 |
| Vitest CI 环境差异 | E3 | 🟠 | CI 环境适配脚本 |
| 错误格式迁移 Breaking Change | E2 | 🟠 | 仅规范化，不改业务逻辑 |

---

## 执行时间线

```
2026-04-14 ───────────────────────────────────
  ├─ PRD + Specs 完成（今日）
  └─ Sprint 1 开始准备

Sprint 1（预计 1 周）:
  ├─ E1.S1 `/pagelist` 修复 (4h)
  └─ E2.S1 API 错误格式统一 (8h)

Sprint 2（预计 1 周）:
  ├─ E2.S2 API 版本管理 (8h)
  └─ E3.S1 测试体系建设 (12h)

Architect Track（条件成熟时启动）:
  ├─ E4.S1 路由重组 (24h+)
  ├─ E4.S2 前端 Store 重构 (16h)
  └─ E4.S3 单体服务拆分 (32h)
```

---

*PM | 2026-04-14*
