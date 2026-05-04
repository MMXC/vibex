# VibeX Sprint 25 — Agents 分工

**项目**: vibex-proposals-sprint25
**版本**: v1.0
**日期**: 2026-05-04

---

## 1. Sprint 角色分配

| Agent | 主要职责 | 负责 Epic |
|-------|---------|----------|
| **Analyst** | P003 验证、Sprint 24 执行状态确认 | E3 验证阶段 |
| **Architect** | 数据模型设计（Canvas ↔ Team 多对多）、接口定义 | E5 架构确认、E2 diff 算法 |
| **Reviewer** | 代码审查、TS 检查、测试覆盖率 | 全 Epic CR |
| **Developer** | 前端组件开发、测试编写 | E1 / E2 / E4 / E5 |
| **QA** | E2E 测试、data-testid 覆盖验证 | E1 / E2 / E4 / E5 |

---

## 2. 工作流程

### 2.1 Sprint 阶段顺序

```
Week 1
  Day 1-2: Analyst (E3 验证) + Developer (E4-S4.1 useProjectSearch) [并行]
  Day 3-4: Developer (E1 Onboarding) + Developer (E2 Canvas-Diff) [并行]
  Day 5:   Reviewer (E3 CR) + Reviewer (E4 CR)

Week 2
  Day 6-8: Developer (E4-S4.2-4.4) + Developer (E5 Teams-Canvas)
  Day 9:   Reviewer (E1/E2 CR) + QA (E1/E2 E2E)
  Day 10:  Reviewer (E5 CR) + QA (E4/E5 E2E) + Analyst (CHANGELOG 更新)
```

### 2.2 并行策略

**可并行开发**（无跨 Epic 依赖）：
- E3 S3.1（验证）// E3 S3.2（验证）// E4 S4.1（hook）
- E1 S1.1 // E2 S2.1
- E4 S4.2 // E4 S4.3 // E4 S4.4

**有依赖（串行）**：
- E3 S3.3（API 测试）依赖 S3.2 确认测试框架
- E3 S3.4（CHANGELOG）依赖 S3.1-3 全部确认
- E4 S4.2-4.4（UI）依赖 S4.1（hook）
- E5 S5.2-5.4（UI + RBAC）依赖 S5.1（API）
- E5 整体依赖 E3 验证完毕（避免重复开发）

### 2.3 阻塞处理

| 阻塞场景 | 处理方式 |
|---------|---------|
| E3 验证发现 S24 实际未完成 | → 评估补全工时，报告 coord 决定是否纳入 Sprint 25 |
| E5 数据模型需调整 | → Architect 召开 15min 设计评审，更新 architecture.md |
| E2 diff 算法无法复用 reviewDiff | → Architect 确认降级方案（纯 JSON diff） |
| PR 被 Reviewer 驳回 | → 修复后重新提 PR，同一 Reviewer 复审 |

---

## 3. Epic 责任矩阵（RACI）

| Epic | Analyst | Architect | Developer | Reviewer | QA |
|------|---------|-----------|-----------|----------|-----|
| **E1 Onboarding+Template** | 需求澄清 | 组件设计 | 开发 E1 | CR E1 | E2E E1 |
| **E2 Cross-Canvas Diff** | — | diff 算法设计 | 开发 E2 | CR E2 | E2E E2 |
| **E3 Sprint 24 遗留** | 验证 | — | S3.3 API 测试 | CR E3 | — |
| **E4 Dashboard 搜索** | — | hook 接口设计 | 开发 E4 | CR E4 | E2E E4 |
| **E5 Teams×Canvas** | — | 数据模型/权限设计 | 开发 E5 | CR E5 | E2E E5 |

**RACI 符号**：
- **R** = Responsible（执行）
- **A** = Accountable（负责）
- **C** = Consulted（咨询）
- **I** = Informed（知会）

---

## 4. 各 Epic 详细分工

### E1: Onboarding + 模板捆绑（Developer: Frontend）

**Developer 职责**：
- 改动 `OnboardingModal.tsx` / `PreviewStep.tsx`：Step 5 模板推荐
- 改动 `ChapterPanel.tsx`：auto-fill 逻辑
- 改动 `onboardingStore.ts`：场景化推荐 + localStorage 同步
- 编写 Vitest 单元测试（Onboarding 相关）

**Reviewer 职责**：
- 检查 auto-fill 是否覆盖用户已有内容（DoD 要求）
- 检查 `data-testid` 覆盖完整性
- 检查 `pnpm run build` 0 errors

**QA 职责**：
- Playwright E2E：Onboarding 完整流程（Step 1 → Step 5 → 选模板 → auto-fill）
- 验证跳过 Onboarding 后不再展示

### E2: 跨 Canvas Diff（Developer: Frontend）

**Developer 职责**：
- 新建 `/canvas-diff/page.tsx` 路由
- 扩展 `reviewDiff.ts` → `compareCanvasProjects()`
- 编写 Vitest 单元测试（diff 算法）

**Architect 职责**：
- 确认 diff 算法降级策略（JSON 结构 diff，不做语义 diff）
- 审核 `compareCanvasProjects` 返回类型设计

**Reviewer 职责**：
- 检查 diff 三栏颜色是否规范（红/黄/绿）
- 检查 JSON 导出格式

**QA 职责**：
- Playwright E2E：选 A → 选 B → 查看 diff → 导出 JSON

### E3: Sprint 24 遗留（Analyst + Developer + Reviewer）

**Analyst 职责**：
- 检查 Slack #analyst-channel E2E 报告
- 检查 CHANGELOG.md S23/S24 条目
- 汇总验证结果，决定补全范围

**Developer 职责**：
- S3.3：补写 auth.test.ts 至 ≥ 20 cases
- 运行 `pnpm test` 确认测试通过

**Reviewer 职责**：
- 审查 auth.test.ts 测试质量（不是数量堆砌）
- 检查 CHANGELOG 更新格式

**注意**：如果 Analyst 验证发现 S24 实际已完成，则 E3 直接完成，无需开发。

### E4: Dashboard 搜索过滤（Developer: Frontend）

**Developer 职责**：
- 新建 `useProjectSearch.ts` hook
- 改动 `dashboard/page.tsx`：替换 inline 逻辑为 hook 调用
- 编写 Vitest 单元测试（搜索/过滤/排序）

**Architect 职责**：
- 定义 `useProjectSearch` 接口（输入/输出类型）
- 确认 debounce 策略

**Reviewer 职责**：
- 检查 hook 逻辑正确性（时间过滤边界 case）
- 检查 `data-testid` 覆盖

**QA 职责**：
- Playwright E2E：搜索 "PRD" → 验证过滤结果

### E5: Teams × Canvas（Developer: Fullstack + Architect）

**Architect 职责（设计阶段，先于开发）**：
- 确认 `canvas_team_mapping` 表设计
- 定义 `/canvas-share` API 接口
- 定义 RBAC 优先级：Project Owner > Team Owner > Team Admin > Team Member
- 确认 Canvas ↔ Team 多对多关系

**Developer 职责**：
- Backend: 新建 `canvas-share.ts` API + 数据库迁移
- Frontend: Team Canvas 列表 + RBAC hook 扩展 + Badge UI
- 编写 Vitest 单元测试（API + RBAC 逻辑）

**Reviewer 职责**：
- 审查 API 权限检查是否完整
- 检查 RBAC 降级逻辑（无 teamId 时降级为 project owner 检查）

**QA 职责**：
- Playwright E2E：分享 Canvas → 查看 Team 列表 → 验证权限生效

---

## 5. 协作规范

### 5.1 PR 规范

每个 Epic 开发完成后，提交 PR 到 `main` 分支：

```
PR 标题格式: [Sprint25-E{N}] {Epic 名称}
PR 内容必须包含:
- [ ] 改动了哪些文件
- [ ] 测试覆盖（Vitest + Playwright）
- [ ] `pnpm run build` 结果截图
- [ ] data-testid 新增列表
- [ ] DoD 自检清单
```

### 5.2 测试覆盖率要求

| 类型 | 门槛 | 负责人 |
|------|------|-------|
| Vitest 单元测试 | 核心逻辑文件 > 80% | Developer |
| API 测试 | auth/project 各 ≥ 20 cases | Developer |
| E2E（Playwright）| 所有 `data-testid` 元素可定位 | QA |
| TypeScript | `pnpm run build` → 0 errors | Reviewer |

### 5.3 交接规范

- **Architect → Developer**：Epic 开始前，Architect 完成 architecture.md 中该 Epic 的设计说明，Developer 阅读后再开始
- **Developer → Reviewer**：PR 必须附上 IMPLEMENTATION_PLAN.md 中对应 Epic 的 checklist 完成截图
- **Reviewer → Developer**：驳回必须说明原因（附具体代码行），不允许仅"需修改"无细节
- **全流程 → Analyst**：Sprint 结束时，Analyst 更新 CHANGELOG.md 并发布 Sprint 总结

### 5.4 每日站会报告格式

```
[Sprint25] {Epic} - {执行者}
- 昨日: {完成事项}
- 今日: {计划事项}
- 阻塞: {有/无}
```

---

## 6. 风险处理

| 风险 | 可能性 | 影响 | 应对策略 | 负责人 |
|------|--------|------|---------|-------|
| E3: S24 实际未执行，需大量补开发 | 高 | 高 | Analyst 先验证再分配；超出 4h 向 coord 报告 | Analyst |
| E5: Canvas ↔ Team 多对多关系设计复杂 | 中 | 高 | Architect 设计评审后再分配开发，预留 buffer | Architect |
| E1: 模板 auto-fill 覆盖用户已有内容 | 低 | 中 | 严格遵守 DoD：只对空 requirement 做 auto-fill | Developer |
| E4: Dashboard 搜索 debounce 影响 UX | 低 | 低 | 保持现有 300ms debounce，QA 实测验证 | QA |
| E2: 跨 Canvas diff 数据量大导致卡顿 | 低 | 中 | diff 计算加 loading 状态，大项目（>1000 nodes）提示用户 | Developer |

---

## 7. DoD 快速检查清单

每个 Epic 交付前，Developer 必须确认：

- [ ] `pnpm run build` → 0 errors
- [ ] 所有 `data-testid` 在 IMPLEMENTATION_PLAN 中列出且已实现
- [ ] Vitest 测试覆盖核心逻辑，报告附在 PR 中
- [ ] Reviewer 已 approve（至少 1 人）
- [ ] 产出物已在对应 docs/ 目录归档

---

*Architect Agent | VibeX Sprint 25 | 2026-05-04*
