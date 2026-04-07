# PRD: VibeX 技术改进提案实施计划

**文档版本**: v1.0
**作者**: PM Agent
**日期**: 2026-04-02
**来源**: Analyst 提案综合分析 (proposals/20260402_201318/)
**状态**: Draft → 待评审

---

## 1. 执行摘要

本 PRD 基于 Analyst 提案，综合识别 **7 项技术改进**，涵盖状态管理、架构重构、数据一致性、交互标准化和设计系统五大领域。

### 关键指标

| 维度 | 数值 |
|------|------|
| 总 Epic 数 | 3 |
| 总 Feature 数 | 7 |
| P0 优先级 | 2 项 |
| P1 优先级 | 3 项 |
| P2 优先级 | 2 项 |
| 预计总工时 | 22.5–37.5h |

### 核心决策

1. **三树状态模型统一** (P0) — 定义统一 `NodeState` 枚举，消除三树实现差异，移除冗余 `nodeUnconfirmed` 黄色边框
2. **canvasStore 拆分重构** (P0) — 按领域拆分为 contextStore/flowStore/componentStore/uiStore，Phase 1 仅拆分 contextStore
3. **Migration Bug 修复** (P1) — 修复 confirmed→isActive 迁移时 `status` 未映射的 bug
4. **API 防御性解析** (P1) — 逐字段验证 + fallback，防止非法数据污染前端状态
5. **交互反馈标准化** (P1) — 消除 `window.confirm()` 浏览器弹窗，替换为 toast；建立 Feedback Token 文档
6. **PRD 模板规范落地** (P2) — 强制 GIVEN/WHEN/THEN 模板，统一功能 ID 格式
7. **设计系统一致性审计** (P2) — emoji→SVG 替换审计，建立 Spacing Token，整理 DESIGN.md

---

## 2. 非功能需求

| 类别 | 要求 |
|------|------|
| **回归风险** | canvasStore 拆分每阶段完整测试；git worktree 隔离多人修改 |
| **性能** | Store 拆分后初始化时间不得增加 >10% |
| **可维护性** | 每条 Story 必须有对应测试，测试覆盖率 >80% |
| **可访问性** | 所有交互反馈符合 WCAG 2.1 AA |
| **向后兼容** | Migration 修复需能处理历史数据，不破坏现有用户 |

---

## 3. Epic 拆分与实施计划

---

### Epic-1: 状态管理与架构重构

> **范围**: 三树节点状态机统一 + canvasStore 按领域拆分 + Migration Bug 修复

---

#### Feature-1.1: 三树状态模型统一

**Story-1.1.1**: 定义统一 NodeState 枚举

| ID | Given | When | Then |
|----|-------|------|------|
| F1.1.1-AC1 | 应用初始化 | 三树组件渲染 | 每个节点状态为 `idle` 或上一轮持久化状态 |
| F1.1.1-AC2 | 节点被点击 | 用户点击节点 checkbox | 状态在 `idle`↔`selected` 之间切换，UI 反映最新状态 |
| F1.1.1-AC3 | 节点确认操作 | 用户确认节点 | 状态变为 `confirmed`，UI 显示绿色 ✓ |
| F1.1.1-AC4 | API 错误发生 | 后端返回错误 | 节点状态变为 `error`，显示红色错误图标 |

**DoD**:
- [ ] `NodeState` 枚举定义于 `types/nodeState.ts`
- [ ] 三树 (ContextTree / FlowTree / ComponentTree) 均使用同一枚举
- [ ] 每种状态有对应 CSS token / 样式变量
- [ ] 有单元测试覆盖状态转换逻辑

---

**Story-1.1.2**: 统一 checkbox 位置

| ID | Given | When | Then |
|----|-------|------|------|
| F1.1.2-AC1 | 三树卡片渲染 | 任意树卡片展示 | checkbox 始终在 type badge **左侧** |
| F1.1.2-AC2 | 多端一致性 | 桌面/移动端 | checkbox 位置保持一致 |

**DoD**:
- [ ] ContextTree 卡片 checkbox 移至 type badge 左侧
- [ ] FlowTree 卡片 checkbox 移至 type badge 左侧
- [ ] ComponentTree 卡片 checkbox 移至 type badge 左侧
- [ ] 视觉回归测试通过

---

**Story-1.1.3**: 移除 nodeUnconfirmed 黄色边框

| ID | Given | When | Then |
|----|-------|------|------|
| F1.1.3-AC1 | 未确认节点 | 节点状态为非 confirmed | 不显示黄色边框 |
| F1.1.3-AC2 | CSS 清理 | 全局搜索 `nodeUnconfirmed` | 无残留样式定义 |

**DoD**:
- [ ] `nodeUnconfirmed` CSS 类删除
- [ ] 相关 TypeScript 代码中的 className 引用移除
- [ ] 页面截图对比验证无黄色边框

---

**Story-1.1.4**: canvasStore Phase 1 拆分 (contextStore)

| ID | Given | When | Then |
|----|-------|------|------|
| F1.2.1-AC1 | contextStore 抽取 | 运行拆分脚本 | `contextStore.ts` 独立文件生成，行数约 180 行 |
| F1.2.1-AC2 | 现有功能 | 在 canvas 页操作上下文树 | 所有行为与拆分前完全一致 |
| F1.2.1-AC3 | 初始化 | 新用户首次打开 canvas | contextStore 正确初始化 |

**DoD**:
- [ ] `contextStore.ts` 独立于 `canvasStore.ts`
- [ ] 入口文件 `canvasStore.ts` 行数 <300 行
- [ ] 所有 250+ 调用点逐个验证无断裂
- [ ] Playwright E2E 测试通过

---

**Story-1.2.2**: canvasStore Migration Bug 修复

| ID | Given | When | Then |
|----|-------|------|------|
| F1.2.2-AC1 | Migration 2→3 执行 | 历史数据刷新页面 | confirmed 节点 `isActive=true` 且 `status='confirmed'` |
| F1.2.2-AC2 | 新建节点 | 用户新建上下文节点 | `status` 字段正确初始化为 `'pending'` |
| F1.2.2-AC3 | 边界情况 | confirmed=null | fallback 到 `status='pending'` |

**DoD**:
- [ ] `runMigrations` 中 `status` 字段正确映射
- [ ] 现有历史数据（confirmed=true）迁移后 status='confirmed'
- [ ] 新建节点不触发 migration，status 默认 'pending'
- [ ] 回归测试：刷新已保存的 canvas JSON，不丢失 confirmed 状态

---

#### Feature-1.2: canvasStore 分层架构（Phase 1 除外）

> Phase 2+ 为后续 Sprint 范围，本 PRD 仅记录，不做实施承诺。

---

### Epic-2: 数据完整性与交互标准化

> **范围**: API 防御性解析 + 交互反馈标准化

---

#### Feature-2.1: API 响应防御性解析

**Story-2.1.1**: generateComponents API 响应验证

| ID | Given | When | Then |
|----|-------|------|------|
| F2.1.1-AC1 | 合法响应 | API 返回合法 type/method | 组件按预期渲染 |
| F2.1.1-AC2 | 非法 type | API 返回未知 type | fallback 到 `'page'`，不报错 |
| F2.1.1-AC3 | 非法 method | API 返回无效 HTTP method | fallback 到 `'GET'` |
| F2.1.1-AC4 | 缺失字段 | API 响应缺少 type/method | 使用默认值，不崩溃 |

**DoD**:
- [ ] `validTypes` 白名单定义完整
- [ ] `validMethods` 白名单定义完整
- [ ] fallback 逻辑有单元测试
- [ ] API 响应验证集成到数据流入口

---

#### Feature-2.2: 交互反馈标准化

**Story-2.2.1**: 消除 window.confirm() 浏览器弹窗

| ID | Given | When | Then |
|----|-------|------|------|
| F2.2.1-AC1 | 危险操作确认 | 用户执行删除/覆盖操作 | 显示 toast 确认而非浏览器弹窗 |
| F2.2.1-AC2 | 确认操作 | 用户在 toast 上确认 | 操作执行，结果反馈 |
| F2.2.1-AC3 | 取消操作 | 用户取消 toast | 无副作用，操作不执行 |

**DoD**:
- [ ] 全局搜索 `window.confirm` 结果为 0
- [ ] 所有确认场景替换为 toast component
- [ ] Toast 有确认/取消按钮，风格统一

---

**Story-2.2.2**: 建立 Feedback Token 文档

| ID | Given | When | Then |
|----|-------|------|------|
| F2.2.2-AC1 | 文档查阅 | 开发查阅 Feedback Token | 有完整文档说明每种反馈类型 |
| F2.2.2-AC2 | 新增反馈 | 需要新增交互反馈 | 开发者参考文档添加，不另起炉灶 |

**DoD**:
- [ ] `docs/feedback-tokens.md` 创建
- [ ] Token 包含：成功/失败/警告/加载/确认 五类
- [ ] 每类有使用示例和代码引用

---

**Story-2.2.3**: 拖拽状态规范

| ID | Given | When | Then |
|----|-------|------|------|
| F2.2.3-AC1 | 拖拽中 | 用户拖拽节点 | 显示统一的拖拽状态视觉反馈 |
| F2.2.3-AC2 | 拖拽结束 | 释放节点 | 拖拽状态清除，恢复正常显示 |

**DoD**:
- [ ] 拖拽状态有统一 CSS class/token
- [ ] 不存在多个不一致的拖拽样式实现

---

### Epic-3: 规范落地与设计系统

> **范围**: PRD 模板规范化 + 设计系统一致性审计

---

#### Feature-3.1: PRD 模板规范化

**Story-3.1.1**: 强制 GIVEN/WHEN/THEN 模板

| ID | Given | When | Then |
|----|-------|------|------|
| F3.1.1-AC1 | 新建 PRD | 团队成员创建 PRD | 使用标准模板，GIVEN/WHEN/THEN 格式 |
| F3.1.1-AC2 | 评审 PRD | Reviewer 评审 | 验收标准无 GIVEN/WHEN/THEN 格式 → 驳回 |
| F3.1.1-AC3 | 现有 PRD | 已有文档 | 补充缺失的验收标准格式 |

**DoD**:
- [ ] PRD 模板文件更新，包含 GIVEN/WHEN/THEN 示例
- [ ] 每条 Story 都有对应的 DoD checklist
- [ ] 团队 review 流程中增加格式检查步骤

---

**Story-3.1.2**: 功能 ID 格式统一

| ID | Given | When | Then |
|----|-------|------|------|
| F3.1.2-AC1 | 功能编号 | 引用功能 | 格式为 `Epic-N/Feature-N.Story-N`，如 `F1.1.1` |
| F3.1.2-AC2 | ID 一致性 | PRD / 测试 / 代码 | 同一功能的 ID 在所有文档中一致 |

**DoD**:
- [ ] PRD 中所有功能引用使用统一 ID 格式
- [ ] 测试用例 ID 与 PRD ID 对应

---

#### Feature-3.2: 设计系统一致性审计

**Story-3.2.1**: emoji→SVG 替换审计

| ID | Given | When | Then |
|----|-------|------|------|
| F3.2.1-AC1 | 页面扫描 | 全站 emoji 使用情况 | 生成 emoji→SVG 替换清单 |
| F3.2.1-AC2 | 替换后 | emoji 替换为 SVG | 视觉一致性保持，无布局破坏 |

**DoD**:
- [ ] 全站 emoji 清单已生成
- [ ] 关键路径 emoji 已替换为 SVG
- [ ] 替换后无视觉回归

---

**Story-3.2.2**: Spacing Token 规范化

| ID | Given | When | Then |
|----|-------|------|------|
| F3.2.2-AC1 | 代码审查 | 新增/修改间距样式 | 使用 space-xs/sm/md/lg/xl token |
| F3.2.2-AC2 | 文档查阅 | 设计师/开发查阅 | DESIGN.md 中有完整 Spacing Token 说明 |

**DoD**:
- [ ] `space-xs` / `space-sm` / `space-md` / `space-lg` / `space-xl` token 定义完整
- [ ] 现有代码中硬编码像素值逐步替换
- [ ] DESIGN.md 更新 Spacing Token 章节

---

**Story-3.2.3**: 整理 DESIGN.md

| ID | Given | When | Then |
|----|-------|------|------|
| F3.2.3-AC1 | 查阅 DESIGN.md | 设计师/开发者 | 文档涵盖：颜色/字体/间距/组件规范 |
| F3.2.3-AC2 | 新增规范 | 设计决策 | 同步更新 DESIGN.md |

**DoD**:
- [ ] DESIGN.md 包含本次审计的所有发现
- [ ] 文档结构清晰，有目录导航
- [ ] 有版本历史记录

---

## 4. Sprint 实施计划

| Sprint | 内容 | 主要交付 | 工时 |
|--------|------|----------|------|
| Sprint 0 | D-001 (Migration Bug) + D-002 (API 防御) | Bug 修复 + 防御逻辑 | 1.5h |
| Sprint 1 | A-1 (三树状态统一) | NodeState 枚举 + checkbox 位置 + 移除黄边框 | 4-6h |
| Sprint 2 | A-2 Phase 1 (canvasStore 拆分) | contextStore 独立文件 | 8-12h |
| Sprint 3 | A-5 (交互反馈标准化) | 消除 confirm() + Feedback Token | 4-6h |
| Sprint 4 | A-6 + A-7 (规范落地) | PRD 模板 + 设计系统审计 | 5h |

---

## 5. 关键风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| canvasStore 拆分引入回归 | 高 | 高 | 每阶段完整 E2E 测试；git worktree 隔离 |
| 三树状态统一破坏现有交互 | 中 | 高 | 拆分前快照对比；灰度发布 |
| emoji→SVG 替换破坏布局 | 低 | 中 | 逐个替换，每次截图验证 |
| Migration Bug 数据丢失 | 高 | 极高 | 修复前备份现有 JSON；发布前验证迁移脚本 |

---

## 6. Out of Scope

- canvasStore Phase 2+ (flowStore / componentStore / uiStore 拆分)
- 新的 UI 组件开发
- 后端 API 改动
- 移动端适配
- 国际化

---

## 7. 依赖项

| 依赖 | 来源 | 备注 |
|------|------|------|
| NodeState 类型定义 | 需要前端团队确认 | 预计 0.5h 评审 |
| canvasStore 源码 | 现有代码库 | ~1433 行，需要逐行审查 |
| API contract 定义 | api-contract.yaml | generateComponents 接口定义 |
| DESIGN.md | 现有文档 | 需更新 Spacing Token 章节 |

---

*文档生成时间: 2026-04-02 21:13 GMT+8*
