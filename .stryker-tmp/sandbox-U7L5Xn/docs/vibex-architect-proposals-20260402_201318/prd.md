# PRD: VibeX 技术架构决策实施计划

**项目名称**: vibex-architect-proposals-20260402_201318  
**版本**: 1.0  
**创建日期**: 2026-04-02  
**负责人**: PM Agent  
**来源**: Architect Agent 提案 (13条提案 + 5项ADR)

---

## 1. 执行摘要

基于 Architect Agent 提交的 13 条提案（D-001~D-006, D-E1, D-E2, P-001~P-006）和 5 项架构决策建议（ADR-001~ADR-005），制定本实施计划。

**核心目标**: 解除 CI 阻断、提升代码质量、消除技术债务、建立可扩展前端架构。

**实施节奏**: Sprint 0（立即）→ Sprint 1 → Sprint 2，按 Epic 分阶段交付。

**总体优先级**:
- P0: Sprint 0 — CI 阻断解除 + 安全修复
- P1: Sprint 1 — canvasStore 拆分 + E2E 基础设施
- P2: Sprint 2 — PM 功能提案 + 状态持久化
- P3/Defer: 移动端 + PRD 导出

---

## 2. 提案评估矩阵

### 2.1 Dev 提案

| 提案ID | 名称 | 架构影响 | 技术风险 | PM 优先级 | 备注 |
|--------|------|---------|---------|-----------|------|
| D-001 | TS 错误清理 | 低 | 低 | P0 | Sprint 0 |
| D-002 | DOMPurify 安全加固 | 中 | 中 | P0 | Sprint 0，立即执行 |
| D-E1 | checkbox 合并 | 中 | 低 | P0 | Sprint 0 |
| D-E2 | 级联确认交互 | 中 | 低 | P0 | Sprint 0 |
| D-003 | canvasStore 拆分 | 高 | 中 | P1 | Sprint 1，关键路径 |
| D-004 | Migration 修复 | 低 | 低 | P1 | Sprint 1 |
| D-005 | 防御性解析 | 中 | 低 | P1 | Sprint 1 |
| D-006 | E2E 测试建设 | 中 | 中 | P1 | Sprint 1 |

### 2.2 PM 提案

| 提案ID | 名称 | 架构影响 | 技术风险 | PM 优先级 | 备注 |
|--------|------|---------|---------|-----------|------|
| P-001 | 确认状态可视化 | 低 | 低 | P1 | Sprint 1 合并到 D-E1/E2 |
| P-002 | 面板状态持久化 | 低 | 低 | P2 | Sprint 2，localStorage 方案 |
| P-003 | 导出向导 | 中 | 中 | P2 | Sprint 2，需 API 稳定 |
| P-004 | 空状态引导 | 低 | 低 | P2 | Sprint 2 |
| P-005 | 移动端降级 | 中 | 高 | Defer | 降低为只读预览 |
| P-006 | PRD 导出 | 中 | 中 | Defer | 暂缓 |

---

## 3. Sprint 规划

### Sprint 0: CI 阻断解除 + 安全修复（本周）
**目标**: 解除 CI 阻断，建立安全基线
**预计工时**: 6-8h
**前置条件**: 无

### Sprint 1: canvasStore 拆分 + E2E 基础设施（1-2周）
**目标**: 重构核心状态管理，建立测试保障
**预计工时**: 20-25h
**前置条件**: Sprint 0 完成

### Sprint 2: PM 功能提案实施（2-3周）
**目标**: 实现用户可见的产品改进
**预计工时**: 25-30h
**前置条件**: Sprint 1 完成，API 稳定

---

## 4. Epic 拆分

---

### Epic 1: Sprint 0 — CI 阻断解除 + 安全修复

**目标**: 解除 CI 阻断，建立安全基线，提升 UI 交互质量

#### Story 1.1: TS 错误清理

| 字段 | 内容 |
|------|------|
| Story ID | S1.1 |
| 作为 | 开发者 |
| 我希望 | 消除项目中的 TypeScript 类型错误 |
| 以便 | CI 不再因 TS 错误阻断，构建可靠类型保障 |

**验收标准 (AC)**:
- [ ] `npm run build` 无 TS 类型错误
- [ ] `npx tsc --noEmit` 返回 exit code 0
- [ ] 关键模块（canvasStore, API client）类型覆盖率 ≥ 80%

**DoD**:
- [ ] 所有 TS 错误已修复或显式 `// @ts-ignore` 标注并记录
- [ ] CI pipeline TS 检查通过
- [ ] 代码审查通过

---

#### Story 1.2: DOMPurify 安全加固

| 字段 | 内容 |
|------|------|
| Story ID | S1.2 |
| 作为 | 安全负责人 |
| 我希望 | 锁定 DOMPurify 版本并添加 overrides |
| 以便 | 消除间接依赖漏洞，建立 XSS 防护基线 |

**验收标准 (AC)**:
- [ ] `package.json` 添加 `overrides` 锁定 DOMPurify 版本
- [ ] 运行 `npm audit` 无 DOMPurify 相关漏洞
- [ ] DOMPurify 配置使用 `ALLOWED_TAGS` / `ALLOWED_ATTR` 白名单模式

**DoD**:
- [ ] package.json overrides 已添加并通过 `npm install` 验证
- [ ] 安全扫描通过（`npm audit` 或 Snyk）
- [ ] ADR-004 L1 层已完成

---

#### Story 1.3: Checkbox 合并与样式统一

| 字段 | 内容 |
|------|------|
| Story ID | S1.3 |
| 作为 | 前端开发者 |
| 我希望 | 统一 BoundedContext 节点 checkbox 样式 |
| 以便 | 消除 3 套独立样式代码，提升 UI 一致性 |

**验收标准 (AC)**:
- [ ] BoundedContext 节点 checkbox 样式统一为单套实现
- [ ] 不存在 `.nodeTypeBadge`、`.confirmedBadge` 等废弃样式残留
- [ ] checkbox 在 default / hover / checked / disabled 各状态样式正确
- [ ] CSS 命名符合 ADR-003 规范

**DoD**:
- [ ] 废弃 CSS 样式（`.nodeTypeBadge`、`.confirmedBadge`、`.selectionCheckbox`）已删除
- [ ] 视觉回归测试通过（或已建立 Playwright screenshot 基线）
- [ ] Storybook（如有）组件文档更新

---

#### Story 1.4: 级联确认交互

| 字段 | 内容 |
|------|------|
| Story ID | S1.4 |
| 作为 | 用户 |
| 我希望 | 在多选节点时支持级联勾选子节点 |
| 以便 | 批量操作更高效，减少重复点击 |

**验收标准 (AC)**:
- [ ] 勾选父节点时，自动勾选所有子节点
- [ ] 取消勾选父节点时，自动取消勾选所有子节点
- [ ] 部分子节点已勾选时，父节点显示为 indeterminate 状态
- [ ] 级联行为在 UI Store 更新后正确反映

**DoD**:
- [ ] 级联逻辑在 flowStore/canvasStore 中实现
- [ ] E2E 测试覆盖多选场景（参考 D-006）
- [ ] 用户文档已更新

---

#### Story 1.5: 废弃 CSS 清理

| 字段 | 内容 |
|------|------|
| Story ID | S1.5 |
| 作为 | 前端开发者 |
| 我希望 | 清理废弃 CSS 样式文件 |
| 以便 | 减少样式维护负担，防止样式冲突 |

**验收标准 (AC)**:
- [ ] `.nodeTypeBadge` 已删除（已被 border 颜色替代）
- [ ] `.confirmedBadge` 已删除（已被 border 颜色替代）
- [ ] `.selectionCheckbox` 评估后决定保留或删除
- [ ] CSS 命名符合 `{component}-{element}-{state}` 规范

**DoD**:
- [ ] 全局搜索确认无残留引用
- [ ] 构建产物无新增警告
- [ ] ADR-003 阶段1完成

---

### Epic 2: canvasStore 拆分重构

**目标**: 将 1433 行的 canvasStore 拆分为 5 个单一职责的 Zustand store

#### Story 2.1: Store 架构设计

| 字段 | 内容 |
|------|------|
| Story ID | S2.1 |
| 作为 | 前端架构师 |
| 我希望 | 定义清晰的 store 拆分边界和依赖方向 |
| 以便 | 避免循环依赖，建立单向数据流 |

**验收标准 (AC)**:
- [ ] 拆分方案已文档化（见 ADR-001）
- [ ] 依赖方向: componentStore → flowStore → contextStore（单向）
- [ ] 无循环依赖警告

**DoD**:
- [ ] ADR-001 文档评审通过
- [ ] 架构审查通过

---

#### Story 2.2: Phase 1 — contextStore 拆分

| 字段 | 内容 |
|------|------|
| Story ID | S2.2 |
| 作为 | 前端开发者 |
| 我希望 | 从 canvasStore 拆分出 contextStore（~180行） |
| 以便 | 验证拆分方案的可行性，控制迁移风险 |

**验收标准 (AC)**:
- [ ] contextStore 包含 contextNodes CRUD + persist 功能
- [ ] 原 canvasStore 通过 re-export 保持向后兼容
- [ ] 现有消费者无需修改即可工作
- [ ] Phase 1 控制在 4h 内完成
- [ ] `npm run build` 和 `npm run dev` 均通过

**DoD**:
- [ ] contextStore 独立文件已创建
- [ ] 原 canvasStore re-export 验证
- [ ] 核心用户流程（创建 context → 编辑 → 删除）手动测试通过

---

#### Story 2.3: Phase 2 — flowStore / componentStore / uiStore / sessionStore 拆分

| 字段 | 内容 |
|------|------|
| Story ID | S2.3 |
| 作为 | 前端开发者 |
| 我希望 | 完成剩余 4 个 store 的拆分 |
| 以便 | 完全消除 canvasStore 的单文件瓶颈 |

**验收标准 (AC)**:
- [ ] flowStore (~350行): flowNodes + cascadeUpdate
- [ ] componentStore (~180行): componentNodes + generation
- [ ] uiStore (~280行): panel/expand/scroll state
- [ ] sessionStore (~150行): SSE/messages/queue
- [ ] canvasStore 入口文件 < 150行（仅 re-export）
- [ ] 所有 consumers 更新为新 store 引用

**DoD**:
- [ ] 所有 store 独立文件创建
- [ ] 消费者代码迁移完成
- [ ] TypeScript 类型检查通过
- [ ] Playwright E2E 核心旅程测试通过

---

### Epic 3: 状态持久化分层

**目标**: 实现 ADR-002 状态持久化分层策略，P-002 面板状态持久化

#### Story 3.1: 持久化分层方案实现

| 字段 | 内容 |
|------|------|
| Story ID | S3.1 |
| 作为 | 前端开发者 |
| 我希望 | 按照 ADR-002 分层策略管理状态持久化 |
| 以便 | 明确哪些状态存内存、哪些存 localStorage、哪些同步后端 |

**验收标准 (AC)**:
- [ ] L1（内存）: Zustand store，页面刷新丢失
- [ ] L2（localStorage）: 用户偏好设置（面板折叠记忆）
- [ ] L3（后端 API）: 业务数据（contextNodes、flowNodes）
- [ ] 分层策略已文档化并代码实现

**DoD**:
- [ ] ADR-002 实现文档已更新
- [ ] 代码审查通过

---

#### Story 3.2: P-002 面板状态持久化

| 字段 | 内容 |
|------|------|
| Story ID | S3.2 |
| 作为 | 用户 |
| 我希望 | 刷新页面后保持面板展开/折叠状态 |
| 以便 | 减少重复操作，提升工作效率 |

**验收标准 (AC)**:
- [ ] 面板折叠状态保存到 localStorage（不依赖 canvasStore 拆分）
- [ ] 页面加载时从 localStorage 恢复状态
- [ ] 退出登录后 localStorage 可选清除（用户隐私）
- [ ] 不影响匿名游客（使用 sessionStorage）

**DoD**:
- [ ] 面板状态在刷新后正确恢复
- [ ] localStorage 读取失败时有合理降级
- [ ] Playwright 测试覆盖此场景

---

### Epic 4: E2E 测试基础设施

**目标**: 建立 Playwright E2E 测试体系，覆盖 3 个核心用户旅程

#### Story 4.1: Playwright 基础配置

| 字段 | 内容 |
|------|------|
| Story ID | S4.1 |
| 作为 | 测试工程师 |
| 我希望 | 配置 Playwright 测试基础设施 |
| 以便 | 建立统一的 E2E 测试框架 |

**验收标准 (AC)**:
- [ ] Playwright 已安装并配置
- [ ] baseURL: http://localhost:3000
- [ ] headless: true, timeout: 30s
- [ ] screenshotOnFailure: true
- [ ] `npm run test:e2e` 可执行

**DoD**:
- [ ] Playwright 配置通过 CI 验证
- [ ] 至少 1 个 smoke test 通过

---

#### Story 4.2: 核心旅程测试覆盖

| 字段 | 内容 |
|------|------|
| Story ID | S4.2 |
| 作为 | 测试工程师 |
| 我希望 | 覆盖 3 个核心用户旅程 |
| 以便 | 确保关键功能不发生回归 |

**验收标准 (AC)**:
| 测试文件 | 覆盖旅程 | 验收条件 |
|---------|---------|---------|
| `journey-create-context.spec.ts` | 创建 BoundedContext → 勾选 → 导出 | ≥ 60% 路径覆盖 |
| `journey-generate-flow.spec.ts` | 创建流程 → 多选 → 生成 | ≥ 60% 路径覆盖 |
| `journey-multi-select.spec.ts` | Ctrl+Click 多选 → 批量操作 | ≥ 60% 路径覆盖 |

**DoD**:
- [ ] 3 个 spec 文件已创建并通过
- [ ] CI 中 `npm run test:e2e` 作为 pre-deploy gate
- [ ] 测试覆盖率报告生成

---

### Epic 5: PM 功能提案实施

**目标**: 实现 P-001、P-003、P-004 用户可见功能改进

#### Story 5.1: P-001 确认状态可视化

| 字段 | 内容 |
|------|------|
| Story ID | S5.1 |
| 作为 | 用户 |
| 我希望 | 直观看到 BoundedContext 的确认状态 |
| 以便 | 快速了解哪些上下文已完成准备 |

**验收标准 (AC)**:
- [ ] 确认状态通过视觉标识区分（颜色/图标）
- [ ] 状态变化时有动画反馈
- [ ] 符合 ADR-003 CSS 命名规范

**DoD**:
- [ ] 视觉设计评审通过
- [ ] Storybook 文档更新

---

#### Story 5.2: P-003 导出向导

| 字段 | 内容 |
|------|------|
| Story ID | S5.2 |
| 作为 | 用户 |
| 我希望 | 通过引导式步骤导出我的设计 |
| 以便 | 导出过程清晰，格式选择明确 |

**验收标准 (AC)**:
- [ ] 导出流程分为步骤向导（格式选择 → 选项配置 → 预览 → 确认）
- [ ] 支持常见格式（Mermaid、JSON、PNG、SVG）
- [ ] 导出前显示预览
- [ ] 导出进度指示
- [ ] ⚠️ API 稳定后实施（P-003 依赖 API 稳定性）

**DoD**:
- [ ] 导出向导 UI 已实现
- [ ] 所有支持格式导出正常
- [ ] API 不稳定时的优雅降级

---

#### Story 5.3: P-004 空状态引导

| 字段 | 内容 |
|------|------|
| Story ID | S5.3 |
| 作为 | 新用户 |
| 我希望 | 在空状态下看到引导提示 |
| 以便 | 快速了解如何开始使用 |

**验收标准 (AC)**:
- [ ] 各主要面板（Context 树、Flow 树、Component 树）有空状态占位符
- [ ] 空状态包含操作引导文案
- [ ] 空状态下有快速创建入口

**DoD**:
- [ ] 所有面板空状态覆盖
- [ ] 文案经过用户测试

---

### Epic 6: 防御性解析 + Migration 修复

#### Story 6.1: D-005 防御性解析

| 字段 | 内容 |
|------|------|
| Story ID | S6.1 |
| 作为 | 开发者 |
| 我希望 | 对外部输入使用 Zod safeParse 验证 |
| 以便 | 防止无效数据进入系统，增强稳定性 |

**验收标准 (AC)**:
- [ ] E5 文件处理使用 Zod safeParse + fallback
- [ ] 解析失败时返回安全的默认值，不抛出异常
- [ ] 解析日志记录（可选，用于调试）

**DoD**:
- [ ] Zod schema 定义完成
- [ ] 安全边界测试通过

---

#### Story 6.2: D-004 Migration 修复

| 字段 | 内容 |
|------|------|
| Story ID | S6.2 |
| 作为 | 用户 |
| 我希望 | 数据迁移过程稳定可靠 |
| 以便 | 升级时不会丢失我的设计数据 |

**验收标准 (AC)**:
- [ ] Migration 脚本可重复运行（幂等性）
- [ ] 迁移失败时提供回滚机制
- [ ] 迁移前后数据一致性验证

**DoD**:
- [ ] Migration 测试用例覆盖
- [ ] 生产数据迁移验证

---

### Epic 7: 移动端/PRD 导出（暂缓/降级）

#### Story 7.1: P-005 移动端只读预览

| 字段 | 内容 |
|------|------|
| Story ID | S7.1 |
| 作为 | 用户 |
| 我希望 | 在移动设备上查看我的设计（只读） |
| 以便 | 随时随地查看，不进行编辑操作 |

**验收标准 (AC)**:
- [ ] 移动端布局适配（响应式 CSS）
- [ ] 仅支持只读视图，Canvas 操作禁用
- [ ] 核心信息可清晰展示
- [ ] ⚠️ 暂缓，等 Sprint 0/1 稳定后评估

**DoD**:
- [ ] 移动端响应式测试通过
- [ ] 功能限制提示明确

---

#### Story 7.2: P-006 PRD 导出

| 字段 | 内容 |
|------|------|
| Story ID | S7.2 |
| 作为 | 用户 |
| 我希望 | 导出项目为标准格式的 PRD 文档 |
| 以便 | 与团队成员共享或归档 |

**验收标准 (AC)**:
- [ ] ⚠️ 暂缓，评估 API 稳定性后决定
- [ ] 替代方案: 提供 Markdown 模板下载

**DoD**:
- [ ] 需求重新评审后决定实施范围

---

## 5. 跨提案依赖图

```
Sprint 0 (并行)
├── D-001 TS错误清理
├── D-002 DOMPurify (立即)
├── D-E1 checkbox合并
├── D-E2 级联确认
└── CSS清理 (伴随 D-E1/E2)

Sprint 1
├── D-003 canvasStore拆分 (关键路径)
│   ├── Phase 1: contextStore (4h验证)
│   └── Phase 2: 其余4个store
├── D-006 E2E建设 (依赖 Sprint 0 稳定)
├── D-005 防御性解析 (可提前)
├── D-004 Migration修复
└── P-001 确认状态可视化 (合并到 D-E1/E2)

Sprint 2
├── P-002 面板状态持久化 (可提前，独立实施)
├── P-003 导出向导 (需API稳定)
└── P-004 空状态引导

Defer
├── P-005 移动端 (降级为只读预览)
└── P-006 PRD导出 (暂缓)
```

---

## 6. 架构决策摘要（ADR）

| ADR | 名称 | 状态 | 实施阶段 |
|-----|------|------|---------|
| ADR-001 | canvasStore 拆分架构 | 待实施 | Sprint 1 |
| ADR-002 | 状态持久化分层策略 | 待实施 | Sprint 2 |
| ADR-003 | CSS 架构规范 | 待实施 | Sprint 0 |
| ADR-004 | 前端安全加固 | 待实施 | Sprint 0（L1立即） |
| ADR-005 | E2E 测试基础设施 | 待实施 | Sprint 1 |

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| D-003 canvasStore 拆分延期 | 中 | 高 | Phase 1 只拆分 contextStore，4h 内验证可行性 |
| E2E 测试不稳定 | 高 | 中 | CI 并行 + retry 机制，初期覆盖率目标 60% |
| P-003 导出向导依赖 API | 中 | 中 | API 不稳定时降级为手动导出，锁定 Sprint 2 后期 |
| P-005 移动端降级复杂 | 高 | 低 | 降低为只读预览，不实现 Canvas 操作 |
| Sprint 0 范围蔓延 | 中 | 中 | 严格控制 5 个 Story，不添加新需求 |

---

## 8. 验收总览

| Epic | Story | 验收条件数 | 关键验收 |
|------|-------|-----------|---------|
| Epic 1 | S1.1~S1.5 | 15 | CI TS检查通过、安全扫描通过、checkbox/级联交互正常 |
| Epic 2 | S2.1~S2.3 | 10 | store拆分完成、向后兼容、消费者迁移 |
| Epic 3 | S3.1~S3.2 | 6 | 分层策略明确、面板状态持久化 |
| Epic 4 | S4.1~S4.2 | 8 | Playwright配置、3个核心旅程通过 |
| Epic 5 | S5.1~S5.3 | 9 | 确认状态可视化、导出向导、空状态引导 |
| Epic 6 | S6.1~S6.2 | 6 | Zod safeParse、Migration幂等 |
| Epic 7 | S7.1~S7.2 | 4 | 移动端只读预览、PRD导出评估 |
| **合计** | **17 Stories** | **58 AC** | |

---

*文档版本: 1.0 | 最后更新: 2026-04-02 | 来源: Architect Agent 提案汇总*
