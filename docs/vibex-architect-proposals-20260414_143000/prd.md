# PRD — VibeX 技术架构清理提案

> **项目**: vibex-architect-proposals-20260414_143000
> **版本**: v1.0
> **日期**: 2026-04-14
> **Owner**: PM
> **状态**: 已采纳（部分）

---

## 执行决策

- **决策**: 已采纳（部分）
- **执行项目**: vibex-architect-proposals-20260414_143000
- **执行日期**: 2026-04-14

---

## 1. 执行摘要

### 背景

VibeX 前端（Next.js）+ 后端（Cloudflare Workers）存在多项技术债务，影响开发效率和品牌一致性：

- `/pagelist` 页面视觉完全脱离 VibeX 深色赛博朋克风格
- MermaidRenderer、TemplateSelector 等组件存在 2-3 份副本
- API 错误响应格式不统一，前端需处理多种错误结构
- 测试覆盖率低，CI 可信度受损

### 目标

通过分阶段 Sprint 清理 P0/P1 技术债务，提升：
1. **品牌一致性** — `/pagelist` 页面融入 VibeX 深色主题
2. **代码质量** — 消除重复组件，统一 API 错误格式
3. **测试可信度** — 覆盖率从当前基线提升至合理水位

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| `/pagelist` 背景色 | 浅灰白 | `var(--color-bg-primary)` 深色 |
| MermaidRenderer 副本数 | 3 | 1 |
| API 错误格式一致性 | 无标准 | 100% 符合 `{ error: { code, message, details } }` |
| P0 修复 CI 通过率 | 基准 | 100%，无新增失败 |
| Sprint 1 完成率 | — | P0-1 + P1-3 完成 |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|----------|------|--------|
| F1 | `/pagelist` 风格修复 | 重写 `/pagelist` 页面样式，对齐 VibeX 深色赛博朋克主题 | P0-1 品牌违规 | 4h | P0 |
| F2 | 组件去重（MermaidRenderer） | diff 分析确认 canonical 版本，删除副本 | P0-2 组件重复 | 16h | P0 |
| F3 | 路由重组 | 重新组织后端 61 个路由文件，消除重叠 | P0-3 路由膨胀 | 24h+ | P0 |
| F4 | API 错误格式统一 | 统一为 `{ error: { code, message, details } }` | A-P1-3 错误格式不统一 | 8h | P1 |
| F5 | API 版本管理 | 建立 API 版本化策略 | A-P1-4 版本管理缺失 | 8h | P1 |
| F6 | 测试覆盖率提升 | Vitest 配置修复 + 覆盖率提升 | A-P1-5 测试覆盖率低 | 12h | P1 |
| F7 | 单体服务拆分 | 将单体后端拆分为独立服务 | P1-1 单体膨胀 | 32h | P1 |
| F8 | 前端 Store 重构 | 重构前端状态管理架构 | P1-2 Store 耦合 | 16h | P1 |

> **注**: F2、F3、F7、F8 为纯技术债务，由 Architect 独立 track，不进本产品提案流程。F1、F4、F5、F6 进本 PRD。

---

## 3. Epic/Story 拆分

### Epic 表格

| Epic ID | Epic 名称 | 描述 | 总工时 |
|---------|-----------|------|--------|
| E1 | 品牌一致性修复 | 修复 `/pagelist` 页面视觉违规 | 4h |
| E2 | API 质量保障 | 统一错误格式 + 建立版本管理 | 16h |
| E3 | 测试体系建设 | 提升测试覆盖率 + 修复 Vitest 配置 | 12h |
| E4 | 架构演进 | 路由重组、服务拆分、Store 重构（条件成熟时） | 88h+ |

### Story 表格

| Epic | Story ID | Story 名称 | 工时 | 状态 |
|------|----------|------------|------|------|
| E1 | E1.S1 | `/pagelist` 风格修复 | 4h | Sprint 1 |
| E2 | E2.S1 | API 错误格式统一 | 8h | Sprint 1 |
| E2 | E2.S2 | API 版本管理策略 | 8h | Sprint 2 |
| E3 | E3.S1 | 测试覆盖率提升 + Vitest 修复 | 12h | Sprint 2 |
| E4 | E4.S1 | 路由重组（条件成熟时） | 24h+ | Architect Track |
| E4 | E4.S2 | 前端 Store 重构（条件成熟时） | 16h | Architect Track |
| E4 | E4.S3 | 单体服务拆分（依赖 E4.S1） | 32h | Architect Track |

---

## 4. 功能点表格

### E1.S1.F1 — `/pagelist` 风格修复

| 字段 | 内容 |
|------|------|
| **功能点 ID** | E1.S1.F1.1 |
| **功能点** | `/pagelist` 页面样式重写 |
| **描述** | 将 `/pagelist` 页面的背景色、字体、组件样式对齐 VibeX 深色赛博朋克主题，消除浅灰白背景 |
| **验收标准** | 见下方验收标准章节 |
| **页面集成** | 【需页面集成】`/pagelist` |

### E2.S1.F1 — API 错误格式统一

| 字段 | 内容 |
|------|------|
| **功能点 ID** | E2.S1.F1.1 |
| **功能点** | 统一 API 错误响应格式 |
| **描述** | 所有 Cloudflare Workers API 错误响应统一为 `{ error: { code: string, message: string, details?: object } }` |
| **验收标准** | 见下方验收标准章节 |
| **页面集成** | 无直接页面集成（后端改造） |

### E2.S2.F1 — API 版本管理策略

| 字段 | 内容 |
|------|------|
| **功能点 ID** | E2.S2.F1.1 |
| **功能点** | 建立 API 版本化规范 |
| **描述** | 为所有 API 路由建立 `/v1/` 前缀版本化规范，新 API 必须带版本前缀，老 API 逐步迁移 |
| **验收标准** | 见下方验收标准章节 |
| **页面集成** | 无直接页面集成（架构规范） |

### E3.S1.F1 — 测试覆盖率提升

| 字段 | 内容 |
|------|------|
| **功能点 ID** | E3.S1.F1.1 |
| **功能点** | Vitest 配置修复 |
| **描述** | 修复 Vitest 配置问题，确保测试可在 CI 环境正常执行 |
| **验收标准** | 见下方验收标准章节 |
| **页面集成** | 无直接页面集成（测试配置） |

---

## 5. 验收标准（expect() 断言格式）

### E1.S1.F1.1 — `/pagelist` 风格修复

**Given** 用户访问 `/pagelist` 页面，**When** 页面加载完成，**Then**：
```typescript
// expect(document.body.style.backgroundColor).toContain('var(--color-bg-primary)')
expect(getComputedStyle(document.body).backgroundColor).not.toBe('rgb(248, 250, 252)')
expect(document.querySelector('.pagelist-container')).toBeTruthy()
expect(document.querySelector('style')).toBeTruthy() // 验证样式已加载
```

**Given** 开发者运行 `npm run build`，**When** 构建完成，**Then**：
```typescript
expect(stderr).not.toContain('CSS module not found')
expect(stderr).not.toContain('Module not found')
```

---

### E2.S1.F1.1 — API 错误格式统一

**Given** 后端 API 返回任何 4xx/5xx 错误，**When** 错误响应到达前端，**Then**：
```typescript
expect(errorResponse).toHaveProperty('error')
expect(errorResponse.error).toHaveProperty('code')
expect(errorResponse.error).toHaveProperty('message')
expect(typeof errorResponse.error.code).toBe('string')
expect(typeof errorResponse.error.message).toBe('string')
```

**Given** 前端调用 `POST /api/generate` 时传入无效参数，**When** 收到 400 响应，**Then**：
```typescript
expect(status).toBe(400)
expect(errorResponse.error.code).toBe('INVALID_PARAMS')
```

**Given** Cloudflare Workers AI 服务超时，**When** 收到 504 响应，**Then**：
```typescript
expect(status).toBe(504)
expect(errorResponse.error.code).toBe('AI_SERVICE_TIMEOUT')
expect(errorResponse.error.message).toContain('timeout')
```

---

### E2.S2.F1.1 — API 版本管理策略

**Given** 开发者新增一个 API 路由文件，**When** 路由文件名不符合 `/v{n}/` 前缀规范，**Then**：
```typescript
// lint 规则检测
expect(lintResult.violations).toHaveLength(0)
// 或手动验证: 新的 API 路由必须在 /v1/ 或 /v2/ 前缀下
```

**Given** 前端发起请求到 `/v1/generate`，**When** 后端处理请求，**Then**：
```typescript
expect(response.status).toBeGreaterThanOrEqual(200)
expect(response.status).toBeLessThan(300)
```

**Given** API 文档工具扫描路由，**When** 生成 OpenAPI 规范，**Then**：
```typescript
expect(openApiSpec.paths).toHaveProperty('/v1/generate')
```

---

### E3.S1.F1.1 — 测试覆盖率提升

**Given** 开发者运行 `npx vitest run`，**When** 测试执行完成，**Then**：
```typescript
expect(exitCode).toBe(0)
expect(stderr).not.toContain('Error: cannot find module')
```

**Given** CI pipeline 执行 `npm run test:ci`，**When** 完成，**Then**：
```typescript
expect(coverageReport.exists).toBe(true)
expect(coverageReport.lines).toBeGreaterThanOrEqual(baselineCoverage)
```

**Given** 新增一个 React 组件，**When** 开发者未编写测试，**Then**：
```typescript
// CI coverage threshold 检测
expect(coverageThresholdMet).toBe(false) // 阻止合并
```

---

## 6. 验收标准汇总（Given/When/Then 格式）

### E1 — 品牌一致性修复

| ID | Given | When | Then |
|----|-------|------|------|
| E1.S1.F1.1.AC1 | 用户访问 `/pagelist` 页面 | 页面加载完成 | 背景色为 `var(--color-bg-primary)`，无浅灰白背景 |
| E1.S1.F1.1.AC2 | 用户访问 `/pagelist` 页面 | 页面加载完成 | 所有文本颜色符合 VibeX 深色主题规范 |
| E1.S1.F1.1.AC3 | 开发者运行 `npm run build` | 构建完成 | 无 CSS module not found 错误 |

### E2 — API 质量保障

| ID | Given | When | Then |
|----|-------|------|------|
| E2.S1.F1.1.AC1 | 后端 API 返回任何错误 | 错误响应到达前端 | 格式为 `{ error: { code, message, details } }` |
| E2.S1.F1.1.AC2 | 前端调用 `POST /api/generate` 传入无效参数 | 收到 400 响应 | `error.code` 为 `INVALID_PARAMS` |
| E2.S1.F1.1.AC3 | Cloudflare Workers AI 服务超时 | 收到 504 响应 | `error.code` 为 `AI_SERVICE_TIMEOUT` |
| E2.S2.F1.1.AC1 | 新增 API 路由文件 | 文件创建 | 路由在 `/v{n}/` 前缀下 |
| E2.S2.F1.1.AC2 | 路由 lint 扫描 | 扫描完成 | 无违规路由（未版本化路由进入警告） |

### E3 — 测试体系建设

| ID | Given | When | Then |
|----|-------|------|------|
| E3.S1.F1.1.AC1 | 开发者运行 `npx vitest run` | 测试执行完成 | exit code 为 0，无模块找不到错误 |
| E3.S1.F1.1.AC2 | CI pipeline 执行 `npm run test:ci` | 完成 | 覆盖率报告存在，覆盖率 >= 基线 |
| E3.S1.F1.1.AC3 | 新增 React 组件未写测试 | PR 创建 | CI coverage threshold 检测失败，阻止合并 |

---

## 7. Definition of Done

### E1 — 品牌一致性修复

- [ ] `/pagelist` 页面背景色为深色（`var(--color-bg-primary)`），无浅灰白背景
- [ ] 所有组件样式与 VibeX 深色赛博朋克主题一致
- [ ] `npm run build` 构建成功，无 CSS 相关错误
- [ ] 页面在 Dark Mode 下显示正确
- [ ] Code Review 通过（至少 1 名 Dev Approve）
- [ ] CI 所有检查通过（tsc + vitest）

### E2 — API 质量保障

- [ ] 所有 API 错误响应符合 `{ error: { code, message, details } }` 格式
- [ ] 旧错误格式已迁移或兼容处理
- [ ] 新增路由遵循 `/v{n}/` 前缀规范
- [ ] OpenAPI 文档包含版本化路径
- [ ] Code Review 通过
- [ ] CI 所有检查通过

### E3 — 测试体系建设

- [ ] `npx vitest run` exit code 为 0
- [ ] CI 环境测试可正常执行（无环境差异问题）
- [ ] 覆盖率报告可生成
- [ ] 新组件 PR 触发 coverage threshold 检查
- [ ] Code Review 通过

### 全局 DoD

- [ ] 每个 Story 至少 1 个通过测试覆盖（集成测试或 E2E）
- [ ] 所有变更已记录到 CHANGELOG.md
- [ ] Architect Review 已完成
- [ ] PM 验收已签字

---

## 8. Specs 目录文件

| 文件 | 对应 Epic | 描述 |
|------|-----------|------|
| `specs/e1-brand-consistency.md` | E1 | `/pagelist` 风格修复详细规格 |
| `specs/e2-api-quality.md` | E2 | API 错误格式 + 版本管理详细规格 |
| `specs/e3-test-system.md` | E3 | 测试体系建设详细规格 |
| `specs/summary.md` | ALL | 全部 Epic 技术规格汇总 |

---

## 9. 风险与依赖

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| `/pagelist` 删除影响外部链接 | 🔴 高 | 已决策保留修复（不删除） |
| 组件去重选错 canonical 版本 | 🟠 中 | diff 分析 + code review，不得绕过 |
| 路由重组影响外部 API 调用者 | 🔴 高 | 先做 API 版本化（E2.S2），再做路由重组 |
| 测试覆盖率提升触发大量 CI 失败 | 🟠 中 | 先修复 Vitest 配置，再提升覆盖率 |

### 依赖关系

```
E4.S3 (服务拆分) → 依赖 E4.S1 (路由重组)
E4.S2 (Store 重构) → 独立，可提前执行
E2.S2 (API 版本化) → 先于 E4.S1 执行（降低路由重组风险）
E3.S1 (测试体系) → 贯穿 Sprint 1-2
```

---

## 10. Sprint 计划

| Sprint | 内容 | 目标 |
|--------|------|------|
| Sprint 1 | E1.S1 + E2.S1 | 品牌一致性 + API 错误格式统一 |
| Sprint 2 | E2.S2 + E3.S1 | API 版本化 + 测试体系建设 |
| Architect Track | E4.S1-S3 | 路由重组 + 服务拆分 + Store 重构（条件成熟时） |

---

*PM | 2026-04-14*
