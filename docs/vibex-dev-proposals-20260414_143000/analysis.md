# 需求分析：vibex-dev-proposals-20260414_143000

> **分析方**: Analyst Agent
> **分析日期**: 2026-04-14
> **主题**: Dev 角色提案需求分析（代码质量、开发体验、测试体系、安全）
> **关联项目**: vibex-dev-proposals-20260414_143000

---

## 执行决策

- **决策**: 已采纳（Sprint 1 纳入 P0 清理）
- **执行项目**: vibex-p0-q2-sprint1
- **执行日期**: 2026-04-21

---

## 1. 业务场景分析

### 业务价值

Dev 提案共 14 项，聚焦于开发者体验（DX）和工程质量。核心问题集中在：
- **TypeScript 配置失准**：后端误配 Next.js 插件，测试文件被排除
- **Bundle 失控风险**：lib 目录 2MB，多处缺少 dynamic import 管控
- **测试框架混乱**：Vitest + Jest + Playwright + Stryker 4 套并存
- **安全盲区**：API 认证覆盖不完整，console.log 残留可能泄露数据

业务影响：开发效率被工具链问题拖累，新成员上手成本高，CI 可信度受损。

### 目标用户

| 用户 | 受益场景 |
|------|---------|
| Dev Agent | 日常开发使用正确配置，不被 tsconfig 误导 |
| CI/CD | 类型检查 gate 真正生效，bundle 膨胀可观测 |
| 安全团队 | API 认证覆盖清晰，攻击面可量化 |
| 新成员 | hooks/stores 有规范可循，降低认知负担 |

---

## 2. 核心 JTBD（Jobs-To-Be-Done）

| # | JTBD | 优先级 | 提案关联 |
|---|------|--------|---------|
| JTBD-1 | 修复 tsconfig 让类型检查可信 | 🔴 P0 | P0-1, P0-2 |
| JTBD-2 | 控制 Bundle Size，防止性能劣化 | 🔴 P0 | P0-3 |
| JTBD-3 | 统一测试框架，减少维护摩擦 | 🟠 P1 | P1-1 |
| JTBD-4 | 规范 hooks/stores，降低新人认知负担 | 🟠 P1 | P1-2, P1-3 |
| JTBD-5 | 消除安全盲区（认证+日志） | 🟠 P1 | P1-5, P1-6 |

---

## 3. 技术方案选项

### JTBD-1: TypeScript 配置修复

**方案 A（推荐）：修正配置文件**
- 删除后端 tsconfig 的 `plugins: [{ "name": "next" }]`
- 配置正确的 Cloudflare Workers types
- 修正前端 exclude 列表，纳入测试文件
- 验证：`npx tsc --noEmit` 在 CI 中生效

优点：最小改动，立即生效。
缺点：是一次性修复，后续需 CI gate 保证不回退。

**方案 B：分层 TypeScript 项目**
- 将前后端分离为独立 tsconfig 体系
- 共享类型包 packages/types 作为桥接

优点：长期架构清晰。
缺点：迁移成本高（~16h），本 Sprint 不适合。

### JTBD-2: Bundle Size 控制

**方案 A（推荐）：强制 dynamic import + 预算**
- 所有 lib/ 下模块使用 `dynamic(() => import(...))`
- 在 next.config.js 添加 bundle 预算
- 定期用 @next/bundle-analyzer 检查

优点：改动小，风险低，立即可见效果。
缺点：需要开发团队形成习惯，长期自律。

**方案 B：微前端拆分**
- canvas/canvas-renderer 拆为独立微前端

优点：一劳永逸。
缺点：过度工程，改造成本 40h+，不适合 Sprint 1。

### JTBD-3: 测试框架统一

**方案 A（推荐）：统一到 Vitest**
- 迁移所有 Jest 测试到 Vitest（兼容模式）
- 合并 Playwright 配置（用 projects 参数区分）
- 删除 Stryker（无持续运行）

优点：生态统一，Vitest 速度更快。
缺点：迁移需要 ~24h，分2个 Sprint 执行。

**方案 B：保持现状**
- 仅补充文档说明何时用哪个框架

优点：无迁移成本。
缺点：技术债持续累积。

---

## 4. 可行性评估

| 提案 | 技术可行性 | 工期 | 风险 | 结论 |
|------|-----------|------|------|------|
| P0-1 tsconfig | ✅ 高 | 1h | 低 | 可立即执行 |
| P0-2 test exclusion | ✅ 高 | 2h | 低 | 可立即执行 |
| P0-3 bundle control | ✅ 高 | 8h | 中（需规范执行） | Sprint 1 可完成 |
| P1-1 测试统一 | ⚠️ 中 | 24h | 中（可能有人抗拒） | 拆为 Sprint 2 |
| P1-2 hooks 规范 | ✅ 高 | 4h | 低 | Sprint 1 可完成 |
| P1-3 stores 重构 | ⚠️ 中 | 16h | 中（与 Architect P1-2 重复） | 与 Architect P1-2 合并 |
| P1-4 TODO 清理 | ✅ 高 | 8h | 低 | Sprint 1 可完成 |
| P1-5 认证白名单 | ⚠️ 中 | 12h | 中（需安全评审） | Sprint 2 |
| P1-6 console.log 清理 | ✅ 高 | 4h | 低 | Sprint 1 可完成 |

**总工期评估**：P0（11h）+ Sprint 1 P1（~20h）+ Sprint 2 P1（~36h）+ P2（~58h）= ~125h

---

## 5. 初步风险识别

### 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| P0-1 修复后暴露大量隐藏类型错误 | 高 | 🔴 严重 | **必须先在干净分支评估**，不要在主分支直接修 |
| P0-3 dynamic import 引入循环依赖 | 低 | 🟠 中 | CI bundle 预算作为 gate |
| P1-3 stores slice 迁移过程中状态丢失 | 低 | 🟠 中 | 与 Architect 协调，同步演进 |

### 业务风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| P1-1 迁移 Vitest 后旧 Jest 测试 break | 中 | 🟠 中 | 迁移前先跑全覆盖，迁移后回归 |
| P1-5 认证白名单实施后发现性能问题 | 低 | 🟠 中 | 中间件需做基准测试 |

### 依赖风险

| 风险 | 来源 | 缓解 |
|------|------|------|
| P1-3 stores 重构与 Architect P1-2 重复 | Architect 提案 | 合并为一个 Epic，统一执行 |
| P1-5 认证中间件依赖 Architect P0-3 路由重组 | Architect 提案 | P0-3 是前置依赖，需先完成路由重组 |

---

## 6. 验收标准（可测试）

| # | 验收标准 | 测试方式 |
|---|---------|---------|
| V1 | `cd vibex-backend && npx tsc --noEmit` 无错误 | CI shell |
| V2 | 前端 `pnpm tsc --noEmit` 覆盖所有 .test.ts/.test.tsx 文件 | CI shell |
| V3 | `pnpm build` 后 bundle analyzer 报告显示无单文件 > 100KB | CI + bundle-analyzer |
| V4 | `grep -rn "console\.\(log\|debug\)" vibex-backend/src/ --include="*.ts" --exclude-dir=__tests__` 返回空 | CI pre-commit hook |
| V5 | 所有新 hook 遵循命名规范（use + Domain + Action）且在 stores/index.ts 导出 | ESLint rule + code review |
| V6 | Zustand stores 全部迁移到 slice pattern | code review checklist |
| V7 | TODO 注释 100% 关联 GitHub Issue 格式 | grep + CI 检测 |
| V8 | API routes 认证覆盖白名单文档存在且同步更新 | code review checklist |

---

## 7. Git History 分析记录

### 相关历史提交

| 提交 | 内容 | 教训 |
|------|------|------|
| `9de1e1e7` | Epic2-Stories 验收标准核实 | 测试驱动开发有益，但需先有可信的类型检查 |
| `da11de72` | Epic1-Stories 52 单元测试 + parser fix | 测试覆盖有用，但框架混乱（Jest/Vitest 共存）说明早期无统一规划 |
| `09aabcd1` | Phase2 P1 规模化批量生成 59 套 catalog | 工具链问题在规模化后急剧放大，bundle 问题同理 |
| `15446fcd` | Phase1 P0 设计风格目录工具链 | DX 工具链修复后，开发效率显著提升 |

### 关键教训
1. **工具链问题有放大效应**：在 small scale 不明显，规模扩大后（59 套 catalog）急剧恶化。bundle/P0-1/P0-2 修复应在规模扩大前完成。
2. **测试框架选定要趁早**：Jest/Vitest 混用是历史遗留，后期迁移成本高。
3. **types 安全是持续工作**：learnings 中多次提到类型问题（REAME-test.md, api-contract），说明这是一直存在的风险点。

---

*Analyst Agent | 2026-04-14*
