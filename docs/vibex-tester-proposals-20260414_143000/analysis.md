# 需求分析：vibex-tester-proposals-20260414_143000

> **分析方**: Analyst Agent  
> **分析日期**: 2026-04-14  
> **主题**: Tester 提案需求分析（测试与质量保障）  
> **关联项目**: vibex-tester-proposals-20260414_143000

---

## 执行决策

- **决策**: 已采纳（部分）
- **执行项目**: vibex-tester-proposals-20260414_143000
- **执行日期**: 2026-04-14

---

## 1. 业务场景分析

### 业务价值

Tester 提案聚焦 VibeX 项目的**质量保障体系**，通过系统化的测试策略确保各提案实施后的功能稳定。当前 VibeX 测试现状：
- Canvas 相关功能已有 Epic2/Epic1 测试通过记录
- 设计系统（design-parser）有 generate-catalog 测试覆盖
- 后端 API（Flows CRUD + Snapshot）有单元测试
- **缺失**：跨提案回归测试、E2E 测试基线

核心业务价值：
- Sprint 1 提案实施后，必须有基线测试防止回归
- Dev P0-1/P0-2 修复后，CI 质量门禁才能可信
- P-004 Canvas Phase 导航修复后，需要端到端验证

### 目标用户

| 用户 | 使用场景 |
|------|---------|
| Dev Agent | 依赖可信的 CI 质量门禁（tsc + vitest）进行自信重构 |
| Coord Agent | 依据测试覆盖率判断提案实施质量 |
| PM Agent | 根据 E2E 验证结果判断功能是否可上线 |

---

## 2. 核心 JTBD（Jobs-To-Be-Done）

1. **When** Dev 修改了 Canvas 组件，**I want** CI 自动运行相关单元测试，**So that** 不会意外破坏已有功能
2. **When** Sprint 1 提案合并到主干，**I want** 有一份 E2E 测试基线，**So that** 能在部署前发现集成问题
3. **When** Dev P0-1 修复 tsconfig，**I want** `tsc --noEmit` 返回零错误，**So that** 类型检查真正可信
4. **When** P-004 Canvas Phase 导航修改，**I want** 有边界测试（刷新/导入/跨 Phase 切换），**So that** TabBar 无障碍后遗症不再复发
5. **When** 团队新增功能，**I want** 有一套测试覆盖率基线（> 60%），**So that** 长期债务有量化指标

---

## 3. 技术方案选项

### 方案A：基于现有 Vitest 框架扩展（推荐）

**描述**: 利用现有 `vitest` 测试基础设施（已有 52 个单元测试），为 Sprint 1 每个提案补充对应的单元测试 + 至少 1 个 E2E 测试。  
**优势**:
- 沿用现有框架，无学习成本
- 可集成到 CI pipeline
- 测试代码可与组件同目录

**劣势**:
- Vitest 目前有 P0-2 问题（测试文件被 exclude），需先修复

### 方案B：引入 Playwright E2E 测试体系

**描述**: Playwright 补充端到端测试，覆盖 Canvas 主流程 + Auth 登录 + 项目 CRUD。  
**优势**:
- 真实浏览器环境，逼近用户操作
- CI 可集成截图 diff

**劣势**:
- 工时估算 16-24h，超出 Sprint 1 范围
- Playwright 环境配置有额外成本

**当前决策**: 方案A。Sprint 1 内每个提案配套 2-3 个单元测试，E2E 测试纳入 Sprint 2 规划。

---

## 4. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| **Dev P0-1 tsconfig 修复** | ✅ 可行 | 1h，修改 tsconfig.json，立即验证 |
| **Dev P0-2 测试文件 exclude 修复** | ✅ 可行 | 2h，移除 exclude 规则，验证 tsc 捕获 |
| **Sprint 1 提案配套测试** | ⚠️ 有条件 | 需 P0-1/P0-2 先修复，CI 才可信 |
| **E2E 基线测试** | ⚠️ 有条件 | 需 Playwright 环境配置完成 |

---

## 5. 初步风险识别

### 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| P0-2 修复后现有测试文件有大量类型错误 | 🔴 高 | 先在干净分支跑 `tsc --noEmit`，统计错误数量 |
| Vitest 测试运行时间过长（> 5min） | 🟠 中 | 分类：unit/integration/e2e，CI 分开运行 |
| Playwright E2E 在 CI 环境不稳定 | 🟠 中 | 使用 `@playwright/test` + 固定版本，配置 retry |

### 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 测试覆盖率目标定得太高（> 80%）导致开发速度下降 | 🟠 中 | Sprint 1 目标设为 60%，后续逐步提升 |
| Dev 跳过测试提交代码 | 🟡 低 | CI 必须通过才能 merge，强制执行 |

### 依赖风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Dev P0-1/P0-2 修复是测试可行性的前置依赖 | 🟠 中 | 必须排 Sprint 1 最先执行 |
| E2E 依赖 Playwright 安装在 CI runner | 🟡 低 | 用 Docker 镜像固化环境 |

---

## 6. 验收标准

- [ ] `cd vibex-backend && npx tsc --noEmit` 无任何错误输出
- [ ] `cd vibex-frontend && npx tsc --noEmit` 无任何错误输出（包含测试文件）
- [ ] `vitest run` 在 CI 中成功执行，退出码 0
- [ ] P-001 (Auth) 配套 2 个视觉回归测试（dark theme 验证）
- [ ] P-004 (Canvas Phase) 配套 3 个边界测试（刷新/导入/Phase 切换）
- [ ] Dev P0-3 (Bundle) 配套 bundle size 阈值测试（< 500KB 增长）
- [ ] CI pipeline 中 Vitest 测试总运行时间 < 3min

---

## 7. Git History 分析记录

| 提交 | 关联度 | 说明 |
|------|--------|------|
| `3bad72a2` test(design): Epic2-Stories — 52 unit tests + parser fix | 🟢 高 | 最新测试质量锚点，52 个测试全部通过 |
| `da11de72` test(design): Epic1-Stories — 52 unit tests + parser fix | 🟢 高 | Epic1 测试模式：unit tests + parser verification |
| `9de1e1e7` docs(vibex): Epic2-Stories 验收标准核实完成 | 🟢 高 | 测试→验收→文档链路已跑通 |
| `c089102f` docs(vibex): Epic1-Stories 验收标准核实完成 | 🟢 中 | 验收文档格式规范参考 |
| `00061ff3` feat(canvas): Phase2 P1 — 18 snapshot 单元测试 | 🟢 高 | Canvas 测试规模参考 |

**结论**: 测试基础设施已验证可用（Vitest + snapshot testing）。Sprint 1 测试任务有成熟模式可循，风险可控。关键前置：Dev P0-1/P0-2 必须先修复。

---

*分析完成 | Analyst Agent | 2026-04-14*
