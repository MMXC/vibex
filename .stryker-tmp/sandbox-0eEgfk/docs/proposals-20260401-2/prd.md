# PRD: proposals-20260401-2 — Sprint 2 提案落地

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Sprint 1（E1-E7）完成交付，E6 竞品分析揭示 VibeX 差异化护城河：PRD → 可运行原型端到端。v0.dev 是最强竞品（UI 质量高），但 VibeX 在「导出后使用」仍有摩擦。第二批提案聚焦**消除用户旅程最后一步摩擦** + **工程能力固化**。

### 目标

通过 5 个 Epic 解决 Sprint 1 遗留问题，建立一键部署能力、工程 SOP 和平台扩展性。总工时 30h（P0: 15h，P1: 15h）。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 部署成功率 | ≥ 90% | Vercel API 成功率统计 |
| 回滚 SOP 覆盖率 | 100% | `ROLLBACK_SOP.md` 场景数 ≥ 5 |
| 功能开关使用率 | 新 Epic ≥ 1 个 feature flag | 代码审查 |
| Zustand migration 库复用 | Epic6/7 全部迁移 | `libs/canvas-store-migration/` 调用数 |
| Vue 导出可用性 | 基础组件可运行 | E2E 测试通过 |
| MCP Server 可连接 | Claude Desktop 连接成功 | 集成测试 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 依赖 | 产出文件 |
|------|------|------|--------|------|----------|
| E1 | 一键部署到 Vercel | 6h | P0 | 无 | specs/e1-vercel-deploy.md |
| E2 | 回滚 SOP + 功能开关 | 4h | P0 | 无 | specs/e2-rollback-sop.md |
| E3 | Zustand Migration 库 | 5h | P0 | 无 | specs/e3-zustand-migration.md |
| E4 | Multi-Framework 导出 | 5h | P1 | 无 | specs/e4-multi-framework.md |
| E5 | MCP Server 集成 | 10h | P1 | 无 | specs/e5-mcp-integration.md |

**总工时**: 30h（约 1.5 周 1 人月）

---

### Epic 1: 一键部署到 Vercel

**工时**: 6h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E1-S1 | Vercel API 集成 | 2h | OAuth token 存储 + 部署 API 调用 |
| E1-S2 | 导出面板部署按钮 | 2h | 「Deploy to Vercel」按钮存在 |
| E1-S3 | 部署状态 UI | 2h | 实时显示部署进度 ≤ 60s 出 URL |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Vercel OAuth | 用户授权 VibeX 访问 Vercel 账号 | `expect(oauthRedirect).toContain('vercel.com/oauth')` | ❌ |
| F1.2 | 部署 API | 调用 Vercel API 生成预览部署 | `expect(deployResponse.url).toMatch(/vercel\.app/)` | ❌ |
| F1.3 | 导出面板按钮 | 导出面板增加「Deploy to Vercel」按钮 | `expect(isVisible(deployBtn)).toBe(true)` | 【需页面集成】 |
| F1.4 | 部署状态 | 显示部署进度 spinner + URL | `expect(urlLatency).toBeLessThan(60000)` | 【需页面集成】 |

#### DoD

- [ ] Vercel OAuth 授权流程可完成
- [ ] 部署请求 ≤ 60s 返回可访问 URL
- [ ] 部署失败时显示错误信息
- [ ] reviewer 两阶段审查通过

---

### Epic 2: 回滚 SOP + 功能开关

**工时**: 4h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E2-S1 | 增量修复 SOP | 2h | `ROLLBACK_SOP.md` 包含 5+ 回滚场景 |
| E2-S2 | 功能开关模板 | 1h | `process.env.NEXT_PUBLIC_FEATURE_*` 开关可用 |
| E2-S3 | DoD 对齐机制 | 1h | Epic 开始前 dev/tester 对齐率 ≥ 80% |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 增量修复 SOP | 回滚 = 新 commit 修复，而非 git revert | `expect(sopDoc.scenarios).toBeGreaterThanOrEqual(5)` | ❌ |
| F2.2 | 功能开关 | `NEXT_PUBLIC_FEATURE_*` 环境变量控制功能开关 | `expect(isEnabled('FEATURE_FLAG')).toBe(true\|false)` | ❌ |
| F2.3 | DoD 对齐 | Epic kickoff 会议 checklist（Dev + Tester 签字） | `expect(dodAlignmentRate).toBeGreaterThanOrEqual(0.8)` | ❌ |

#### DoD

- [ ] `docs/process/ROLLBACK_SOP.md` 存在且 ≥ 5 场景
- [ ] 当前 Epic 中至少 1 个 feature flag 已使用
- [ ] SOP 文档经 reviewer 确认

---

### Epic 3: Zustand Migration 库

**工时**: 5h | **优先级**: P0 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E3-S1 | 版本化 Storage 封装 | 2h | `createVersionedStorage()` 可导出 |
| E3-S2 | Epic6/7 migration 迁移 | 2h | Epic6 + Epic7 的 migration 已迁移到库 |
| E3-S3 | Jest 测试覆盖 | 1h | `libs/canvas-store-migration/` 测试覆盖率 ≥ 80% |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 版本化 Storage | `libs/canvas-store-migration/index.ts` 导出 `createVersionedStorage` | `expect(typeof createVersionedStorage).toBe('function')` | ❌ |
| F3.2 | Epic6 迁移 | Epic6 的 `CURRENT_STORAGE_VERSION: 2→3` 已迁移到库 | `expect(epic6UsesLib).toBe(true)` | ❌ |
| F3.3 | Epic7 迁移 | Epic7 的 migration 已迁移到库 | `expect(epic7UsesLib).toBe(true)` | ❌ |
| F3.4 | 测试覆盖 | Jest 测试覆盖 ≥ 80% | `expect(coverage).toBeGreaterThanOrEqual(80)` | ❌ |

#### DoD

- [ ] `libs/canvas-store-migration/index.ts` 存在且导出正确
- [ ] Epic6/Epic7 全部使用新库（无 inline migration）
- [ ] Jest 覆盖率 ≥ 80%
- [ ] reviewer 两阶段审查通过

---

### Epic 4: Multi-Framework 导出

**工时**: 5h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E4-S1 | Vue 代码生成器 | 2h | React → Vue 组件映射表 |
| E4-S2 | 导出面板框架切换 | 1.5h | 面板支持 React/Vue 切换 |
| E4-S3 | 基础组件验证 | 1.5h | Button/Input/Card 在 Vue 下可运行 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | Vue 映射表 | `components/react2vue/mappings.ts` React→Vue 组件映射 | `expect(mappings.Button).toBeDefined()` | ❌ |
| F4.2 | 框架选择器 | 导出面板 React/Vue 下拉切换 | `expect(isVisible(toggle)).toBe(true)` | 【需页面集成】 |
| F4.3 | Vue 运行验证 | Button/Input/Card 导出后可运行（E2E） | `expect(vueComponentsRender).toBe(true)` | ❌ |
| F4.4 | 测试覆盖率 | 映射表 + 生成器单元测试覆盖率 ≥ 80% | `expect(coverage).toBeGreaterThanOrEqual(80)` | ❌ |

#### DoD

- [ ] 导出面板支持 React/Vue 切换
- [ ] Button/Input/Card 在 Vue 下 E2E 测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] reviewer 两阶段审查通过

---

### Epic 5: MCP Server 集成

**工时**: 10h | **优先级**: P1 | **依赖**: 无 | **可并行**: ✅

#### Stories

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| E5-S1 | MCP Server 基础 | 3h | `@vibex/mcp-server` npm 包存在 |
| E5-S2 | Claude Desktop 连接 | 4h | Claude Desktop 可连接并查询项目 |
| E5-S3 | 集成文档 | 3h | `docs/mcp-integration.md` 存在且完整 |

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | MCP Server 包 | `@vibex/mcp-server` 发布到 npm，包含 `server.ts` | `expect(packageJson.name).toBe('@vibex/mcp-server')` | ❌ |
| F5.2 | 项目上下文 API | `tools/getProject` 返回项目结构 | `expect(getProjectTools.length).toBeGreaterThan(0)` | ❌ |
| F5.3 | Claude 连接验证 | Claude Desktop 可发现并连接 VibeX MCP Server | `expect(claudeCanConnect).toBe(true)` | ❌ |
| F5.4 | 集成文档 | `docs/mcp-integration.md` 包含安装 + 使用指南 | `expect(docExists).toBe(true)` | ❌ |

#### DoD

- [ ] `@vibex/mcp-server` npm 包可安装
- [ ] Claude Desktop 连接测试通过
- [ ] 集成文档包含安装步骤 + 使用示例
- [ ] reviewer 两阶段审查通过

---

## 3. 验收标准（汇总）

| Epic | Story | expect() 断言 |
|------|-------|--------------|
| E1 | E1-S1 | `expect(oauthRedirect).toContain('vercel.com/oauth')` |
| E1 | E1-S2 | `expect(deployResponse.url).toMatch(/vercel\.app/)` |
| E1 | E1-S3 | `expect(isVisible(deployBtn)).toBe(true)` |
| E1 | E1-S3 | `expect(urlLatency).toBeLessThan(60000)` |
| E2 | E2-S1 | `expect(sopDoc.scenarios).toBeGreaterThanOrEqual(5)` |
| E2 | E2-S2 | `expect(isEnabled('FEATURE_FLAG')).toBe(true\|false)` |
| E2 | E2-S3 | `expect(dodAlignmentRate).toBeGreaterThanOrEqual(0.8)` |
| E3 | E3-S1 | `expect(typeof createVersionedStorage).toBe('function')` |
| E3 | E3-S2 | `expect(epic6UsesLib).toBe(true)` |
| E3 | E3-S3 | `expect(epic7UsesLib).toBe(true)` |
| E3 | E3-S3 | `expect(coverage).toBeGreaterThanOrEqual(80)` |
| E4 | E4-S1 | `expect(mappings.Button).toBeDefined()` |
| E4 | E4-S2 | `expect(isVisible(toggle)).toBe(true)` |
| E4 | E4-S3 | `expect(vueComponentsRender).toBe(true)` |
| E4 | E4-S4 | `expect(coverage).toBeGreaterThanOrEqual(80)` |
| E5 | E5-S1 | `expect(packageJson.name).toBe('@vibex/mcp-server')` |
| E5 | E5-S2 | `expect(getProjectTools.length).toBeGreaterThan(0)` |
| E5 | E5-S3 | `expect(claudeCanConnect).toBe(true)` |
| E5 | E5-S3 | `expect(docExists).toBe(true)` |

---

## 4. DoD (Definition of Done)

### 全局 DoD（所有 Epic 必须满足）

1. **代码规范**: `npm run lint` 无 error
2. **TypeScript**: `npx tsc --noEmit` 0 error
3. **测试**: 所有新增功能有对应测试（单元或 E2E）
4. **审查**: PR 经过 reviewer 两阶段审查
5. **文档**: 关键变更更新相关文档

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | Vercel OAuth 完成 + 部署成功率 ≥ 90% |
| E2 | ROLLBACK_SOP.md ≥ 5 场景 + 至少 1 个 feature flag 使用 |
| E3 | 库导出函数正确 + Epic6/7 全迁移 + 覆盖率 ≥ 80% |
| E4 | Vue E2E 通过 + 测试覆盖率 ≥ 80% |
| E5 | npm 包可安装 + Claude 连接验证 + 文档完整 |

---

## 5. 优先级矩阵

| 优先级 | Epic | 启动条件 | 建议排期 |
|--------|------|----------|----------|
| P0 | E1, E2, E3 | 立即并行 | Sprint 2（第 1 周） |
| P1 | E4, E5 | 立即并行 | Sprint 2（第 1-2 周） |

### Sprint 2 排期建议

```
Sprint 2（本周，5 Epic 并行）:
  - Dev: E1（6h，一键部署）
  - Dev: E2（4h，回滚 SOP）
  - Dev: E3（5h，Zustand 库）
  - Dev: E4（5h，Multi-Framework）
  - Dev: E5（10h，MCP Server）
  → 总计 30h，约 1.5 周完成
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | Vercel 部署 ≤ 60s 生成 URL |
| **可靠性** | Vercel API 部署成功率 ≥ 90% |
| **可维护性** | Zustand migration 库独立，Epic6/7 全部迁移 |
| **可扩展性** | MCP Server 隔离在独立包，便于协议变更隔离 |
| **安全** | Vercel OAuth token 安全存储（不暴露前端） |

---

## 7. 依赖关系图

```
[无依赖：全部可并行]

E1 ─┐
E2 ─┼─→ Sprint 2（5 Epic 并行）
E3 ─┤
E4 ─┤
E5 ─┘
```

---

## 8. 风险跟踪

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Vercel API 限流 | 中 | 中 | 降级为 Netlify Drop；加指数退避重试 |
| MCP 协议变更 | 低 | 高 | 隔离在独立包 `@vibex/mcp-server`；版本锁定 |
| Vue 映射质量差 | 中 | 高 | 先 MVP（3 个基础组件）再优化映射表 |
| E5（10h）膨胀 | 中 | 中 | 拆分 E5-S2（连接验证）单独验收 |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 10:08 GMT+8*
